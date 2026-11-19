import React, { useState } from 'react';
import {
  Download,
  ExternalLink,
  Laptop,
  ShieldCheck,
  Sparkles,
  X,
  ArrowLeft,
  CheckCircle2,
  Copy,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface DesktopLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopLauncherModal: React.FC<DesktopLauncherModalProps> = ({ isOpen, onClose }) => {
  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedBridgeUrl, setCopiedBridgeUrl] = useState(false);

  const { stealthBridgeStatus, stealthAudioPeak, stealthAudioErrors, stealthBridgeError, isBraveBrowser } = useAppStore();

  if (!isOpen) return null;

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

  const handleCopyBridgeUrl = async () => {
    try {
      await navigator.clipboard.writeText(standaloneBridgeUrl);
      setCopiedBridgeUrl(true);
      setTimeout(() => setCopiedBridgeUrl(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const downloadPersonalizedScript = async (path: string, filename: string) => {
    try {
      setDownloading(true);
      const res = await fetch(path);
      if (!res.ok) throw new Error('Fetch failed');
      const raw = await res.text();
      const personalized = raw.replace(/__COPILOT_BRIDGE_URL__/g, standaloneBridgeUrl);
      const blob = new Blob([personalized], { type: 'application/octet-stream' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 1000);
      setDownloaded(true);
    } catch {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = path;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 500);
      setDownloaded(true);
    } finally {
      setTimeout(() => setDownloading(false), 1000);
    }
  };

  const handleDownload = () => {
    void downloadPersonalizedScript('/InterviewCopilot-Stealth.bat', 'InterviewCopilot-Stealth.bat');
  };

  const handleDownloadPs1 = () => {
    void downloadPersonalizedScript('/InterviewCopilot-Stealth.ps1', 'InterviewCopilot-Stealth.ps1');
  };

  const handleCopyFullScript = async () => {
    try {
      const res = await fetch('/InterviewCopilot-Stealth.bat');
      if (!res.ok) throw new Error('Fetch failed');
      const text = (await res.text()).replace(/__COPILOT_BRIDGE_URL__/g, standaloneBridgeUrl);
      await navigator.clipboard.writeText(text);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    } catch (err) {
      console.error(err);
    }
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
              Native Windows 11 app that captures <strong>both System Audio (Interviewer) &amp; Mic (Interviewee)</strong> via WASAPI, floats beneath your webcam, and renders a live conversation timeline + Gemini answers.
            </p>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full max-w-sm py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl border border-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer"
          >
            <Laptop className="w-4 h-4" />
            <span>{downloading ? 'Preparing Download...' : downloaded ? 'Downloaded! Double-click file to run' : 'Download Stealth Desktop App (.bat)'}</span>
          </button>

          {/* Live Bridge Status & Iframe Bypass */}
          {stealthBridgeStatus === 'connected' ? (
            <div className="w-full max-w-sm p-3 rounded-xl bg-emerald-950/50 border border-emerald-700/60 text-left space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  Gemini Bridge Connected (127.0.0.1:38291)
                </span>
                <span className="font-mono text-[10px]">
                  Spk {stealthAudioPeak.speaker}% · Mic {stealthAudioPeak.mic}%
                </span>
              </div>
              {(stealthAudioErrors.speakerError || stealthAudioErrors.micError) && (
                <p className="text-[10px] text-amber-300 font-mono">
                  {stealthAudioErrors.speakerError || stealthAudioErrors.micError}
                </p>
              )}
            </div>
          ) : isInIframe || stealthBridgeStatus === 'iframe-blocked' ? (
            <div className="w-full max-w-sm p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/50 text-left space-y-2.5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-100 leading-relaxed">
                  <strong>Why .bat shows &quot;Bridge: Waiting&quot;:</strong> You are inside the AI Studio preview iframe. Chrome &amp; Brave block local <code className="text-amber-300">127.0.0.1</code> bridge calls inside iframes.
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={standaloneBridgeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Bridge Tab</span>
                </a>
                <button
                  onClick={handleCopyBridgeUrl}
                  className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] rounded-lg border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Copy URL to paste into Microsoft Edge or Google Chrome"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedBridgeUrl ? 'Copied!' : 'Copy URL'}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-300 leading-snug">
                <strong>In Brave:</strong> On the opened <em>Interview Copilot</em> tab (not your video tab), click the orange Lion icon and flip the top-right toggle switch OFF (so it says <strong>Shields down</strong>). If Brave still prompts/blocks localhost, paste the copied URL into <strong>Microsoft Edge</strong> or <strong>Chrome</strong>.
              </p>
            </div>
          ) : isBraveBrowser ? (
            <div className="w-full max-w-sm p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/50 text-left space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-100 leading-relaxed">
                  <strong>Brave blocked local bridge (127.0.0.1:38291):</strong> Even with Shields down, Brave blocks <code className="text-amber-300">localhost</code> unless allowed in <code className="text-amber-300">brave://settings/content/localhost</code> (set to Ask/Allow) or site permissions.
                  {stealthBridgeError ? <span className="block text-[10px] text-amber-300/80 font-mono mt-1">Status: {stealthBridgeError}</span> : null}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className="text-[10px] text-slate-300">Easiest: Open this URL in Chrome / Edge:</span>
                <button
                  onClick={handleCopyBridgeUrl}
                  className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[10.5px] rounded-lg border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedBridgeUrl ? 'Copied!' : 'Copy URL'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-sm p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-left space-y-1.5">
              <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                <strong>Zero-Click Gemini AI Mode:</strong> Keep this top-level tab open. If Chrome/Edge asks to allow local network access (<code className="text-emerald-300 font-mono">127.0.0.1</code>), click <strong>Allow</strong> so the <code className="text-emerald-300 font-mono">.bat</code> connects automatically.
              </p>
              {stealthBridgeError ? (
                <p className="text-[10px] text-amber-300 font-mono">Bridge note: {stealthBridgeError}</p>
              ) : null}
            </div>
          )}

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
                disabled={downloading}
                className="py-2.5 px-3 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>{downloading ? 'Downloading...' : 'Download .bat'}</span>
              </button>
              <button
                onClick={handleDownloadPs1}
                disabled={downloading}
                className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .ps1</span>
              </button>
            </div>

            {/* Direct Clipboard Option (100% immune to browser download blocks) */}
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-300 font-medium">
                  Browser blocking .bat downloads?
                </span>
                <button
                  onClick={handleCopyFullScript}
                  className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedScript ? 'Copied to Clipboard!' : 'Copy Script Code'}</span>
                </button>
              </div>
              <p className="text-[9.5px] text-slate-400 leading-snug">
                Click <strong>Copy Script Code</strong>, then open Notepad, paste (<code className="text-indigo-300">Ctrl+V</code>), save as <code className="text-emerald-300 font-mono">copilot.bat</code> on your Desktop, and double-click to run!
              </p>
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
