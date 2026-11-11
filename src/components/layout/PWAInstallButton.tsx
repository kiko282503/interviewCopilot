import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  Download,
  Monitor,
  Check,
  X,
  ExternalLink,
  Laptop,
  CheckCircle2,
  Copy,
  ChevronRight,
} from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'hero' | 'settings';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  // Close modal when pressing Escape
  useEffect(() => {
    if (!showGuide) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowGuide(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGuide]);

  // If already running in installed standalone desktop window
  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Running in Standalone Windows App</span>
        </div>
      );
    }
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleClick}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center gap-1.5 shadow-sm shadow-indigo-500/20 transition-all ${className}`}
          title="Install as Windows 11 Desktop Application"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      )}

      {variant === 'hero' && (
        <button
          onClick={handleClick}
          className={`px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-slate-700 flex items-center gap-2 transition-all shadow-md ${className}`}
        >
          <Download className="w-4 h-4 text-indigo-400" />
          <span>Install on Windows 11</span>
        </button>
      )}

      {variant === 'settings' && (
        <button
          onClick={handleClick}
          className={`px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm ${className}`}
        >
          <Download className="w-4 h-4" />
          <span>Install Desktop PWA</span>
        </button>
      )}

      {/* Guide Modal when native prompt is delayed or user needs 1-click Chrome instructions */}
      {showGuide && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGuide(false);
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150"
        >
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-md w-full max-h-[88vh] flex flex-col overflow-hidden text-slate-100 select-none my-auto">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Install on Windows 11
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Standalone desktop window without browser tabs.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body with internal scrolling */}
            <div className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
              {isInstallable ? (
                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/60 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold text-white block">Ready to Install</span>
                    <span className="text-[11px] text-slate-300">
                      Click below to open Chrome's install prompt.
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      const res = await install();
                      if (res) setShowGuide(false);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors shrink-0 shadow-sm cursor-pointer"
                  >
                    Click to Install
                  </button>
                </div>
              ) : null}

              {/* Exact Chrome / Edge Instructions */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-slate-200 block">
                  How to install from your browser menu:
                </span>

                {/* Chrome Steps */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 font-semibold text-indigo-400 text-xs">
                    <Monitor className="w-4 h-4" />
                    <span>In Google Chrome:</span>
                  </div>
                  <ol className="space-y-2 text-[11px] text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-mono text-[10px] shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        Look at the <strong>top-right corner of Chrome</strong> and click the <strong>three vertical dots (⋮)</strong> menu.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-mono text-[10px] shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Click on <strong>"Save and share"</strong> (or look for <strong>"Install Interview Copilot AI..."</strong>).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-mono text-[10px] shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        Click <strong>"Install"</strong>. Check <strong>"Pin to taskbar"</strong> and <strong>"Pin to Start"</strong>.
                      </span>
                    </li>
                  </ol>
                </div>

                {/* Edge Steps */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-emerald-400 text-xs">
                    <Monitor className="w-4 h-4" />
                    <span>In Microsoft Edge:</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Click the <strong>three dots (...)</strong> in Edge &rarr; <strong>Apps</strong> &rarr; <strong>"Install Interview Copilot AI"</strong>.
                  </p>
                </div>
              </div>

              {/* Direct Link Copy */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-400 truncate max-w-xs font-mono">
                  {typeof window !== 'undefined' ? window.location.href : ''}
                </span>
                <button
                  onClick={handleCopyUrl}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 flex items-center gap-1 transition-colors text-xs shrink-0 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy App URL'}</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                PWA Standalone App for Windows 11
              </span>
              <button
                onClick={() => setShowGuide(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
