import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useCodeStore } from '../../store/useCodeStore';
import { geminiClient } from '../../services/geminiClient';
import {
  Terminal,
  Play,
  Copy,
  Check,
  Plus,
  X,
  RefreshCw,
  Clock,
  Sparkles,
  AlertTriangle,
  Code2,
} from 'lucide-react';

export const CodeWorkspaceView: React.FC = () => {
  const {
    tabs,
    activeTabId,
    setActiveTabId,
    updateTabCode,
    updateTabLanguage,
    addTab,
    closeTab,
    isExecuting,
    setIsExecuting,
    executionOutput,
    executionErrors,
    executionTimeMs,
    setExecutionResult,
  } = useCodeStore();

  const [copied, setCopied] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileModal, setShowNewFileModal] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const handleRunCode = async () => {
    if (!activeTab || isExecuting) return;
    setIsExecuting(true);
    try {
      const result = await geminiClient.executeCode(activeTab.code, activeTab.language);
      setExecutionResult(result.output, result.errors, result.executionTimeMs);
    } catch (err: any) {
      setExecutionResult(null, err.message || 'Execution error', 0);
    } finally {
      setIsExecuting(false);
    }
  };

  const copyCode = () => {
    if (!activeTab) return;
    navigator.clipboard.writeText(activeTab.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const name = newFileName.trim();
    let lang = 'typescript';
    if (name.endsWith('.java')) lang = 'java';
    else if (name.endsWith('.py')) lang = 'python';
    else if (name.endsWith('.sql')) lang = 'sql';
    else if (name.endsWith('.js')) lang = 'javascript';

    addTab(name, lang, `// ${name}\n`);
    setNewFileName('');
    setShowNewFileModal(false);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-950">
      {/* Tab bar & Actions */}
      <div className="border-b border-slate-800/80 bg-slate-900/70 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* File Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-2xl py-1">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-slate-950 text-indigo-400 border-indigo-500/40 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                <span>{tab.title}</span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="p-0.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={() => setShowNewFileModal(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Create New File"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Actions: Language Selector, Run, Copy */}
        <div className="flex items-center gap-2.5">
          <select
            value={activeTab?.language || 'typescript'}
            onChange={(e) => activeTab && updateTabLanguage(activeTab.id, e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none"
          >
            <option value="java">Java</option>
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="sql">SQL</option>
            <option value="csharp">C#</option>
          </select>

          <button
            onClick={copyCode}
            className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleRunCode}
            disabled={isExecuting}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            {isExecuting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">Filename:</span>
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="e.g. TestClass.java, utils.ts, query.sql"
            className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white font-mono flex-1 max-w-sm focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleCreateFile}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded"
          >
            Create
          </button>
          <button
            onClick={() => setShowNewFileModal(false)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Editor & Console Split */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Monaco Editor Container */}
        <div className="flex-1 overflow-hidden">
          {activeTab && (
            <Editor
              height="100%"
              theme="vs-dark"
              language={activeTab.language === 'csharp' ? 'csharp' : activeTab.language}
              value={activeTab.code}
              onChange={(value) => updateTabCode(activeTab.id, value || '')}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                automaticLayout: true,
                padding: { top: 12 },
              }}
            />
          )}
        </div>

        {/* Bottom Output Console */}
        <div className="h-48 border-t border-slate-800/80 bg-slate-950 flex flex-col shrink-0">
          <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300 font-semibold">Execution Output Console</span>
              {executionTimeMs > 0 && (
                <span className="text-[10px] text-slate-500 tabular-nums">
                  ({executionTimeMs}ms)
                </span>
              )}
            </div>
            <button
              onClick={() => setExecutionResult(null, null, 0)}
              className="text-[10px] text-slate-500 hover:text-slate-300"
            >
              Clear Console
            </button>
          </div>

          <div className="flex-1 p-3 font-mono text-xs overflow-y-auto text-slate-300 select-text">
            {executionErrors ? (
              <div className="text-rose-400 whitespace-pre-wrap">{executionErrors}</div>
            ) : executionOutput ? (
              <div className="text-emerald-300/90 whitespace-pre-wrap">{executionOutput}</div>
            ) : (
              <div className="text-slate-600 italic">
                Press "Run Code" above to execute or simulate in isolated sandbox environment.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
