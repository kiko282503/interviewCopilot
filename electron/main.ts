import { app, BrowserWindow, ipcMain, screen, desktopCapturer, dialog, globalShortcut, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { startServer } from '../server.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let copilotWindow: BrowserWindow | null = null;
let backendServer: Awaited<ReturnType<typeof startServer>> | null = null;
let backendUrl = '';

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#020617', // slate-950
    title: 'Settings',
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  try {
    mainWindow.setContentProtection(true);
  } catch {}

  mainWindow.loadURL(backendUrl).catch((error) => {
    console.error('Failed to load the Interview Copilot window:', error);
    if (!mainWindow?.isDestroyed()) {
      dialog.showErrorBox('Interview Copilot failed to load', error.message);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (copilotWindow) {
      copilotWindow.close();
    }
  });
}

function createCopilotFloatingWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  copilotWindow = new BrowserWindow({
    width: 440,
    height: 640,
    x: width - 460,
    y: Math.max(40, height - 680),
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: true, // Invisible in Windows taskbar & Alt+Tab
    title: 'Settings', // Decoy title
    backgroundColor: '#090d16',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Windows DWM Screen Capture Exclusion: prevents capture when user shares screen
  try {
    copilotWindow.setContentProtection(true);
  } catch (e) {
    console.warn('Content protection not supported in this environment');
  }

  copilotWindow.loadURL(`${backendUrl}/?mode=floating`).catch((error) => {
    console.error('Failed to load the floating copilot window:', error);
    if (!copilotWindow?.isDestroyed()) {
      dialog.showErrorBox('Floating Copilot failed to load', error.message);
    }
  });

  copilotWindow.on('closed', () => {
    copilotWindow = null;
  });
}

app.whenReady().then(async () => {
  backendServer = await startServer({
    port: 0,
    host: '127.0.0.1',
    production: app.isPackaged,
    staticDir: path.resolve(__dirname, '../dist'),
  });
  const address = backendServer.address();
  if (!address || typeof address === 'string') {
    throw new Error('The local API server did not report a TCP address.');
  }
  backendUrl = `http://127.0.0.1:${address.port}`;

  // Silent system-audio loopback handler (Parakeet-style zero-picker audio capture inside Electron)
  try {
    if (session?.defaultSession?.setDisplayMediaRequestHandler) {
      session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
        desktopCapturer
          .getSources({ types: ['screen'] })
          .then((sources) => {
            if (sources && sources.length > 0) {
              callback({ video: sources[0], audio: 'loopback' });
            } else {
              callback({});
            }
          })
          .catch(() => callback({}));
      });
    }
  } catch (err) {
    console.warn('Loopback handler registration notice:', err);
  }

  createMainWindow();

  // OS-Wide Global Hotkey for Stealth Mode: CommandOrControl+Shift+H
  try {
    globalShortcut.register('CommandOrControl+Shift+H', () => {
      if (copilotWindow) {
        if (copilotWindow.isVisible()) {
          copilotWindow.hide();
        } else {
          copilotWindow.show();
        }
      }
    });
  } catch (err) {
    console.warn('Failed to register global shortcut:', err);
  }

  // IPC: Stealth Mode Controls
  ipcMain.handle('stealth:set-enabled', (event: any, enabled: boolean) => {
    if (copilotWindow) {
      try {
        copilotWindow.setContentProtection(enabled);
      } catch (err) {
        console.warn('setContentProtection failed:', err);
      }
    }
    return enabled;
  });

  ipcMain.handle('stealth:register-hotkey', (event: any, accelerator: string) => {
    try {
      globalShortcut.unregisterAll();
      const success = globalShortcut.register(accelerator, () => {
        if (copilotWindow) {
          if (copilotWindow.isVisible()) {
            copilotWindow.hide();
          } else {
            copilotWindow.show();
          }
        }
      });
      return success;
    } catch {
      return false;
    }
  });

  // IPC: Window Controls
  ipcMain.handle('window:minimize', (event: any) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.minimize();
  });

  ipcMain.handle('window:maximize', (event: any) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  });

  ipcMain.handle('window:close', (event: any) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.close();
  });

  ipcMain.handle('window:set-always-on-top', (event: any, flag: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.setAlwaysOnTop(flag);
    return flag;
  });

  ipcMain.handle('window:set-opacity', (event: any, opacity: number) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.setOpacity(opacity);
    return opacity;
  });

  ipcMain.handle('window:set-content-protection', (event: any, flag: boolean) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    try {
      win?.setContentProtection(flag);
      return flag;
    } catch {
      return false;
    }
  });

  ipcMain.handle('window:toggle-copilot', () => {
    if (copilotWindow) {
      if (copilotWindow.isVisible()) {
        copilotWindow.hide();
      } else {
        copilotWindow.show();
      }
    } else {
      createCopilotFloatingWindow();
    }
  });

  // IPC: Screen Capture Sources for Windows
  ipcMain.handle('screen:get-sources', async () => {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 1280, height: 720 },
    });
    return sources.map((s: any) => ({
      id: s.id,
      name: s.name,
      thumbnail: s.thumbnail.toDataURL(),
    }));
  });

  // IPC: File dialog
  ipcMain.handle('dialog:open-file', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Documents', extensions: ['pdf', 'docx', 'txt'] },
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] },
      ],
    });
    return result.filePaths;
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
}).catch((error) => {
  console.error('Failed to start Interview Copilot:', error);
  dialog.showErrorBox(
    'Interview Copilot failed to start',
    error instanceof Error ? error.message : String(error)
  );
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  backendServer?.close();
});
