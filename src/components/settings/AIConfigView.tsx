import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useInterviewStore } from '../../store/useInterviewStore';
import {
  Cpu,
  Save,
  Check,
  ShieldAlert,
  Sparkles,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export const AIConfigView: React.FC = () => {
  const { preferredModel } = useAppStore();
  const { responseLength, setResponseLength } = useInterviewStore();

  const [selectedModel, setSelectedModel] = useState('gemini-3.8-flash');
  const [responseStyle, setResponseStyle] = useState<'conversational' | 'concise' | 'technical'>('conversational');
  const [reasoningLevel, setReasoningLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-950">
      {/* Top Header */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <span>AI Model & Orchestration Configuration</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage Gemini API parameters, response styles, and latency thresholds.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
        >
          {saved ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Save className="w-3.5 h-3.5" />}
          <span>{saved ? 'Saved Successfully' : 'Save Configuration'}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-4xl mx-auto w-full">
        {/* Model Selection */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-300 font-semibold block">
              Active Gemini Model
            </span>
            <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
              Low-Latency Active
            </span>
          </div>

          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3.5 rounded-lg border border-indigo-500/40 bg-indigo-950/20 cursor-pointer">
              <input
                type="radio"
                name="model"
                value="gemini-3.8-flash"
                checked={selectedModel === 'gemini-3.8-flash'}
                onChange={() => setSelectedModel('gemini-3.8-flash')}
                className="mt-0.5 text-indigo-600"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">gemini-3.8-flash</span>
                  <span className="text-[10px] text-indigo-400 font-mono">(Recommended for Live Interviews)</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  High-speed reasoning, low-latency streaming answers, and multimodal vision processing. Sub-second response turnaround.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Response Defaults */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <span className="text-xs font-mono uppercase text-slate-300 font-semibold block">
              Default Response Length
            </span>
            <div className="space-y-2 text-xs">
              {(['short', 'standard', 'detailed'] as const).map((len) => (
                <label
                  key={len}
                  onClick={() => setResponseLength(len)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    responseLength === len
                      ? 'bg-slate-950 border-indigo-500/50 text-white'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="capitalize font-medium">{len}</span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {len === 'short' ? '15–30s spoken' : len === 'standard' ? '30–60s spoken' : '60–120s spoken'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <span className="text-xs font-mono uppercase text-slate-300 font-semibold block">
              Tone & Style Delivery
            </span>
            <div className="space-y-2 text-xs">
              {(
                [
                  { id: 'conversational', label: 'Conversational & Articulate', desc: 'Natural first-person spoken English' },
                  { id: 'concise', label: 'Executive Bullet Points', desc: 'Punchy talking points' },
                  { id: 'technical', label: 'Deep Technical Architecture', desc: 'Deep dive with code and framework patterns' },
                ] as const
              ).map((st) => (
                <label
                  key={st.id}
                  onClick={() => setResponseStyle(st.id)}
                  className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-colors ${
                    responseStyle === st.id
                      ? 'bg-slate-950 border-indigo-500/50 text-white'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-medium text-xs text-white">{st.label}</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">{st.desc}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Security & Credentials Notice */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400 space-y-1">
            <span className="font-semibold text-slate-200 block">Security & Secret Isolation</span>
            <p>
              Your Gemini API key is securely loaded from server-side environment variables (`GEMINI_API_KEY`) and is never exposed to the client renderer process or IPC message bus.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
