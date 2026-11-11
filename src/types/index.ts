export type NavigationTab =
  | 'dashboard'
  | 'live'
  | 'coding'
  | 'screenshot'
  | 'practice'
  | 'resume'
  | 'library'
  | 'history'
  | 'workspace'
  | 'aiconfig'
  | 'settings';

export type QuestionCategory =
  | 'general'
  | 'qa_technical'
  | 'automation'
  | 'programming'
  | 'database'
  | 'api_testing'
  | 'behavioral'
  | 'scenario';

export type ResponseLength = 'short' | 'standard' | 'detailed';

export interface EmploymentRecord {
  company: string;
  role: string;
  period: string;
  highlights: string[];
}

export interface ProfessionalProfile {
  id: string;
  name: string;
  title: string;
  yearsExperience: number;
  automationExperience: number;
  summary: string;
  positioning: string;
  programmingLanguages: string[];
  automationFrameworks: string[];
  testTools: string[];
  databases: string[];
  testingTypes: string[];
  employmentHistory: EmploymentRecord[];
  education: string[];
  certifications: string[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
    outcomes: string;
  }[];
}

export interface TranscriptItem {
  id: string;
  timestamp: string;
  speaker: 'interviewer' | 'candidate';
  text: string;
  isQuestion?: boolean;
}

export interface DetectedQuestion {
  id: string;
  timestamp: string;
  text: string;
  category: QuestionCategory;
  confidence: number;
  urgency: 'high' | 'normal';
  suggestedAnswer?: SuggestedAnswer;
}

export interface StarMethod {
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface SuggestedAnswer {
  id: string;
  questionId: string;
  questionText: string;
  category: QuestionCategory;
  length: ResponseLength;
  answer: string;
  keyPoints: string[];
  starMethod?: StarMethod;
  followUpPredictions: string[];
  codeSnippet?: string;
  timestamp: string;
}

export interface CodingSolution {
  problemUnderstanding: string;
  approach: string;
  code: string;
  language: string;
  explanation: string;
  timeComplexity: string;
  spaceComplexity: string;
  testCases: { input: string; expected: string; explanation: string }[];
  edgeCases: string[];
  alternativeApproaches?: string[];
}

export interface ScreenshotAnalysis {
  id: string;
  imageUrl: string;
  timestamp: string;
  extractedQuestion: string;
  questionCategory: string;
  identifiedLanguage?: string;
  suggestedSolution: string;
  explanation: string;
  testCases?: string[];
  confidence: number;
  uncertaintyNotes?: string;
}

export interface PracticeQuestion {
  id: string;
  prompt: string;
  category: QuestionCategory;
  context?: string;
  userAnswer?: string;
  feedback?: PracticeFeedback;
}

export interface PracticeFeedback {
  score: number; // 0-100
  accuracy: number;
  relevance: number;
  technicalDepth: number;
  communication: number;
  clarity: number;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
}

export interface PracticeSession {
  id: string;
  title: string;
  jobPosition: string;
  company: string;
  difficulty: 'Junior' | 'Mid-Level' | 'Senior' | 'Lead / Architect';
  technologies: string[];
  questions: PracticeQuestion[];
  currentQuestionIndex: number;
  status: 'configured' | 'in_progress' | 'completed';
  createdAt: string;
}

export interface SavedQuestion {
  id: string;
  title: string;
  category: QuestionCategory;
  technology: string;
  question: string;
  answer: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Senior' | 'Lead / Architect';
  tags: string[];
  isFavorite: boolean;
  notes?: string;
}

export interface InterviewSessionHistory {
  id: string;
  date: string;
  jobPosition: string;
  company: string;
  interviewType: string;
  durationMinutes: number;
  transcripts: TranscriptItem[];
  detectedQuestions: DetectedQuestion[];
  answers: SuggestedAnswer[];
  notes: string;
}

export interface AIConfiguration {
  preferredModel: string;
  defaultResponseLength: ResponseLength;
  responseStyle: 'conversational' | 'concise' | 'technical';
  creativityLevel: number;
  timeoutMs: number;
}
