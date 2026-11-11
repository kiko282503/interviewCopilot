declare module 'electron' {
  export interface IpcMainInvokeEvent {
    sender: any;
  }

  export const app: {
    whenReady: () => Promise<void>;
    quit: () => void;
    on: (event: string, callback: (...args: any[]) => void) => void;
  };

  export class BrowserWindow {
    constructor(options: any);
    loadURL: (url: string) => Promise<void>;
    loadFile: (filePath: string, options?: any) => Promise<void>;
    minimize: () => void;
    maximize: () => void;
    unmaximize: () => void;
    isMaximized: () => boolean;
    close: () => void;
    show: () => void;
    hide: () => void;
    isVisible: () => boolean;
    setAlwaysOnTop: (flag: boolean) => void;
    setOpacity: (opacity: number) => void;
    setContentProtection: (enable: boolean) => void;
    on: (event: string, callback: (...args: any[]) => void) => void;
    static fromWebContents: (contents: any) => BrowserWindow | null;
    static getAllWindows: () => BrowserWindow[];
  }

  export const ipcMain: {
    handle: (channel: string, listener: (event: IpcMainInvokeEvent, ...args: any[]) => any) => void;
  };

  export const ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => Promise<any>;
  };

  export const screen: {
    getPrimaryDisplay: () => {
      workAreaSize: { width: number; height: number };
    };
  };

  export const desktopCapturer: {
    getSources: (options: { types: string[]; thumbnailSize?: { width: number; height: number } }) => Promise<
      { id: string; name: string; thumbnail: { toDataURL: () => string } }[]
    >;
  };

  export const dialog: {
    showOpenDialog: (window: BrowserWindow, options: any) => Promise<{ filePaths: string[] }>;
  };

  export const globalShortcut: {
    register: (accelerator: string, callback: () => void) => boolean;
    unregister: (accelerator: string) => void;
    unregisterAll: () => void;
    isRegistered: (accelerator: string) => boolean;
  };

  export const contextBridge: {
    exposeInMainWorld: (apiKey: string, api: any) => void;
  };
}
