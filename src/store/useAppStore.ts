import { create } from 'zustand';
import { NavigationTab } from '../types';

export type DecoyPreset = 'settings' | 'notepad' | 'system' | 'calc' | 'off';

export const DECOY_CONFIGS: Record<DecoyPreset, { title: string; favicon: string }> = {
  settings: {
    title: 'Settings',
    favicon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'><circle cx='12' cy='12' r='3'/><path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'/></svg>",
  },
  notepad: {
    title: 'Notepad - Notes.txt',
    favicon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2338bdf8' stroke-width='2'><path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><polyline points='14 2 14 8 20 8'/><line x1='16' y1='13' x2='8' y2='13'/><line x1='16' y1='17' x2='8' y2='17'/><polyline points='10 9 9 9 8 9'/></svg>",
  },
  system: {
    title: 'System Diagnostics & Performance',
    favicon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2'><rect x='2' y='3' width='20' height='14' rx='2'/><line x1='8' y1='21' x2='16' y2='21'/><line x1='12' y1='17' x2='12' y2='21'/></svg>",
  },
  calc: {
    title: 'Calculator',
    favicon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2'><rect x='4' y='2' width='16' height='20' rx='2'/><line x1='8' y1='6' x2='16' y2='6'/><line x1='16' y1='14' x2='16' y2='18'/><path d='M16 10h.01'/><path d='M12 10h.01'/><path d='M8 10h.01'/><path d='M12 14h.01'/><path d='M8 14h.01'/><path d='M12 18h.01'/><path d='M8 18h.01'/></svg>",
  },
  off: {
    title: 'Interview Copilot AI - Windows 11 Desktop Assistant',
    favicon: '/favicon.svg',
  },
};

interface AppState {
  currentTab: NavigationTab;
  isFloatingMode: boolean;
  isAlwaysOnTop: boolean;
  isElectron: boolean;
  theme: 'dark' | 'light';
  geminiConnected: boolean;
  preferredModel: string;
  activeNotification: string | null;
  hudOpacity: number;
  stealthMode: boolean;
  stealthHotkey: string;
  decoyPreset: DecoyPreset;
  sidebarOpen: boolean;
  isCamouflageMode: boolean;
  setCurrentTab: (tab: NavigationTab) => void;
  setFloatingMode: (enabled: boolean) => void;
  setAlwaysOnTop: (enabled: boolean) => void;
  setHudOpacity: (opacity: number) => void;
  setStealthMode: (enabled: boolean) => void;
  setStealthHotkey: (hotkey: string) => void;
  setDecoyPreset: (preset: DecoyPreset) => void;
  setIsCamouflageMode: (enabled: boolean) => void;
  toggleCamouflageMode: () => void;
  toggleTheme: () => void;
  setGeminiConnected: (connected: boolean) => void;
  setNotification: (msg: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentTab: 'dashboard',
  isFloatingMode: false,
  isAlwaysOnTop: true,
  isElectron: typeof window !== 'undefined' && !!(window as any).electronAPI?.isElectron,
  theme: 'dark',
  geminiConnected: true,
  preferredModel: 'gemini-3.8-flash',
  activeNotification: null,
  hudOpacity: 95,
  stealthMode: true,
  stealthHotkey: 'Ctrl+Shift+H',
  decoyPreset: typeof window !== 'undefined'
    ? ((localStorage.getItem('copilot_decoy') as DecoyPreset) || 'settings')
    : 'settings',
  sidebarOpen: false,
  isCamouflageMode: typeof window !== 'undefined'
    ? localStorage.getItem('copilot_camouflage') === 'true'
    : false,
  setCurrentTab: (tab) => set({ currentTab: tab, sidebarOpen: false }),
  setFloatingMode: (enabled) => set({ isFloatingMode: enabled }),
  setAlwaysOnTop: (enabled) => set({ isAlwaysOnTop: enabled }),
  setHudOpacity: (opacity) => {
    set({ hudOpacity: opacity });
    if (typeof window !== 'undefined' && (window as any).electronAPI?.setOpacity) {
      (window as any).electronAPI.setOpacity(opacity / 100);
    }
  },
  setStealthMode: (enabled) => {
    set({
      stealthMode: enabled,
      activeNotification: enabled
        ? 'Stealth Mode Enabled: HUD excluded from screen recordings and hidden with hotkey'
        : 'Stealth Mode Disabled: Screen protection turned off',
    });
    if (typeof window !== 'undefined' && (window as any).electronAPI?.setStealthEnabled) {
      (window as any).electronAPI.setStealthEnabled(enabled);
    }
  },
  setStealthHotkey: (hotkey) => {
    set({ stealthHotkey: hotkey });
    if (typeof window !== 'undefined' && (window as any).electronAPI?.registerStealthHotkey) {
      const electronAcc = hotkey.replace('Ctrl', 'CommandOrControl');
      (window as any).electronAPI.registerStealthHotkey(electronAcc);
    }
  },
  setDecoyPreset: (preset) => {
    set({ decoyPreset: preset });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('copilot_decoy', preset);
      } catch (e) {}
    }
    if (typeof document !== 'undefined') {
      const config = DECOY_CONFIGS[preset];
      document.title = config.title;
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = config.favicon;
    }
  },
  setIsCamouflageMode: (enabled) => {
    set({ isCamouflageMode: enabled });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('copilot_camouflage', String(enabled));
      } catch (e) {}
    }
  },
  toggleCamouflageMode: () => {
    set((state) => {
      const next = !state.isCamouflageMode;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('copilot_camouflage', String(next));
        } catch (e) {}
      }
      return { isCamouflageMode: next };
    });
  },
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setGeminiConnected: (connected) => set({ geminiConnected: connected }),
  setNotification: (msg) => set({ activeNotification: msg }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
