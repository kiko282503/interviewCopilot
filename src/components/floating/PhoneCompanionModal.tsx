import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  Copy,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Mic,
  Monitor,
  Zap,
} from 'lucide-react';

interface PhoneCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhoneCompanionModal: React.FC<PhoneCompanionModalProps> = ({ isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const companionUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?mode=companion`
    : '';

  useEffect(() => {
    if (isOpen && companionUrl) {
      QRCode.toDataURL(companionUrl, {
        width: 240,
        margin: 1,
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR code:', err));
    }
  }, [isOpen, companionUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (companionUrl) {
      navigator.clipboard.writeText(companionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Phone Companion Mode</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.2 rounded border border-emerald-500/30">
                  Zero PC Footprint
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                100% undetectable during full "Entire Screen" sharing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Explanation Alert */}
          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/60 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-indigo-200">The Ultimate Entire-Screen Solution:</strong> When your interviewers mandate sharing your <em>Entire Screen</em>, any window open on your PC is technically broadcast. By running the copilot on your phone, there is <strong>zero code, zero window, and zero process</strong> on your computer.
            </div>
          </div>

          {/* QR Code & Link Section */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div className="bg-white p-2.5 rounded-xl shadow-md shrink-0 flex items-center justify-center">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Companion QR Code" className="w-36 h-36" />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center text-slate-400 text-xs">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="space-y-3 flex-1 w-full">
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Scan with your Smartphone Camera</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Point your iPhone or Android camera at the QR code to instantly open the live audio HUD on your mobile device.
              </p>
              
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={companionUrl}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 font-mono truncate select-all"
                />
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 shrink-0 cursor-pointer border border-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3 Step Positioning Guide */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300">How to Setup in 30 Seconds:</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]">
                  <span className="w-4 h-4 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800 font-mono text-[10px]">1</span>
                  <span>Prop Phone Below</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Prop phone on a stand right below your monitor/webcam. Glancing down looks like natural thinking.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-400 font-medium text-[11px]">
                  <span className="w-4 h-4 rounded-full bg-indigo-950 text-indigo-400 flex items-center justify-center border border-indigo-800 font-mono text-[10px]">2</span>
                  <span>Audio via Speakers</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Interviewer audio from PC speakers is detected by the phone mic in real time.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-sky-400 font-medium text-[11px]">
                  <span className="w-4 h-4 rounded-full bg-sky-950 text-sky-400 flex items-center justify-center border border-sky-800 font-mono text-[10px]">3</span>
                  <span>Share Entire Screen</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Share Entire Screen on PC with 100% peace of mind. Your PC is clean.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Works on iOS & Android Safari/Chrome
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
