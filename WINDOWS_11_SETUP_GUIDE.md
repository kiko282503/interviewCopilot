# Interview Copilot AI — Windows 11 Complete Setup Guide

This guide covers all methods to run and package **Interview Copilot AI** on **Windows 11**.

---

## Method 1: Instant Desktop App via Chrome or Edge (Zero Installation)
If you want to use the app on Windows 11 immediately without compiling code:

1. Open your Windows 11 browser (Google Chrome or Microsoft Edge).
2. Navigate to your app URL:
   `https://ais-dev-dekg77rzmikklb5emsfymz-934662374252.asia-southeast1.run.app`
3. Look at the right side of the URL address bar:
   * **In Edge**: Click the **"App available. Install Interview Copilot AI"** icon (three squares with a plus).
   * **In Chrome**: Click the **"Install Interview Copilot AI"** computer monitor icon.
4. When prompted:
   * Check **"Pin to Taskbar"**
   * Check **"Pin to Start menu"**
   * Click **Install**
5. **Result**: The app will launch in its own standalone, frameless desktop window with its own taskbar icon, separate from your web browsing tabs.

---

## Method 2: Standalone Windows 11 Installer (.exe with NSIS & OS Stealth Mode)
To compile a standalone `.exe` installer that registers OS-level global hotkeys (`Ctrl+Shift+H` across all apps) and activates Windows DWM screen capture exclusion (`WDA_EXCLUDEFROMCAPTURE`):

### 1. Prerequisites
* **Windows 11** (64-bit or ARM64)
* **Node.js (v20+ or v22 LTS)**: Download from [nodejs.org](https://nodejs.org)
* **Git for Windows**: Download from [git-scm.com](https://git-scm.com)

### 2. Download & Setup
Open **Windows Terminal** (PowerShell) as Administrator:

```powershell
# 1. Clone your project or extract downloaded ZIP
git clone <your-repo-url> interview-copilot
cd interview-copilot

# 2. Install dependencies
npm install

# 3. Create your environment variables file
Copy-Item .env.example .env

# 4. Open .env in Notepad and paste your Gemini API Key:
notepad .env
# Set GEMINI_API_KEY="your_actual_key_here"
```

### 3. Build & Package the Windows 11 Installer
Run the distribution build script:

```powershell
npm run dist:win
```

* This runs `vite build` followed by `electron-builder --win nsis`.
* When compilation finishes, your installer will be in the `release/` folder:
  ```
  release/Interview Copilot AI Setup 1.0.0.exe
  ```

### 4. Install & Run
* Double-click `Interview Copilot AI Setup 1.0.0.exe` to run the setup wizard.
* It will install into `%LocalAppData%\Programs\Interview Copilot AI` and generate:
  * A Start Menu entry
  * A Desktop shortcut
* Launch the app from your Start Menu!

---

## Method 3: Running in Local Development Mode on Windows 11
If you want to run the code locally with hot-reloading:

```powershell
# In PowerShell:
npm install
npm run dev
```
Open `http://localhost:3000` in Edge or Chrome.

---

## Essential Windows 11 Audio Setup for Video Meetings (Teams / Meet / Zoom)

When you are in an online interview using headphones, your microphone only hears your physical voice; it does not hear the interviewer talking inside your headphones.

To allow Interview Copilot AI to listen and transcribe **both** your voice and the interviewer's voice in real time:

### Option A: Use Laptop Speakers (Simplest)
* Run the interview sound through your laptop speakers at a moderate volume.
* Your laptop microphone naturally picks up the interviewer's voice and transcribes questions automatically.

### Option B: Windows "Stereo Mix" or Virtual Audio Cable (For Headphones)
1. Download the free, standard audio driver: [VB-Audio Virtual Cable](https://vb-audio.com/Cable/) (or enable Windows built-in **Stereo Mix** in Sound Control Panel).
2. In Windows 11 **Settings > System > Sound > More sound settings**:
   * Set your Output to **Cable Input**.
   * In the **Recording** tab, right-click **Cable Output > Properties > Listen > Check "Listen to this device"** and select your headphones.
3. In Microsoft Teams / Google Meet:
   * Speaker: **CABLE Input (VB-Audio Virtual Cable)**
4. In Interview Copilot AI:
   * Audio Input: Set to your microphone or Cable Output.
5. Now, both your microphone audio and the interviewer's incoming voice are fed cleanly into Copilot with zero distortion or lag.

---

## Windows 11 Screen Sharing Best Practices
1. **Always choose "Share a Window"**:
   * In Teams or Google Meet, select only the window you want to share (e.g. VS Code, Chrome IDE, or Terminal).
   * Teams will stream only that program. The Floating Copilot HUD is physically not shared.
2. **If forced to "Share Entire Screen"**:
   * Keep **Stealth Mode** turned **ON** in Application Settings.
   * The desktop app automatically calls `SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)`.
   * Press **`Ctrl + Shift + H`** or **`Escape`** anytime to immediately hide the HUD.
