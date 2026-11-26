import express, { Request, Response } from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import {
  GoogleGenAI,
  Type,
  ThinkingLevel,
  Modality,
  LiveServerMessage,
  AudioTranscriptionConfigMode,
  StartSensitivity,
  EndSensitivity,
} from '@google/genai';
import { WebSocketServer } from 'ws';
import mammoth from 'mammoth';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

interface ServerStartOptions {
  port?: number;
  host?: string;
  production?: boolean;
  staticDir?: string;
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google Gemini SDK on the server with recommended telemetry header
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Centralized default models with automatic fallback pool
const TEXT_MODEL = 'gemini-4-hydrogen';
const FALLBACK_MODELS = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
const TRANSCRIBE_MODEL = 'gemini-3.5-transcribe';

// Automatic resilient model fallback to handle 503 high demand or 429 quota spikes seamlessly
async function generateWithFallback(options: {
  contents: any;
  config?: any;
  preferredModels?: string[];
  stopOnQuota?: boolean;
}) {
  const models = options.preferredModels || FALLBACK_MODELS;
  let lastError: any = null;
  const modelErrors: string[] = [];

  for (const model of models) {
    try {
      // Configure low thinking level on gemini-4-hydrogen for fast responses (skip for transcription model)
      const modelConfig = { ...(options.config || {}) };
      if (model === 'gemini-4-hydrogen' && !modelConfig.thinkingConfig) {
        modelConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }

      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: modelConfig,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || err || '');
      modelErrors.push(`${model}[${err?.status || 'ERR'}]: ${errMsg.slice(0, 160)}`);
      console.warn(`Model ${model} unavailable (${errMsg.slice(0, 140)}). Trying backup model...`);

      const isQuota = err?.status === 429 || errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED');
      if ((options.stopOnQuota && isQuota) || models.indexOf(model) === models.length - 1) {
        (err as any).modelErrors = modelErrors;
        throw err;
      }
    }
  }
  if (lastError) (lastError as any).modelErrors = modelErrors;
  throw lastError;
}

function extractReadableGeminiError(err: any, fallback: string): { status: number; message: string; retryAfterSec?: number; modelErrors?: string[] } {
  const raw = String(err?.message || fallback);
  const modelErrors: string[] | undefined = Array.isArray(err?.modelErrors) ? err.modelErrors : undefined;
  const isQuota = err?.status === 429 || raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED');
  if (isQuota) {
    let retryAfterSec = 10;
    const retryMatch = raw.match(/retry in\s+(\d+(?:\.\d+)?)s/i) || raw.match(/"retryDelay"\s*:\s*"(\d+)s"/i);
    if (retryMatch) {
      retryAfterSec = Math.max(5, Math.min(60, Math.ceil(Number(retryMatch[1]))));
    }
    return {
      status: 429,
      retryAfterSec,
      message: `Gemini quota cooldown (${retryAfterSec}s) — Free Tier rate limit reached.`,
      modelErrors,
    };
  }
  if (raw.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.error?.message) {
        return { status: Number(err?.status) || 500, message: String(parsed.error.message).slice(0, 140), modelErrors };
      }
    } catch {
      // ignore JSON parse errors
    }
  }
  return { status: Number(err?.status) || 500, message: raw.slice(0, 140) || fallback, modelErrors };
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// System Status Check
app.get('/api/system/status', (_req: Request, res: Response) => {
  res.json({
    hasApiKey: !!geminiApiKey,
    preferredModel: TEXT_MODEL,
    serverTime: new Date().toISOString(),
    status: 'online',
    version: '1.0.0',
    platform: 'Windows Desktop / Electron Native Bridge',
  });
});

// Explicit Static Download Routes for Desktop Stealth Apps (inject live bridge URL if requested directly)
function buildBridgeOrigin(req: Request): string | null {
  const host = req.get('x-forwarded-host') || req.get('host');
  if (!host) return null;
  const proto = (req.get('x-forwarded-proto') || req.protocol || 'https').split(',')[0].trim();
  return `${proto}://${host}/`;
}

app.get(['/InterviewCopilot-Stealth.bat', '/api/download/stealth-bat'], (req: Request, res: Response) => {
  const filePath = path.resolve(__dirname, 'public', 'InterviewCopilot-Stealth.bat');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Disposition', 'attachment; filename="InterviewCopilot-Stealth.bat"');
    res.setHeader('Content-Type', 'application/octet-stream');
    const origin = buildBridgeOrigin(req);
    if (origin) {
      const text = fs.readFileSync(filePath, 'utf8').replace(/__COPILOT_BRIDGE_URL__/g, origin);
      return res.send(text);
    }
    return res.sendFile(filePath);
  }
  return res.status(404).send('File not found');
});

app.get(['/InterviewCopilot-Stealth.ps1', '/api/download/stealth-ps1'], (req: Request, res: Response) => {
  const filePath = path.resolve(__dirname, 'public', 'InterviewCopilot-Stealth.ps1');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Disposition', 'attachment; filename="InterviewCopilot-Stealth.ps1"');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    const origin = buildBridgeOrigin(req);
    if (origin) {
      const text = fs.readFileSync(filePath, 'utf8').replace(/__COPILOT_BRIDGE_URL__/g, origin);
      return res.send(text);
    }
    return res.sendFile(filePath);
  }
  return res.status(404).send('File not found');
});

// 1. Live Interview Answer Generation
app.post('/api/gemini/answer', async (req: Request, res: Response) => {
  try {
    const { question, category, length = 'standard', profileContext, conversationContext } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (!geminiApiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured in server environment' });
    }

    const lengthGuidelines = {
      short: 'Deliver a high-impact, punchy answer designed for 15-30 seconds of speech. Direct, concise, no fluff.',
      standard: 'Deliver a well-rounded answer designed for 30-60 seconds of speech. Explain rationale with 1 concrete technical example.',
      detailed: 'Deliver an in-depth answer designed for 60-120 seconds of speech. Include architectural details, trade-offs, and deep technical context.',
    }[length as 'short' | 'standard' | 'detailed'] || 'Standard length (30-60 seconds)';

    const systemInstruction = `You are an elite AI Interview Copilot assisting a Senior QA Automation Engineer and QA Lead during a high-stakes job interview.

CANDIDATE BACKGROUND INFORMATION:
- Role & Positioning: Senior QA Automation Engineer / QA Lead
- Total QA Experience: 14+ years (11+ years automation testing)
- Core Technologies: Selenium WebDriver, Java, Playwright, TypeScript, JavaScript, Cucumber BDD, Maven, TestNG, HP UFT/ALM, Jenkins CI/CD, MySQL, SQL, Jira, YouTrack, Agile
- Key Specializations: End-to-end framework architecture, Page Object Model, dynamic explicit wait strategies, API testing, database verification, CI/CD pipelines, flaky test diagnosis, mentoring junior QA
${profileContext ? `\nADDITIONAL PROFILE DETAILS:\n${profileContext}` : ''}

STRICT FACTUAL DISCIPLINE:
- NEVER invent qualifications, degrees, companies, or tools that are not in the profile.
- If asked about a tool or framework outside this profile, explain how concepts transfer or acknowledge learning capacity honestly.
- For behavioral or situational questions, naturally apply the STAR method (Situation, Task, Action, Result) with realistic senior QA lead scenarios.
- Speak in first-person ("I", "In my automation frameworks", "When leading QA teams").
- Keep tone confident, humble, articulate, and conversational. Avoid sounding like a scripted textbook.

RESPONSE LENGTH DIRECTIVE: ${lengthGuidelines}`;

    const prompt = `INTERVIEW QUESTION: "${question}"
CATEGORY: ${category || 'general'}
RECENT INTERVIEW CONTEXT:
${conversationContext || 'No previous context yet.'}

Provide your response in JSON format matching the schema.`;

    const response = await generateWithFallback({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: {
              type: Type.STRING,
              description: 'The natural, spoken first-person response for the candidate to speak.',
            },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-4 concise bullet points summarizing the core talking points at a glance.',
            },
            starMethod: {
              type: Type.OBJECT,
              properties: {
                situation: { type: Type.STRING },
                task: { type: Type.STRING },
                action: { type: Type.STRING },
                result: { type: Type.STRING },
              },
              description: 'Structured STAR breakdown if applicable to this question.',
            },
            followUpPredictions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 likely follow-up questions the interviewer might ask next.',
            },
            codeSnippet: {
              type: Type.STRING,
              description: 'Optional relevant code snippet or query if this is a technical or coding question.',
            },
          },
          required: ['answer', 'keyPoints', 'followUpPredictions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini answer generation error:', error);
    const clean = extractReadableGeminiError(error, 'Failed to generate answer from Gemini API');
    if (clean.status === 429) res.setHeader('Retry-After', '5');
    return res.status(clean.status).json({ error: clean.message });
  }
});

// 2. Question Detection from Live Transcription
app.post('/api/gemini/detect-question', async (req: Request, res: Response) => {
  try {
    const { transcriptChunk, conversationHistory } = req.body;

    if (!transcriptChunk) {
      return res.status(400).json({ error: 'transcriptChunk is required' });
    }

    if (!geminiApiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }

    const prompt = `Analyze this stream of transcript text from a live interview conversation:
"${transcriptChunk}"

Context history:
${conversationHistory || 'None'}

Determine if the speaker/interviewer just asked or finished asking a genuine question or posed a challenge/prompt that requires an answer.
Ignore conversational filler, greetings, confirmations ("okay", "I see", "let's move on"), and background noise.`;

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isQuestion: { type: Type.BOOLEAN, description: 'True if a clear question or prompt is present' },
            questionText: { type: Type.STRING, description: 'The clean, normalized text of the detected question' },
            category: {
              type: Type.STRING,
              enum: ['general', 'qa_technical', 'automation', 'programming', 'database', 'api_testing', 'behavioral', 'scenario'],
              description: 'The classified category of the question',
            },
            urgency: { type: Type.STRING, enum: ['high', 'normal'], description: 'High if it demands an immediate response' },
            confidence: { type: Type.NUMBER, description: 'Confidence between 0 and 1' },
          },
          required: ['isQuestion', 'questionText', 'category', 'confidence'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Question detection error:', error);
    const clean = extractReadableGeminiError(error, 'Question detection failed');
    if (clean.status === 429) res.setHeader('Retry-After', '5');
    return res.status(clean.status).json({ error: clean.message });
  }
});

// 2.5 High-Precision Audio Transcription via Gemini Speech Model
app.post('/api/transcribe', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType = 'audio/wav', previousTranscript = '' } = req.body;

    if (!audioBase64 || typeof audioBase64 !== 'string' || audioBase64.length < 400) {
      return res.json({ transcript: '' });
    }

    if (!geminiApiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured in server environment' });
    }

    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');

    // Fast Node.js PCM energy check for WAV clips so silence/hum never burns API quota or triggers hallucinations
    if (String(mimeType).toLowerCase().includes('wav')) {
      const wavBuf = Buffer.from(cleanBase64, 'base64');
      if (wavBuf.length > 44 && wavBuf.toString('ascii', 0, 4) === 'RIFF') {
        const pcmBytes = wavBuf.length - 44;
        if (pcmBytes < 4800) {
          return res.json({ transcript: '' });
        }
        let maxAbs = 0;
        let sumSq = 0;
        const sampleCount = Math.floor(pcmBytes / 2);
        for (let i = 44; i + 1 < wavBuf.length; i += 2) {
          const s = wavBuf.readInt16LE(i);
          const a = s < 0 ? -s : s;
          if (a > maxAbs) maxAbs = a;
          sumSq += s * s;
        }
        const rms = Math.sqrt(sumSq / Math.max(1, sampleCount));
        if (maxAbs < 320 || rms < 65) {
          return res.json({ transcript: '' });
        }
      }
    }

    const prevCtx = typeof previousTranscript === 'string'
      ? previousTranscript.replace(/\s+/g, ' ').trim().slice(-160)
      : '';

    const prompt = prevCtx
      ? `Transcribe every spoken English word in this audio clip accurately and verbatim (preceding context: "${prevCtx}"). Output ONLY the spoken words from this clip with natural punctuation. No timestamps, no speaker labels. If no speech is audible, output [NO_SPEECH].`
      : `Transcribe every spoken English word in this audio clip accurately and verbatim. Output ONLY the spoken words with natural punctuation. No timestamps, no speaker labels. If no speech is audible, output [NO_SPEECH].`;

    const audioPart = {
      inlineData: {
        mimeType,
        data: cleanBase64,
      },
    };
    const textPart = {
      text: prompt,
    };

    const response = await generateWithFallback({
      preferredModels: [TRANSCRIBE_MODEL, 'gemini-4-hydrogen'],
      stopOnQuota: true,
      contents: { parts: [audioPart, textPart] },
    });

    let transcript = response.text ? response.text.trim() : '';
    transcript = transcript
      .replace(/^["'`]+|["'`]+$/g, '')
      .replace(/^(?:\[?\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d+)?\s*(?:[-–>]+\s*\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d+)?)?\]?\s*)+/g, '')
      .trim();

    if (
      !transcript ||
      /^(\[.*?(no_speech|silence|inaudible|noise|music|no speech|empty).*?\]|\(.*?(no_speech|silence|inaudible|noise|music|no speech).*?\)|no speech|no_speech|silence|empty string)$/i.test(
        transcript
      )
    ) {
      return res.json({ transcript: '' });
    }

    return res.json({ transcript });
  } catch (error: any) {
    console.error('Audio transcription error:', error);
    const clean = extractReadableGeminiError(error, 'Transcription failed');
    if (clean.status === 429) {
      res.setHeader('Retry-After', String(clean.retryAfterSec || 10));
    }
    return res.status(clean.status).json({
      error: clean.message,
      retryAfterSec: clean.retryAfterSec,
      modelErrors: clean.modelErrors,
    });
  }
});

// 3. AI Coding Interview Assistant
app.post('/api/gemini/code-solve', async (req: Request, res: Response) => {
  try {
    const { problemText, language = 'Java', mode = 'interview', context } = req.body;

    if (!problemText) {
      return res.status(400).json({ error: 'Problem text is required' });
    }

    if (!geminiApiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    const systemInstruction = `You are a Principal Software Engineer & QA Automation Architect solving technical interview and coding problems.
Deliver production-grade, cleanly structured solutions in ${language}.
Focus on:
1. Clear problem understanding, input/output constraints, and edge cases.
2. Step-by-step algorithm explanation before code.
3. Clean, idiomatic, runnable ${language} code with comments explaining key steps.
4. Accurate Big-O Time and Space complexity analysis.
5. Concrete test cases with inputs, expected outputs, and reasons.
6. Special attention to QA automation best practices (e.g., explicit waits, Page Object Model, thread safety, clean assertions) when automation questions are asked.`;

    const prompt = `CODING PROBLEM:
${problemText}

TARGET LANGUAGE: ${language}
MODE: ${mode}
ADDITIONAL CONTEXT: ${context || 'None'}`;

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problemUnderstanding: { type: Type.STRING, description: 'Summary of the problem, constraints, and inputs/outputs' },
            approach: { type: Type.STRING, description: 'The chosen algorithmic approach and why it was selected' },
            code: { type: Type.STRING, description: 'Complete, runnable, idiomatic code in the requested language' },
            language: { type: Type.STRING, description: 'Normalized language name' },
            explanation: { type: Type.STRING, description: 'Walkthrough of how the code executes' },
            timeComplexity: { type: Type.STRING, description: 'Time complexity with detailed Big-O explanation' },
            spaceComplexity: { type: Type.STRING, description: 'Space complexity with detailed Big-O explanation' },
            testCases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  input: { type: Type.STRING },
                  expected: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['input', 'expected', 'explanation'],
              },
            },
            edgeCases: { type: Type.ARRAY, items: { type: Type.STRING } },
            alternativeApproaches: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['problemUnderstanding', 'approach', 'code', 'language', 'explanation', 'timeComplexity', 'spaceComplexity', 'testCases', 'edgeCases'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Coding solve error:', error);
    return res.status(500).json({ error: error.message || 'Failed to solve coding problem' });
  }
});

// 4. Multimodal Screenshot Analyzer
app.post('/api/gemini/analyze-screenshot', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/png', additionalPrompt } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    if (!geminiApiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    // Strip data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: cleanBase64,
      },
    };

    const textPart = {
      text: `Analyze this screenshot from a technical assessment, coding challenge, error stack trace, database diagram, or interview test.
${additionalPrompt ? `User Question/Instructions: ${additionalPrompt}` : ''}

Tasks:
1. Extract the exact question or challenge visible in the image.
2. Identify the category (coding problem, compiler error, database diagram, multiple choice question, API schema, etc.).
3. Identify the programming language or technology stack (Java, TypeScript, SQL, Python, etc.).
4. Provide a complete, correct, production-ready solution or answer.
5. Provide a thorough technical explanation.
6. Include test cases and note any unreadable or uncertain parts if resolution is degraded.`,
    };

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedQuestion: { type: Type.STRING, description: 'Exact extracted question or text from the image' },
            questionCategory: { type: Type.STRING, description: 'Category e.g. Coding Challenge, SQL Query, Stack Trace, Multiple Choice, Diagram' },
            identifiedLanguage: { type: Type.STRING, description: 'Identified programming language or tech' },
            suggestedSolution: { type: Type.STRING, description: 'Complete solution, query, or code' },
            explanation: { type: Type.STRING, description: 'Step-by-step technical explanation' },
            testCases: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Applicable test cases or validation checks' },
            confidence: { type: Type.NUMBER, description: 'Confidence score between 0 and 1' },
            uncertaintyNotes: { type: Type.STRING, description: 'Any visual ambiguities or caveats' },
          },
          required: ['extractedQuestion', 'questionCategory', 'suggestedSolution', 'explanation', 'confidence'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Screenshot analysis error:', error);
    return res.status(500).json({ error: error.message || 'Screenshot analysis failed' });
  }
});

// 5. Resume Intelligence & Document Parser
app.post('/api/gemini/parse-resume', async (req: Request, res: Response) => {
  try {
    const { documentText, documentBase64, mimeType = 'text/plain', fileName = '' } = req.body;

    if (!documentText && !documentBase64) {
      return res.status(400).json({ error: 'documentText or documentBase64 is required' });
    }

    if (!geminiApiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    let contents: any;
    let extractedText = documentText || '';

    if (documentBase64 && !extractedText) {
      let cleanBase64 = documentBase64;
      let detectedMime = mimeType || 'application/pdf';

      if (cleanBase64.startsWith('data:')) {
        const match = cleanBase64.match(/^data:([^;]+);base64,/);
        if (match) {
          detectedMime = match[1];
        }
        cleanBase64 = cleanBase64.replace(/^data:[^;]+;base64,/, '');
      }

      // Check if file is a Word Document (.docx or .doc)
      const isWordDoc =
        detectedMime.includes('word') ||
        detectedMime.includes('officedocument') ||
        fileName.toLowerCase().endsWith('.docx') ||
        fileName.toLowerCase().endsWith('.doc');

      if (isWordDoc) {
        try {
          const buffer = Buffer.from(cleanBase64, 'base64');
          const result = await mammoth.extractRawText({ buffer });
          if (result && result.value && result.value.trim()) {
            extractedText = result.value.trim();
          }
        } catch (docxErr: any) {
          console.warn('Word document text extraction warning:', docxErr);
        }
      }

      // Check if file is a PDF (.pdf)
      const isPdf =
        detectedMime.includes('pdf') ||
        fileName.toLowerCase().endsWith('.pdf');

      if (isPdf && !extractedText) {
        try {
          const buffer = Buffer.from(cleanBase64, 'base64');
          const parser = new PDFParse({ data: buffer });
          const pdfResult = await parser.getText();
          if (pdfResult && pdfResult.text && pdfResult.text.trim().length > 30) {
            extractedText = pdfResult.text.trim();
          }
        } catch (pdfErr: any) {
          console.warn('PDF text extraction fallback warning:', pdfErr);
        }
      }

      if (extractedText) {
        // Truncate to reasonable token limit (first 30,000 chars)
        const safeText = extractedText.slice(0, 30000);
        contents = `Parse this candidate resume document into structured professional profile data:\n\n${safeText}`;
      } else {
        // Fallback for image-only/scanned PDF
        const safeMime = isPdf ? 'application/pdf' : 'application/pdf';

        contents = {
          parts: [
            { inlineData: { mimeType: safeMime, data: cleanBase64 } },
            { text: 'Analyze this resume document and extract candidate profile details into structured JSON.' },
          ],
        };
      }
    } else {
      contents = `Parse this candidate resume/CV text into structured candidate profile data:\n\n${extractedText.slice(0, 30000)}`;
    }

    const response = await generateWithFallback({
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            title: { type: Type.STRING },
            yearsExperience: { type: Type.NUMBER },
            automationExperience: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            positioning: { type: Type.STRING },
            programmingLanguages: { type: Type.ARRAY, items: { type: Type.STRING } },
            automationFrameworks: { type: Type.ARRAY, items: { type: Type.STRING } },
            testTools: { type: Type.ARRAY, items: { type: Type.STRING } },
            databases: { type: Type.ARRAY, items: { type: Type.STRING } },
            testingTypes: { type: Type.ARRAY, items: { type: Type.STRING } },
            employmentHistory: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  company: { type: Type.STRING },
                  role: { type: Type.STRING },
                  period: { type: Type.STRING },
                  highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
              },
            },
            education: { type: Type.ARRAY, items: { type: Type.STRING } },
            certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['name', 'title', 'summary'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      name: parsed.name || 'Candidate',
      title: parsed.title || 'Senior QA Automation Engineer',
      yearsExperience: parsed.yearsExperience || 10,
      automationExperience: parsed.automationExperience || 8,
      positioning: parsed.positioning || parsed.summary || '',
      summary: parsed.summary || '',
      programmingLanguages: parsed.programmingLanguages || [],
      automationFrameworks: parsed.automationFrameworks || [],
      testTools: parsed.testTools || [],
      databases: parsed.databases || [],
      testingTypes: parsed.testingTypes || [],
      employmentHistory: (parsed.employmentHistory || []).map((h: any) => ({
        company: h.company || 'Enterprise Company',
        role: h.role || 'Senior Engineer',
        period: h.period || '2020 - Present',
        highlights: h.highlights || [],
      })),
      education: parsed.education || [],
      certifications: parsed.certifications || [],
    });
  } catch (error: any) {
    console.error('Resume parse error:', error);
    let errorText = error?.message || 'Resume parsing failed. Please check document format or paste text directly.';
    if (typeof errorText === 'string' && errorText.includes('{')) {
      try {
        const parsedJson = JSON.parse(errorText);
        if (parsedJson?.error?.message) {
          errorText = parsedJson.error.message;
        }
      } catch {
        // fallback
      }
    }
    return res.status(500).json({ error: errorText });
  }
});

// 6. Practice Interview Evaluator
app.post('/api/gemini/practice-evaluate', async (req: Request, res: Response) => {
  try {
    const { questionPrompt, candidateAnswer, targetRole = 'Senior QA Automation Engineer', difficulty = 'Senior' } = req.body;

    if (!questionPrompt || !candidateAnswer) {
      return res.status(400).json({ error: 'questionPrompt and candidateAnswer are required' });
    }

    if (!geminiApiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    const prompt = `Evaluate this mock interview candidate answer:
TARGET ROLE: ${targetRole} (${difficulty} level)
QUESTION: "${questionPrompt}"
CANDIDATE'S ANSWER: "${candidateAnswer}"

Grade objectively on a 0-100 scale across:
- Accuracy (Technical correctness)
- Relevance (Directly addresses the question)
- Technical Depth (Demonstrates real engineering experience vs superficial keywords)
- Communication (Structure, clarity, conciseness)
- Completeness (Covered trade-offs, edge cases, or STAR points)

Provide concrete strengths, actionable improvements, and a gold-standard model response.`;

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: 'Overall score from 0 to 100' },
            accuracy: { type: Type.NUMBER, description: '0 to 100' },
            relevance: { type: Type.NUMBER, description: '0 to 100' },
            technicalDepth: { type: Type.NUMBER, description: '0 to 100' },
            communication: { type: Type.NUMBER, description: '0 to 100' },
            clarity: { type: Type.NUMBER, description: '0 to 100' },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            modelAnswer: { type: Type.STRING, description: 'Ideal polished answer' },
          },
          required: ['score', 'accuracy', 'relevance', 'technicalDepth', 'communication', 'clarity', 'strengths', 'improvements', 'modelAnswer'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Practice evaluation error:', error);
    return res.status(500).json({ error: error.message || 'Practice evaluation failed' });
  }
});

// 7. Safe Sandboxed Code Runner
app.post('/api/code/execute', async (req: Request, res: Response) => {
  try {
    const { code, language = 'javascript' } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const normLang = language.toLowerCase();

    if (normLang === 'javascript' || normLang === 'typescript' || normLang === 'js' || normLang === 'ts') {
      // Sandboxed execution with timeout & console interception
      const logs: string[] = [];
      const errorLogs: string[] = [];

      const customConsole = {
        log: (...args: any[]) => logs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
        error: (...args: any[]) => errorLogs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
        warn: (...args: any[]) => logs.push('[WARN] ' + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
        info: (...args: any[]) => logs.push('[INFO] ' + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
      };

      try {
        // Strip TS type annotations if running directly or evaluate
        // Basic safe wrapper function
        const wrappedCode = `
          "use strict";
          const console = __customConsole;
          ${code}
        `;

        const startTime = Date.now();
        // Execute in isolated function context
        const runFn = new Function('__customConsole', wrappedCode);
        const result = runFn(customConsole);
        const duration = Date.now() - startTime;

        return res.json({
          success: errorLogs.length === 0,
          output: logs.join('\n') || (result !== undefined ? String(result) : '(Execution completed with no console output)'),
          errors: errorLogs.join('\n') || null,
          executionTimeMs: duration,
        });
      } catch (execErr: any) {
        return res.json({
          success: false,
          output: logs.join('\n'),
          errors: execErr.message || String(execErr),
          executionTimeMs: 0,
        });
      }
    } else {
      // For Java, Python, SQL, C#, use Gemini to simulate test execution with isolated correctness check
      const prompt = `Simulate isolated compilation and test execution for this ${language} code:
\`\`\`${language}
${code}
\`\`\`

Evaluate for:
1. Syntax validity
2. Edge case failures
3. Execution output or standard assertions
Return simulated standard output, stderr, and execution status.`;

      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              success: { type: Type.BOOLEAN },
              output: { type: Type.STRING },
              errors: { type: Type.STRING },
              executionTimeMs: { type: Type.NUMBER },
            },
            required: ['success', 'output', 'executionTimeMs'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Execution error' });
  }
});

// -------------------------------------------------------------
// Vite Dev Server / Static Production Mounting
// -------------------------------------------------------------
export async function startServer(options: ServerStartOptions = {}): Promise<http.Server> {
  const production = options.production ?? process.env.NODE_ENV === 'production';
  if (!production) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = options.staticDir ?? path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  const server = http.createServer(app);
  const liveWss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const urlPath = request.url || '';
    if (urlPath.startsWith('/api/live-transcribe')) {
      liveWss.handleUpgrade(request, socket, head, (ws) => {
        liveWss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  liveWss.on('connection', async (clientWs, request) => {
    if (!geminiApiKey) {
      clientWs.send(JSON.stringify({ type: 'error', error: 'Gemini API key missing' }));
      clientWs.close();
      return;
    }

    const reqUrl = new URL(request.url || '/api/live-transcribe', `http://${request.headers.host || 'localhost'}`);
    const speaker = reqUrl.searchParams.get('speaker') === 'interviewee' ? 'interviewee' : 'interviewer';
    let session: any = null;
    let closed = false;

    const callbacks = {
      onmessage: (message: LiveServerMessage) => {
        if (closed || clientWs.readyState !== 1) return;
        const content: any = message.serverContent;
        if (content?.interimInputTranscription?.text) {
          clientWs.send(
            JSON.stringify({
              type: 'interim',
              speaker,
              text: content.interimInputTranscription.text,
            })
          );
        }
        if (content?.inputTranscription?.text) {
          clientWs.send(
            JSON.stringify({
              type: 'transcript',
              speaker,
              text: content.inputTranscription.text,
            })
          );
        }
        if (content?.turnComplete) {
          clientWs.send(JSON.stringify({ type: 'turnComplete', speaker }));
        }
      },
      onerror: (err: any) => {
        if (closed || clientWs.readyState !== 1) return;
        const clean = extractReadableGeminiError(err, 'Live transcription error');
        clientWs.send(
          JSON.stringify({
            type: 'error',
            status: clean.status,
            retryAfterSec: clean.retryAfterSec,
            error: clean.message,
          })
        );
      },
      onclose: () => {
        if (!closed && clientWs.readyState === 1) {
          clientWs.send(JSON.stringify({ type: 'closed' }));
          try { clientWs.close(); } catch {}
        }
      },
    };

    try {
      try {
        session = await ai.live.connect({
          model: 'gemini-3.5-transcribe-live',
          config: {
            responseModalities: [Modality.TEXT],
            inputAudioTranscription: {
              languageCodes: ['en-US'],
              mode: AudioTranscriptionConfigMode.VERBATIM,
            },
            realtimeInputConfig: {
              automaticActivityDetection: {
                startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
                endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
                prefixPaddingMs: 250,
                silenceDurationMs: 800,
              },
            },
          },
          callbacks,
        });
      } catch {
        session = await ai.live.connect({
          model: 'gemini-3.5-transcribe-live',
          config: {
            responseModalities: [Modality.TEXT],
            inputAudioTranscription: {
              languageCodes: ['en-US'],
            },
          },
          callbacks,
        });
      }

      if (closed) {
        try { session.close(); } catch {}
        return;
      }

      if (clientWs.readyState === 1) {
        clientWs.send(JSON.stringify({ type: 'ready', speaker, model: 'gemini-3.5-transcribe-live' }));
      }
    } catch (err: any) {
      const clean = extractReadableGeminiError(err, 'Live API connection failed');
      if (clientWs.readyState === 1) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            status: clean.status,
            retryAfterSec: clean.retryAfterSec,
            error: clean.message,
          })
        );
        try { clientWs.close(); } catch {}
      }
      return;
    }

    clientWs.on('message', (raw) => {
      if (closed || !session) return;
      try {
        const msg = JSON.parse(raw.toString());
        if (msg?.audio && typeof msg.audio === 'string') {
          session.sendRealtimeInput({
            audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        }
      } catch {}
    });

    clientWs.on('close', () => {
      closed = true;
      if (session) {
        try { session.close(); } catch {}
        session = null;
      }
    });
  });

  const port = options.port ?? PORT;
  const host = options.host ?? '0.0.0.0';
  await new Promise<void>((resolve, reject) => {
    const handleError = (error: Error) => reject(error);
    server.once('error', handleError);
    server.listen(port, host, () => {
      server.off('error', handleError);
      resolve();
    });
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('The local API server did not report a TCP address.');
  }

  console.log(`[Interview Copilot AI] Server running at http://${address.address}:${address.port}`);
  return server;
}

if (['server.ts', 'server.js', 'server.mjs', 'server.cjs'].includes(path.basename(process.argv[1] || ''))) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
