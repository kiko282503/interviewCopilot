import React, { useState } from 'react';
import { useCodeStore } from '../../store/useCodeStore';
import { useAppStore } from '../../store/useAppStore';
import { geminiClient } from '../../services/geminiClient';
import {
  Code2,
  Play,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  ExternalLink,
  Sparkles,
  Layers,
  Clock,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

const QA_CODING_PROMPTS = [
  {
    title: 'Playwright POM Login Suite (TypeScript)',
    prompt: 'Write a complete Playwright TypeScript test suite using Page Object Model (POM) for login authentication with custom explicit waits, data-driven test cases, and assertion messages.',
    language: 'TypeScript',
  },
  {
    title: 'Find Duplicate Values in Integer Array (Java)',
    prompt: 'Write a Java method to find all duplicate elements in an integer array in O(n) time and O(n) space using HashSet, and explain how to solve it in O(1) extra space if elements are bounded 1..n.',
    language: 'Java',
  },
  {
    title: 'Selenium Dynamic Web Table Parser (Java)',
    prompt: 'Write a reusable Selenium Java utility class that extracts data from a dynamic HTML table with pagination, handles StaleElementReferenceException gracefully, and validates row values.',
    language: 'Java',
  },
  {
    title: 'SQL: Find Duplicate Emails & 2nd Highest Salary',
    prompt: 'Write SQL queries to: 1) Identify duplicate emails from a Person table with counts, and 2) Find the second highest salary using DENSE_RANK() and handle ties/null gracefully.',
    language: 'SQL',
  },
  {
    title: 'API Automation Token Refresh Fixture (TypeScript)',
    prompt: 'Create a reusable Playwright/TypeScript API client fixture that automatically intercepts expired 401 JWT tokens, requests a new token via refresh endpoint, and replays original requests.',
    language: 'TypeScript',
  },
];

export const CodingAssistantView: React.FC = () => {
  const { currentSolution, setCurrentSolution, isSolving, setIsSolving, addTab } = useCodeStore();
  const { setCurrentTab } = useAppStore();

  const [problemText, setProblemText] = useState(
    'Write a Java method to identify duplicate values in an integer array, return the duplicates list, and analyze Big-O complexity.'
  );
  const [language, setLanguage] = useState('Java');
  const [mode, setMode] = useState<'quick' | 'detailed' | 'interview' | 'optimized' | 'debugging'>('interview');
  const [copied, setCopied] = useState(false);
  const [mobileTab, setMobileTab] = useState<'prompt' | 'solution'>('prompt');

  const languages = ['Java', 'TypeScript', 'JavaScript', 'Python', 'SQL', 'C#', 'Bash'];
  const modes = [
    { id: 'interview', label: 'Interview Explanation' },
    { id: 'quick', label: 'Quick Code' },
    { id: 'optimized', label: 'Optimized Solution' },
    { id: 'detailed', label: 'In-Depth Walkthrough' },
    { id: 'debugging', label: 'Debugging Mode' },
  ];

  const handleSolve = async () => {
    if (!problemText.trim() || isSolving) return;
    setIsSolving(true);
    try {
      const solution = await geminiClient.solveCodingProblem({
        problemText,
        language,
        mode,
      });
      setCurrentSolution(solution);
      setMobileTab('solution');
    } catch (err) {
      console.error('Failed to solve problem:', err);
    } finally {
      setIsSolving(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openInWorkspace = () => {
    if (!currentSolution) return;
    const ext = language.toLowerCase() === 'java' ? 'java' : language.toLowerCase() === 'typescript' ? 'ts' : 'js';
    addTab(`Solution.${ext}`, language.toLowerCase(), currentSolution.code);
    setCurrentTab('workspace');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-950">
      {/* Top Header bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-400" />
            <span>AI Coding Interview Assistant</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Algorithmic problem solving, Big-O complexity analysis, and QA automation architecture.
          </p>
        </div>

        {/* Language & Mode Selectors */}
        <div className="flex items-center gap-3">
          {/* Language Picker */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-mono text-[11px] text-slate-500">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-500"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Segmented Controls */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                  mode === m.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Solve Button */}
          <button
            onClick={handleSolve}
            disabled={isSolving || !problemText.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            {isSolving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Solving...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Generate Solution</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Screen Segmented Tab Switcher */}
      <div className="lg:hidden flex border-b border-slate-800 bg-slate-900/90 px-3 py-1.5 shrink-0">
        <div className="flex w-full rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setMobileTab('prompt')}
            className={`flex-1 py-1.5 rounded-md text-center transition-colors ${
              mobileTab === 'prompt' ? 'bg-indigo-600 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Problem & Presets
          </button>
          <button
            onClick={() => setMobileTab('solution')}
            className={`flex-1 py-1.5 rounded-md text-center transition-colors flex items-center justify-center gap-1.5 ${
              mobileTab === 'solution' ? 'bg-indigo-600 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Solution & Tests</span>
            {currentSolution && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Content Split: Left (Prompt & Presets) / Right (Structured Output) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Problem Input & Templates (5 cols) */}
        <div
          className={`lg:col-span-5 border-r border-slate-800/80 p-4 sm:p-5 flex-col gap-4 overflow-y-auto bg-slate-950 ${
            mobileTab === 'prompt' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono mb-2">
              Problem Description or Interview Prompt
            </label>
            <textarea
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
              placeholder="Paste algorithm question, coding exercise, SQL problem, or QA automation request..."
              rows={8}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* QA Automation Quick Prompts */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono mb-2">
              <span>Curated QA & Coding Challenges</span>
            </div>
            <div className="space-y-2">
              {QA_CODING_PROMPTS.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setProblemText(item.prompt);
                    setLanguage(item.language);
                  }}
                  className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between text-slate-300 font-medium mb-1">
                    <span className="group-hover:text-indigo-400 transition-colors">{item.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {item.language}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {item.prompt}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Structured Solution & Complexity (7 cols) */}
        <div
          className={`lg:col-span-7 flex-col overflow-hidden bg-slate-950 ${
            mobileTab === 'solution' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {isSolving ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-xs font-medium">Developing optimal {language} solution...</p>
              <p className="text-[11px] text-slate-500">Calculating Big-O complexity & generating edge cases</p>
            </div>
          ) : !currentSolution ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
              <Code2 className="w-12 h-12 text-slate-800" />
              <div>
                <h3 className="text-sm font-medium text-slate-300">Ready to Solve</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Enter any coding problem, algorithm, or QA framework task on the left and click "Generate Solution".
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Actions Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-indigo-400 uppercase font-semibold">
                    {currentSolution.language} Solution
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyCode(currentSolution.code)}
                    className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Code'}</span>
                  </button>
                  <button
                    onClick={openInWorkspace}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Open in Code Workspace</span>
                  </button>
                </div>
              </div>

              {/* 1. Problem Understanding & Approach */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block">
                    Problem Understanding & Constraints
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentSolution.problemUnderstanding}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-mono uppercase text-indigo-400 font-semibold block">
                    Algorithmic Approach
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentSolution.approach}
                  </p>
                </div>
              </div>

              {/* 2. Code Block */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Complete Implementation</span>
                  <span>{currentSolution.language}</span>
                </div>
                <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed select-text">
                  <code>{currentSolution.code}</code>
                </pre>
              </div>

              {/* 3. Complexity Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold block">
                      Time Complexity
                    </span>
                    <p className="text-xs font-mono font-semibold text-white mt-0.5">
                      {currentSolution.timeComplexity}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 shrink-0">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold block">
                      Space Complexity
                    </span>
                    <p className="text-xs font-mono font-semibold text-white mt-0.5">
                      {currentSolution.spaceComplexity}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Step-by-Step Explanation */}
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                <span className="text-xs font-mono uppercase text-slate-300 font-semibold block">
                  Step-by-Step Walkthrough
                </span>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {currentSolution.explanation}
                </p>
              </div>

              {/* 5. Test Cases Table */}
              {currentSolution.testCases && currentSolution.testCases.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
                  <span className="text-xs font-mono uppercase text-slate-300 font-semibold block">
                    Validation Test Cases
                  </span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase font-mono text-slate-500 border-b border-slate-800">
                        <tr>
                          <th className="py-2 pr-4 font-semibold">Input</th>
                          <th className="py-2 pr-4 font-semibold">Expected Output</th>
                          <th className="py-2 font-semibold">Rationale</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                        {currentSolution.testCases.map((tc, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/60">
                            <td className="py-2 pr-4 text-indigo-300 font-medium">{tc.input}</td>
                            <td className="py-2 pr-4 text-emerald-300 font-medium">{tc.expected}</td>
                            <td className="py-2 text-slate-400 font-sans">{tc.explanation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 6. Edge Cases & Caveats */}
              {currentSolution.edgeCases && currentSolution.edgeCases.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/30 space-y-2">
                  <span className="text-xs font-mono uppercase text-amber-400 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Important Edge Cases to Mention in Interview</span>
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {currentSolution.edgeCases.map((ec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <span>{ec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
