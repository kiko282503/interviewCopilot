import React, { useState, useEffect, useRef } from 'react';
import { useInterviewStore } from '../../store/useInterviewStore';
import { useProfileStore } from '../../store/useProfileStore';
import { useAppStore } from '../../store/useAppStore';
import { useCodeStore } from '../../store/useCodeStore';
import { geminiClient } from '../../services/geminiClient';
import { startWavSpeechChunker, WavChunkerHandle } from '../../utils/audioWavChunker';
import { ResponseLength, QuestionCategory } from '../../types';
import {
  Mic,
  MicOff,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Send,
  Code,
  Volume2,
  AlertCircle,
  HelpCircle,
  Clock,
  Radio,
  Sliders,
  ChevronDown,
  Headphones,
  Speaker,
} from 'lucide-react';

export const LiveInterviewView: React.FC = () => {
  const {
    isListening,
    setListening,
    selectedAudioDeviceId,
    audioInputName,
    setAudioDevice,
    selectedAudioOutputId,
    audioOutputName,
    setAudioOutputDevice,
    audioVolume,
    setAudioVolume,
    transcripts,
    addTranscriptItem,
    detectedQuestions,
    addDetectedQuestion,
    activeAnswer,
    setActiveAnswer,
    responseLength,
    setResponseLength,
    autoAnswerEnabled,
    setAutoAnswerEnabled,
    isGeneratingAnswer,
    setIsGeneratingAnswer,
    interimTranscript,
    setInterimTranscript,
    clearSession,
    loadDemoData,
  } = useInterviewStore();

  const { getProfileSummaryForPrompt } = useProfileStore();
  const { setCurrentTab } = useAppStore();
  const { addTab } = useCodeStore();

  const [availableDevices, setAvailableDevices] = useState<{ id: string; label: string }[]>([]);
  const [availableOutputs, setAvailableOutputs] = useState<{ id: string; label: string }[]>([]);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isTranscribingChunk, setIsTranscribingChunk] = useState(false);
  const [capturingSystemAudio, setCapturingSystemAudio] = useState(false);
  const [capturingMic, setCapturingMic] = useState(false);
  const [mobileTab, setMobileTab] = useState<'transcript' | 'answer'>('answer');

  // Audio Context, WAV Chunkers, Streams & Speech Recognition references
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const micChunkerRef = useRef<WavChunkerHandle | null>(null);
  const displayChunkerRef = useRef<WavChunkerHandle | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const lastCommittedRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });
  const transcribingInFlightRef = useRef<number>(0);

  // Sync transcribed text directly to the native stealth desktop HUD via localhost bridge & clipboard
  const syncToStealthDesktop = async (transcript: string) => {
    if (!transcript || transcript.trim().length < 2) return;
    const cleanText = transcript.trim();
    try {
      await fetch('http://127.0.0.1:38291/', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: cleanText,
      });
    } catch {}
    try {
      await navigator.clipboard.writeText(`[COPILOT_AUDIO] ${cleanText}`);
    } catch {}
  };

  const commitTranscript = (rawText: string, speaker: 'interviewer' | 'candidate' = 'interviewer') => {
    const cleaned = rawText.trim();
    if (cleaned.length < 3) return;

    const nowMs = Date.now();
    const norm = cleaned.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    if (
      lastCommittedRef.current.text === norm &&
      nowMs - lastCommittedRef.current.time < 5000
    ) {
      return;
    }
    lastCommittedRef.current = { text: norm, time: nowMs };

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    addTranscriptItem({
      timestamp: nowStr,
      speaker,
      text: cleaned,
    });
    setInterimTranscript('');

    // Immediately broadcast live transcript to Stealth HUD
    syncToStealthDesktop(cleaned);

    // Run instant question detection only for interviewer speech
    if (speaker === 'interviewer') {
      handleQuestionDetection(cleaned);
    }
  };

  const sendWavToTranscribe = async (wavBase64: string, speaker: 'interviewer' | 'candidate') => {
    transcribingInFlightRef.current += 1;
    setIsTranscribingChunk(true);
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: wavBase64, mimeType: 'audio/wav' }),
      });

      const { safeParseJsonResponse } = await import('../../services/geminiClient');
      const data = await safeParseJsonResponse<{ transcript?: string }>(res, 'Audio transcription failed');
      if (data.transcript && data.transcript.trim().length >= 3) {
        setAudioError(null);
        commitTranscript(data.transcript.trim(), speaker);
      }
    } catch (err: any) {
      console.error('Audio chunk transcription error:', err);
      setAudioError(err?.message || 'Transcription request failed. Check server API status.');
    } finally {
      transcribingInFlightRef.current = Math.max(0, transcribingInFlightRef.current - 1);
      if (transcribingInFlightRef.current === 0) {
        setIsTranscribingChunk(false);
      }
    }
  };

  // Enumerate BOTH microphone inputs AND browser speaker/headphone audio outputs
  const loadAudioDevices = async (requestPermission = false) => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;

      let devices = await navigator.mediaDevices.enumerateDevices();
      const hasAnyLabel = devices.some((d) => Boolean(d.label && d.label.trim().length > 0));

      if (requestPermission && !hasAnyLabel && navigator.mediaDevices.getUserMedia) {
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          tempStream.getTracks().forEach((t) => t.stop());
          devices = await navigator.mediaDevices.enumerateDevices();
        } catch (permErr: any) {
          setAudioError(
            permErr?.message || 'Please allow microphone access in the browser address bar to reveal audio devices.'
          );
        }
      }

      const inputs = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, i) => ({
          id: d.deviceId || `input-${i}`,
          label:
            d.label ||
            (d.deviceId === 'default'
              ? 'Browser Default Microphone'
              : `Microphone ${i + 1} (Click Refresh to unlock name)`),
        }));

      const outputs = devices
        .filter((d) => d.kind === 'audiooutput')
        .map((d, i) => ({
          id: d.deviceId || `output-${i}`,
          label:
            d.label ||
            (d.deviceId === 'default'
              ? 'Browser Default Speakers / Headphones'
              : `Audio Output ${i + 1}`),
        }));

      const resolvedInputs =
        inputs.length > 0
          ? inputs
          : [{ id: 'default', label: 'Browser Default Microphone' }];
      const resolvedOutputs =
        outputs.length > 0
          ? outputs
          : [{ id: 'default', label: 'Browser Default Speakers / Headphones' }];

      setAvailableDevices(resolvedInputs);
      setAvailableOutputs(resolvedOutputs);

      // Keep store device labels synced with real browser hardware names
      const currentIn = resolvedInputs.find((d) => d.id === selectedAudioDeviceId) || resolvedInputs[0];
      if (currentIn && currentIn.label !== audioInputName) {
        setAudioDevice(currentIn.id, currentIn.label);
      }
      const currentOut = resolvedOutputs.find((d) => d.id === selectedAudioOutputId) || resolvedOutputs[0];
      if (currentOut && currentOut.label !== audioOutputName) {
        setAudioOutputDevice(currentOut.id, currentOut.label);
      }
    } catch {
      setAvailableDevices([{ id: 'default', label: 'Browser Default Microphone' }]);
      setAvailableOutputs([{ id: 'default', label: 'Browser Default Speakers / Headphones' }]);
    }
  };

  useEffect(() => {
    loadAudioDevices(false);
    const onDeviceChange = () => {
      loadAudioDevices(false);
    };
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', onDeviceChange);
      return () => navigator.mediaDevices.removeEventListener('devicechange', onDeviceChange);
    }
  }, []);

  const ensureAudioContext = async (): Promise<AudioContext> => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      return audioContextRef.current;
    }
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    audioContextRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyserRef.current = analyser;
    updateVolume();
    return ctx;
  };

  // Web Audio Analyser volume meter loop
  const updateVolume = () => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    setAudioVolume(Math.min(100, Math.round(average * 2.2)));

    animationFrameRef.current = requestAnimationFrame(updateVolume);
  };

  // Start capturing selected browser microphone input
  const startRecording = async (overrideDeviceId?: string, overrideDeviceName?: string) => {
    setAudioError(null);
    const activeDeviceId = overrideDeviceId ?? useInterviewStore.getState().selectedAudioDeviceId;
    const activeDeviceName = overrideDeviceName ?? useInterviewStore.getState().audioInputName;
    try {
      let stream: MediaStream;
      try {
        const constraints: MediaStreamConstraints = {
          audio:
            activeDeviceId === 'default'
              ? { echoCancellation: true, noiseSuppression: true }
              : { deviceId: { exact: activeDeviceId }, echoCancellation: true, noiseSuppression: true },
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (exactErr: any) {
        if (activeDeviceId !== 'default') {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { ideal: activeDeviceId } },
          });
        } else {
          throw exactErr;
        }
      }

      if (micChunkerRef.current) {
        micChunkerRef.current.stop();
        micChunkerRef.current = null;
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      micStreamRef.current = stream;

      // Refresh real hardware device names now that mic permission is active
      loadAudioDevices(false);

      const audioCtx = await ensureAudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      if (analyserRef.current) {
        source.connect(analyserRef.current);
      }

      // Attach WAV speech chunker directly to the selected microphone stream
      const isLoopbackInput = /stereo mix|what u hear|cable|loopback|voicemeeter/i.test(activeDeviceName);
      micChunkerRef.current = startWavSpeechChunker({
        audioCtx,
        sourceNode: source,
        onSpeechChunk: (wavBase64) => {
          sendWavToTranscribe(wavBase64, isLoopbackInput ? 'interviewer' : 'candidate');
        },
      });

      // Also attach Web Speech API ONLY when using default device as an optional low-latency interim preview
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition && activeDeviceId === 'default' && !recognitionRef.current) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (!event.results[i].isFinal) {
                interim += event.results[i][0].transcript;
              }
            }
            if (interim) {
              setInterimTranscript(interim);
            }
          };

          recognition.onerror = (e: any) => {
            if (e.error !== 'no-speech' && e.error !== 'aborted') {
              console.warn('WebSpeech notice:', e.error);
            }
          };

          recognition.onend = () => {
            if (isListeningRef.current && recognitionRef.current === recognition) {
              try {
                recognition.start();
              } catch {}
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch {}
      }

      isListeningRef.current = true;
      setCapturingMic(true);
      setListening(true);
    } catch (err: any) {
      console.error('Failed to start audio capture:', err);
      setAudioError(err?.message || 'Could not access the selected browser microphone device');
      if (!displayStreamRef.current) {
        isListeningRef.current = false;
        setListening(false);
      }
    }
  };

  // Capture Microsoft Teams / Browser Tab / Windows System Sound Output directly
  const startTeamsAudioCapture = async () => {
    setAudioError(null);
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        } as any,
        systemAudio: 'include',
      } as any);

      const audioTrack = displayStream.getAudioTracks()[0];
      if (!audioTrack) {
        setAudioError(
          'No audio track shared. In the browser popup, select the Teams/Video tab (or Entire Screen) and check "Also share tab/system audio".'
        );
        displayStream.getTracks().forEach((t) => t.stop());
        return;
      }

      if (displayChunkerRef.current) {
        displayChunkerRef.current.stop();
        displayChunkerRef.current = null;
      }
      if (displayStreamRef.current) {
        displayStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      displayStreamRef.current = displayStream;

      const audioOnlyStream = new MediaStream([audioTrack]);
      const audioCtx = await ensureAudioContext();
      const source = audioCtx.createMediaStreamSource(audioOnlyStream);
      if (analyserRef.current) {
        source.connect(analyserRef.current);
      }

      // Send valid standalone 16kHz WAV speech chunks from captured sound output to /api/transcribe
      displayChunkerRef.current = startWavSpeechChunker({
        audioCtx,
        sourceNode: source,
        onSpeechChunk: (wavBase64) => {
          sendWavToTranscribe(wavBase64, 'interviewer');
        },
      });

      audioTrack.onended = () => {
        if (displayChunkerRef.current) {
          displayChunkerRef.current.stop();
          displayChunkerRef.current = null;
        }
        displayStreamRef.current = null;
        setCapturingSystemAudio(false);
        if (!micStreamRef.current) {
          isListeningRef.current = false;
          setListening(false);
          setAudioVolume(0);
        }
      };

      isListeningRef.current = true;
      setCapturingSystemAudio(true);
      setListening(true);
    } catch (err: any) {
      if (err?.name !== 'NotAllowedError') {
        console.error('Failed to capture browser sound output:', err);
        setAudioError(err?.message || 'Could not capture tab or system audio output.');
      }
      if (!micStreamRef.current) {
        isListeningRef.current = false;
        setListening(false);
      }
    }
  };

  const stopRecording = () => {
    isListeningRef.current = false;
    setCapturingMic(false);
    setCapturingSystemAudio(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (micChunkerRef.current) {
      try {
        micChunkerRef.current.stop();
      } catch {}
      micChunkerRef.current = null;
    }
    if (displayChunkerRef.current) {
      try {
        displayChunkerRef.current.stop();
      } catch {}
      displayChunkerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach((track) => track.stop());
      displayStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioVolume(0);
    setInterimTranscript('');
    setListening(false);
  };

  // Analyze text for question presence and generate answer
  const handleQuestionDetection = async (text: string) => {
    // 1. Instant regex heuristic - 0ms latency!
    const questionRegex = /^(what|how|why|when|where|who|which|can|could|would|should|is|are|do|does|did|tell me|explain|describe)\b|\?|fringe|scared|moment|cavemen/i;
    const isDirectQuestion = questionRegex.test(text.trim()) || text.includes('?');

    if (isDirectQuestion) {
      const detectedQ = addDetectedQuestion({
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        text: text.trim(),
        category: 'qa_technical',
        confidence: 0.98,
        urgency: 'high',
      });

      if (autoAnswerEnabled) {
        triggerAnswerGeneration(detectedQ.text, detectedQ.category);
      }
      return;
    }

    // 2. Fallback to API if ambiguous
    try {
      const detectResult = await geminiClient.detectQuestion({
        transcriptChunk: text,
      });

      if (detectResult.isQuestion && detectResult.confidence >= 0.6) {
        const detectedQ = addDetectedQuestion({
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          text: detectResult.questionText || text,
          category: detectResult.category,
          confidence: detectResult.confidence,
          urgency: detectResult.urgency,
        });

        if (autoAnswerEnabled) {
          triggerAnswerGeneration(detectedQ.text, detectedQ.category);
        }
      }
    } catch (err) {
      console.error('Error during live question detection:', err);
    }
  };

  // Fast-path local QA answer generator (0ms instant response)
  const getFastPathAnswer = (qText: string) => {
    const q = qText.toLowerCase();

    // Freedom! Family Limited / Last employment question
    if (
      q.includes('freedom') ||
      q.includes('family limited') ||
      q.includes('outsource people') ||
      q.includes('finish up') ||
      q.includes('when did you finish') ||
      q.includes('last role') ||
      q.includes('leave your last') ||
      q.includes('end of last september') ||
      q.includes('less of them')
    ) {
      return {
        answer: "I finished my work with Freedom! Family Limited (via The Outsource People) at the end of last September. My last day with the company was at the close of September of this year after successfully delivering our automated test suites.\n\nDuring my engagement at Freedom! Family Limited, I led the QA automation efforts, designing and scaling our Playwright and TypeScript test suites, reducing regression execution cycles, and partnering with developers during sprint planning. Since concluding that engagement at the end of September, I have been actively looking for my next long-term role as a Senior QA Automation Engineer or QA Lead where I can architect robust testing frameworks and drive high quality.",
        keyPoints: [
          "Company: Freedom! Family Limited (via The Outsource People)",
          "Timeline: Completed contract at the end of September of this year",
          "Role: Lead QA Automation Consultant (Playwright, TypeScript, CI/CD gates)",
          "Current Status: Actively interviewing for Senior QA Automation Lead roles with immediate availability"
        ],
        followUpPredictions: [
          "What were your main contributions at Freedom! Family Limited?",
          "What kind of QA culture are you looking for in your next company?"
        ]
      };
    }

    // 0. How many years of QA / automation experience
    if (q.includes('years of') || q.includes('how many years') || q.includes('years experience') || q.includes('experience do you have') || q.includes('years in qa')) {
      return {
        answer: "I have over 14 years of total software quality assurance experience, with more than 11 years dedicated specifically to test automation and SDET leadership.\n\nTo break that down: I spent the first 3 years of my career building a solid foundation in manual exploratory testing, test scenario design, defect lifecycle management, and QA processes. Once I had that groundwork, I transitioned fully into test automation engineering and architecture.\n\nOver the last 11+ years, I've designed and scaled automated testing frameworks from scratch using Playwright with TypeScript, Cypress, Selenium with Java, and API automation tools like RestAssured and Supertest.\n\nIn my recent roles as Senior QA Lead, my day-to-day focus is roughly 80% hands-on automation architecture—building parallel test suites in GitHub Actions with Docker, creating reusable Page Objects and API data seeding utilities, and eliminating flaky tests—and 20% team leadership, mentoring junior SDETs, and driving Three Amigos sessions so developers and QA are aligned before sprint coding begins.",
        keyPoints: [
          "Total QA Experience: 14+ years in software quality engineering and agile delivery",
          "Automation Focus: 11+ years designing and leading test automation frameworks (Playwright, Selenium, Cypress)",
          "Career Path: 3 years manual QA & test design foundation → 11+ years SDET & Automation Lead",
          "Tech Stack: Playwright (TypeScript), Selenium (Java), Cypress (JS), RestAssured, Docker, GitHub Actions CI/CD",
          "Current Split: 80% hands-on automation framework & CI/CD architecture, 20% QA leadership & junior mentoring",
          "Key Metric: Sub-8-minute regression pipelines, 0-tolerance for flakiness, defect leakage < 2%"
        ],
        followUpPredictions: [
          "What is your preference between Playwright and Selenium for new projects?",
          "How do you mentor manual QA engineers into automated SDET roles?"
        ]
      };
    }

    if (q.includes('types of automation') || q.includes('type of automation') || q.includes('categories of automation') || q.includes('levels of automation')) {
      return {
        answer: "In my 14 years of automation engineering experience, I categorize automation into four primary layers based on the Testing Pyramid:\n\n1. API & Service-Level Automation: Validates business logic, microservices, REST/GraphQL endpoints, and database state using Java REST Assured or TypeScript Playwright APIRequestContext. This represents 70-80% of our automated regression because API tests execute 10x faster and never flake on UI rendering.\n\n2. UI / Functional End-to-End Automation: Validates critical user journeys across web and mobile viewports strictly using Playwright/TypeScript with the Page Object Model (POM).\n\n3. Unit & Integration Automation: Written in Jest/JUnit to validate isolated modules and database transactions before code merges.\n\n4. Infrastructure & CI/CD Pipeline Automation: Parallel worker sharding in GitHub Actions using Docker containers with automated failure alerts.",
        keyPoints: [
          "Testing Pyramid: 70% API testing, 20% UI E2E, 10% Exploratory/Manual",
          "API tests execute 10x faster with 0% UI locator flakiness",
          "UI automated with Playwright/TypeScript using Page Object Model",
          "Multi-stage CI/CD pipelines in GitHub Actions with Docker"
        ],
        followUpPredictions: [
          "How do you decide whether a test should be automated at the API or UI level?",
          "What metrics do you use to measure the ROI of your automation framework?"
        ]
      };
    }
    // Which automation frameworks have you worked with
    if (
      q.includes('which automation framework') ||
      q.includes('frameworks have you worked with') ||
      q.includes('frameworks you worked with') ||
      q.includes('which frameworks') ||
      q.includes('what automation frameworks') ||
      q.includes('automation frameworks do you use') ||
      q.includes('frameworks you have worked') ||
      q.includes('chick russell') ||
      q.includes('dilday torre')
    ) {
      return {
        answer: "Throughout my 14+ years in QA and 11+ years dedicated to test automation, I’ve architected, built, and maintained frameworks across three major generations of the automation ecosystem:\n\n1. Playwright with TypeScript (My primary go-to stack for 4+ years): I build modular hybrid frameworks on the Page Object Model (POM), leveraging Playwright's native auto-waiting and WebSocket browser communication. We use API fixtures for background authentication via storageState—eliminating repetitive UI login steps—and run parallel test shards across Docker workers in GitHub Actions for sub-8-minute CI feedback.\n\n2. Selenium WebDriver with Java & TestNG (7+ years enterprise production): Architected robust enterprise frameworks using TestNG, Maven, and Page Factory. I implemented custom ThreadLocal WebDriver management to ensure thread safety across concurrent test threads, with Allure reporting and BrowserStack cross-browser cloud grids.\n\n3. Cypress with JavaScript (2+ years): Used for fast developer-loop integration and frontend component testing directly within React applications.\n\n4. API Automation Frameworks (RestAssured & Supertest): Automated 75% of regression assertions down at the API layer with RestAssured in Java and Supertest/Axios in TypeScript, validating JSON schema contracts and database states in milliseconds.\n\n5. BDD Frameworks (Cucumber with Gherkin): Created clean Gherkin feature files aligned with Three Amigos sprint planning for cross-functional transparency between QA, developers, and product owners.",
        keyPoints: [
          "Playwright + TypeScript (Primary, 4+ yrs): Page Object Model, API fixtures, storageState, Docker CI sharding (<8 min)",
          "Selenium WebDriver + Java (7+ yrs): TestNG, Maven, ThreadLocal concurrency, BrowserStack cloud grid",
          "Cypress + JS: Fast developer-loop component and E2E testing",
          "API Automation: RestAssured (Java) & Supertest (TypeScript) for contract and schema validation",
          "BDD Cucumber: Gherkin Three Amigos alignment with product owners and developers",
          "Framework Governance: Zero-tolerance flaky quarantine and automated CI/CD quality gates"
        ],
        followUpPredictions: [
          "Why did you choose Playwright over Selenium for modern web apps?",
          "How do you structure your Page Object Model with TypeScript?"
        ]
      };
    }
    if (q.includes('framework') || q.includes('architecture') || q.includes('pros and cons')) {
      return {
        answer: "Throughout my 14 years in QA, I have architected enterprise automation frameworks across Selenium/Java and modern Playwright/TypeScript. My standard architecture consists of 4 distinct layers: Page Objects & Component Fragments, API Data Utilities for pre-test data seeding, Custom Fixtures for isolated browser contexts, and CI/CD GitHub Actions sharding.\n\nPROS: Native auto-waiting eliminates 90% of timing flakiness, independent browser contexts prevent state bleed, test velocity is 4x faster than Selenium Grid, and built-in tracing records video and DOM snapshots on failure.\n\nCONS & MITIGATIONS: Requires strict code reviews to ensure junior engineers don't leak business logic into page objects, and async/await requires an initial learning curve for legacy Java engineers.",
        keyPoints: [
          "4-Layer Architecture: Page Objects, API Data Seeding, Custom Auth Fixtures, CI/CD Sharding",
          "Playwright + TypeScript for fast execution and zero Thread.sleep() flakiness",
          "Pros: Native auto-waiting, browser context isolation, 4x faster execution, trace viewer",
          "Trade-offs: Requires architecture discipline in PR reviews"
        ],
        followUpPredictions: [
          "How do you handle authentication state across 100+ parallel tests?",
          "Why choose TypeScript over Python or Java for Playwright?"
        ]
      };
    }
    if (q.includes('agile') || q.includes('collaborat') || q.includes('mentor') || q.includes('process') || q.includes('junior qa') || q.includes('cross-functional') || q.includes('sprint') || q.includes('improving testing')) {
      return {
        answer: "Throughout my 14 years in QA and test automation leadership, I have operated extensively across Agile/Scrum cross-functional engineering teams. My approach focuses on three core pillars:\n\n1. Cross-Functional Developer Collaboration (Shift-Left & Three Amigos): I facilitate 'Three Amigos' sessions with Product Owners and Developers during sprint planning to establish testable Acceptance Criteria and edge cases before code is written. I also pair with developers on API contract design and review unit test coverage in PRs to ensure test pyramid discipline.\n\n2. Improving Testing & CI/CD Processes: Transformed QA from a release-blocking bottleneck into automated continuous quality gates in GitHub Actions. We run parallel Docker smoke tests on every PR (under 8 minutes feedback loop), keep Defect Leakage Rate strictly below 2%, and enforce clear 'Definition of Done' criteria.\n\n3. Mentoring & Elevating Junior QA / SDETs: Mentored 8+ junior and mid-level QA engineers, upskilling manual testers to SDETs capable of writing production-grade Playwright/TypeScript and Selenium/Java frameworks using the Page Object Model. I conduct weekly code reviews and maintain reusable fixtures to accelerate junior velocity while preserving architecture standards.",
        keyPoints: [
          "Agile Shift-Left: Three Amigos sessions, testable acceptance criteria, BDD alignment",
          "Developer Partnership: API contract collaboration, PR review quality gates, 8-minute feedback",
          "Leadership & Mentoring: Upskilled 8+ manual testers to SDETs in Playwright/TypeScript",
          "Process Metrics: Defect leakage < 2%, zero flaky test tolerance, definition of done"
        ],
        followUpPredictions: [
          "How do you handle disagreement with developers over bug severity?",
          "How do you balance sprint automation with exploratory testing?"
        ]
      };
    }
    if (q.includes('flaky') || q.includes('flakiness') || q.includes('unstable') || q.includes('dynamic wait')) {
      return {
        answer: "In senior QA leadership, flaky tests are treated as technical debt that destroys team confidence in CI/CD. I implement a 4-pillar Flakiness Eradication Protocol:\n\n1. Metric Tracking: If a test fails and passes on retry, GitHub Actions tags it as FLAKY and files an engineering ticket.\n2. Quarantining: Flaky tests are immediately removed from the PR-blocking pipeline into a non-blocking Quarantine suite until they pass 50 consecutive runs.\n3. Root Cause Analysis: Replaced hardcoded sleep with web-first assertions (expect(locator).toBeVisible()), isolated test data so parallel threads don't collide on identical DB records, and waited for network idle.\n4. Infrastructure: Dedicated CPU/RAM thresholds in Docker runners to prevent CPU throttling.",
        keyPoints: [
          "Quarantine protocol: Flaky tests removed from PR blocker immediately",
          "Web-first dynamic assertions replace all static sleep calls",
          "Test data isolation using unique UUID customer records per thread",
          "Track flakiness KPI: Must pass 50 consecutive runs to graduate from quarantine"
        ],
        followUpPredictions: [
          "How do you handle third-party service downtime during test execution?",
          "What is your threshold for acceptable test suite pass rates?"
        ]
      };
    }
    return null;
  };

  // Trigger Gemini answer generation with Candidate Profile
  const triggerAnswerGeneration = async (
    question: string,
    category: QuestionCategory = 'general',
    length: ResponseLength = responseLength
  ) => {
    // 1. Instant 0ms Fast-Path Check
    const fastAns = getFastPathAnswer(question);
    if (fastAns) {
      const instantSuggestedAnswer = {
        id: 'fast-ans-' + Date.now(),
        questionId: 'q-' + Date.now(),
        questionText: question,
        category,
        length,
        answer: fastAns.answer,
        keyPoints: fastAns.keyPoints,
        followUpPredictions: fastAns.followUpPredictions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setActiveAnswer(instantSuggestedAnswer);
      setMobileTab('answer');
      setIsGeneratingAnswer(false);

      // Auto-broadcast to clipboard
      try {
        const hudPayload = `[STEALTH_HUD_ANSWER]\nQUESTION:\n"${question}"\n\nRECOMMENDED VERBAL ANSWER (Senior QA Lead):\n${fastAns.answer}\n\nKEY TALKING POINTS:\n${fastAns.keyPoints.map((k: string) => '• ' + k).join('\n')}`;
        navigator.clipboard.writeText(hudPayload).catch(() => {});
      } catch {}
      return;
    }

    setIsGeneratingAnswer(true);
    try {
      const profileContext = getProfileSummaryForPrompt();
      const conversationContext = transcripts
        .slice(-5)
        .map((t) => `${t.speaker.toUpperCase()}: ${t.text}`)
        .join('\n');

      const ans = await geminiClient.generateAnswer({
        question,
        category,
        length,
        profileContext,
        conversationContext,
      });

      setActiveAnswer(ans);
      setMobileTab('answer');

      // Auto-broadcast live answers to Native Stealth HUD via clipboard bridge
      try {
        const hudPayload = `[STEALTH_HUD_ANSWER]\nQUESTION:\n"${question}"\n\nRECOMMENDED VERBAL ANSWER (Senior QA Lead):\n${ans.answer}\n\nKEY TALKING POINTS:\n${(ans.keyPoints || []).map((k: string) => '• ' + k).join('\n')}${ans.codeSnippet ? `\n\nCODE IMPLEMENTATION:\n${ans.codeSnippet}` : ''}`;
        navigator.clipboard.writeText(hudPayload).catch(() => {});
      } catch {
        // ignore clipboard error in background
      }
    } catch (err: any) {
      console.error('Answer generation failed:', err);
    } finally {
      setIsGeneratingAnswer(false);
    }
  };

  const handleManualQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const qText = manualInput.trim();
    setManualInput('');

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    addTranscriptItem({
      timestamp: now,
      speaker: 'interviewer',
      text: qText,
      isQuestion: true,
    });

    const detectedQ = addDetectedQuestion({
      timestamp: now,
      text: qText,
      category: 'general',
      confidence: 1.0,
      urgency: 'high',
    });

    triggerAnswerGeneration(detectedQ.text, detectedQ.category);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const transferCodeToWorkspace = (code: string) => {
    addTab('SuggestedSolution.ts', 'typescript', code);
    setCurrentTab('workspace');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-950">
      {/* Control Bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Microphone Input Start / Stop Toggle */}
          <button
            onClick={() => (isListening ? stopRecording() : startRecording())}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition-all shadow-sm cursor-pointer ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Stop Listening</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Start Mic</span>
              </>
            )}
          </button>

          {/* Capture System / Teams Sound Output Button (Always available even while Mic is running) */}
          <button
            onClick={startTeamsAudioCapture}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition-all shadow-sm cursor-pointer border ${
              capturingSystemAudio
                ? 'bg-emerald-700 text-white border-emerald-400'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
            }`}
            title="Capture digital sound output from a browser tab (Teams / Meet / Video) or entire Windows system audio"
          >
            <Headphones className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-100" />
            <span>{capturingSystemAudio ? 'System Audio Active' : 'Capture System / Tab Audio'}</span>
          </button>

          {/* Browser Audio Input & Output Device Selector Button */}
          <button
            onClick={() => {
              const next = !showDeviceModal;
              setShowDeviceModal(next);
              if (next) loadAudioDevices(true);
            }}
            className="px-2.5 sm:px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 sm:gap-2 transition-colors max-w-[200px] sm:max-w-xs cursor-pointer"
            title={`Mic: ${audioInputName} | Output: ${audioOutputName}`}
          >
            <Radio className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">{capturingSystemAudio ? `Out: ${audioOutputName}` : audioInputName}</span>
            <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
          </button>

          {/* Live Volume Meter */}
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
            <Volume2 className={`w-3.5 h-3.5 ${isTranscribingChunk ? 'text-indigo-400 animate-pulse' : 'text-slate-400'}`} />
            <div className="w-12 sm:w-16 h-2 bg-slate-800 rounded-full overflow-hidden flex items-center">
              <div
                className={`h-full transition-all duration-75 ${
                  audioVolume > 60 ? 'bg-amber-400' : 'bg-emerald-500'
                }`}
                style={{ width: `${audioVolume}%` }}
              />
            </div>
            <span className="text-[10px] font-mono tabular-nums text-slate-400 w-7">
              {isTranscribingChunk ? 'AI..' : `${audioVolume}%`}
            </span>
          </div>
        </div>

        {/* Right side controls: Response Length & Clear */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Response Length Segmented Control */}
          <div className="flex items-center gap-1 p-0.5 sm:p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            {(['short', 'standard', 'detailed'] as ResponseLength[]).map((len) => (
              <button
                key={len}
                onClick={() => {
                  setResponseLength(len);
                  if (activeAnswer) {
                    triggerAnswerGeneration(activeAnswer.questionText, activeAnswer.category, len);
                  }
                }}
                className={`px-2 sm:px-2.5 py-1 rounded-md capitalize font-medium text-[11px] sm:text-xs transition-colors ${
                  responseLength === len
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {len}
              </button>
            ))}
          </div>

          {/* Auto Answer Toggle */}
          <button
            onClick={() => setAutoAnswerEnabled(!autoAnswerEnabled)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium border transition-colors ${
              autoAnswerEnabled
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Automatically generate answers when interviewer questions are detected"
          >
            Auto: {autoAnswerEnabled ? 'ON' : 'OFF'}
          </button>

          {/* Clear Session */}
          <button
            onClick={clearSession}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
            title="Clear Current Session Transcript"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Screen Segmented Tab Switcher */}
      <div className="lg:hidden flex border-b border-slate-800 bg-slate-900/90 px-3 py-1.5 shrink-0">
        <div className="flex w-full rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setMobileTab('transcript')}
            className={`flex-1 py-1.5 rounded-md text-center transition-colors ${
              mobileTab === 'transcript' ? 'bg-indigo-600 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Transcript ({transcripts.length})
          </button>
          <button
            onClick={() => setMobileTab('answer')}
            className={`flex-1 py-1.5 rounded-md text-center transition-colors flex items-center justify-center gap-1.5 ${
              mobileTab === 'answer' ? 'bg-indigo-600 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Suggested Answer</span>
            {activeAnswer && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Device Selection Dropdown Modal */}
      {showDeviceModal && (
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col gap-3 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Browser Microphone Input & Sound Output Devices</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadAudioDevices(true)}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 normal-case font-medium cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Browser Devices</span>
              </button>
              <button onClick={() => setShowDeviceModal(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                Close
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-1">
            {/* Microphone Inputs */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-indigo-400" />
                <span>Microphone Input (Selected by Browser)</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto">
                {availableDevices.map((dev) => (
                  <button
                    key={dev.id}
                    onClick={() => {
                      setAudioDevice(dev.id, dev.label);
                      if (capturingMic) {
                        startRecording(dev.id, dev.label);
                      }
                    }}
                    className={`p-2.5 rounded-lg text-left text-xs border transition-colors flex items-center justify-between cursor-pointer ${
                      selectedAudioDeviceId === dev.id
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{dev.label}</span>
                    {selectedAudioDeviceId === dev.id && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Audio Outputs */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Speaker className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sound Audio Output (Speakers / Headphones)</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto">
                {availableOutputs.map((out) => (
                  <button
                    key={out.id}
                    onClick={() => {
                      setAudioOutputDevice(out.id, out.label);
                    }}
                    className={`p-2.5 rounded-lg text-left text-xs border transition-colors flex items-center justify-between cursor-pointer ${
                      selectedAudioOutputId === out.id
                        ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{out.label}</span>
                    {selectedAudioOutputId === out.id && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-emerald-400">
              How to transcribe Browser Sound Output (Teams / Chrome Video) & Microphone:
            </p>
            <p className="text-slate-300">
              • To transcribe the other speaker from Teams, Meet, or a browser video playing on <strong className="text-white">{audioOutputName}</strong>, click <strong className="text-emerald-300">"Capture System / Tab Audio"</strong> and check <strong className="text-white">"Also share tab audio"</strong> (or choose Entire Screen + <strong className="text-white">"Also share system audio"</strong>).
            </p>
            <p className="text-slate-300">
              • Both Microphone Input and System/Tab Sound Output can run simultaneously and transcribe via 16kHz PCM WAV speech capture.
            </p>
          </div>
        </div>
      )}

      {audioError && (
        <div className="bg-rose-950/60 border-b border-rose-800/80 px-6 py-2.5 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{audioError}</span>
        </div>
      )}

      {/* Main Split Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Live Transcript & Question Stream (5 cols) */}
        <div
          className={`lg:col-span-5 border-r border-slate-800/80 flex-col overflow-hidden bg-slate-950 ${
            mobileTab === 'transcript' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="px-4 py-3 border-b border-slate-800/70 bg-slate-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Live Conversation Transcript</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {transcripts.length} entries
            </span>
          </div>

          {/* Transcript Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans">
            {transcripts.length === 0 && !interimTranscript ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                <Mic className="w-8 h-8 text-slate-600" />
                <p className="text-xs">No audio transcribed yet.</p>
                <p className="text-[11px] text-slate-600 max-w-xs">
                  Click "Start Audio Capture" above or type a question below to test live assistance.
                </p>
              </div>
            ) : (
              transcripts.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border text-xs leading-relaxed transition-all ${
                    item.isQuestion
                      ? 'bg-indigo-950/30 border-indigo-800/40 text-slate-200'
                      : item.speaker === 'interviewer'
                      ? 'bg-slate-900/70 border-slate-800 text-slate-300'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                    <span className="capitalize font-semibold text-slate-400">
                      {item.speaker === 'interviewer' ? 'Interviewer' : 'You (Candidate)'}
                    </span>
                    <span>{item.timestamp}</span>
                  </div>
                  <p>{item.text}</p>

                  {item.isQuestion && (
                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-[10px] text-indigo-400 font-mono">
                        Question Detected
                      </span>
                      <button
                        onClick={() => triggerAnswerGeneration(item.text)}
                        className="text-[11px] text-indigo-300 hover:text-white font-medium flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span>Generate Answer</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Interim live speech chunk */}
            {interimTranscript && (
              <div className="p-3 rounded-lg bg-slate-900/30 border border-slate-800/40 text-xs italic text-slate-400 animate-pulse">
                <span className="text-[10px] font-mono text-indigo-400 block mb-0.5">Speaking...</span>
                "{interimTranscript}"
              </div>
            )}
          </div>

          {/* Manual Input Bar */}
          <form
            onSubmit={handleManualQuestionSubmit}
            className="p-3 border-t border-slate-800/80 bg-slate-900/40 flex items-center gap-2"
          >
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Type or paste interviewer question..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition-colors"
              title="Submit Question"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Right Column: AI Answer Engine & Key Talking Points (7 cols) */}
        <div
          className={`lg:col-span-7 flex-col overflow-hidden bg-slate-950 ${
            mobileTab === 'answer' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="px-5 py-3 border-b border-slate-800/70 bg-slate-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Suggested Response & Key Talking Points</span>
            </div>
            {activeAnswer && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerAnswerGeneration(activeAnswer.questionText, activeAnswer.category, responseLength)}
                  disabled={isGeneratingAnswer}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 flex items-center gap-1 transition-colors"
                  title="Regenerate Answer"
                >
                  <RefreshCw className={`w-3 h-3 ${isGeneratingAnswer ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>
                <button
                  onClick={() => copyToClipboard(activeAnswer.answer)}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Answer Content */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {isGeneratingAnswer ? (
              <div className="h-64 flex flex-col items-center justify-center space-y-3 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                <div className="text-xs font-medium">Formulating grounded response...</div>
                <div className="text-[11px] text-slate-500">
                  Retrieving 14+ years QA Automation Lead context & calculating talking points
                </div>
              </div>
            ) : !activeAnswer ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-4">
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-indigo-400 border border-slate-800">
                  <Mic className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-200">Ready for Live Interview</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Click <strong className="text-white">"Start Audio"</strong> in the top toolbar to begin listening. As your interviewer speaks, questions are auto-detected and personalized answers appear here instantly.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={loadDemoData}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-indigo-300 hover:text-white border border-slate-700/80 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Load Sample Q&A Demo</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Active Question Banner */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-indigo-400 uppercase">
                    <div className="flex items-center gap-2">
                      <span>Target Question</span>
                      {activeAnswer.id.startsWith('ans-demo') && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 lowercase">
                          sample demo preview
                        </span>
                      )}
                    </div>
                    <span className="capitalize">{activeAnswer.category.replace('_', ' ')}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">
                    "{activeAnswer.questionText}"
                  </h3>
                </div>

                {/* 1. Quick Glancable Talking Points (High information density for speaking) */}
                {activeAnswer.keyPoints && activeAnswer.keyPoints.length > 0 && (
                  <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/40 space-y-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-semibold block">
                      Quick Talking Points (Glance While Speaking)
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-200">
                      {activeAnswer.keyPoints.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 2. Full First-Person Spoken Answer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                      Recommended Spoken Answer ({activeAnswer.length})
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      First-person Senior QA Lead voice
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-sm leading-relaxed text-slate-200 select-text">
                    {activeAnswer.answer}
                  </div>
                </div>

                {/* 3. STAR Breakdown if applicable */}
                {activeAnswer.starMethod && (
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-3">
                    <span className="text-xs font-mono uppercase text-slate-400 font-semibold block">
                      STAR Method Breakdown
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/70">
                        <span className="text-indigo-400 font-semibold block mb-0.5">S · Situation</span>
                        <p className="text-slate-300 text-[11px]">{activeAnswer.starMethod.situation}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/70">
                        <span className="text-indigo-400 font-semibold block mb-0.5">T · Task</span>
                        <p className="text-slate-300 text-[11px]">{activeAnswer.starMethod.task}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/70">
                        <span className="text-indigo-400 font-semibold block mb-0.5">A · Action</span>
                        <p className="text-slate-300 text-[11px]">{activeAnswer.starMethod.action}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/70">
                        <span className="text-indigo-400 font-semibold block mb-0.5">R · Result</span>
                        <p className="text-slate-300 text-[11px]">{activeAnswer.starMethod.result}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Code Snippet if applicable */}
                {activeAnswer.codeSnippet && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase text-slate-400 font-semibold">
                        Technical Code Solution
                      </span>
                      <button
                        onClick={() => transferCodeToWorkspace(activeAnswer.codeSnippet!)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                      >
                        <Code className="w-3.5 h-3.5" />
                        <span>Open in Code Workspace</span>
                      </button>
                    </div>
                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
                      <code>{activeAnswer.codeSnippet}</code>
                    </pre>
                  </div>
                )}

                {/* 5. Predicted Follow-up Questions */}
                {activeAnswer.followUpPredictions && activeAnswer.followUpPredictions.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 space-y-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                      Likely Interviewer Follow-Up Questions
                    </span>
                    <div className="space-y-1.5">
                      {activeAnswer.followUpPredictions.map((fu, i) => (
                        <div
                          key={i}
                          onClick={() => triggerAnswerGeneration(fu)}
                          className="p-2 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800/80 text-xs text-slate-300 hover:text-white cursor-pointer transition-colors flex items-center justify-between group"
                        >
                          <span className="truncate">{fu}</span>
                          <Sparkles className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
