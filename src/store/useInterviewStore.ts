import { create } from 'zustand';
import { TranscriptItem, DetectedQuestion, SuggestedAnswer, ResponseLength } from '../types';

interface InterviewState {
  isListening: boolean;
  selectedAudioDeviceId: string;
  audioInputName: string;
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
  
  // Actions
  setListening: (listening: boolean) => void;
  setAudioDevice: (id: string, name: string) => void;
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

export const useInterviewStore = create<InterviewState>((set, get) => ({
  isListening: false,
  selectedAudioDeviceId: 'default',
  audioInputName: 'Default Microphone (Realtek Audio)',
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
  activeSessionStartTime: Date.now(),

  setListening: (listening) =>
    set({
      isListening: listening,
      activeSessionStartTime: listening ? Date.now() : get().activeSessionStartTime,
    }),
  setAudioDevice: (id, name) => set({ selectedAudioDeviceId: id, audioInputName: name }),
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
      activeSessionStartTime: Date.now(),
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
