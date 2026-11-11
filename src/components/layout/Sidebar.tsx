import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useProfileStore } from '../../store/useProfileStore';
import { NavigationTab } from '../../types';
import {
  LayoutDashboard,
  Mic,
  Code2,
  ScanLine,
  GraduationCap,
  FileText,
  BookOpen,
  History,
  Terminal,
  Cpu,
  Settings,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'live', label: 'Live Interview', icon: Mic, badge: 'Realtime' },
  { id: 'coding', label: 'Coding Assistant', icon: Code2 },
  { id: 'screenshot', label: 'Screenshot Analyzer', icon: ScanLine, badge: 'Vision' },
  { id: 'practice', label: 'Interview Practice', icon: GraduationCap },
  { id: 'resume', label: 'Resume Intelligence', icon: FileText },
  { id: 'library', label: 'Q&A Library', icon: BookOpen },
  { id: 'history', label: 'Interview History', icon: History },
  { id: 'workspace', label: 'Code Workspace', icon: Terminal },
  { id: 'aiconfig', label: 'AI Configuration', icon: Cpu },
  { id: 'settings', label: 'Application Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { currentTab, setCurrentTab, sidebarOpen, setSidebarOpen } = useAppStore();
  const { profile } = useProfileStore();

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 top-14 bg-black/70 backdrop-blur-xs z-30 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-14 left-0 z-40 w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between select-none transition-transform duration-200 ease-in-out lg:static lg:inset-auto lg:w-64 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation List */}
        <div className="p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              Copilot Workspace
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-300 lg:hidden p-1 rounded"
              title="Close Menu"
            >
              ✕
            </button>
          </div>

        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-indigo-400' : 'text-slate-500'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Candidate Profile Widget at bottom */}
      <div className="p-3 border-t border-slate-800/70 bg-slate-900/40">
        <div
          onClick={() => setCurrentTab('resume')}
          className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium text-xs truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">Active Candidate Profile</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {profile.title}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 font-mono">
            <span>{profile.yearsExperience}+ yrs QA</span>
            <span>·</span>
            <span>11+ yrs Auto</span>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};
