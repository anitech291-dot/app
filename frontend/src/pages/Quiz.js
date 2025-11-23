import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import axios from 'axios';
import { ArrowRight, ArrowLeft, CheckCircle2, Brain, Target, Sparkles } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Quiz = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const { user, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${API}/quiz/questions`);
      setQuestions(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setLoading(false);
    }
  };

  const handleAnswer = (optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = {
      question_id: questions[currentQuestion].id,
      selected_option: optionIndex
    };
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (answers.length !== questions.length) {
      alert('Please answer all questions');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(
        `${API}/quiz/submit`,
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(response.data);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz. Please try again.');
      setSubmitting(false);
    }
  };

  const handleComplete = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4 animate-bounce shadow-lg shadow-green-500/50">
              <CheckCircle2 size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Assessment Complete!</h1>
            <p className="text-gray-400 text-lg">
              We've analyzed your responses and created a personalized learning path
            </p>
          </div>

          {/* Recommended Paths */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 mb-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Target className="text-blue-400" />
              Recommended Career Paths
            </h2>
            <div className="space-y-4">
              {results.recommended_paths.map((path, index) => (
                <div 
                  key={path.path_id} 
                  className="bg-slate-900 border border-slate-600 rounded-xl p-6 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{path.path_name}</h3>
                      <p className="text-gray-400 mb-4">{path.reason}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-sm font-medium">
                          📅 ~{path.estimated_weeks} weeks
                        </span>
                        <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm font-medium">
                          🎯 Match: {path.score}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Style */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-8 mb-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <Brain className="text-purple-400" />
              Your Learning Style
            </h3>
            <p className="text-gray-300 text-lg">
              {results.learning_style === 'video' && '🎥 Video Tutorials - Visual learning works best for you'}
              {results.learning_style === 'article' && '📚 Reading & Documentation - You prefer in-depth written content'}
              {results.learning_style === 'course' && '🎯 Hands-on Projects - You learn by doing'}
              {results.learning_style === 'all' && '🌟 Mixed Learning - You benefit from diverse learning materials'}
            </p>
          </div>

          {/* Complete Button */}
          <Button
            onClick={handleComplete}
            className="w-full h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold text-lg rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-blue-500/50"
          >
            <span className="flex items-center justify-center gap-2">
              Start Learning Journey
              <ArrowRight size={20} />
            </span>
          </Button>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="quiz-container">
      <div className="quiz-card">
        <div className="quiz-header">
          <div className="quiz-progress-bar">
            <div 
              className="quiz-progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="quiz-progress-text">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>

        <div className="quiz-content">
          <h2 className="quiz-question">{question.question}</h2>

          <div className="quiz-options">
            {question.options.map((option, index) => (
              <button
                key={index}
                className={`quiz-option ${
                  answers[currentQuestion]?.selected_option === index ? 'selected' : ''
                }`}
                onClick={() => handleAnswer(index)}
              >
                <span className="quiz-option-radio">
                  {answers[currentQuestion]?.selected_option === index && (
                    <span className="quiz-option-dot"></span>
                  )}
                </span>
                <span className="quiz-option-text">{option.text}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="quiz-actions">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            variant="outline"
            className="quiz-nav-button"
          >
            <ArrowLeft size={18} className="mr-2" />
            Previous
          </Button>

          {currentQuestion < questions.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!answers[currentQuestion]}
              className="quiz-nav-button"
            >
              Next
              <ArrowRight size={18} className="ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={answers.length !== questions.length || submitting}
              className="quiz-submit-button"
            >
              {submitting ? 'Submitting...' : 'Complete Assessment'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
