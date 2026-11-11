import React, { useState } from 'react';
import { useLibraryStore } from '../../store/useLibraryStore';
import { useInterviewStore } from '../../store/useInterviewStore';
import { useAppStore } from '../../store/useAppStore';
import {
  BookOpen,
  Search,
  Star,
  Plus,
  Copy,
  Check,
  Sparkles,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const QuestionLibraryView: React.FC = () => {
  const {
    questions,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    toggleFavorite,
    addQuestion,
  } = useLibraryStore();

  const { setActiveAnswer } = useInterviewStore();
  const { setCurrentTab } = useAppStore();

  const [activeQuestionId, setActiveQuestionId] = useState<string>(questions[0]?.id || '');
  const [copied, setCopied] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'automation' | 'qa_technical' | 'programming' | 'database' | 'api_testing' | 'behavioral'>('automation');
  const [newTech, setNewTech] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.technology.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || q.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedQ = questions.find((q) => q.id === activeQuestionId) || filteredQuestions[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUseInLive = () => {
    if (!selectedQ) return;
    setActiveAnswer({
      id: 'ans-' + Date.now(),
      questionId: selectedQ.id,
      questionText: selectedQ.question,
      category: selectedQ.category,
      length: 'standard',
      answer: selectedQ.answer,
      keyPoints: [
        'Direct architectural answer grounded in candidate QA profile.',
        'Concrete examples using ' + selectedQ.technology + '.',
      ],
      followUpPredictions: [
        'How would you scale this across multiple microservices?',
        'What performance trade-offs did you encounter?',
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    setCurrentTab('live');
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrompt.trim()) return;
    addQuestion({
      title: newTitle.trim(),
      category: newCategory,
      technology: newTech.trim() || 'QA Automation',
      difficulty: 'Senior',
      tags: [newCategory, newTech.trim()],
      isFavorite: false,
      question: newPrompt.trim(),
      answer: newAnswer.trim(),
    });
    setShowAddModal(false);
    setNewTitle('');
    setNewTech('');
    setNewPrompt('');
    setNewAnswer('');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-950">
      {/* Top Header */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-400" />
            <span>Question & Answer Knowledge Base</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Curated high-frequency QA automation, Playwright, Selenium, Java, SQL, and leadership interview solutions.
          </p>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search technology, question..."
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 w-56 focus:outline-none focus:border-rose-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="automation">Automation</option>
            <option value="qa_technical">QA Technical</option>
            <option value="programming">Programming</option>
            <option value="database">Database & SQL</option>
            <option value="api_testing">API Testing</option>
            <option value="behavioral">Behavioral (STAR)</option>
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom</span>
          </button>
        </div>
      </div>

      {/* Add Custom Question Modal */}
      {showAddModal && (
        <form onSubmit={handleSaveCustom} className="bg-slate-900 border-b border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase font-mono text-slate-300">
            <span>Add Custom Interview Question & Answer</span>
            <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-slate-300">
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Short title / topic (e.g. Playwright Network Interception)"
              className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white"
              required
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white"
            >
              <option value="automation">Automation</option>
              <option value="qa_technical">QA Technical</option>
              <option value="programming">Programming</option>
              <option value="database">Database</option>
              <option value="api_testing">API Testing</option>
              <option value="behavioral">Behavioral</option>
            </select>
            <input
              type="text"
              value={newTech}
              onChange={(e) => setNewTech(e.target.value)}
              placeholder="Technology (e.g. Playwright, Java, Jenkins)"
              className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white"
            />
          </div>
          <textarea
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            placeholder="Full interview question..."
            rows={2}
            className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs text-white"
            required
          />
          <textarea
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder="Recommended ideal answer..."
            rows={4}
            className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs text-white"
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1.5 text-xs bg-slate-800 text-slate-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded"
            >
              Save Question
            </button>
          </div>
        </form>
      )}

      {/* Split Content: Left (Question List) / Right (Answer Details) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column (5 cols) */}
        <div className="lg:col-span-5 border-r border-slate-800/80 p-3 overflow-y-auto space-y-2 bg-slate-950">
          {filteredQuestions.map((q) => {
            const isSelected = q.id === (selectedQ?.id || activeQuestionId);
            return (
              <div
                key={q.id}
                onClick={() => setActiveQuestionId(q.id)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-rose-950/20 border-rose-800/50 text-white shadow-sm'
                    : 'bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1.5 text-slate-500">
                  <span className="capitalize text-rose-400 font-semibold">{q.category.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <span>{q.technology}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(q.id);
                      }}
                      className="text-slate-500 hover:text-amber-400"
                    >
                      <Star className={`w-3.5 h-3.5 ${q.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-xs leading-snug line-clamp-2">{q.title}</h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{q.question}</p>
              </div>
            );
          })}
        </div>

        {/* Right Column: Question Details & Ideal Answer (7 cols) */}
        <div className="lg:col-span-7 flex flex-col overflow-hidden bg-slate-950">
          {!selectedQ ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              Select a question to inspect details.
            </div>
          ) : (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <span className="text-rose-400 uppercase font-semibold">{selectedQ.category.replace('_', ' ')}</span>
                    <span>·</span>
                    <span>{selectedQ.technology}</span>
                    <span>·</span>
                    <span>{selectedQ.difficulty}</span>
                  </div>
                  <h2 className="text-base font-bold text-white">{selectedQ.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(selectedQ.answer)}
                    className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleUseInLive}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Use in Live Session</span>
                  </button>
                </div>
              </div>

              {/* Exact Interviewer Prompt */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block">
                  Question Prompt
                </span>
                <p className="text-sm font-medium text-white leading-relaxed">
                  "{selectedQ.question}"
                </p>
              </div>

              {/* Recommended Ideal Answer */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase text-rose-400 font-semibold block">
                  Ideal Spoken Answer
                </span>
                <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs leading-relaxed text-slate-200 select-text whitespace-pre-line">
                  {selectedQ.answer}
                </div>
              </div>

              {/* Personal Notes */}
              {selectedQ.notes && (
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 space-y-1">
                  <span className="font-semibold text-slate-300 block font-mono text-[11px]">
                    Candidate Strategic Talking Notes:
                  </span>
                  <p>{selectedQ.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
