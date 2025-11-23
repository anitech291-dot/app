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
      <div className="quiz-results-container">
        <div className="quiz-results-card">
          <div className="quiz-results-header">
            <CheckCircle2 size={64} className="quiz-success-icon" />
            <h1 className="quiz-results-title">Assessment Complete!</h1>
            <p className="quiz-results-subtitle">
              We've analyzed your responses and created a personalized learning path
            </p>
          </div>

          <div className="quiz-recommendations">
            <h2 className="quiz-section-title">Recommended Career Paths</h2>
            <div className="quiz-paths-list">
              {results.recommended_paths.map((path, index) => (
                <div key={path.path_id} className="quiz-path-card">
                  <div className="quiz-path-rank">#{index + 1}</div>
                  <div className="quiz-path-info">
                    <h3 className="quiz-path-name">{path.path_name}</h3>
                    <p className="quiz-path-reason">{path.reason}</p>
                    <div className="quiz-path-meta">
                      <span className="quiz-meta-badge">
                        📅 ~{path.estimated_weeks} weeks
                      </span>
                      <span className="quiz-meta-badge">
                        🎯 Match: {path.score}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="quiz-learning-style">
            <h3 className="quiz-style-title">Your Learning Style</h3>
            <p className="quiz-style-text">
              {results.learning_style === 'video' && '🎥 Video Tutorials - Visual learning works best for you'}
              {results.learning_style === 'article' && '📚 Reading & Documentation - You prefer in-depth written content'}
              {results.learning_style === 'course' && '🎯 Hands-on Projects - You learn by doing'}
              {results.learning_style === 'all' && '🌟 Mixed Learning - You benefit from diverse learning materials'}
            </p>
          </div>

          <Button
            onClick={handleComplete}
            className="quiz-complete-button"
          >
            Start Learning
            <ArrowRight size={18} className="ml-2" />
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
