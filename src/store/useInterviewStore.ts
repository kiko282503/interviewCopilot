import { create } from 'zustand';
import type {
  DetectedQuestion,
  InterviewSessionHistory,
  ResponseLength,
  SuggestedAnswer,
  TranscriptItem,
} from '../types';

const SESSION_HISTORY_STORAGE_KEY = 'interview-copilot-session-history-v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTranscriptItem(value: unknown): value is TranscriptItem {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.timestamp === 'string' &&
    (value.speaker === 'interviewer' || value.speaker === 'candidate') &&
    typeof value.text === 'string' &&
    (value.isQuestion === undefined || typeof value.isQuestion === 'boolean')
  );
}

function isQuestionCategory(value: unknown): boolean {
  return [
    'general',
    'qa_technical',
    'automation',
    'programming',
    'database',
    'api_testing',
    'behavioral',
    'scenario',
  ].some((category) => category === value);
}

function isDetectedQuestion(value: unknown): value is DetectedQuestion {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.timestamp === 'string' &&
    typeof value.text === 'string' &&
    isQuestionCategory(value.category) &&
    typeof value.confidence === 'number' &&
    Number.isFinite(value.confidence) &&
    (value.urgency === 'high' || value.urgency === 'normal') &&
    (value.suggestedAnswer === undefined || isSuggestedAnswer(value.suggestedAnswer))
  );
}

function isStarMethod(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.situation === 'string' &&
    typeof value.task === 'string' &&
    typeof value.action === 'string' &&
    typeof value.result === 'string'
  );
}

function isSuggestedAnswer(value: unknown): value is SuggestedAnswer {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.questionId === 'string' &&
    typeof value.questionText === 'string' &&
    isQuestionCategory(value.category) &&
    (value.length === 'short' || value.length === 'standard' || value.length === 'detailed') &&
    typeof value.answer === 'string' &&
    Array.isArray(value.keyPoints) &&
    value.keyPoints.every((item) => typeof item === 'string') &&
    Array.isArray(value.followUpPredictions) &&
    value.followUpPredictions.every((item) => typeof item === 'string') &&
    typeof value.timestamp === 'string' &&
    (value.codeSnippet === undefined || typeof value.codeSnippet === 'string') &&
    (value.starMethod === undefined || isStarMethod(value.starMethod))
  );
}

function isInterviewSessionHistory(value: unknown): value is InterviewSessionHistory {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.date === 'string' &&
    !Number.isNaN(Date.parse(value.date)) &&
    typeof value.jobPosition === 'string' &&
    typeof value.company === 'string' &&
    typeof value.interviewType === 'string' &&
    typeof value.durationMinutes === 'number' &&
    Number.isFinite(value.durationMinutes) &&
    value.durationMinutes >= 0 &&
    Array.isArray(value.transcripts) &&
    value.transcripts.every(isTranscriptItem) &&
    Array.isArray(value.detectedQuestions) &&
    value.detectedQuestions.every(isDetectedQuestion) &&
    Array.isArray(value.answers) &&
    value.answers.every(isSuggestedAnswer) &&
    typeof value.notes === 'string'
  );
}

function loadSessionHistory(): {
  sessions: InterviewSessionHistory[];
  error: string | null;
} {
  if (typeof window === 'undefined') {
    return { sessions: [], error: null };
  }

  try {
    const saved = window.localStorage.getItem(SESSION_HISTORY_STORAGE_KEY);
    if (!saved) return { sessions: [], error: null };

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(isInterviewSessionHistory)) {
      return { sessions: [], error: 'Saved session history is invalid and could not be loaded.' };
    }

    return { sessions: parsed, error: null };
  } catch (error) {
    const detail = error instanceof Error ? ` ${error.message}` : '';
    return { sessions: [], error: `Could not load saved session history.${detail}` };
  }
}

interface InterviewState {
  isListening: boolean;
  selectedAudioDeviceId: string;
  audioInputName: string;
  selectedAudioOutputId: string;
  audioOutputName: string;
  audioVolume: number;
  transcripts: TranscriptItem[];
  detectedQuestions: DetectedQuestion[];
  activeAnswer: SuggestedAnswer | null;
  answerHistory: SuggestedAnswer[];
  responseLength: ResponseLength;
  autoAnswerEnabled: boolean;
  isGeneratingAnswer: boolean;
  isDetectingQuestion: boolean;
  interimTranscript: string;
  activeSessionStartTime: number | null;
  sessionFinalized: boolean;
  completedSessions: InterviewSessionHistory[];
  sessionHistoryError: string | null;
  
  // Actions
  setListening: (listening: boolean) => void;
  setAudioDevice: (id: string, name: string) => void;
  setAudioOutputDevice: (id: string, name: string) => void;
  setAudioVolume: (vol: number) => void;
  setInterimTranscript: (text: string) => void;
  addTranscriptItem: (item: Omit<TranscriptItem, 'id'>) => void;
  addDetectedQuestion: (q: Omit<DetectedQuestion, 'id'>) => DetectedQuestion;
  setActiveAnswer: (ans: SuggestedAnswer | null) => void;
  setResponseLength: (len: ResponseLength) => void;
  setAutoAnswerEnabled: (enabled: boolean) => void;
  setIsGeneratingAnswer: (generating: boolean) => void;
  clearSession: () => void;
  loadDemoData: () => void;
}

const savedHistory = loadSessionHistory();

export const useInterviewStore = create<InterviewState>((set, get) => ({
  isListening: false,
  selectedAudioDeviceId: 'default',
  audioInputName: 'Browser Default Microphone',
  selectedAudioOutputId: 'default',
  audioOutputName: 'Browser Default Output (Speakers)',
  audioVolume: 0,
  transcripts: [],
  detectedQuestions: [],
  activeAnswer: null,
  answerHistory: [],
  responseLength: 'standard',
  autoAnswerEnabled: true,
  isGeneratingAnswer: false,
  isDetectingQuestion: false,
  interimTranscript: '',
  activeSessionStartTime: null,
  sessionFinalized: false,
  completedSessions: savedHistory.sessions,
  sessionHistoryError: savedHistory.error,

  setListening: (listening) => {
    const state = get();
    if (listening) {
      if (state.isListening) return;
      set({
        isListening: true,
        activeSessionStartTime: state.activeSessionStartTime ?? Date.now(),
        sessionFinalized: false,
        ...(state.sessionFinalized
          ? {
              transcripts: [],
              detectedQuestions: [],
              activeAnswer: null,
              answerHistory: [],
              interimTranscript: '',
            }
          : {}),
      });
      return;
    }

    if (!state.isListening) return;

    const hasContent =
      state.transcripts.length > 0 ||
      state.detectedQuestions.length > 0 ||
      state.answerHistory.length > 0;
    let completedSessions = state.completedSessions;
    let sessionHistoryError = state.sessionHistoryError;

    if (state.activeSessionStartTime !== null && hasContent) {
      const session: InterviewSessionHistory = {
        id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date: new Date(state.activeSessionStartTime).toISOString(),
        jobPosition: 'Live session',
        company: '',
        interviewType: 'Live interview',
        durationMinutes: Math.max(
          1,
          Math.round((Date.now() - state.activeSessionStartTime) / 60000)
        ),
        transcripts: state.transcripts,
        detectedQuestions: state.detectedQuestions,
        answers: state.answerHistory,
        notes: '',
      };
      completedSessions = [session, ...state.completedSessions];

      try {
        if (typeof window === 'undefined') {
          throw new Error('Persistent browser storage is unavailable.');
        }
        window.localStorage.setItem(
          SESSION_HISTORY_STORAGE_KEY,
          JSON.stringify(completedSessions)
        );
        sessionHistoryError = null;
      } catch (error) {
        const detail = error instanceof Error ? ` ${error.message}` : '';
        sessionHistoryError = `Session was saved for this run but could not be written to local storage.${detail}`;
      }
    }

    set({
      isListening: false,
      activeSessionStartTime: null,
      sessionFinalized: true,
      completedSessions,
      sessionHistoryError,
    });
  },
  setAudioDevice: (id, name) => set({ selectedAudioDeviceId: id, audioInputName: name }),
  setAudioOutputDevice: (id, name) => set({ selectedAudioOutputId: id, audioOutputName: name }),
  setAudioVolume: (vol) => set({ audioVolume: vol }),
  setInterimTranscript: (text) => set({ interimTranscript: text }),
  addTranscriptItem: (item) => {
    const newItem: TranscriptItem = {
      ...item,
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    };
    set((state) => ({
      transcripts: [...state.transcripts, newItem],
    }));
  },
  addDetectedQuestion: (q) => {
    const newQ: DetectedQuestion = {
      ...q,
      id: 'dq-' + Date.now(),
    };
    set((state) => ({
      detectedQuestions: [newQ, ...state.detectedQuestions],
    }));
    return newQ;
  },
  setActiveAnswer: (ans) =>
    set((state) => {
      const history = ans ? [ans, ...state.answerHistory.slice(0, 19)] : state.answerHistory;
      return { activeAnswer: ans, answerHistory: history };
    }),
  setResponseLength: (len) => set({ responseLength: len }),
  setAutoAnswerEnabled: (enabled) => set({ autoAnswerEnabled: enabled }),
  setIsGeneratingAnswer: (generating) => set({ isGeneratingAnswer: generating }),
  clearSession: () =>
    set({
      transcripts: [],
      detectedQuestions: [],
      activeAnswer: null,
      interimTranscript: '',
      activeSessionStartTime: get().isListening ? Date.now() : null,
      sessionFinalized: false,
    }),
  loadDemoData: () =>
    set({
      transcripts: [
        {
          id: 'tx-demo-1',
          timestamp: '10:02:15',
          speaker: 'interviewer',
          text: 'Thanks for taking the time today. Could you walk me through your background and how you approach building an automation framework from scratch?',
          isQuestion: true,
        },
        {
          id: 'tx-demo-2',
          timestamp: '10:02:40',
          speaker: 'candidate',
          text: 'Certainly. Over my 14 years in QA, with 11 specialized in automation...',
        },
      ],
      detectedQuestions: [
        {
          id: 'dq-demo-1',
          timestamp: '10:02:15',
          text: 'Could you walk me through your background and how you approach building an automation framework from scratch?',
          category: 'automation',
          confidence: 0.98,
          urgency: 'high',
        },
      ],
      activeAnswer: {
        id: 'ans-demo-1',
        questionId: 'dq-demo-1',
        questionText: 'Could you walk me through your background and how you approach building an automation framework from scratch?',
        category: 'automation',
        length: 'standard',
        answer: "With 14 years in QA and 11 focused on test automation, I approach framework architecture from a business-first and maintainability perspective. I start by evaluating the application's technology stack—such as choosing Playwright with TypeScript for modern fast-executing web apps or Selenium WebDriver with Java for established enterprise ecosystems. I implement a strict Page Object Model with encapsulated locators and explicit smart wait strategies to prevent flaky tests. From day one, I configure a Maven or npm dependency structure, integrate TestNG or Cucumber for readable specifications, and embed automated smoke and regression gates directly into the Jenkins CI/CD pipeline.",
        keyPoints: [
          'Evaluate tech stack: Playwright (TS) for speed or Selenium (Java) for enterprise.',
          'Enforce Page Object Model with centralized explicit wait strategies.',
          'Integrate into Jenkins CI/CD pipeline with auto-reporting from day one.',
          'Design test data isolation and reusable utility modules.',
        ],
        starMethod: {
          situation: 'In my role leading automation at Enterprise Cloud Technologies...',
          task: 'We needed to replace legacy brittle scripts with a maintainable zero-flake framework.',
          action: 'I architected a modular Playwright + TypeScript framework using Page Object Model, custom retry handlers, and Jenkins multibranch pipelines.',
          result: 'Reduced overall regression cycle by 65% and attained 99.4% test reliability across 450+ test suites.',
        },
        followUpPredictions: [
          'How do you handle dynamic AJAX elements and avoid Thread.sleep?',
          'What is your approach to test data management in parallel execution?',
          'How do you convince development teams to adhere to testability standards?',
        ],
        timestamp: '10:02:22',
      },
    }),
}));
