import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Award, Download, Share2, ExternalLink, Calendar } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Certificates = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      // In a real app, you'd have an endpoint to list user certificates
      // For now, we'll fetch from a theoretical endpoint
      const response = await axios.get(`${API}/user/${user.id}/certificates`);
      setCertificates(response.data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificateId) => {
    try {
      const response = await axios.get(`${API}/certificate/download/${certificateId}`);
      // In a real implementation, this would trigger a PDF download
      console.log('Certificate data:', response.data);
      alert('Certificate download would start here. In production, this would generate a PDF.');
    } catch (error) {
      console.error('Error downloading certificate:', error);
    }
  };

  const handleShare = (certificateId) => {
    const shareUrl = `${window.location.origin}/certificate/${certificateId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Certificate link copied to clipboard!');
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Award className="text-amber-500" size={40} />
            <h1 className="text-4xl font-bold text-white">Your Certificates</h1>
          </div>
          <p className="text-gray-400 text-lg">
            {certificates.length > 0 
              ? `You've earned ${certificates.length} certificate${certificates.length > 1 ? 's' : ''}!`
              : 'Complete career paths to earn certificates'
            }
          </p>
        </div>

        {certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-slate-800 rounded-xl p-6 border-2 border-amber-500 shadow-xl shadow-amber-500/20 hover:scale-105 transition-all duration-300"
              >
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-xl font-bold text-white mb-2">{cert.path_name}</h3>
                  <p className="text-gray-400 text-sm mb-1">Awarded to</p>
                  <p className="text-white font-semibold">{cert.user_name}</p>
                  
                  <div className="flex items-center justify-center text-gray-500 text-sm mt-3">
                    <Calendar size={14} className="mr-1" />
                    {new Date(cert.completion_date).toLocaleDateString()}
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => handleDownload(cert.id)}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  >
                    <Download size={18} className="mr-2" />
                    Download
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleShare(cert.id)}
                      variant="outline"
                      className="w-full"
                    >
                      <Share2 size={16} className="mr-2" />
                      Share
                    </Button>
                    
                    <Button
                      onClick={() => navigate(`/certificate/${cert.id}`)}
                      variant="outline"
                      className="w-full"
                    >
                      <ExternalLink size={16} className="mr-2" />
                      View
                    </Button>
                  </div>
                </div>

                {cert.achievements && cert.achievements.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-gray-400 text-xs mb-2">Achievements Earned:</p>
                    <div className="flex flex-wrap gap-2">
                      {cert.achievements.map((achievement, idx) => (
                        <span 
                          key={idx}
                          className="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded-full"
                        >
                          {achievement}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">🎯</div>
            <h3 className="text-2xl font-bold text-white mb-4">No Certificates Yet</h3>
            <p className="text-gray-400 mb-6">
              Complete all milestones in a career path to earn your first certificate
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Browse Career Paths
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificates;
