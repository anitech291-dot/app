#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for SUPERCHARGE Career Roadmap Platform
Tests all backend endpoints with authentication, progress tracking, certificates, etc.
"""

import requests
import json
import sys
import os
from datetime import datetime

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading backend URL: {e}")
        return None

BASE_URL = get_backend_url()
if not BASE_URL:
    print("ERROR: Could not get backend URL from frontend/.env")
    sys.exit(1)

API_BASE = f"{BASE_URL}/api"

print(f"Testing backend at: {API_BASE}")

# Global variables to store test data
auth_token = None
user_id = None
path_id = None
certificate_id = None
share_id = None

def make_request(method, endpoint, data=None, headers=None, auth_required=True):
    """Make HTTP request with proper error handling"""
    url = f"{API_BASE}{endpoint}"
    
    # Add auth header if required and token available
    if auth_required and auth_token:
        if headers is None:
            headers = {}
        headers['Authorization'] = f'Bearer {auth_token}'
    
    try:
        if method.upper() == 'GET':
            response = requests.get(url, headers=headers, timeout=30)
        elif method.upper() == 'POST':
            headers = headers or {}
            headers['Content-Type'] = 'application/json'
            response = requests.post(url, json=data, headers=headers, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def test_auth_flow():
    """Test authentication endpoints"""
    global auth_token, user_id
    
    print("\n=== TESTING AUTHENTICATION FLOW ===")
    
    # Test signup
    print("1. Testing user signup...")
    signup_data = {
        "email": "test@supercharge.com",
        "password": "TestPass123",
        "name": "Test User"
    }
    
    response = make_request('POST', '/auth/signup', signup_data, auth_required=False)
    if response and response.status_code == 200:
        data = response.json()
        auth_token = data.get('access_token')
        user_id = data.get('user', {}).get('id')
        print(f"✅ Signup successful - User ID: {user_id}")
    else:
        print(f"❌ Signup failed - Status: {response.status_code if response else 'No response'}")
        if response:
            print(f"Response: {response.text}")
        return False
    
    # Test login
    print("2. Testing user login...")
    login_data = {
        "email": "test@supercharge.com",
        "password": "TestPass123"
    }
    
    response = make_request('POST', '/auth/login', login_data, auth_required=False)
    if response and response.status_code == 200:
        data = response.json()
        login_token = data.get('access_token')
        print(f"✅ Login successful - Token received")
    else:
        print(f"❌ Login failed - Status: {response.status_code if response else 'No response'}")
        if response:
            print(f"Response: {response.text}")
        return False
    
    # Test get current user
    print("3. Testing get current user...")
    response = make_request('GET', '/auth/me')
    if response and response.status_code == 200:
        user_data = response.json()
        print(f"✅ Get user info successful - Name: {user_data.get('name')}")
    else:
        print(f"❌ Get user info failed - Status: {response.status_code if response else 'No response'}")
        if response:
            print(f"Response: {response.text}")
        return False
    
    return True

def test_career_paths():
    """Test career paths endpoints"""
    global path_id
    
    print("\n=== TESTING CAREER PATHS ===")
    
    # Test get all career paths
    print("1. Testing get all career paths...")
    response = make_request('GET', '/career-paths', auth_required=False)
    if response and response.status_code == 200:
        paths = response.json()
        if paths and len(paths) > 0:
            path_id = paths[0]['id']
            print(f"✅ Get career paths successful - Found {len(paths)} paths")
            print(f"First path: {paths[0]['name']} (ID: {path_id})")
        else:
            print("❌ No career paths found")
            return False
    else:
        print(f"❌ Get career paths failed - Status: {response.status_code if response else 'No response'}")
        if response:
            print(f"Response: {response.text}")
        return False
    
    # Test get specific career path
    print("2. Testing get specific career path...")
    response = make_request('GET', f'/career-paths/{path_id}', auth_required=False)
    if response and response.status_code == 200:
        path_data = response.json()
        milestones_count = len(path_data.get('milestones', []))
        print(f"✅ Get specific path successful - {milestones_count} milestones")
    else:
        print(f"❌ Get specific path failed - Status: {response.status_code if response else 'No response'}")
        if response:
            print(f"Response: {response.text}")
        return False
    
    return True

def test_progress_tracking():
    """Test progress tracking endpoints"""
    print("\n=== TESTING PROGRESS TRACKING ===")
    
    # Test get user progress (all paths)
    print("1. Testing get user progress (all paths)...")
    response = make_request('GET', f'/progress/{user_id}')
    if response and response.status_code == 200:
        progress_list = response.json()
        print(f"✅ Get user progress successful - {len(progress_list)} paths tracked")
    else:
        print(f"❌ Get user progress failed - Status: {response.status_code if response else 'No response'}")
        if response:
            print(f"Response: {response.text}")
        return False
    
    # Test get progress for specific path
    print("2. Testing get progress for specific path...")
    response = make_request('GET', f'/progress/{user_id}/{path_id}')
    if response and response.status_code == 200:
        path_progress = response.json()
        completed_count = len(path_progress.get('completed_milestones', []))
        print(f"✅ Get path progress successful - {completed_count} milestones completed")
    else:
        print(f"❌ Get path progress failed - Status: {response.status_code if response else 'No response'}")
        if response:
            print(f"Response: {response.text}")
        return False
    
    # Get path details to find milestone IDs
    path_response = make_request('GET', f'/career-paths/{path_id}', auth_required=False)
    if not path_response or path_response.status_code != 200:
        print("❌ Could not get path details for milestone testing")
        return False
    
    path_data = path_response.json()
    milestones = path_data.get('milestones', [])
    if not milestones:
        print("❌ No milestones found in path")
        return False
    
    # Test marking milestones as complete
    print("3. Testing milestone completion...")
    for i, milestone in enumerate(milestones[:3]):  # Test first 3 milestones
        milestone_id = milestone['id']
        update_data = {
            "milestone_id": milestone_id,
            "completed": True
        }
        
        response = make_request('POST', f'/progress/{user_id}/{path_id}', update_data)
        if response and response.status_code == 200:
            result = response.json()
            print(f"✅ Milestone {i+1} marked complete - {milestone['title']}")
        else:
            print(f"❌ Failed to mark milestone {i+1} complete - Status: {response.status_code if response else 'No response'}")
            if response:
                print(f"Response: {response.text}")
            return False
    
    return True

def test_quiz_flow():
    """Test quiz endpoints"""
    print("\n=== TESTING QUIZ FLOW ===")
    
    # Test get quiz questions
    print("1. Testing get quiz questions...")
    response = make_request('GET', '/quiz/questions', auth_required=False)
    if response and response.status_code == 200:
        questions = response.json()
        print(f"✅ Get quiz questions successful - {len(questions)} questions")
    else:
        print(f"❌ Get quiz questions failed - Status: {response.status_code if response else 'No response'}")
        if response:
            print(f"Response: {response.text}")
        return False
    
    # Test submit quiz answers
    print("2. Testing quiz submission...")
    # Create sample answers for the first few questions
    answers = []
    for i, question in enumerate(questions[:5]):  # Answer first 5 questions
        answers.append({
            "question_id": question['id'],
            "selected_option": 0  # Select first option
        })
    
    quiz_submission = {
        "answers": answers
    }
    
    response = make_request('POST', '/quiz/submit', quiz_submission)
    if response and response.status_code == 200:
        result = response.json()
        recommended_paths = result.get('recommended_paths', [])
        print(f"✅ Quiz submission successful - {len(recommended_paths)} paths recommended")
    else:
        print(f"❌ Quiz submission failed - Status: {response.status_code if response else 'No response'}")
        if response:
            print(f"Response: {response.text}")
        return False
    
    return True

def test_achievements():
    """Test achievements endpoints"""
    print("\n=== TESTING ACHIEVEMENTS ===")
    
    # Test get all achievements
    print("1. Testing get all achievements...")
    response = make_request('GET', '/achievements', auth_required=False)
    if response and response.status_code == 200:
        achievements_data = response.json()
        achievements = achievements_data.get('achievements', [])
        print(f"✅ Get all achievements successful - {len(achievements)} achievements available")
    else:
        print(f"❌ Get all achievements failed - Status: {response.status_code if response else 'No response'}")
        if response:
            print(f"Response: {response.text}")
        return False
    
    # Test get user achievements
    print("2. Testing get user achievements...")
    response = make_request('GET', f'/user/{user_id}/achievements')
    if response and response.status_code == 200:
        user_achievements = response.json()
        earned_count = len(user_achievements.get('achievements', []))
        print(f"✅ Get user achievements successful - {earned_count} achievements earned")
    else:
        print(f"❌ Get user achievements failed - Status: {response.status_code if response else 'No response'}")
        if response:
            print(f"Response: {response.text}")
        return False
    
    return True

def complete_entire_path():
    """Complete all milestones in the path to enable certificate generation"""
    print("\n=== COMPLETING ENTIRE PATH FOR CERTIFICATE ===")
    
    # Get path details
    path_response = make_request('GET', f'/career-paths/{path_id}', auth_required=False)
    if not path_response or path_response.status_code != 200:
        print("❌ Could not get path details")
        return False
    
    path_data = path_response.json()
    milestones = path_data.get('milestones', [])
    
    print(f"Completing all {len(milestones)} milestones...")
    
    for i, milestone in enumerate(milestones):
        milestone_id = milestone['id']
        update_data = {
            "milestone_id": milestone_id,
            "completed": True
        }
        
        response = make_request('POST', f'/progress/{user_id}/{path_id}', update_data)
        if response and response.status_code == 200:
            print(f"✅ Milestone {i+1}/{len(milestones)} completed")
        else:
            print(f"❌ Failed to complete milestone {i+1}")
            return False
    
    return True

def test_certificate_flow():
    """Test certificate generation and download"""
    global certificate_id
    
    print("\n=== TESTING CERTIFICATE FLOW ===")
    
    # First complete the entire path
    if not complete_entire_path():
        return False
    
    # Test certificate generation
    print("1. Testing certificate generation...")
    cert_request = {
        "path_id": path_id
    }
    
    response = make_request('POST', '/certificate/generate', cert_request)
    if response and response.status_code == 200:
        cert_data = response.json()
        certificate_id = cert_data.get('certificate_id')
        print(f"✅ Certificate generation successful - ID: {certificate_id}")
    else:
        print(f"❌ Certificate generation failed - Status: {response.status_code if response else 'No response'}")
        if response:
            print(f"Response: {response.text}")
        return False
    
    # Test certificate download
    print("2. Testing certificate download...")
    response = make_request('GET', f'/certificate/download/{certificate_id}', auth_required=False)
    if response and response.status_code == 200:
        cert_data = response.json()
        print(f"✅ Certificate download successful - User: {cert_data.get('user_name')}")
    else:
        print(f"❌ Certificate download failed - Status: {response.status_code if response else 'No response'}")
        if response:
            print(f"Response: {response.text}")
        return False
    
    # Test certificate public view
    print("3. Testing certificate public view...")
    response = make_request('GET', f'/certificate/{certificate_id}', auth_required=False)
    if response and response.status_code == 200:
        cert_data = response.json()
        print(f"✅ Certificate public view successful")
    else:
        print(f"❌ Certificate public view failed - Status: {response.status_code if response else 'No response'}")
        if response:
            print(f"Response: {response.text}")
        return False
    
    return True

def test_social_features():
    """Test social sharing features"""
    global share_id
    
    print("\n=== TESTING SOCIAL FEATURES ===")
    
    # Test create shareable progress link
    print("1. Testing create shareable progress link...")
    share_data = {
        "path_id": path_id
    }
    
    response = make_request('POST', '/share/progress', share_data)
    if response and response.status_code == 200:
        share_result = response.json()
        share_id = share_result.get('share_id')
        print(f"✅ Share progress successful - Share ID: {share_id}")
    else:
        print(f"❌ Share progress failed - Status: {response.status_code if response else 'No response'}")
        if response:
            print(f"Response: {response.text}")
        return False
    
    # Test view shared progress
    print("2. Testing view shared progress...")
    response = make_request('GET', f'/share/{share_id}', auth_required=False)
    if response and response.status_code == 200:
        shared_data = response.json()
        print(f"✅ View shared progress successful - User: {shared_data.get('user_name')}")
    else:
        print(f"❌ View shared progress failed - Status: {response.status_code if response else 'No response'}")
        if response:
            print(f"Response: {response.text}")
        return False
    
    # Test get user certificates list
    print("3. Testing get user certificates list...")
    response = make_request('GET', f'/user/{user_id}/certificates')
    if response and response.status_code == 200:
        certificates = response.json()
        print(f"✅ Get user certificates successful - {len(certificates)} certificates")
    else:
        print(f"❌ Get user certificates failed - Status: {response.status_code if response else 'No response'}")
        if response:
            print(f"Response: {response.text}")
        return False
    
    return True

def main():
    """Run all tests"""
    print("🚀 Starting SUPERCHARGE Backend API Tests")
    print(f"Backend URL: {API_BASE}")
    
    test_results = []
    
    # Run all test suites
    test_results.append(("Authentication Flow", test_auth_flow()))
    test_results.append(("Career Paths", test_career_paths()))
    test_results.append(("Progress Tracking", test_progress_tracking()))
    test_results.append(("Quiz Flow", test_quiz_flow()))
    test_results.append(("Achievements", test_achievements()))
    test_results.append(("Certificate Flow", test_certificate_flow()))
    test_results.append(("Social Features", test_social_features()))
    
    # Print summary
    print("\n" + "="*50)
    print("TEST SUMMARY")
    print("="*50)
    
    passed = 0
    failed = 0
    
    for test_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\nTotal: {passed + failed} tests")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    
    if failed == 0:
        print("\n🎉 All tests passed! Backend is working correctly.")
        return True
    else:
        print(f"\n⚠️  {failed} test(s) failed. Check the output above for details.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)