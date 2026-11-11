import React, { useState } from 'react';
import {
  ShieldAlert,
  Copy,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Download,
  AlertTriangle,
  Zap,
  Laptop,
} from 'lucide-react';

interface NativeInvisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NativeInvisibilityModal: React.FC<NativeInvisibilityModalProps> = ({ isOpen, onClose }) => {
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const oneLinerCmd = `Add-Type 'using System;using System.Runtime.InteropServices;public class WDA{[DllImport("user32.dll")]public static extern bool SetWindowDisplayAffinity(IntPtr h,uint a);}';Get-Process|Where-Object{$_.MainWindowTitle -match 'Interview|Copilot|Settings|Terminal'}|ForEach-Object{[WDA]::SetWindowDisplayAffinity($_.MainWindowHandle,0x11);Write-Host "[SUCCESS] Cloaked from Teams: $($_.MainWindowTitle)" -ForegroundColor Green}`;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(oneLinerCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-600/60 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Parakeet AI-Grade Screen Share Invisibility</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.2 rounded border border-emerald-500/30">
                  WDA_EXCLUDEFROMCAPTURE
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                How native tools hide from Microsoft Teams & Zoom during "Entire Screen" sharing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto text-xs">
          {/* Technical Reality Explainer */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Why Parakeet AI Hides (And Why Chrome Webpages Cannot By Default)</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11.5px]">
              Parakeet AI is a <strong>compiled native desktop application (.exe)</strong>. Because Parakeet's own process created and owns its window, it can call:
            </p>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[10.5px] text-emerald-400">
              SetWindowDisplayAffinity(hWnd, WDA_EXCLUDEFROMCAPTURE = 0x00000011);
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              <strong>Windows Security Rule:</strong> The Windows OS kernel strictly requires the <em>process that created the window</em> to set this affinity. External scripts cannot alter Chrome or Edge's window affinity from outside (Windows rejects with Access Denied / False).
            </p>
          </div>

          {/* Solution 1: 1-Click Windows 11 Cloak Script */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>1-Click Windows 11 Native Cloak (No Install Needed!)</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-1.5 py-0.5 rounded">
                Windows 10 / 11
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              You can instantly apply <code className="text-emerald-300 font-mono">SetWindowDisplayAffinity</code> to this window on your Windows 11 PC right now:
            </p>

            <div className="space-y-2">
              <div className="text-[11px] text-slate-400">
                1. Open <strong>PowerShell</strong> (press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px]">Win + R</kbd>, type <code className="text-slate-200">powershell</code>, and press Enter).
              </div>
              <div className="text-[11px] text-slate-400">
                2. Copy and paste this single command:
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800">
                <code className="flex-1 font-mono text-[11px] text-emerald-300 select-all truncate">
                  {oneLinerCmd}
                </code>
                <button
                  onClick={handleCopyCmd}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 cursor-pointer shadow-sm"
                >
                  {copiedCmd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCmd ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="flex items-center gap-2 text-[10.5px] text-slate-400">
                <span>Or download file directly:</span>
                <a
                  href="/stealth-cloak.ps1"
                  download="stealth-cloak.ps1"
                  className="text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1 font-mono"
                >
                  <Download className="w-3 h-3" />
                  <span>stealth-cloak.ps1</span>
                </a>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-[11px] text-emerald-200">
              ✓ Once executed, your Copilot HUD window becomes <strong>completely invisible</strong> to Microsoft Teams, Zoom, Google Meet, and screen recordings, even when sharing <strong>Entire Screen (Screen 1)</strong>!
            </div>
          </div>

          {/* Solution 2: Native Electron Desktop Build */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-indigo-300 text-xs">
              <Laptop className="w-4 h-4 text-indigo-400" />
              <span>Native Electron Desktop Client</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Our repository already contains the native Windows desktop client with <code className="text-indigo-300 font-mono">setContentProtection(true)</code> and <code className="text-indigo-300 font-mono">skipTaskbar: true</code> in <code className="text-slate-300 font-mono">electron/main.ts</code>. Run:
            </p>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-200">
              npm run electron:start
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Powered by Win32 DWM API
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
