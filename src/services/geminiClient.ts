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

export async function safeParseJsonResponse<T = any>(res: Response, fallbackError: string): Promise<T> {
  const raw = await res.text();
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith('<')) {
    const err = new Error(
      res.ok ? 'Server reconnecting — retrying shortly.' : `${fallbackError} (HTTP ${res.status})`
    ) as Error & { status?: number; isHtml?: boolean };
    err.status = res.status;
    err.isHtml = true;
    throw err;
  }
  let data: any;
  try {
    data = JSON.parse(trimmed);
  } catch {
    throw new Error(`${fallbackError} (Invalid JSON response)`);
  }
  if (!res.ok) {
    const err = new Error(data?.error || `${fallbackError} (HTTP ${res.status})`) as Error & {
      status?: number;
      retryAfterSec?: number;
    };
    err.status = res.status;
    if (typeof data?.retryAfterSec === 'number') {
      err.retryAfterSec = data.retryAfterSec;
    }
    throw err;
  }
  return data as T;
}

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
      return await safeParseJsonResponse(res, 'System status check failed');
    } catch {
      return {
        hasApiKey: false,
        preferredModel: 'gemini-4-hydrogen',
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
    let data: any;
    let lastErr: any;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch('/api/gemini/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
        data = await safeParseJsonResponse(res, 'Failed to generate answer');
        lastErr = null;
        break;
      } catch (err: any) {
        lastErr = err;
        if (attempt === 0 && err?.isHtml) {
          await new Promise((r) => setTimeout(r, 850));
          continue;
        }
        throw err;
      }
    }
    if (lastErr) throw lastErr;

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
    try {
      const res = await fetch('/api/gemini/detect-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await safeParseJsonResponse(res, 'Question detection failed');
    } catch {
      return {
        isQuestion: false,
        questionText: '',
        category: 'general',
        urgency: 'normal',
        confidence: 0,
      };
    }
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
    return await safeParseJsonResponse<CodingSolution>(res, 'Failed to solve coding problem');
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

    const data = await safeParseJsonResponse(res, 'Failed to analyze screenshot');
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

      return await safeParseJsonResponse<Partial<ProfessionalProfile>>(res, 'Failed to parse resume');
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

    return await safeParseJsonResponse<PracticeFeedback>(res, 'Failed to evaluate response');
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

    return await safeParseJsonResponse(res, 'Execution failed');
  },
};
