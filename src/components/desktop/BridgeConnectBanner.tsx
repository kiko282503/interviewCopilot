import React, { useState } from 'react';
import { Radio, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const BridgeConnectBanner: React.FC = () => {
  const {
    stealthBridgeStatus,
    stealthAudioPeak,
    stealthBridgeError,
    isBraveBrowser,
  } = useAppStore();
  const [dismissed, setDismissed] = useState(false);

  const isConnectLaunch =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('bridge') === 'connect';

  if (dismissed) return null;
  if (!isConnectLaunch && stealthBridgeStatus !== 'connected') return null;

  const handleDirectConnect = async () => {
    try {
      await fetch('http://127.0.0.1:38291/health', {
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
      });
    } catch {}
    window.dispatchEvent(new Event('copilot-bridge-retry'));
  };

  if (stealthBridgeStatus === 'connected') {
    return (
      <div className="bg-emerald-950/90 border-b border-emerald-700/60 px-4 py-2 flex items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2.5 text-emerald-200 min-w-0">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
          <span className="font-semibold text-emerald-300 whitespace-nowrap">
            Desktop Stealth Connected
          </span>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-700/50 whitespace-nowrap">
            Spk {stealthAudioPeak.speaker}% · Mic {stealthAudioPeak.mic}%
          </span>
          <span className="text-emerald-200/85 truncate hidden sm:inline">
            Streaming desktop audio &amp; AI answers silently. You may minimize this browser tab.
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-emerald-300/70 hover:text-white rounded hover:bg-emerald-900/60 cursor-pointer shrink-0"
          title="Hide banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-amber-950/95 border-b border-amber-600/60 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
      <div className="flex items-start sm:items-center gap-2.5 text-amber-100 min-w-0 flex-1">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
        <div className="space-y-0.5 min-w-0">
          <div className="font-semibold text-amber-200 flex flex-wrap items-center gap-2">
            <span>Desktop Stealth Audio Bridge (127.0.0.1:38291)</span>
            {stealthBridgeError ? (
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-200 border border-amber-700/60">
                {stealthBridgeError}
              </span>
            ) : null}
          </div>
          <p className="text-[11px] text-amber-100/80 leading-snug">
            {isBraveBrowser
              ? 'If Brave blocks localhost, click Allow in brave://settings/content/localhost (or open this tab in Chrome/Edge) then click Connect Bridge.'
              : 'Make sure InterviewCopilot-Stealth.bat is running, then click Connect Bridge (and click Allow if Chrome/Edge asks for local network access).'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => void handleDirectConnect()}
          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Connect Bridge</span>
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-amber-300/70 hover:text-white rounded hover:bg-amber-900/60 cursor-pointer"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
