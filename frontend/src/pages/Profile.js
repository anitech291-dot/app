import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Mail, 
  Calendar, 
  Trophy, 
  Award, 
  Target,
  TrendingUp,
  Edit
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Profile = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPaths: 0,
    completedPaths: 0,
    totalMilestones: 0,
    achievementsCount: 0,
    certificatesCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [progressRes, achievementsRes, pathsRes] = await Promise.all([
        axios.get(`${API}/progress/${user.id}`),
        axios.get(`${API}/user/${user.id}/achievements`),
        axios.get(`${API}/career-paths`)
      ]);

      const progress = progressRes.data;
      const achievements = achievementsRes.data.achievements || [];
      const paths = pathsRes.data;

      const completedPaths = progress.filter(p => {
        const path = paths.find(cp => cp.id === p.career_path_id);
        return path && p.completed_milestones.length === path.milestones.length;
      }).length;

      const totalMilestones = progress.reduce(
        (sum, p) => sum + p.completed_milestones.length, 
        0
      );

      setStats({
        totalPaths: progress.length,
        completedPaths,
        totalMilestones,
        achievementsCount: achievements.length,
        certificatesCount: completedPaths // Certificates equal completed paths
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-4xl text-white font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
                
                <div className="flex items-center space-x-2 text-gray-400 mb-1">
                  <Mail size={16} />
                  <span>{user.email}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-gray-400">
                  <Calendar size={16} />
                  <span>Member since {new Date(user.created_at).toLocaleDateString()}</span>
                </div>

                {user.quiz_completed && (
                  <div className="mt-3 inline-block bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                    ✓ Quiz Completed
                  </div>
                )}
              </div>
            </div>

            <Button variant="outline" className="flex items-center space-x-2">
              <Edit size={18} />
              <span>Edit Profile</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Target className="text-white" size={32} />
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{stats.completedPaths}</div>
                <div className="text-blue-100 text-sm">Paths Completed</div>
              </div>
            </div>
            <div className="text-blue-100 text-sm">
              {stats.totalPaths} total paths started
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="text-white" size={32} />
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{stats.totalMilestones}</div>
                <div className="text-green-100 text-sm">Milestones</div>
              </div>
            </div>
            <div className="text-green-100 text-sm">
              Keep up the great work!
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Trophy className="text-white" size={32} />
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{stats.achievementsCount}</div>
                <div className="text-purple-100 text-sm">Achievements</div>
              </div>
            </div>
            <div className="text-purple-100 text-sm">
              Unlocked badges
            </div>
          </div>
        </div>

        {/* Learning Preferences */}
        {user.learning_style && (
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Learning Preferences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-gray-400 text-sm mb-2">Learning Style</h3>
                <p className="text-white text-lg font-semibold capitalize">{user.learning_style}</p>
              </div>
              
              {user.recommended_paths && user.recommended_paths.length > 0 && (
                <div>
                  <h3 className="text-gray-400 text-sm mb-2">Recommended Paths</h3>
                  <p className="text-white text-lg font-semibold">{user.recommended_paths.length} paths</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Certificates Section */}
        {stats.certificatesCount > 0 && (
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Award className="text-amber-500" size={32} />
                <h2 className="text-2xl font-bold text-white">Certificates</h2>
              </div>
              <span className="text-3xl font-bold text-amber-500">{stats.certificatesCount}</span>
            </div>
            <p className="text-gray-400">
              You've earned {stats.certificatesCount} certificate{stats.certificatesCount > 1 ? 's' : ''} for completing career paths!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
