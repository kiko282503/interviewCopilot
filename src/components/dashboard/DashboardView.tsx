import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useProfileStore } from '../../store/useProfileStore';
import { useInterviewStore } from '../../store/useInterviewStore';
import {
  Mic,
  Code2,
  ScanLine,
  GraduationCap,
  FileText,
  HelpCircle,
  Play,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
  Monitor,
  ShieldCheck,
  Smartphone,
  Terminal,
  Laptop,
} from 'lucide-react';
import { PWAInstallButton } from '../layout/PWAInstallButton';
import { ScreenShareTestModal } from '../floating/ScreenShareTestModal';
import { PhoneCompanionModal } from '../floating/PhoneCompanionModal';
import { NativeInvisibilityModal } from '../floating/NativeInvisibilityModal';
import { DesktopLauncherModal } from '../desktop/DesktopLauncherModal';

export const DashboardView: React.FC = () => {
  const { setCurrentTab, setFloatingMode, isFloatingMode, decoyPreset, isCamouflageMode, toggleCamouflageMode } = useAppStore();
  const { profile } = useProfileStore();
  const { isListening, audioInputName } = useInterviewStore();
  const [showScreenTestModal, setShowScreenTestModal] = React.useState(false);
  const [showCompanionModal, setShowCompanionModal] = React.useState(false);
  const [showInvisibilityModal, setShowInvisibilityModal] = React.useState(false);
  const [showDesktopModal, setShowDesktopModal] = React.useState(false);

  const handleLaunchDesktopHUD = () => {
    const url = `${window.location.origin}${window.location.pathname}?mode=standalone-hud`;
    const popup = window.open(
      url,
      'CopilotFloatingHUD',
      'popup=yes,width=440,height=650,menubar=no,toolbar=no,status=no,resizable=yes'
    );
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      setFloatingMode(true);
    }
  };

  const quickActions = [
    {
      title: 'Start Live Interview',
      desc: 'Listen to interview audio, auto-detect questions, and stream personalized answers.',
      icon: Mic,
      color: 'from-indigo-500/20 to-blue-500/10 border-indigo-500/30 text-indigo-400',
      action: () => setCurrentTab('live'),
    },
    {
      title: 'Analyze Screenshot',
      desc: 'Upload, capture, or paste test assessment images, compiler errors, or diagrams.',
      icon: ScanLine,
      color: 'from-sky-500/20 to-cyan-500/10 border-sky-500/30 text-sky-400',
      action: () => setCurrentTab('screenshot'),
    },
    {
      title: 'Open Coding Assistant',
      desc: 'Solve data structures, algorithms, SQL queries, or automation framework challenges.',
      icon: Code2,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
      action: () => setCurrentTab('coding'),
    },
    {
      title: 'Practice Mock Interview',
      desc: 'Simulate high-stakes technical QA and behavioral rounds with AI grading.',
      icon: GraduationCap,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
      action: () => setCurrentTab('practice'),
    },
    {
      title: 'Review Resume Intelligence',
      desc: 'Audit the preloaded Senior QA Lead profile or upload an updated resume.',
      icon: FileText,
      color: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-400',
      action: () => setCurrentTab('resume'),
    },
    {
      title: 'Q&A Knowledge Base',
      desc: 'Browse curated QA automation, Playwright, Selenium, and SQL technical solutions.',
      icon: HelpCircle,
      color: 'from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-400',
      action: () => setCurrentTab('library'),
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 overflow-y-auto">
      {/* Top Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5 sm:pb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Interview Copilot AI
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/40">
              Desktop Edition
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Decoy: {decoyPreset}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Real-time audio transcription, multimodal vision problem solving, and personalized answers grounded in your Senior QA Automation leadership experience.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setShowDesktopModal(true)}
            className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer border border-emerald-500"
            title="Download native Windows desktop app (100% invisible on Teams entire screen sharing)"
          >
            <Laptop className="w-4 h-4" />
            <span>Download Native Stealth App (.bat)</span>
          </button>
          <button
            onClick={handleLaunchDesktopHUD}
            className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            title="Pop out HUD as an independent Windows 11 desktop window that can be dragged outside this browser"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Pop Out Desktop HUD</span>
          </button>
          <button
            onClick={() => setShowCompanionModal(true)}
            className="px-3 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            title="Scan QR code to open companion HUD on your smartphone (Zero apps on PC)"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline">Phone QR</span>
          </button>
          <button
            onClick={() => setCurrentTab('live')}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
            <span>Start Live Session</span>
          </button>
        </div>
      </div>

      {/* Screen Share & Stealth Notice Banner */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-slate-900/70 border border-emerald-900/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              <span>Entire Screen Sharing Invisibility (Parakeet Method)</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-1.5 py-0.2 rounded border border-emerald-500/30">
                WDA_EXCLUDEFROMCAPTURE
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
              To hide from Microsoft Teams and Zoom during <strong>Entire Screen sharing</strong> like Parakeet AI, activate the native Windows 11 DWM Cloak (<code className="text-emerald-300 font-mono">SetWindowDisplayAffinity</code>), run the native Electron desktop client, or use Phone Companion mode.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <button
            onClick={() => setShowInvisibilityModal(true)}
            className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Parakeet Cloak (WDA)</span>
          </button>
          <button
            onClick={() => setShowCompanionModal(true)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Phone QR</span>
          </button>
          <button
            onClick={toggleCamouflageMode}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              isCamouflageMode
                ? 'bg-amber-950 text-amber-300 border-amber-600'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>{isCamouflageMode ? 'Camouflage: ON' : 'Camouflage Mode'}</span>
          </button>
        </div>
      </div>

      <ScreenShareTestModal
        isOpen={showScreenTestModal}
        onClose={() => setShowScreenTestModal(false)}
      />

      <PhoneCompanionModal
        isOpen={showCompanionModal}
        onClose={() => setShowCompanionModal(false)}
      />

      <NativeInvisibilityModal
        isOpen={showInvisibilityModal}
        onClose={() => setShowInvisibilityModal(false)}
      />

      <DesktopLauncherModal
        isOpen={showDesktopModal}
        onClose={() => setShowDesktopModal(false)}
      />

      {/* KPI & Status Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs truncate">Interview Sessions</span>
            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">12</div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">4 live, 8 mock</div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs truncate">Analyzed Questions</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">84</div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">98.2% precision</div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs truncate">Coding Challenges</span>
            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">31</div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">Java, TS, SQL, Python</div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs truncate">Profile Grounding</span>
            <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono tabular-nums">100%</div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">14y QA / 11y Auto</div>
        </div>
      </div>

      {/* Quick Action Matrix */}
      <div>
        <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((qa, i) => {
            const Icon = qa.icon;
            return (
              <div
                key={i}
                onClick={qa.action}
                className={`p-5 rounded-xl bg-gradient-to-br border transition-all cursor-pointer group hover:scale-[1.01] hover:border-slate-600 ${qa.color} bg-slate-900/40`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{qa.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{qa.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Candidate Background Context Card */}
      <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">Active Grounding Profile</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400">Strict Factual Consistency Enforced</span>
            </div>
            <h3 className="text-base font-semibold text-white mt-1">{profile.title}</h3>
          </div>
          <button
            onClick={() => setCurrentTab('resume')}
            className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors"
          >
            Edit Profile Data
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {profile.summary}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
          <div>
            <span className="text-slate-500 block mb-1 font-mono text-[11px]">AUTOMATION FRAMEWORKS</span>
            <div className="flex flex-wrap gap-1.5 text-slate-300">
              {profile.automationFrameworks.map((f, idx) => (
                <span key={idx} className="bg-slate-800/80 px-2 py-0.5 rounded text-[11px] border border-slate-700/60">
                  {f}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-slate-500 block mb-1 font-mono text-[11px]">LANGUAGES & SQL</span>
            <div className="flex flex-wrap gap-1.5 text-slate-300">
              {profile.programmingLanguages.map((l, idx) => (
                <span key={idx} className="bg-slate-800/80 px-2 py-0.5 rounded text-[11px] border border-slate-700/60">
                  {l}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-slate-500 block mb-1 font-mono text-[11px]">CI/CD & TOOLS</span>
            <div className="flex flex-wrap gap-1.5 text-slate-300">
              {profile.testTools.slice(0, 6).map((t, idx) => (
                <span key={idx} className="bg-slate-800/80 px-2 py-0.5 rounded text-[11px] border border-slate-700/60">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
