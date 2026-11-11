import React, { useState } from 'react';
import { useInterviewStore } from '../../store/useInterviewStore';
import { useAppStore } from '../../store/useAppStore';
import { useProfileStore } from '../../store/useProfileStore';
import { geminiClient } from '../../services/geminiClient';
import { ResponseLength } from '../../types';
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Maximize2,
  Pin,
  PinOff,
  Mic,
  MicOff,
  ShieldCheck,
  Eye,
  Sliders,
  HelpCircle,
  X,
  Video,
  Monitor,
  ChevronDown,
  ChevronUp,
  Volume2,
  Smartphone,
  EyeOff,
  Zap,
  ExternalLink,
  Shield,
  Terminal,
  Laptop,
} from 'lucide-react';
import { ScreenShareTestModal } from './ScreenShareTestModal';
import { PhoneCompanionModal } from './PhoneCompanionModal';
import { NativeInvisibilityModal } from './NativeInvisibilityModal';
import { DesktopLauncherModal } from '../desktop/DesktopLauncherModal';

interface FloatingCopilotViewProps {
  isStandalone?: boolean;
}

export const FloatingCopilotView: React.FC<FloatingCopilotViewProps> = ({ isStandalone = false }) => {
  const {
    isListening,
    activeAnswer,
    setActiveAnswer,
    responseLength,
    setResponseLength,
    isGeneratingAnswer,
    setIsGeneratingAnswer,
  } = useInterviewStore();

  const {
    isAlwaysOnTop,
    setAlwaysOnTop,
    setFloatingMode,
    isElectron,
    hudOpacity,
    setHudOpacity,
    stealthMode,
    setStealthMode,
    stealthHotkey,
    decoyPreset,
    setDecoyPreset,
    isCamouflageMode,
    toggleCamouflageMode,
  } = useAppStore();

  const { getProfileSummaryForPrompt } = useProfileStore();

  const [copied, setCopied] = useState(false);
  const [showStar, setShowStar] = useState(false);
  const [showCode, setShowCode] = useState(true);
  const [showMeetingGuide, setShowMeetingGuide] = useState(false);
  const [showOpacityMenu, setShowOpacityMenu] = useState(false);
  const [showDecoyMenu, setShowDecoyMenu] = useState(false);
  const [showScreenTestModal, setShowScreenTestModal] = useState(false);
  const [showCompanionModal, setShowCompanionModal] = useState(false);
  const [showInvisibilityModal, setShowInvisibilityModal] = useState(false);
  const [showDesktopModal, setShowDesktopModal] = useState(false);
  const [panicConcealed, setPanicConcealed] = useState(false);

  const handlePopoutWindow = () => {
    const url = `${window.location.origin}${window.location.pathname}?mode=standalone-hud`;
    window.open(
      url,
      'CopilotFloatingHUD',
      'popup=yes,width=440,height=650,menubar=no,toolbar=no,status=no,resizable=yes'
    );
    // Dismiss the overlay in the dashboard
    setFloatingMode(false);
  };

  // Global Hotkeys: Stealth hide, Camouflage toggle (Ctrl+Shift+T), and Panic Clear
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Ctrl+Shift+T: Toggle Terminal Camouflage Mode
      if (e.ctrlKey && e.shiftKey && key === 't') {
        e.preventDefault();
        toggleCamouflageMode();
        return;
      }

      // If in camouflage mode and user presses Escape or Ctrl+\, toggle panic conceal
      if (isCamouflageMode && (key === 'escape' || (e.ctrlKey && key === '\\'))) {
        e.preventDefault();
        setPanicConcealed((prev) => !prev);
        return;
      }

      if (!stealthMode) return;

      const isCustomH = (e.ctrlKey && e.shiftKey && (key === 'h' || key === 'x' || key === 'i'));
      const isBackslash = (e.ctrlKey && key === '\\');
      const isEscape = (e.key === 'Escape' && !showScreenTestModal && !showMeetingGuide && !showCompanionModal);

      if (isCustomH || isBackslash || isEscape) {
        e.preventDefault();
        setFloatingMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stealthMode, setFloatingMode, showScreenTestModal, showMeetingGuide, showCompanionModal, isCamouflageMode, toggleCamouflageMode]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRegenerate = async (len: ResponseLength = responseLength) => {
    if (!activeAnswer || isGeneratingAnswer) return;
    setIsGeneratingAnswer(true);
    try {
      const profileContext = getProfileSummaryForPrompt();
      const ans = await geminiClient.generateAnswer({
        question: activeAnswer.questionText,
        category: activeAnswer.category,
        length: len,
        profileContext,
      });
      setActiveAnswer(ans);
    } catch (err) {
      console.error('Failed to regenerate answer:', err);
    } finally {
      setIsGeneratingAnswer(false);
    }
  };

  const togglePin = () => {
    const next = !isAlwaysOnTop;
    setAlwaysOnTop(next);
    if (isElectron && typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.setAlwaysOnTop(next);
    }
  };

  const opacityPresets = [100, 85, 70, 55];

  const containerClasses = isStandalone
    ? "h-screen w-screen flex flex-col bg-slate-950 font-sans select-none text-slate-100 transition-opacity duration-200"
    : "fixed inset-x-2 inset-y-2 sm:inset-x-auto sm:inset-y-4 sm:right-4 sm:w-[420px] max-w-[calc(100vw-16px)] z-50 flex flex-col bg-slate-950/98 border border-slate-700/90 rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden font-sans select-none text-slate-100 transition-opacity duration-200";

  return (
    <div
      style={{ opacity: hudOpacity / 100 }}
      className={containerClasses}
    >
      {/* Draggable HUD Header */}
      <div className="px-3.5 py-2.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between cursor-move shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/30 shrink-0">
            <Sparkles className="w-3 h-3" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold tracking-tight text-white whitespace-nowrap">
              Copilot HUD
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
              {hudOpacity}%
            </span>
          </div>
          {isListening && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5 shrink-0" title="Listening Active" />
          )}
        </div>

        {/* HUD Window Actions */}
        <div className="flex items-center gap-1 text-slate-400">
          {/* Pop Out to Independent OS Window (Can move outside browser across any monitor) */}
          {!isStandalone && (
            <button
              onClick={handlePopoutWindow}
              className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
              title="Pop out into an independent Windows desktop window that moves outside this browser"
            >
              <span>Pop Out</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          {/* Taskbar Stealth Decoy */}
          <div className="relative">
            <button
              onClick={() => setShowDecoyMenu(!showDecoyMenu)}
              className={`px-1.5 py-1 rounded text-[10px] font-mono border transition-colors flex items-center gap-1 cursor-pointer ${
                decoyPreset !== 'off'
                  ? 'bg-slate-800/90 text-indigo-300 border-indigo-700/60'
                  : 'text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
              title="Disguise Windows Taskbar Icon & Title (Settings / Notepad)"
            >
              <Shield className="w-3 h-3 text-indigo-400" />
              <span className="hidden sm:inline capitalize">{decoyPreset}</span>
            </button>
            {showDecoyMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-2xl z-50 flex flex-col gap-0.5">
                <div className="px-2 py-1 text-[10px] text-slate-400 font-mono border-b border-slate-800">
                  Disguise Taskbar Button
                </div>
                {(['settings', 'notepad', 'system', 'calc', 'off'] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setDecoyPreset(preset);
                      setShowDecoyMenu(false);
                    }}
                    className={`w-full px-2 py-1 text-left rounded text-xs flex items-center justify-between capitalize cursor-pointer ${
                      decoyPreset === preset ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{preset === 'off' ? 'Default App Title' : preset}</span>
                    {decoyPreset === preset && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Camouflage Mode Quick Toggle (VS Code Terminal Disguise for Entire Screen Sharing) */}
          <button
            onClick={toggleCamouflageMode}
            className={`p-1.5 rounded transition-colors flex items-center gap-1 cursor-pointer border ${
              isCamouflageMode
                ? 'bg-amber-950 text-amber-300 border-amber-600'
                : 'text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
            }`}
            title="Terminal Camouflage Mode (Ctrl+Shift+T): Disguises window as a VS Code terminal running Jest tests during Entire Screen sharing"
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline font-mono text-[9px] uppercase font-semibold">
              {isCamouflageMode ? 'Term' : 'Camo'}
            </span>
          </button>

          {/* Phone Companion Modal Toggle (Zero PC Footprint for Entire Screen) */}
          <button
            onClick={() => setShowCompanionModal(true)}
            className="p-1.5 rounded hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            title="Phone Companion QR Code (Zero PC footprint for Entire Screen sharing)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>

          {/* Parakeet-Grade Screen Cloak Invisibility Modal */}
          <button
            onClick={() => setShowInvisibilityModal(true)}
            className="p-1.5 rounded hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            title="Parakeet AI Invisibility: Windows 11 SetWindowDisplayAffinity Cloak"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
          </button>

          {/* Download Native Desktop App (Parakeet Method) */}
          <button
            onClick={() => setShowDesktopModal(true)}
            className="p-1.5 rounded hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            title="Download Native Desktop App (.cmd) - 100% Invisible on Teams Entire Screen"
          >
            <Laptop className="w-3.5 h-3.5" />
          </button>

          {/* Stealth Mode Quick Toggle */}
          <button
            onClick={() => setStealthMode(!stealthMode)}
            className={`p-1.5 rounded transition-colors flex items-center gap-1 cursor-pointer ${
              stealthMode
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/60'
                : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
            }`}
            title={stealthMode ? `Stealth Mode Active (${stealthHotkey} to hide)` : 'Stealth Mode Disabled: Click to Arm'}
          >
            {stealthMode ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline font-mono text-[9px] uppercase font-semibold">
              {stealthMode ? 'Stealth' : 'Off'}
            </span>
          </button>

          {/* Meeting Guide Button */}
          <button
            onClick={() => setShowMeetingGuide(!showMeetingGuide)}
            className={`p-1.5 rounded transition-colors flex items-center gap-1 text-[11px] cursor-pointer ${
              showMeetingGuide ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Teams & Google Meet Privacy Guide"
          >
            <Monitor className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline font-medium text-[10px]">Guide</span>
          </button>

          {/* Opacity Menu Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowOpacityMenu(!showOpacityMenu)}
              className={`p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer ${
                showOpacityMenu ? 'bg-slate-800 text-indigo-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Window Transparency"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            {showOpacityMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-32 bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-2xl z-50 flex flex-col gap-0.5">
                <div className="px-2 py-1 text-[10px] text-slate-400 font-mono border-b border-slate-800">
                  Opacity
                </div>
                {opacityPresets.map((pct) => (
                  <button
                    key={pct}
                    onClick={() => {
                      setHudOpacity(pct);
                      setShowOpacityMenu(false);
                    }}
                    className={`w-full px-2 py-1 text-left rounded text-xs flex items-center justify-between cursor-pointer ${
                      hudOpacity === pct ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{pct}%</span>
                    {hudOpacity === pct && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Always on top toggle */}
          <button
            onClick={togglePin}
            className={`p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer ${
              isAlwaysOnTop ? 'text-indigo-400' : 'text-slate-500'
            }`}
            title={isAlwaysOnTop ? 'Always on Top: Active' : 'Always on Top: Disabled'}
          >
            {isAlwaysOnTop ? <Pin className="w-3.5 h-3.5 fill-current" /> : <PinOff className="w-3.5 h-3.5" />}
          </button>

          {/* Close / Expand Button */}
          {isStandalone ? (
            <button
              onClick={() => window.close()}
              className="p-1.5 rounded hover:bg-rose-950/80 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
              title="Close Standalone Floating HUD"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setFloatingMode(false)}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Expand to Full Dashboard"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Pop Out Callout Banner for In-Browser Overlay */}
      {!isStandalone && (
        <div className="bg-indigo-950/95 border-b border-indigo-800/80 px-3 py-2 flex items-center justify-between text-xs text-indigo-200 shrink-0">
          <div className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-[11px] leading-tight text-slate-200">
              <strong>Move Outside Window:</strong> Pop out to move freely across your desktop.
            </span>
          </div>
          <button
            onClick={handlePopoutWindow}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-[11px] shrink-0 transition-colors shadow-sm cursor-pointer flex items-center gap-1"
          >
            <span>Pop Out</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Meeting Mode Interactive Guide Popover */}
      {showMeetingGuide && (
        <div className="p-3.5 bg-slate-900/98 border-b border-slate-800 text-xs space-y-3 shrink-0 animate-in fade-in duration-150 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-indigo-400 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Microsoft Teams & Google Meet Stealth Guide</span>
            </div>
            <button
              onClick={() => setShowMeetingGuide(false)}
              className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-[11px] text-slate-300">
            {/* Rule 1: Pop Out Window */}
            <div className="p-2.5 rounded-lg bg-indigo-950/50 border border-indigo-700/70 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-indigo-300">
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                <span>1. Move Outside Browser: Click "Pop Out" (↗)</span>
              </div>
              <p className="text-slate-200 leading-snug text-[10.5px]">
                Web pages cannot cross their browser window borders. Click the <strong>Pop Out (↗)</strong> button above to detach this HUD into a separate Windows 11 desktop window that you can drag to any monitor or place over Teams!
              </p>
            </div>

            {/* Rule 2: Share Window, NEVER Entire Screen */}
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-700/60 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. The Golden Rule: Share "Window", NEVER "Entire Screen"</span>
              </div>
              <p className="text-slate-200 leading-snug text-[10.5px]">
                In Microsoft Teams or Google Meet, when asked to share your screen:
              </p>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10.5px] space-y-1">
                <div className="text-rose-400 font-semibold">❌ DO NOT click "Entire Screen / Screen 1":</div>
                <div className="text-slate-400 pl-4">Windows broadcasts every single pixel and open window on your desktop.</div>
                <div className="text-emerald-400 font-semibold pt-1">✅ ALWAYS click "Window" (or "Tab"):</div>
                <div className="text-slate-300 pl-4">Select <strong>ONLY VS Code</strong> or your <strong>Chrome Coding Tab</strong>. Teams will transmit <em>only</em> that program. This HUD and your taskbar remain <strong>100% invisible</strong>!</div>
              </div>
            </div>

            {/* Rule 3: Taskbar Decoy */}
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>3. Taskbar Decoy: Disguise App Name</span>
              </div>
              <p className="text-slate-300 leading-snug text-[10.5px]">
                Click the <strong>Decoy</strong> button above to rename this window on the Windows taskbar to <strong>"Settings"</strong> or <strong>"Notepad"</strong>. Anyone glancing at your screen will see a normal Windows utility.
              </p>
            </div>

            {/* Rule 4: Entire Screen Sharing Solutions */}
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-700/60 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>4. Required to Share Entire Screen? (3 Solutions)</span>
              </div>
              <div className="space-y-1.5 text-[10.5px] text-slate-300">
                <p>
                  <strong className="text-emerald-400">Solution A (0% Risk): Phone Companion.</strong> Scan the QR code to open the HUD on your phone placed under your webcam. It listens from your PC speakers with <strong>zero apps on your PC</strong>!
                </p>
                <p>
                  <strong className="text-amber-300">Solution B: Terminal Camouflage (Ctrl+Shift+T).</strong> Click "Camo" to turn this window into a realistic VS Code terminal running Jest unit tests.
                </p>
                <p>
                  <strong className="text-sky-300">Solution C: Dual Monitors.</strong> Share Screen 1 (VS Code) and put this HUD on Screen 2.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen Share Tester Modal */}
      <ScreenShareTestModal
        isOpen={showScreenTestModal}
        onClose={() => setShowScreenTestModal(false)}
      />

      {/* Phone Companion Modal */}
      <PhoneCompanionModal
        isOpen={showCompanionModal}
        onClose={() => setShowCompanionModal(false)}
      />

      {/* Parakeet Native Invisibility Modal */}
      <NativeInvisibilityModal
        isOpen={showInvisibilityModal}
        onClose={() => setShowInvisibilityModal(false)}
      />

      {/* Desktop App Downloader Modal */}
      <DesktopLauncherModal
        isOpen={showDesktopModal}
        onClose={() => setShowDesktopModal(false)}
      />

      {/* Length selector & Privacy Status Strip */}
      <div className="px-3 py-1.5 bg-slate-900/40 border-b border-slate-800/60 flex items-center justify-between text-[11px] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-mono">Depth:</span>
          <div className="flex items-center gap-1 font-medium">
            {(['short', 'standard', 'detailed'] as const).map((len) => (
              <button
                key={len}
                onClick={() => {
                  setResponseLength(len);
                  handleRegenerate(len);
                }}
                className={`px-1.5 py-0.5 rounded capitalize transition-colors ${
                  responseLength === len
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {len}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowScreenTestModal(true)}
          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/50 hover:bg-emerald-900/40 transition-colors"
          title="Test whether screen sharing can see this HUD"
        >
          <ShieldCheck className="w-3 h-3" />
          <span>Test Privacy</span>
        </button>
      </div>

      {/* Main Scrollable HUD Content */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs select-text">
        {isCamouflageMode ? (
          <div className="font-mono text-[11px] leading-relaxed text-slate-300 space-y-3 p-3 bg-[#181818] rounded-xl border border-slate-800 shadow-inner">
            {/* Terminal Tab Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[10px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  bash
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-300">npm test:e2e</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPanicConcealed(!panicConcealed)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
                  title="Wipe screen and display clean build logs (Esc or Ctrl+\)"
                >
                  {panicConcealed ? 'Restore Logs' : 'Panic Clear (Esc)'}
                </button>
                <button
                  onClick={toggleCamouflageMode}
                  className="px-2 py-0.5 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 text-[10px] cursor-pointer"
                  title="Switch back to regular view"
                >
                  Exit Camo
                </button>
              </div>
            </div>

            {panicConcealed ? (
              <div className="text-slate-400 font-mono text-[11px] space-y-1 py-3">
                <div className="text-slate-500">$ npm run build && npm run test</div>
                <div className="text-slate-400">&gt; qa-automation-suite@1.0.0 build</div>
                <div className="text-emerald-400">✓ 142 modules transformed. Output: dist/</div>
                <div className="text-slate-500">&gt; jest --config jest.config.ts</div>
                <div className="text-emerald-400">PASS tests/e2e/sanity.spec.ts (8 passed)</div>
                <div className="text-slate-300 pt-3 flex items-center gap-1">
                  <span className="text-emerald-400 font-semibold">dev@workstation</span>:<span className="text-sky-400">~/workspace</span>$ <span className="w-1.5 h-3.5 bg-slate-200 inline-block animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-slate-400 text-[10.5px]">
                  $ npx jest --verbose --testPathPattern="core-qa-architecture"
                </div>
                <div className="text-slate-500 text-[10px]">[Jest Runner v29.7.0] 1 test suite found</div>

                <div className="p-2.5 rounded bg-slate-900/95 border border-slate-800 text-amber-300 text-[11px] space-y-1">
                  <span className="text-slate-500 block text-[9.5px] uppercase font-bold tracking-wider">
                    ● Target Query Spec:
                  </span>
                  <div className="text-slate-100 font-sans text-xs font-medium">
                    "{activeAnswer?.questionText || 'Awaiting live audio query...'}"
                  </div>
                </div>

                <div className="text-emerald-400 font-semibold text-[11px] pt-1">
                  PASS tests/core/architecture.spec.ts (4 checks passed, 1.4s)
                </div>

                <div className="space-y-1.5 pl-2.5 border-l-2 border-emerald-500/50 text-[11px]">
                  {(activeAnswer?.keyPoints || [
                    'Focus on architecture over scripting: modularity and POM',
                    'Tool selection: Playwright/Selenium/TypeScript',
                    'CI/CD integration: GitHub Actions parallel runners',
                    'Resilience: Dynamic smart waits and auto-retry policies',
                  ]).map((pt, i) => (
                    <div key={i} className="text-slate-200 flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span><strong className="text-sky-300">[Spec {i + 1}]</strong> {pt}</span>
                    </div>
                  ))}
                </div>

                <div className="p-2.5 rounded bg-slate-950/90 border border-slate-800/80 text-[10.5px] text-slate-300 space-y-1.5">
                  <span className="text-slate-500 block text-[9px] font-mono uppercase font-bold tracking-wider">
                    // Implementation Notes / Spoken Summary:
                  </span>
                  <p className="leading-relaxed whitespace-pre-wrap font-sans text-[11px] text-slate-200 max-h-48 overflow-y-auto">
                    {activeAnswer?.answer || 'Awaiting live response...'}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : isGeneratingAnswer ? (
          <div className="h-44 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
            <span className="text-[11px]">Synthesizing response for interview...</span>
          </div>
        ) : !activeAnswer ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-indigo-400 border border-slate-800">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-300">Ready for Live Questions</p>
              <p className="text-[11px] text-slate-500 max-w-[260px] mx-auto mt-0.5">
                Listen live or capture interview questions. Instant glanceable points appear here.
              </p>
            </div>
            <button
              onClick={() => setShowMeetingGuide(true)}
              className="mt-1 text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 underline underline-offset-2"
            >
              <HelpCircle className="w-3 h-3" />
              <span>How to use with Teams / Google Meet</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Question Text */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-indigo-400 uppercase font-semibold">
                <span>Active Question</span>
                {activeAnswer.id.startsWith('ans-demo') && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800 lowercase">
                    sample demo preview
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-white leading-snug">
                "{activeAnswer.questionText}"
              </p>
            </div>

            {/* Glanceable Bullets (Critical for Natural Delivery) */}
            {activeAnswer.keyPoints && activeAnswer.keyPoints.length > 0 && (
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/50 space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-indigo-300 font-semibold block">
                  Key Talking Points (Glanceable)
                </span>
                <ul className="space-y-1 text-[11px] text-slate-200 leading-snug">
                  {activeAnswer.keyPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Spoken Script / Answer */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Spoken Answer</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleRegenerate()}
                    className="hover:text-slate-200 p-1"
                    title="Regenerate"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleCopy(activeAnswer.answer)}
                    className="hover:text-slate-200 p-1"
                    title="Copy"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed max-h-48 overflow-y-auto pr-1">
                {activeAnswer.answer}
              </p>
            </div>

            {/* STAR Accordion if available */}
            {activeAnswer.starMethod && (
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
                <button
                  onClick={() => setShowStar(!showStar)}
                  className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <span>STAR Methodology</span>
                  {showStar ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showStar && (
                  <div className="p-3 pt-0 space-y-1.5 text-[11px] text-slate-300">
                    <p><strong className="text-indigo-400 font-mono">S (Situation):</strong> {activeAnswer.starMethod.situation}</p>
                    <p><strong className="text-indigo-400 font-mono">T (Task):</strong> {activeAnswer.starMethod.task}</p>
                    <p><strong className="text-indigo-400 font-mono">A (Action):</strong> {activeAnswer.starMethod.action}</p>
                    <p><strong className="text-indigo-400 font-mono">R (Result):</strong> {activeAnswer.starMethod.result}</p>
                  </div>
                )}
              </div>
            )}

            {/* Code Snippet if present */}
            {activeAnswer.codeSnippet && (
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <span>Code Solution</span>
                  {showCode ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showCode && (
                  <div className="p-3 pt-0">
                    <pre className="p-2 rounded bg-slate-950 text-[10px] font-mono text-slate-300 overflow-x-auto">
                      <code>{activeAnswer.codeSnippet}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Copy & Status */}
      {activeAnswer && (
        <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-500 font-mono">
            {activeAnswer.timestamp}
          </span>
          <button
            onClick={() => handleCopy(activeAnswer.answer)}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied!' : 'Copy Answer'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
