import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  User, 
  LogOut, 
  Trophy, 
  Award, 
  Home,
  Brain,
  ChevronDown
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition">
            <span className="text-3xl">⚡</span>
            <span className="text-xl font-bold text-white">SUPERCHARGE</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/dashboard" 
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition"
            >
              <Home size={18} />
              <span>Dashboard</span>
            </Link>
            
            {!user.quiz_completed && (
              <Link 
                to="/quiz" 
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition"
              >
                <Brain size={18} />
                <span>Take Quiz</span>
              </Link>
            )}
            
            <Link 
              to="/achievements" 
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition"
            >
              <Trophy size={18} />
              <span>Achievements</span>
            </Link>
            
            <Link 
              to="/certificates" 
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition"
            >
              <Award size={18} />
              <span>Certificates</span>
            </Link>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition"
            >
              <User size={18} className="text-gray-300" />
              <span className="text-white">{user.name}</span>
              <ChevronDown size={16} className="text-gray-300" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden">
                <Link
                  to="/profile"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center space-x-2 px-4 py-3 text-gray-300 hover:bg-slate-700 transition"
                >
                  <User size={18} />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-3 text-red-400 hover:bg-slate-700 transition"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
