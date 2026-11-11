import {
  SuggestedAnswer,
  DetectedQuestion,
  CodingSolution,
  ScreenshotAnalysis,
  ProfessionalProfile,
  PracticeFeedback,
  ResponseLength,
  QuestionCategory,
} from '../types';

export const geminiClient = {
  // Check system and API status
  async getSystemStatus(): Promise<{
    hasApiKey: boolean;
    preferredModel: string;
    serverTime: string;
    status: string;
    version: string;
  }> {
    try {
      const res = await fetch('/api/system/status');
      return await res.json();
    } catch (err) {
      return {
        hasApiKey: false,
        preferredModel: 'gemini-3.8-flash',
        serverTime: new Date().toISOString(),
        status: 'offline',
        version: '1.0.0',
      };
    }
  },

  // 1. Generate live interview answer
  async generateAnswer(params: {
    question: string;
    category?: QuestionCategory;
    length?: ResponseLength;
    profileContext?: string;
    conversationContext?: string;
  }): Promise<SuggestedAnswer> {
    const res = await fetch('/api/gemini/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || 'Failed to generate answer');
    }

    const data = await res.json();
    return {
      id: 'ans-' + Date.now(),
      questionId: 'q-' + Date.now(),
      questionText: params.question,
      category: params.category || 'general',
      length: params.length || 'standard',
      answer: data.answer || '',
      keyPoints: data.keyPoints || [],
      starMethod: data.starMethod,
      followUpPredictions: data.followUpPredictions || [],
      codeSnippet: data.codeSnippet,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  },

  // 2. Detect questions from live transcript
  async detectQuestion(params: {
    transcriptChunk: string;
    conversationHistory?: string;
  }): Promise<{
    isQuestion: boolean;
    questionText: string;
    category: QuestionCategory;
    urgency: 'high' | 'normal';
    confidence: number;
  }> {
    const res = await fetch('/api/gemini/detect-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      return {
        isQuestion: false,
        questionText: '',
        category: 'general',
        urgency: 'normal',
        confidence: 0,
      };
    }

    return await res.json();
  },

  // 3. AI Coding Assistant
  async solveCodingProblem(params: {
    problemText: string;
    language?: string;
    mode?: 'quick' | 'detailed' | 'interview' | 'optimized' | 'debugging';
    context?: string;
  }): Promise<CodingSolution> {
    const res = await fetch('/api/gemini/code-solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Coding solver failed' }));
      throw new Error(err.error || 'Failed to solve coding problem');
    }

    return await res.json();
  },

  // 4. Multimodal Screenshot Analyzer
  async analyzeScreenshot(params: {
    imageBase64: string;
    mimeType?: string;
    additionalPrompt?: string;
  }): Promise<ScreenshotAnalysis> {
    const res = await fetch('/api/gemini/analyze-screenshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Screenshot analysis failed' }));
      throw new Error(err.error || 'Failed to analyze screenshot');
    }

    const data = await res.json();
    return {
      id: 'ss-' + Date.now(),
      imageUrl: params.imageBase64,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      extractedQuestion: data.extractedQuestion || '',
      questionCategory: data.questionCategory || 'Technical Assessment',
      identifiedLanguage: data.identifiedLanguage,
      suggestedSolution: data.suggestedSolution || '',
      explanation: data.explanation || '',
      testCases: data.testCases,
      confidence: data.confidence || 0.95,
      uncertaintyNotes: data.uncertaintyNotes,
    };
  },

  // 5. Parse Resume Document
  async parseResume(params: {
    documentText?: string;
    documentBase64?: string;
    mimeType?: string;
    fileName?: string;
  }): Promise<Partial<ProfessionalProfile>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch('/api/gemini/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Resume parse failed' }));
        throw new Error(err.error || 'Failed to parse resume');
      }

      return await res.json();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Upload timed out. The server or connection took too long. Please paste your resume text directly into the box below.');
      }
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        throw new Error('Connection lost while uploading document. If your file is large or network is unstable, copy & paste your resume text below for 100% reliable parsing.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  // 6. Practice Interview Evaluator
  async evaluatePracticeAnswer(params: {
    questionPrompt: string;
    candidateAnswer: string;
    targetRole?: string;
    difficulty?: string;
  }): Promise<PracticeFeedback> {
    const res = await fetch('/api/gemini/practice-evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Practice evaluation failed' }));
      throw new Error(err.error || 'Failed to evaluate response');
    }

    return await res.json();
  },

  // 7. Safe Sandboxed Code Runner
  async executeCode(code: string, language: string = 'javascript'): Promise<{
    success: boolean;
    output: string;
    errors: string | null;
    executionTimeMs: number;
  }> {
    const res = await fetch('/api/code/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Code execution failed' }));
      throw new Error(err.error || 'Execution failed');
    }

    return await res.json();
  },
};
