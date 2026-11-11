# PROJECT ARCHITECTURE: INTERVIEW COPILOT AI

## 1. System Overview
Interview Copilot AI is a high-performance Windows 11 desktop assistant engineered for real-time interview transcription, question detection, personalized answer generation, multimodal screenshot analysis, coding assistance, and interview practice simulation.

```
+------------------------------------------------------------------------------------+
|                                INTERVIEW COPILOT AI                                |
+------------------------------------------------------------------------------------+
|  ELECTRON MAIN PROCESS (electron/main.ts & electron/preload.ts)                    |
|  - Window Management: Main Window & Always-on-Top Floating HUD Overlay             |
|  - Windows IPC API: Window bounds, shortcuts, screen capture, file dialogs         |
|  - Production Distribution: Electron Builder & Windows NSIS Installer             |
+------------------------------------------------------------------------------------+
                                       |
+------------------------------------------------------------------------------------+
|  RENDERER PROCESS (React 19 + TypeScript + Tailwind CSS + Zustand)                 |
|  - Dashboard: System metrics, quick actions, audio & Gemini connection state       |
|  - Live Interview Assistant: Streaming transcription, question detection, answers  |
|  - Coding Assistant: Algorithm solver, complexity calculator, QA automation        |
|  - Screenshot Analyzer: Multimodal Gemini vision, OCR, crop tool, code extraction  |
|  - Interview Practice: Mock simulator, role configuration, evaluation rubric       |
|  - Resume Intelligence: Senior QA Automation Engineer profile, parser, editor      |
|  - Question & Answer Library: Curated QA automation questions, custom collections  |
|  - Code Workspace: Monaco editor, syntax highlight, isolated runner, test cases    |
|  - Floating Copilot Overlay: Compact, draggable, non-intrusive meeting companion  |
+------------------------------------------------------------------------------------+
                                       |
+------------------------------------------------------------------------------------+
|  BACKEND NODE.JS & EXPRESS SERVICE (server.ts)                                     |
|  - Gemini AI Orchestration Service (@google/genai SDK):                            |
|      * gemini-3.8-flash for rapid text, Q&A, coding, and multimodal vision         |
|      * gemini-3.5-transcribe for audio processing & transcription                  |
|  - Audio Capture & Processing: Web Audio API, MediaDevices, loopback integration   |
|  - Safe Sandboxed Code Runner: Node VM / subprocess with timeout & memory caps     |
|  - Database Persistence Engine: Relational storage for sessions, profiles, Q&A     |
+------------------------------------------------------------------------------------+
```

## 2. Directory Structure
```
/
├── electron/
│   ├── main.ts              # Electron main process (multi-window, IPC, shortcuts)
│   └── preload.ts           # Secure ContextBridge IPC bindings
├── src/
│   ├── assets/              # Icons, logos, and graphic assets
│   ├── components/
│   │   ├── layout/          # Sidebar, Header, WindowControls, Navigation
│   │   ├── dashboard/       # Dashboard metrics, recent sessions, quick actions
│   │   ├── live/            # Audio transcription, question detector, answers
│   │   ├── coding/          # Coding solver, language selector, complexity view
│   │   ├── screenshot/      # Image upload, crop, multimodal Gemini inspection
│   │   ├── practice/        # Mock simulator, feedback scorecards
│   │   ├── resume/          # Profile editor, resume parser, skill chips
│   │   ├── library/         # Searchable QA questions, collections
│   │   ├── history/         # Saved sessions, transcript export
│   │   ├── editor/          # Monaco-based code workspace & test runner
│   │   ├── floating/        # Floating HUD copilot overlay for meetings
│   │   └── settings/        # AI configuration & application preferences
│   ├── store/
│   │   ├── useAppStore.ts   # Navigation, theme, active session state
│   │   ├── useInterviewStore.ts # Live audio, transcripts, answers
│   │   ├── useProfileStore.ts   # Candidate profile (Senior QA Lead)
│   │   └── useCodeStore.ts      # Code workspace, snippets, languages
│   ├── services/
│   │   ├── geminiClient.ts  # Client-side API caller to backend /api/gemini
│   │   ├── audioService.ts  # Web Audio API & Speech Recognition
│   │   └── storageService.ts# Local database persistence bridge
│   ├── types/
│   │   └── index.ts         # TypeScript data contracts & models
│   ├── App.tsx              # Root component & view router
│   ├── index.css            # Tailwind CSS v4 + Dark variant
│   └── main.tsx             # React DOM root
├── server.ts                # Express backend + Vite middleware + Gemini API
├── electron-builder.json5   # Windows NSIS packaging definition
├── DEVELOPMENT_STATUS.md    # Development phases & milestones
└── CHANGELOG.md             # Version & feature history
```

## 3. Technology Stack Justification
- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 (`Plus Jakarta Sans` & `JetBrains Mono` typography).
- **Backend**: Node.js + Express with server-side `@google/genai` (version >= 2.25.0) ensuring API keys never touch the client.
- **AI Models**: `gemini-3.8-flash` for high-throughput, low-latency reasoning and multimodal vision; `gemini-3.5-transcribe` for voice.
- **Desktop**: Electron main process with secure IPC, context isolation, always-on-top floating HUD window, and NSIS Windows installer config.
