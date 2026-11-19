import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useInterviewStore } from '../../store/useInterviewStore';
import {
  Mic,
  MicOff,
  Sparkles,
  ExternalLink,
  Minimize2,
  Square,
  X,
  Volume2,
  Menu,
  Laptop,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { DesktopLauncherModal } from '../desktop/DesktopLauncherModal';

export const Header: React.FC = () => {
  const [showDesktopModal, setShowDesktopModal] = React.useState(false);
  const {
    preferredModel,
    isElectron,
    sidebarOpen,
    toggleSidebar,
    stealthBridgeStatus,
    stealthAudioPeak,
    stealthBridgeError,
    isBraveBrowser,
  } = useAppStore();
  const { isListening, audioInputName, audioOutputName, audioVolume } = useInterviewStore();

  const isInIframe = (() => {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const standaloneBridgeUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : '/';

  const handleWindowAction = (action: 'minimize' | 'maximize' | 'close') => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      if (action === 'minimize') (window as any).electronAPI.minimizeWindow();
      if (action === 'maximize') (window as any).electronAPI.maximizeWindow();
      if (action === 'close') (window as any).electronAPI.closeWindow();
    }
  };

  return (
    <header className="h-14 border-b border-slate-800/80 bg-slate-950/95 px-3 sm:px-5 flex items-center justify-between gap-3 shrink-0 backdrop-blur-md select-none z-30">
      {/* Zone 1: Mobile Hamburger & Brand Wordmark */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 lg:hidden transition-colors"
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          {sidebarOpen ? <X className="w-4 h-4 text-slate-200" /> : <Menu className="w-4 h-4 text-slate-200" />}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 shrink-0">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-semibold text-xs sm:text-sm tracking-tight text-slate-100 whitespace-nowrap">
              Interview Copilot
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-400 border border-indigo-800/40">
              Win 11
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Real-time Audio & Model Status */}
      <div className="hidden md:flex items-center gap-4 text-xs text-slate-400">
        {/* Audio Status */}
        <div className="flex items-center gap-2">
          {isListening ? (
            <div className="flex items-center gap-1.5 text-emerald-400" title={`Input: ${audioInputName} | Output: ${audioOutputName}`}>
              <Mic className="w-3.5 h-3.5 animate-pulse" />
              <span className="font-medium truncate max-w-[140px]">Live: {audioInputName}</span>
              <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden flex items-center">
                <div
                  className="h-full bg-emerald-500 transition-all duration-75"
                  style={{ width: `${Math.min(100, audioVolume * 1.5)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-500" title={`Input: ${audioInputName} | Output: ${audioOutputName}`}>
              <MicOff className="w-3.5 h-3.5" />
              <span className="truncate max-w-[160px]">{audioInputName}</span>
            </div>
          )}
        </div>

        <span className="text-slate-700">·</span>

        {/* Stealth .bat Bridge Indicator */}
        {stealthBridgeStatus === 'connected' ? (
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 font-mono text-[11px]"
            title="Native Stealth App (.bat) connected to Gemini AI bridge"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>.bat Spk:{stealthAudioPeak.speaker}% Mic:{stealthAudioPeak.mic}%</span>
          </div>
        ) : isInIframe || stealthBridgeStatus === 'iframe-blocked' ? (
          <a
            href={standaloneBridgeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/60 hover:bg-amber-900/70 border border-amber-600/50 text-amber-300 font-medium text-[11px] transition-colors"
            title="AI Studio iframe blocks localhost bridge (127.0.0.1). Open top-level tab so .bat uses Gemini AI."
          >
            <ExternalLink className="w-3 h-3" />
            <span>Open Bridge Tab (.bat)</span>
          </a>
        ) : stealthBridgeError || isBraveBrowser ? (
          <button
            onClick={() => {
              void fetch('http://127.0.0.1:38291/health', {
                mode: 'cors',
                credentials: 'omit',
                cache: 'no-store',
              }).catch(() => {});
              window.dispatchEvent(new Event('copilot-bridge-retry'));
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/60 hover:bg-amber-900/70 border border-amber-600/50 text-amber-300 font-medium text-[11px] transition-colors cursor-pointer"
            title="Connect running Stealth App (.bat) in background (click Allow if prompted)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Connect .bat Bridge</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5" title="Gemini ready">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-mono text-slate-300">{preferredModel}</span>
            <span className="text-emerald-400/90 font-medium">Ready</span>
          </div>
        )}
      </div>

      {/* Zone 3: Actions & Window Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowDesktopModal(true)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors border border-emerald-500 shadow-sm cursor-pointer"
          title="Download Standalone Invisible Desktop App (.bat)"
        >
          <Laptop className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Stealth App (.bat)</span>
          <span className="sm:hidden">.bat</span>
        </button>

        <DesktopLauncherModal
          isOpen={showDesktopModal}
          onClose={() => setShowDesktopModal(false)}
        />

        {/* Electron Window Controls */}
        {isElectron && (
          <div className="flex items-center ml-1 border-l border-slate-800 pl-1.5 gap-1 text-slate-400">
            <button
              onClick={() => handleWindowAction('minimize')}
              className="p-1.5 rounded hover:bg-slate-800 hover:text-slate-200"
              title="Minimize"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleWindowAction('maximize')}
              className="p-1.5 rounded hover:bg-slate-800 hover:text-slate-200"
              title="Maximize"
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleWindowAction('close')}
              className="p-1.5 rounded hover:bg-red-600 hover:text-white"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
