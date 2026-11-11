import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  Monitor,
  Smartphone,
  Video,
  X,
  Play,
  Square,
  AlertCircle,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  EyeOff,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface ScreenShareTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScreenShareTestModal: React.FC<ScreenShareTestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isElectron } = useAppStore();
  const [isCapturing, setIsCapturing] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const startScreenCaptureTest = async () => {
    setStreamError(null);
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('Screen capture API is not supported in this browser environment.');
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor', // Requests whole screen
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCapturing(true);

      // Handle user stopping share from browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopScreenCaptureTest();
      };
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        setStreamError(err.message || 'Failed to start screen capture');
      }
    }
  };

  const stopScreenCaptureTest = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  useEffect(() => {
    return () => {
      stopScreenCaptureTest();
    };
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${appUrl}?mode=floating`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopScreenCaptureTest();
          onClose();
        }
      }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Whole-Screen Sharing Privacy & Adaptation</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  {isElectron ? 'Windows App Active' : 'Web & Companion Mode'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                How Copilot stays hidden when an interviewer demands sharing your entire desktop.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScreenCaptureTest();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5 text-xs">
          {/* Strategy 1: Windows DWM Display Affinity */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Strategy 1: Windows OS Display Affinity Exclusion</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                WDA_EXCLUDEFROMCAPTURE
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              On Windows 10 & 11, the desktop app invokes Microsoft's native API:
              <br />
              <code className="text-indigo-300 font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded mt-1 inline-block">
                SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE = 0x00000011)
              </code>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-semibold text-slate-200 block">What YOU See:</span>
                <p className="text-slate-400">
                  The floating HUD stays crisp and visible on your monitor right beneath your webcam.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-semibold text-emerald-300 block">What INTERVIEWER Sees:</span>
                <p className="text-slate-400">
                  Windows automatically composites the pixels underneath. The HUD is completely erased from their screen feed.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Live Screen Share Tester */}
          <div className="p-4 rounded-xl bg-slate-950 border border-indigo-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block text-xs flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-indigo-400" />
                  <span>Test Your Screen Share in Real-Time</span>
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Launch a test screen share to verify what external meeting software captures.
                </p>
              </div>
              {!isCapturing ? (
                <button
                  onClick={startScreenCaptureTest}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Test Share</span>
                </button>
              ) : (
                <button
                  onClick={stopScreenCaptureTest}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Test</span>
                </button>
              )}
            </div>

            {streamError && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{streamError}</span>
              </div>
            )}

            {isCapturing && (
              <div className="space-y-2 pt-2">
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black aspect-video flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-rose-600/90 text-white text-[10px] font-mono flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>LIVE STREAM CAPTURE PREVIEW</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 text-center">
                  This preview is identical to what Teams or Google Meet sends to your interviewers.
                </p>
              </div>
            )}
          </div>

          {/* Strategy 2: Mobile / Smartphone Companion Mode */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Strategy 2: The "Phone Companion" (Zero Desktop Footprint)</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              If your interviewer uses aggressive third-party proctoring (e.g., CodePair, HackerRank, Codility, or ProctorU) that monitors the entire OS process list, open Copilot on your <strong>phone or tablet</strong> resting on your desk directly beneath your laptop screen:
            </p>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="font-mono text-slate-300 truncate max-w-sm">
                {appUrl}?mode=floating
              </div>
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 flex items-center gap-1 transition-colors text-xs"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied URL' : 'Copy Mobile Link'}</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Your phone hears the conversation via speaker audio and displays live bullet points. Your computer screen remains 100% clean with zero background apps running.
            </p>
          </div>

          {/* Strategy 3: Panic Key (Instant Boss Hide) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
              <EyeOff className="w-4 h-4 text-amber-400" />
              <span>Strategy 3: Panic Instant Hide Key</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              If you ever need the HUD to vanish immediately:
            </p>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-indigo-300 font-mono text-[11px]">
                Ctrl + Shift + H
              </kbd>
              <span className="text-[11px] text-slate-400">or press</span>
              <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-indigo-300 font-mono text-[11px]">
                Escape
              </kbd>
              <span className="text-[11px] text-slate-400">to instantly close/minimize the HUD to 0% footprint.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Compliant with system privacy protocols & Section 2 guidelines.
          </span>
          <button
            onClick={() => {
              stopScreenCaptureTest();
              onClose();
            }}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
