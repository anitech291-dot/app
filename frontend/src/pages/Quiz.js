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
  const answeredCount = answers.filter(a => a).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/50">
            <Brain size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Career Assessment</h1>
          <p className="text-gray-400">Help us understand your goals and preferences</p>
        </div>

        {/* Quiz Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl mb-6">
          {/* Progress Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-400">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span className="text-sm font-medium text-blue-400">
                {answeredCount}/{questions.length} answered
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 leading-relaxed">
              {question.question}
            </h2>

            {/* Options */}
            <div className="space-y-3">
              {question.options.map((option, index) => {
                const isSelected = answers[currentQuestion]?.selected_option === index;
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-300 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                        : 'border-slate-600 bg-slate-900 hover:border-slate-500 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'border-blue-500' : 'border-slate-600'
                      }`}>
                        {isSelected && (
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                      <span className={`text-base ${
                        isSelected ? 'text-white font-medium' : 'text-gray-300'
                      }`}>
                        {option.text}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-700">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              variant="outline"
              className="bg-slate-900 border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white disabled:opacity-30 h-12 px-6"
            >
              <ArrowLeft size={18} className="mr-2" />
              Previous
            </Button>

            {currentQuestion < questions.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!answers[currentQuestion]}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white h-12 px-6 shadow-lg shadow-blue-500/30 disabled:opacity-50"
              >
                Next
                <ArrowRight size={18} className="ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={answers.length !== questions.length || submitting}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white h-12 px-8 shadow-lg shadow-green-500/30 disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={18} />
                    Complete Assessment
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Sparkles size={20} className="text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-white">Pro tip:</span> Answer honestly to get the most accurate career recommendations tailored to your interests and goals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
