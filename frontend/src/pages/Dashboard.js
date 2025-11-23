import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronRight, 
  Trophy, 
  Award,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ICON_MAP = {
  code: '💻',
  shield: '🛡️',
  brain: '🧠',
  chart: '📊',
  cube: '📦',
  cloud: '☁️'
};

const Dashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [careerPaths, setCareerPaths] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [pathsRes, progressRes, achievementsRes] = await Promise.all([
        axios.get(`${API}/career-paths`),
        axios.get(`${API}/progress/${user.id}`),
        axios.get(`${API}/user/${user.id}/achievements`)
      ]);

      setCareerPaths(pathsRes.data);
      setUserProgress(progressRes.data);
      setAchievements(achievementsRes.data.achievements || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPathProgress = (pathId) => {
    const progress = userProgress.find(p => p.career_path_id === pathId);
    if (!progress) return 0;
    
    const path = careerPaths.find(p => p.id === pathId);
    if (!path) return 0;
    
    return Math.round((progress.completed_milestones.length / path.milestones.length) * 100);
  };

  const getCompletedCount = () => {
    return userProgress.reduce((sum, p) => {
      const path = careerPaths.find(cp => cp.id === p.career_path_id);
      if (path && p.completed_milestones.length === path.milestones.length) {
        return sum + 1;
      }
      return sum;
    }, 0);
  };

  const getTotalMilestonesCompleted = () => {
    return userProgress.reduce((sum, p) => sum + p.completed_milestones.length, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const recommendedPaths = user.recommended_paths || [];
  const hasRecommendations = recommendedPaths.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user.name}! 👋
          </h1>
          <p className="text-gray-400 text-lg">
            Continue your learning journey and achieve your goals
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Target className="text-white" size={24} />
              <span className="text-blue-100 text-sm font-medium">Paths</span>
            </div>
            <div className="text-3xl font-bold text-white">{getCompletedCount()}</div>
            <div className="text-blue-100 text-sm">Completed</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="text-white" size={24} />
              <span className="text-green-100 text-sm font-medium">Milestones</span>
            </div>
            <div className="text-3xl font-bold text-white">{getTotalMilestonesCompleted()}</div>
            <div className="text-green-100 text-sm">Achieved</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="text-white" size={24} />
              <span className="text-purple-100 text-sm font-medium">Achievements</span>
            </div>
            <div className="text-3xl font-bold text-white">{achievements.length}</div>
            <div className="text-purple-100 text-sm">Earned</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-white" size={24} />
              <span className="text-orange-100 text-sm font-medium">Progress</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {userProgress.length > 0 ? Math.round(userProgress.reduce((sum, p) => sum + getPathProgress(p.career_path_id), 0) / userProgress.length) : 0}%
            </div>
            <div className="text-orange-100 text-sm">Average</div>
          </div>
        </div>

        {/* Quiz CTA */}
        {!user.quiz_completed && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 mb-8 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">🎯 Take Your Skill Assessment</h3>
                <p className="text-indigo-100 mb-4">
                  Get personalized career path recommendations based on your interests and goals
                </p>
                <Button
                  onClick={() => navigate('/quiz')}
                  className="bg-white text-indigo-600 hover:bg-indigo-50 font-semibold"
                >
                  Start Quiz
                  <ChevronRight className="ml-2" size={18} />
                </Button>
              </div>
              <div className="hidden md:block text-8xl">🧠</div>
            </div>
          </div>
        )}

        {/* Recommended Paths */}
        {hasRecommendations && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <Target className="mr-2" size={24} />
              Recommended For You
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {careerPaths
                .filter(path => recommendedPaths.includes(path.id))
                .map(path => {
                  const progress = getPathProgress(path.id);
                  return (
                    <div
                      key={path.id}
                      onClick={() => navigate(`/path/${path.id}`)}
                      className="bg-slate-800 border-2 border-indigo-500 rounded-xl p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      <div className="text-4xl mb-4">{ICON_MAP[path.icon]}</div>
                      <h3 className="text-xl font-bold text-white mb-2">{path.name}</h3>
                      <p className="text-gray-400 text-sm mb-4">{path.description}</p>
                      <Progress value={progress} className="mb-2" />
                      <div className="text-sm text-gray-400">{progress}% Complete</div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* All Career Paths */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">All Career Paths</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {careerPaths.map(path => {
              const progress = getPathProgress(path.id);
              const isStarted = progress > 0;
              
              return (
                <div
                  key={path.id}
                  onClick={() => navigate(`/path/${path.id}`)}
                  className="bg-slate-800 rounded-xl p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border border-slate-700"
                >
                  <div className="text-4xl mb-4">{ICON_MAP[path.icon]}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{path.name}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{path.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span>{path.milestones.length} Milestones</span>
                    <span className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      {path.milestones.reduce((sum, m) => sum + m.estimated_days, 0)} Days
                    </span>
                  </div>
                  
                  {isStarted ? (
                    <>
                      <Progress value={progress} className="mb-2" />
                      <div className="text-sm text-gray-400">{progress}% Complete</div>
                    </>
                  ) : (
                    <Button className="w-full" variant="outline">
                      Start Learning
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
