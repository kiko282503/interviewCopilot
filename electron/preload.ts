import { contextBridge, ipcRenderer } from 'electron';

export interface IElectronAPI {
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  setAlwaysOnTop: (flag: boolean) => Promise<boolean>;
  setOpacity: (opacity: number) => Promise<number>;
  setContentProtection: (flag: boolean) => Promise<boolean>;
  setStealthEnabled: (enabled: boolean) => Promise<boolean>;
  registerStealthHotkey: (accelerator: string) => Promise<boolean>;
  toggleCopilotHUD: () => Promise<void>;
  getScreenSources: () => Promise<{ id: string; name: string; thumbnail: string }[]>;
  openFileDialog: () => Promise<string[] | null>;
  isElectron: boolean;
}

const electronAPI: IElectronAPI = {
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  setAlwaysOnTop: (flag: boolean) => ipcRenderer.invoke('window:set-always-on-top', flag),
  setOpacity: (opacity: number) => ipcRenderer.invoke('window:set-opacity', opacity),
  setContentProtection: (flag: boolean) => ipcRenderer.invoke('window:set-content-protection', flag),
  setStealthEnabled: (enabled: boolean) => ipcRenderer.invoke('stealth:set-enabled', enabled),
  registerStealthHotkey: (accelerator: string) => ipcRenderer.invoke('stealth:register-hotkey', accelerator),
  toggleCopilotHUD: () => ipcRenderer.invoke('window:toggle-copilot'),
  getScreenSources: () => ipcRenderer.invoke('screen:get-sources'),
  openFileDialog: () => ipcRenderer.invoke('dialog:open-file'),
  isElectron: true,
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
