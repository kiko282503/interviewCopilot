import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { LiveInterviewView } from './components/live/LiveInterviewView';
import { CodingAssistantView } from './components/coding/CodingAssistantView';
import { ScreenshotAnalyzerView } from './components/screenshot/ScreenshotAnalyzerView';
import { InterviewPracticeView } from './components/practice/InterviewPracticeView';
import { ResumeIntelligenceView } from './components/resume/ResumeIntelligenceView';
import { QuestionLibraryView } from './components/library/QuestionLibraryView';
import { InterviewHistoryView } from './components/history/InterviewHistoryView';
import { CodeWorkspaceView } from './components/editor/CodeWorkspaceView';
import { AIConfigView } from './components/settings/AIConfigView';
import { AppSettingsView } from './components/settings/AppSettingsView';
import { FloatingCopilotView } from './components/floating/FloatingCopilotView';

export default function App() {
  const { currentTab, isFloatingMode, setFloatingMode, theme, decoyPreset, setDecoyPreset } = useAppStore();

  const isStandalone = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('mode') === 'floating' ||
    new URLSearchParams(window.location.search).get('mode') === 'standalone-hud' ||
    new URLSearchParams(window.location.search).get('mode') === 'companion'
  );

  // Sync stealth decoy title on initial load
  useEffect(() => {
    setDecoyPreset(decoyPreset);
  }, [setDecoyPreset, decoyPreset]);

  // Ensure .dark class is synced on document.documentElement
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Global Stealth Mode Hotkey Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Toggle Floating HUD with Ctrl+Shift+H (Stealth Hotkey) or Ctrl+Shift+I
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'h') ||
          (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i')) {
        e.preventDefault();
        setFloatingMode(!isFloatingMode);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isFloatingMode, setFloatingMode]);

  // If running as standalone popped-out desktop window, render ONLY the HUD
  if (isStandalone) {
    return (
      <div className="h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
        <FloatingCopilotView isStandalone={true} />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Application Header */}
      <Header />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Dynamic Viewport */}
        <main className="flex-1 overflow-hidden flex flex-col bg-slate-950">
          {currentTab === 'dashboard' && <DashboardView />}
          {currentTab === 'live' && <LiveInterviewView />}
          {currentTab === 'coding' && <CodingAssistantView />}
          {currentTab === 'screenshot' && <ScreenshotAnalyzerView />}
          {currentTab === 'practice' && <InterviewPracticeView />}
          {currentTab === 'resume' && <ResumeIntelligenceView />}
          {currentTab === 'library' && <QuestionLibraryView />}
          {currentTab === 'history' && <InterviewHistoryView />}
          {currentTab === 'workspace' && <CodeWorkspaceView />}
          {currentTab === 'aiconfig' && <AIConfigView />}
          {currentTab === 'settings' && <AppSettingsView />}
        </main>

        {/* Floating Copilot HUD Overlay */}
        {isFloatingMode && <FloatingCopilotView />}
      </div>
    </div>
  );
}
