import React, { useState } from 'react';
import {
  Download,
  ExternalLink,
  Laptop,
  Check,
  ShieldCheck,
  Sparkles,
  X,
  ArrowLeft,
  CheckCircle2,
  Copy,
} from 'lucide-react';

interface DesktopLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopLauncherModal: React.FC<DesktopLauncherModalProps> = ({ isOpen, onClose }) => {
  const [downloaded, setDownloaded] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const downloadUrl = '/InterviewCopilot-Stealth.bat';
  const downloadPs1Url = '/InterviewCopilot-Stealth.ps1';
  const oneLineLaunchCmd = `powershell -ExecutionPolicy Bypass -Command "irm ${typeof window !== 'undefined' ? window.location.origin : ''}/InterviewCopilot-Stealth.ps1 | iex"`;
  const [copiedLaunchCmd, setCopiedLaunchCmd] = useState(false);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'InterviewCopilot-Stealth.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloaded(true);
  };

  const handleDownloadPs1 = () => {
    const a = document.createElement('a');
    a.href = downloadPs1Url;
    a.download = 'InterviewCopilot-Stealth.ps1';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloaded(true);
  };

  const handleCopyLaunchCmd = () => {
    navigator.clipboard.writeText(oneLineLaunchCmd);
    setCopiedLaunchCmd(true);
    setTimeout(() => setCopiedLaunchCmd(false), 2000);
  };

  const handleOpenDesktopApp = () => {
    handleDownload();
  };

  const selfContainedCmd = `Add-Type 'using System;using System.Runtime.InteropServices;public class WDA{[DllImport("user32.dll")]public static extern bool SetWindowDisplayAffinity(IntPtr h,uint a);}';Get-Process|Where-Object{$_.MainWindowTitle -match 'Interview|Copilot|Settings|Terminal'}|ForEach-Object{[WDA]::SetWindowDisplayAffinity($_.MainWindowHandle,0x11);Write-Host "[SUCCESS] Cloaked from Teams: $($_.MainWindowTitle)" -ForegroundColor Green}`;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(selfContainedCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-300">
              Standalone Desktop App (100% Invisible to Teams)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Brand Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-800 p-0.5 shadow-xl shadow-indigo-500/20 flex items-center justify-center text-white">
            <div className="w-full h-full rounded-[14px] bg-slate-950/40 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white drop-shadow-md" />
            </div>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
              <span>Interview Copilot Stealth Desktop</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30 font-normal">
                Teams Screen Share Invisible
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
              Native Windows 11 app that floats beneath your webcam, auto-transcribes, and provides 0.1s Senior QA Lead answers. <strong>100% invisible when sharing Entire Screen on Teams!</strong>
            </p>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={handleDownload}
            className="w-full max-w-sm py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl border border-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer"
          >
            <Laptop className="w-4 h-4" />
            <span>{downloaded ? 'Downloaded! Double-click file to run' : 'Download Stealth Desktop App (.bat)'}</span>
          </button>

          <p className="text-[11px] text-amber-300/90 bg-amber-950/30 border border-amber-800/40 p-2.5 rounded-xl text-left max-w-sm leading-relaxed">
            <strong>Important:</strong> Once you run the stealth app, you can completely close this Google Chrome tab! You only need Microsoft Teams open.
          </p>
          <div className="w-full max-w-xs border-t border-slate-800 my-1" />

          {/* Parakeet-Style Download Box */}
          <div className="w-full max-w-sm p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3.5 text-left">
            <div>
              <h4 className="text-xs font-semibold text-white">
                Don't have the desktop app yet?
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Download the native Windows desktop launcher to run Interview Copilot <strong>completely hidden from Teams entire screen sharing</strong>.
              </p>
            </div>

            {/* Big Download Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownload}
                className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Download .bat</span>
              </button>
              <button
                onClick={handleDownloadPs1}
                className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .ps1</span>
              </button>
            </div>

            {/* Direct PowerShell 1-Line Run Option */}
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-medium block">
                Or run directly via Windows PowerShell (no download needed):
              </span>
              <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                <code className="text-[9.5px] text-indigo-300 font-mono truncate flex-1 select-all">
                  {oneLineLaunchCmd}
                </code>
                <button
                  onClick={handleCopyLaunchCmd}
                  className="px-2 py-0.5 bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200 rounded text-[10px] font-mono transition-colors shrink-0 cursor-pointer"
                >
                  {copiedLaunchCmd ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {downloaded && (
              <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-700/60 text-[11px] text-emerald-300 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>File downloaded successfully!</span>
                </div>
                <p className="text-[10.5px] text-slate-300 leading-snug">
                  Double-click the downloaded file in your Downloads folder. It opens the stealth GUI, stays invisible to Teams (<code className="text-emerald-300 font-mono">WDA_EXCLUDEFROMCAPTURE</code>), and listens continuously with Neural AI!
                </p>
              </div>
            )}

            {/* Technical Proof Badge */}
            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3 h-3" />
                <span>SetWindowDisplayAffinity Active</span>
              </span>
              <span>Windows 10 / 11 64-bit</span>
            </div>
          </div>

          {/* Alternative Quick Cloak for Current Browser Window */}
          <div className="w-full max-w-sm p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-left space-y-1.5">
            <span className="text-slate-400 font-medium block">
              Already have the HUD open in Chrome right now?
            </span>
            <p className="text-slate-500 text-[10.5px] leading-snug">
              Run this 1-line command in PowerShell to make your open window invisible instantly:
            </p>
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
              <code className="text-[10px] text-emerald-400 font-mono truncate flex-1">
                {selfContainedCmd}
              </code>
              <button
                onClick={handleCopyCmd}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-mono transition-colors shrink-0 cursor-pointer"
              >
                {copiedCmd ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
