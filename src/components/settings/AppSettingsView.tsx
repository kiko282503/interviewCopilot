import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  Settings,
  Monitor,
  Keyboard,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Download,
  CheckCircle2,
  Moon,
  Sun,
  Eye,
  EyeOff,
  Zap,
  Play,
  Sparkles,
} from 'lucide-react';
import { ScreenShareTestModal } from '../floating/ScreenShareTestModal';
import { PWAInstallButton } from '../layout/PWAInstallButton';

export const AppSettingsView: React.FC = () => {
  const {
    theme,
    toggleTheme,
    isElectron,
    stealthMode,
    setStealthMode,
    stealthHotkey,
    setStealthHotkey,
    isFloatingMode,
    setFloatingMode,
  } = useAppStore();

  const [showScreenTester, setShowScreenTester] = useState(false);
  const [testNotification, setTestNotification] = useState<string | null>(null);

  const hotkeyOptions = ['Ctrl+Shift+H', 'Ctrl+Shift+X', 'Ctrl+Shift+I', 'Ctrl+\\'];

  const handleTestHotkey = () => {
    const nextState = !isFloatingMode;
    setFloatingMode(nextState);
    setTestNotification(
      nextState
        ? 'Floating Copilot HUD shown!'
        : 'Stealth Mode triggered: Floating Copilot HUD hidden instantly!'
    );
    setTimeout(() => setTestNotification(null), 3000);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-950">
      {/* Top Header */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-400" />
            <span>Application Settings & Desktop Integration</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure Stealth Mode, global quick-hide hotkeys, and screen share privacy shields.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-4xl mx-auto w-full">
        {/* Stealth Mode & Screen Capture Privacy Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-indigo-500/30 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  stealthMode
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {stealthMode ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-white">Stealth Mode & Quick-Hide Hotkey</h2>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      stealthMode
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {stealthMode ? 'ARMED & ACTIVE' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Excludes the Floating Copilot HUD from screen captures and binds a global panic hide hotkey.
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={() => setStealthMode(!stealthMode)}
              className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                stealthMode ? 'bg-emerald-600' : 'bg-slate-800'
              }`}
              role="switch"
              aria-checked={stealthMode}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  stealthMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Description & Technical Capabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Screen Capture & Recording Masking</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                When enabled, the desktop app invokes Windows OS <code className="text-indigo-300 font-mono">WDA_EXCLUDEFROMCAPTURE</code>. Even during whole-desktop screen recordings, Google Meet, MS Teams, Zoom, and OBS cannot capture the HUD window.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-indigo-400">
                <Zap className="w-4 h-4 shrink-0" />
                <span>Instant Panic Quick-Hide</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Pressing the armed hotkey immediately collapses the HUD to a 0% visual footprint without disrupting your ongoing audio transcription or meeting flow.
              </p>
            </div>
          </div>

          {/* Hotkey Configuration & Testing Strip */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-medium">Global Stealth Hotkey:</span>
              <div className="flex items-center gap-1.5">
                {hotkeyOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setStealthHotkey(opt)}
                    className={`px-2 py-1 rounded font-mono text-[11px] transition-colors ${
                      stealthHotkey === opt
                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTestHotkey}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Test Hide Hotkey</span>
              </button>
              <button
                onClick={() => setShowScreenTester(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Test Screen Recording Live</span>
              </button>
            </div>
          </div>

          {testNotification && (
            <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800 text-indigo-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{testNotification}</span>
            </div>
          )}
        </div>

        {/* Video Meeting & Screen-Sharing Integration */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-300 font-semibold block">
              Microsoft Teams & Google Meet Privacy Setup
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
              Protected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                <Monitor className="w-4 h-4" />
                <span>Screen Sharing: "Share Window" Rule</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                When sharing your screen during live interviews on MS Teams or Google Meet, select <strong>"Share a Window"</strong> (e.g., your IDE, VS Code, or browser tab) rather than "Share Entire Screen". This guarantees Teams/Meet will only stream that single app, leaving your Floating HUD entirely invisible to attendees.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                <Shield className="w-4 h-4" />
                <span>Windows OS Capture Shielding</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                In desktop mode, Copilot calls <code className="font-mono text-indigo-300">SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)</code>. Windows DWM will mask this HUD window with black or exclude it completely if whole-desktop capture is triggered.
              </p>
            </div>
          </div>
        </div>

        {/* Global Keyboard Shortcuts */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <span className="text-xs font-mono uppercase text-slate-300 font-semibold block">
            Windows Desktop Shortcuts
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">Stealth Mode: Instant Hide / Show</span>
              <kbd className="px-2 py-1 rounded bg-slate-800 text-emerald-400 font-mono text-[11px]">
                {stealthHotkey}
              </kbd>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">Toggle Floating Copilot HUD</span>
              <kbd className="px-2 py-1 rounded bg-slate-800 text-indigo-400 font-mono text-[11px]">
                Ctrl + Shift + I
              </kbd>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">Capture Screen / Window Snippet</span>
              <kbd className="px-2 py-1 rounded bg-slate-800 text-indigo-400 font-mono text-[11px]">
                Ctrl + Shift + S
              </kbd>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">Copy Active Suggested Answer</span>
              <kbd className="px-2 py-1 rounded bg-slate-800 text-indigo-400 font-mono text-[11px]">
                Ctrl + Shift + C
              </kbd>
            </div>
          </div>
        </div>

        {/* Appearance & Themes */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <span className="text-xs font-mono uppercase text-slate-300 font-semibold block">
            Appearance & Interface Theme
          </span>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-white">Dark-First Desktop Aesthetic</p>
              <p className="text-[11px] text-slate-400">
                Optimized for low eye fatigue during long technical assessments and video meetings.
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              <span>Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
            </button>
          </div>
        </div>

        {/* Windows Packaging & NSIS Installer Information */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-mono uppercase text-slate-300 font-semibold block">
              Windows 11 Desktop Installation
            </span>
            <PWAInstallButton variant="settings" />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Install directly as a Windows 11 PWA desktop app, or package a standalone NSIS installer (<code className="font-mono text-indigo-400">.exe</code>) with desktop shortcuts, Start Menu entries, and uninstaller.
          </p>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
            <span className="text-slate-500 block mb-1">To package the Windows Installer locally:</span>
            <p className="text-indigo-300">$ npm run build</p>
            <p className="text-indigo-300">$ npx electron-builder --win nsis</p>
          </div>
        </div>

        {/* Privacy & Ethical Disclosure */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-start gap-3">
          <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400 space-y-1">
            <span className="font-semibold text-slate-200 block">Transparent Operation Policy</span>
            <p>
              In full accordance with application guidelines, Interview Copilot AI operates transparently. It does not implement stealth hooks or monitoring evasion, respecting meeting policies and operating-system security controls.
            </p>
          </div>
        </div>
      </div>

      {/* Screen Share Tester Modal */}
      <ScreenShareTestModal
        isOpen={showScreenTester}
        onClose={() => setShowScreenTester(false)}
      />
    </div>
  );
};
