from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_user_optional,
    security
)
from enhanced_data import ENHANCED_CAREER_PATHS, SKILL_ASSESSMENT_QUESTIONS
import base64
from io import BytesIO

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ================== MODELS ==================

class Resource(BaseModel):
    title: str
    url: str
    type: str  # video, article, course

class Milestone(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    order: int
    resources: List[Resource]
    estimated_days: int

class CareerPath(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    icon: str
    color: str
    milestones: List[Milestone]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserProgress(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    career_path_id: str
    completed_milestones: List[str] = []
    achievements: List[str] = []
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProgressUpdate(BaseModel):
    milestone_id: str
    completed: bool

# Auth Models
class UserSignup(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    quiz_completed: bool = False
    recommended_paths: List[str] = []

# Quiz Models
class QuizAnswer(BaseModel):
    question_id: str
    selected_option: int  # index of selected option

class QuizSubmission(BaseModel):
    answers: List[QuizAnswer]

class QuizResult(BaseModel):
    recommended_paths: List[Dict[str, any]]
    learning_style: str
    estimated_completion_weeks: int

# Certificate Model
class CertificateRequest(BaseModel):
    path_id: str

# Share Model
class ShareProgress(BaseModel):
    path_id: str

# ================== ROUTES ==================

# --- Auth Routes ---
@api_router.post("/auth/signup")
async def signup(user_data: UserSignup):
    """Register a new user"""
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = {
        "id": str(uuid.uuid4()),
        "email": user_data.email,
        "name": user_data.name,
        "hashed_password": hashed_password,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "quiz_completed": False,
        "recommended_paths": []
    }
    
    await db.users.insert_one(new_user)
    
    # Create access token
    access_token = create_access_token(data={"sub": new_user["id"], "email": new_user["email"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user["id"],
            "email": new_user["email"],
            "name": new_user["name"]
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    """Login user"""
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user["id"], "email": user["email"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "quiz_completed": user.get("quiz_completed", False),
            "recommended_paths": user.get("recommended_paths", [])
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "hashed_password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# --- Career Paths Routes ---
@api_router.get("/")
async def root():
    return {"message": "SUPERCHARGE API - Enhanced Career Roadmap Platform"}

@api_router.get("/career-paths", response_model=List[CareerPath])
async def get_career_paths():
    """Get all career paths with enhanced data"""
    return ENHANCED_CAREER_PATHS

@api_router.get("/career-paths/{path_id}", response_model=CareerPath)
async def get_career_path(path_id: str):
    """Get a specific career path"""
    for path in ENHANCED_CAREER_PATHS:
        if path["id"] == path_id:
            return path
    raise HTTPException(status_code=404, detail="Career path not found")

# --- Progress Routes ---
@api_router.get("/progress/{user_id}", response_model=List[UserProgress])
async def get_user_progress(user_id: str):
    """Get user's progress across all career paths"""
    progress_list = await db.user_progress.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    
    for progress in progress_list:
        if isinstance(progress.get('updated_at'), str):
            progress['updated_at'] = datetime.fromisoformat(progress['updated_at'])
    
    return progress_list

@api_router.get("/progress/{user_id}/{path_id}")
async def get_path_progress(user_id: str, path_id: str):
    """Get user's progress for a specific career path"""
    progress = await db.user_progress.find_one(
        {"user_id": user_id, "career_path_id": path_id},
        {"_id": 0}
    )
    
    if not progress:
        # Return empty progress if none exists
        return {
            "user_id": user_id,
            "career_path_id": path_id,
            "completed_milestones": [],
            "achievements": [],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    
    if isinstance(progress.get('updated_at'), str):
        progress['updated_at'] = datetime.fromisoformat(progress['updated_at'])
    
    return progress

@api_router.post("/progress/{user_id}/{path_id}")
async def update_progress(user_id: str, path_id: str, update: ProgressUpdate):
    """Update milestone completion status with achievement tracking"""
    # Find existing progress
    existing = await db.user_progress.find_one(
        {"user_id": user_id, "career_path_id": path_id}
    )
    
    # Get career path to check milestones
    career_path = next((p for p in ENHANCED_CAREER_PATHS if p["id"] == path_id), None)
    if not career_path:
        raise HTTPException(status_code=404, detail="Career path not found")
    
    if existing:
        completed = existing.get("completed_milestones", [])
        achievements = existing.get("achievements", [])
        
        if update.completed and update.milestone_id not in completed:
            completed.append(update.milestone_id)
            
            # Check for achievements
            milestone_count = len(completed)
            total_milestones = len(career_path["milestones"])
            
            # First milestone achievement
            if milestone_count == 1 and "first_step" not in achievements:
                achievements.append("first_step")
            
            # Halfway achievement
            if milestone_count >= total_milestones / 2 and "halfway_hero" not in achievements:
                achievements.append("halfway_hero")
            
            # Completion achievement
            if milestone_count == total_milestones and "path_master" not in achievements:
                achievements.append("path_master")
            
            # Speed achievements (if completed in estimated time or less)
            # This is simplified - in production you'd track actual time
            
        elif not update.completed and update.milestone_id in completed:
            completed.remove(update.milestone_id)
        
        await db.user_progress.update_one(
            {"user_id": user_id, "career_path_id": path_id},
            {
                "$set": {
                    "completed_milestones": completed,
                    "achievements": achievements,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
    else:
        # Create new progress entry
        achievements = []
        completed_list = [update.milestone_id] if update.completed else []
        
        if update.completed:
            achievements.append("first_step")
        
        new_progress = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "career_path_id": path_id,
            "completed_milestones": completed_list,
            "achievements": achievements,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.user_progress.insert_one(new_progress)
    
    return {
        "success": True,
        "milestone_id": update.milestone_id,
        "completed": update.completed
    }

# --- Quiz Routes ---
@api_router.get("/quiz/questions")
async def get_quiz_questions():
    """Get skill assessment quiz questions"""
    return SKILL_ASSESSMENT_QUESTIONS

@api_router.post("/quiz/submit")
async def submit_quiz(submission: QuizSubmission, current_user: dict = Depends(get_current_user)):
    """Submit quiz and get personalized recommendations"""
    # Calculate scores for each path
    path_scores = {}
    learning_style = "all"
    time_multiplier = 1.5
    
    for answer in submission.answers:
        question = next((q for q in SKILL_ASSESSMENT_QUESTIONS if q["id"] == answer.question_id), None)
        if not question:
            continue
        
        selected_option = question["options"][answer.selected_option]
        
        # Add scores for career paths mentioned in the option
        if "paths" in selected_option:
            for path_id in selected_option["paths"]:
                path_scores[path_id] = path_scores.get(path_id, 0) + 10
        
        # Track learning preferences
        if "preference" in selected_option:
            learning_style = selected_option["preference"]
        
        # Track time availability
        if "time_multiplier" in selected_option:
            time_multiplier = selected_option["time_multiplier"]
    
    # Get top 3 recommended paths
    sorted_paths = sorted(path_scores.items(), key=lambda x: x[1], reverse=True)[:3]
    
    recommended_paths = []
    for path_id, score in sorted_paths:
        path = next((p for p in ENHANCED_CAREER_PATHS if p["id"] == path_id), None)
        if path:
            total_days = sum(m["estimated_days"] for m in path["milestones"])
            estimated_weeks = int((total_days / 7) * time_multiplier)
            
            recommended_paths.append({
                "path_id": path["id"],
                "path_name": path["name"],
                "score": score,
                "estimated_weeks": estimated_weeks,
                "reason": f"Great fit based on your interests and learning style"
            })
    
    # Update user with recommendations
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {
            "$set": {
                "quiz_completed": True,
                "recommended_paths": [p["path_id"] for p in recommended_paths],
                "learning_style": learning_style
            }
        }
    )
    
    return {
        "recommended_paths": recommended_paths,
        "learning_style": learning_style,
        "estimated_completion_weeks": recommended_paths[0]["estimated_weeks"] if recommended_paths else 24
    }

# --- Certificate Routes ---
@api_router.post("/certificate/generate")
async def generate_certificate(request: CertificateRequest, current_user: dict = Depends(get_current_user)):
    """Generate a completion certificate"""
    user_id = current_user["user_id"]
    
    # Check if user completed the path
    progress = await db.user_progress.find_one({
        "user_id": user_id,
        "career_path_id": request.path_id
    })
    
    if not progress:
        raise HTTPException(status_code=404, detail="No progress found for this path")
    
    # Get career path
    career_path = next((p for p in ENHANCED_CAREER_PATHS if p["id"] == request.path_id), None)
    if not career_path:
        raise HTTPException(status_code=404, detail="Career path not found")
    
    completed_count = len(progress.get("completed_milestones", []))
    total_count = len(career_path["milestones"])
    
    if completed_count < total_count:
        raise HTTPException(
            status_code=400,
            detail=f"Path not completed. {completed_count}/{total_count} milestones done."
        )
    
    # Get user info
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    # Generate certificate data
    certificate = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "user_name": user.get("name", "Student"),
        "path_id": request.path_id,
        "path_name": career_path["name"],
        "completion_date": datetime.now(timezone.utc).isoformat(),
        "total_milestones": total_count,
        "achievements": progress.get("achievements", [])
    }
    
    # Store certificate
    await db.certificates.insert_one(certificate)
    
    return {
        "certificate_id": certificate["id"],
        "download_url": f"/api/certificate/download/{certificate['id']}",
        "share_url": f"/certificate/{certificate['id']}",
        **certificate
    }

@api_router.get("/certificate/download/{certificate_id}")
async def download_certificate(certificate_id: str):
    """Get certificate data for download"""
    certificate = await db.certificates.find_one({"id": certificate_id}, {"_id": 0})
    
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    return certificate

@api_router.get("/certificate/{certificate_id}")
async def view_certificate(certificate_id: str):
    """Public view of certificate"""
    certificate = await db.certificates.find_one({"id": certificate_id}, {"_id": 0})
    
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    return certificate

# --- Share Routes ---
@api_router.post("/share/progress")
async def share_progress(share_data: ShareProgress, current_user: dict = Depends(get_current_user)):
    """Generate shareable link for progress"""
    user_id = current_user["user_id"]
    
    # Get progress
    progress = await db.user_progress.find_one({
        "user_id": user_id,
        "career_path_id": share_data.path_id
    })
    
    if not progress:
        raise HTTPException(status_code=404, detail="No progress found for this path")
    
    # Get user and path info
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "hashed_password": 0})
    career_path = next((p for p in ENHANCED_CAREER_PATHS if p["id"] == share_data.path_id), None)
    
    if not career_path:
        raise HTTPException(status_code=404, detail="Career path not found")
    
    # Create shareable snapshot
    share_id = str(uuid.uuid4())
    snapshot = {
        "id": share_id,
        "user_name": user.get("name", "Anonymous"),
        "path_id": share_data.path_id,
        "path_name": career_path["name"],
        "completed_milestones": len(progress.get("completed_milestones", [])),
        "total_milestones": len(career_path["milestones"]),
        "achievements": progress.get("achievements", []),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.shared_progress.insert_one(snapshot)
    
    return {
        "share_id": share_id,
        "share_url": f"/progress/view/{share_id}",
        "snapshot": snapshot
    }

@api_router.get("/share/{share_id}")
async def view_shared_progress(share_id: str):
    """View shared progress"""
    snapshot = await db.shared_progress.find_one({"id": share_id}, {"_id": 0})
    
    if not snapshot:
        raise HTTPException(status_code=404, detail="Shared progress not found")
    
    return snapshot

# --- Achievements Routes ---
@api_router.get("/achievements")
async def get_achievements():
    """Get all available achievements"""
    return {
        "achievements": [
            {
                "id": "first_step",
                "name": "First Step",
                "description": "Complete your first milestone",
                "icon": "🎯",
                "color": "#10B981"
            },
            {
                "id": "halfway_hero",
                "name": "Halfway Hero",
                "description": "Complete 50% of a career path",
                "icon": "🚀",
                "color": "#3B82F6"
            },
            {
                "id": "path_master",
                "name": "Path Master",
                "description": "Complete an entire career path",
                "icon": "👑",
                "color": "#F59E0B"
            },
            {
                "id": "speed_demon",
                "name": "Speed Demon",
                "description": "Complete a path in record time",
                "icon": "⚡",
                "color": "#EF4444"
            },
            {
                "id": "multi_path",
                "name": "Multi-Path Master",
                "description": "Complete 3 different career paths",
                "icon": "🌟",
                "color": "#8B5CF6"
            }
        ]
    }

@api_router.get("/user/{user_id}/achievements")
async def get_user_achievements(user_id: str):
    """Get all achievements earned by a user"""
    progress_list = await db.user_progress.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    
    all_achievements = set()
    for progress in progress_list:
        achievements = progress.get("achievements", [])
        all_achievements.update(achievements)
    
    # Check for multi-path achievement
    completed_paths = sum(1 for p in progress_list 
                          if len(p.get("completed_milestones", [])) == 
                          len(next((path for path in ENHANCED_CAREER_PATHS 
                                   if path["id"] == p["career_path_id"]), {}).get("milestones", [])))
    
    if completed_paths >= 3:
        all_achievements.add("multi_path")
    
    return {"user_id": user_id, "achievements": list(all_achievements)}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
