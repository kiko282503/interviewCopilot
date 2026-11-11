import React, { useState } from 'react';
import { geminiClient } from '../../services/geminiClient';
import { PracticeQuestion, PracticeFeedback } from '../../types';
import {
  GraduationCap,
  Play,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Mic,
  MicOff,
  Award,
  TrendingUp,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

const MOCK_QUESTIONS: PracticeQuestion[] = [
  {
    id: 'pq-1',
    prompt: 'How do you design a robust test automation framework from scratch, and how do you ensure zero flakiness in CI/CD pipelines?',
    category: 'automation',
  },
  {
    id: 'pq-2',
    prompt: 'Tell me about a time when a critical bug escaped to production under your QA watch. How did you handle the situation and prevent future recurrences?',
    category: 'behavioral',
  },
  {
    id: 'pq-3',
    prompt: 'What are the architectural differences between Playwright and Selenium, and in what enterprise scenarios would you advocate for one over the other?',
    category: 'qa_technical',
  },
  {
    id: 'pq-4',
    prompt: 'How do you validate complex asynchronous database updates during automated API and UI testing to guarantee data consistency?',
    category: 'database',
  },
];

export const InterviewPracticeView: React.FC = () => {
  const [role, setRole] = useState('Senior QA Automation Lead');
  const [difficulty, setDifficulty] = useState('Senior');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [mobileTab, setMobileTab] = useState<'prompt' | 'scorecard'>('prompt');

  const activeQuestion = MOCK_QUESTIONS[currentIndex];

  const handleEvaluate = async () => {
    if (!candidateAnswer.trim() || isEvaluating) return;
    setIsEvaluating(true);
    try {
      const result = await geminiClient.evaluatePracticeAnswer({
        questionPrompt: activeQuestion.prompt,
        candidateAnswer,
        targetRole: role,
        difficulty,
      });
      setFeedback(result);
      setMobileTab('scorecard');
    } catch (err) {
      console.error('Failed to evaluate answer:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const nextQuestion = () => {
    setFeedback(null);
    setCandidateAnswer('');
    setCurrentIndex((prev) => (prev + 1) % MOCK_QUESTIONS.length);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-950">
      {/* Top Header */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-400" />
            <span>Interactive Interview Simulator</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Practice technical and behavioral rounds with objective AI rubric evaluation and model answers.
          </p>
        </div>

        {/* Configuration settings */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-mono text-[11px]">Role:</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            >
              <option value="Senior QA Automation Lead">Senior QA Lead</option>
              <option value="Senior SDET">Senior SDET</option>
              <option value="Lead QA Architect">Lead QA Architect</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-mono text-[11px]">Difficulty:</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            >
              <option value="Senior">Senior</option>
              <option value="Lead / Architect">Lead / Architect</option>
              <option value="Mid-Level">Mid-Level</option>
            </select>
          </div>

          <div className="font-mono text-slate-400 text-xs px-2 py-1 rounded bg-slate-900 border border-slate-800">
            Question {currentIndex + 1} of {MOCK_QUESTIONS.length}
          </div>
        </div>
      </div>

      {/* Mobile Screen Segmented Tab Switcher */}
      <div className="lg:hidden flex border-b border-slate-800 bg-slate-900/90 px-3 py-1.5 shrink-0">
        <div className="flex w-full rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setMobileTab('prompt')}
            className={`flex-1 py-1.5 rounded-md text-center transition-colors ${
              mobileTab === 'prompt' ? 'bg-amber-600 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Question & Response
          </button>
          <button
            onClick={() => setMobileTab('scorecard')}
            className={`flex-1 py-1.5 rounded-md text-center transition-colors flex items-center justify-center gap-1.5 ${
              mobileTab === 'scorecard' ? 'bg-amber-600 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Evaluation Scorecard</span>
            {feedback && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Split Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Question & Candidate Answer Input (5 cols) */}
        <div
          className={`lg:col-span-5 border-r border-slate-800/80 p-4 sm:p-5 flex-col gap-4 overflow-y-auto bg-slate-950 ${
            mobileTab === 'prompt' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Question Box */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-amber-400 uppercase font-semibold">
              <span>Simulated Interviewer Prompt</span>
              <span className="capitalize">{activeQuestion.category.replace('_', ' ')}</span>
            </div>
            <p className="text-sm font-semibold text-white leading-relaxed">
              "{activeQuestion.prompt}"
            </p>
          </div>

          {/* Candidate Answer Input */}
          <div className="flex-1 flex flex-col space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 font-mono uppercase">
              <span>Your Spoken or Written Response</span>
              <span className="text-[10px] text-slate-500 font-mono lowercase">STAR framework recommended</span>
            </div>
            <textarea
              value={candidateAnswer}
              onChange={(e) => setCandidateAnswer(e.target.value)}
              placeholder="Speak or type your full response as if you were in the actual interview room..."
              rows={8}
              className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 leading-relaxed placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none font-sans"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={nextQuestion}
              className="px-3 py-2 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
            >
              Skip / Next Question
            </button>

            <button
              onClick={handleEvaluate}
              disabled={isEvaluating || !candidateAnswer.trim()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              {isEvaluating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Grading Answer...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Evaluate Response</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Objective AI Evaluation & Model Answer (7 cols) */}
        <div
          className={`lg:col-span-7 flex-col overflow-hidden bg-slate-950 ${
            mobileTab === 'scorecard' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {isEvaluating ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
              <p className="text-xs font-medium">Grading against Senior QA Lead benchmarks...</p>
              <p className="text-[11px] text-slate-500">Evaluating technical accuracy, relevance, communication, and depth</p>
            </div>
          ) : !feedback ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
              <GraduationCap className="w-12 h-12 text-slate-800" />
              <div>
                <h3 className="text-sm font-medium text-slate-300">Ready for Assessment</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Deliver your answer to the simulated question on the left. The AI will evaluate your communication clarity, technical depth, and generate an ideal model response.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Scorecard Header */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block">
                    Overall Performance Score
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-bold font-mono text-amber-400 tabular-nums">
                      {feedback.score}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">/ 100</span>
                  </div>
                </div>

                {/* Submetrics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 font-mono block">Accuracy</span>
                    <span className="font-semibold text-emerald-400 font-mono">{feedback.accuracy}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 font-mono block">Relevance</span>
                    <span className="font-semibold text-sky-400 font-mono">{feedback.relevance}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 font-mono block">Tech Depth</span>
                    <span className="font-semibold text-indigo-400 font-mono">{feedback.technicalDepth}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 font-mono block">Clarity</span>
                    <span className="font-semibold text-amber-400 font-mono">{feedback.clarity}%</span>
                  </div>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/30 space-y-2">
                  <span className="text-xs font-mono uppercase text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Strong Key Elements</span>
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {feedback.strengths.map((str, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/30 space-y-2">
                  <span className="text-xs font-mono uppercase text-amber-400 font-semibold flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Areas for Improvement</span>
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {feedback.improvements.map((imp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Model Gold-Standard Answer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-slate-300 font-semibold">
                    Gold-Standard Model Answer
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Structured with STAR & Senior QA lead metrics
                  </span>
                </div>
                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-xs leading-relaxed text-slate-200 whitespace-pre-line select-text">
                  {feedback.modelAnswer}
                </div>
              </div>

              {/* Next Question CTA */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={nextQuestion}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                  <span>Practice Next Question</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
