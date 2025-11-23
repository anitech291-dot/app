import React from 'react';
import { Trophy, Target, Zap, Star, Crown } from 'lucide-react';

const ACHIEVEMENT_ICONS = {
  first_step: Target,
  halfway_hero: Zap,
  path_master: Crown,
  speed_demon: Zap,
  multi_path: Star
};

const ACHIEVEMENT_DATA = {
  first_step: {
    name: 'First Step',
    description: 'Complete your first milestone',
    icon: '🎯',
    color: '#10B981'
  },
  halfway_hero: {
    name: 'Halfway Hero',
    description: 'Complete 50% of a career path',
    icon: '🚀',
    color: '#3B82F6'
  },
  path_master: {
    name: 'Path Master',
    description: 'Complete an entire career path',
    icon: '👑',
    color: '#F59E0B'
  },
  speed_demon: {
    name: 'Speed Demon',
    description: 'Complete a path in record time',
    icon: '⚡',
    color: '#EF4444'
  },
  multi_path: {
    name: 'Multi-Path Master',
    description: 'Complete 3 different career paths',
    icon: '🌟',
    color: '#8B5CF6'
  }
};

const AchievementBadge = ({ achievementId, size = 'medium', showTooltip = true }) => {
  const achievement = ACHIEVEMENT_DATA[achievementId];
  
  if (!achievement) return null;

  const sizeClasses = {
    small: 'achievement-small',
    medium: 'achievement-medium',
    large: 'achievement-large'
  };

  return (
    <div 
      className={`achievement-badge ${sizeClasses[size]}`}
      style={{ '--achievement-color': achievement.color }}
      title={showTooltip ? `${achievement.name}: ${achievement.description}` : ''}
    >
      <div className="achievement-icon">
        {achievement.icon}
      </div>
      {size !== 'small' && (
        <div className="achievement-info">
          <span className="achievement-name">{achievement.name}</span>
          {size === 'large' && (
            <span className="achievement-description">{achievement.description}</span>
          )}
        </div>
      )}
    </div>
  );
};

export const AchievementPopup = ({ achievement, onClose }) => {
  const achievementData = ACHIEVEMENT_DATA[achievement];
  
  if (!achievementData) return null;

  return (
    <div className="achievement-popup-overlay" onClick={onClose}>
      <div className="achievement-popup" onClick={(e) => e.stopPropagation()}>
        <div className="achievement-popup-glow"></div>
        <div className="achievement-popup-content">
          <div className="achievement-popup-icon">{achievementData.icon}</div>
          <h3 className="achievement-popup-title">Achievement Unlocked!</h3>
          <h4 className="achievement-popup-name">{achievementData.name}</h4>
          <p className="achievement-popup-description">{achievementData.description}</p>
          <button onClick={onClose} className="achievement-popup-close">
            Awesome!
          </button>
        </div>
      </div>
    </div>
  );
};

export default AchievementBadge;
