import React, { useState, useRef, useEffect } from 'react';
import { geminiClient } from '../../services/geminiClient';
import { useCodeStore } from '../../store/useCodeStore';
import { useAppStore } from '../../store/useAppStore';
import { ScreenshotAnalysis } from '../../types';
import {
  ScanLine,
  Upload,
  Crop,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  Camera,
  Clipboard,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Layers,
  ArrowRight,
  FileImage,
} from 'lucide-react';

export const ScreenshotAnalyzerView: React.FC = () => {
  const { addTab } = useCodeStore();
  const { setCurrentTab } = useAppStore();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/png');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ScreenshotAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mobileTab, setMobileTab] = useState<'capture' | 'solution'>('capture');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Global Ctrl+V clipboard image paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            readAndSetImage(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const readAndSetImage = (file: File) => {
    setErrorMsg(null);
    setMimeType(file.type || 'image/png');
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      readAndSetImage(e.target.files[0]);
    }
  };

  // Screen Capture using getDisplayMedia
  const handleCaptureScreen = async () => {
    setErrorMsg(null);
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        // Use Electron desktopCapturer if running in Electron
        const sources = await (window as any).electronAPI.getScreenSources();
        if (sources && sources.length > 0) {
          setImagePreview(sources[0].thumbnail);
          setMimeType('image/png');
          setAnalysisResult(null);
          return;
        }
      }

      // Standard browser screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'window' },
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setImagePreview(dataUrl);
        setMimeType('image/png');
        setAnalysisResult(null);

        // Stop media stream tracks
        stream.getTracks().forEach((t) => t.stop());
      };
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        setErrorMsg('Screen capture error: ' + (err.message || 'Capture canceled'));
      }
    }
  };

  const runAnalysis = async () => {
    if (!imagePreview || isAnalyzing) return;
    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const result = await geminiClient.analyzeScreenshot({
        imageBase64: imagePreview,
        mimeType,
        additionalPrompt: additionalPrompt.trim() || undefined,
      });
      setAnalysisResult(result);
      setMobileTab('solution');
    } catch (err: any) {
      setErrorMsg(err.message || 'Multimodal screenshot analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTransferToWorkspace = () => {
    if (!analysisResult) return;
    const lang = analysisResult.identifiedLanguage?.toLowerCase() || 'typescript';
    const ext = lang.includes('java') ? 'java' : lang.includes('sql') ? 'sql' : lang.includes('python') ? 'py' : 'ts';
    addTab(`AssessmentSolution.${ext}`, lang, analysisResult.suggestedSolution);
    setCurrentTab('workspace');
  };

  const copySolution = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult.suggestedSolution);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-950">
      {/* Top Header */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-sky-400" />
            <span>Multimodal Screenshot Intelligence</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gemini vision understanding for technical assessments, code snippets, compiler errors, and diagrams.
          </p>
        </div>

        {/* Input Methods Toolbar */}
        <div className="flex items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>

          <button
            onClick={handleCaptureScreen}
            className="px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Camera className="w-3.5 h-3.5 text-sky-400" />
            <span>Capture Window / Region</span>
          </button>

          <button
            onClick={runAnalysis}
            disabled={!imagePreview || isAnalyzing}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Inspecting Vision...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analyze with Gemini</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Screen Segmented Tab Switcher */}
      <div className="lg:hidden flex border-b border-slate-800 bg-slate-900/90 px-3 py-1.5 shrink-0">
        <div className="flex w-full rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setMobileTab('capture')}
            className={`flex-1 py-1.5 rounded-md text-center transition-colors ${
              mobileTab === 'capture' ? 'bg-sky-600 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Screenshot & Input
          </button>
          <button
            onClick={() => setMobileTab('solution')}
            className={`flex-1 py-1.5 rounded-md text-center transition-colors flex items-center justify-center gap-1.5 ${
              mobileTab === 'solution' ? 'bg-sky-600 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Extracted Solution</span>
            {analysisResult && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-950/60 border-b border-rose-800 px-6 py-2.5 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Split Content: Left (Image Preview & Followup prompt) / Right (Multimodal Extraction & Solution) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column (5 cols) */}
        <div
          className={`lg:col-span-5 border-r border-slate-800/80 p-4 sm:p-5 flex-col gap-4 overflow-y-auto bg-slate-950 ${
            mobileTab === 'capture' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 font-mono uppercase">
            <span>Screenshot Frame</span>
            <span className="text-[10px] text-slate-500 lowercase">Press Ctrl+V to paste anytime</span>
          </div>

          {/* Image Display / Dropzone */}
          {imagePreview ? (
            <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center min-h-[220px] sm:min-h-[260px] max-h-[360px]">
              <img
                src={imagePreview}
                alt="Assessment Screenshot"
                className="max-h-[360px] w-auto object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg backdrop-blur border border-slate-800">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-300 text-xs"
                  title="Change Image"
                >
                  Replace
                </button>
                <button
                  onClick={() => {
                    setImagePreview(null);
                    setAnalysisResult(null);
                  }}
                  className="p-1.5 rounded hover:bg-rose-900/60 text-rose-400 text-xs"
                  title="Remove Image"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-900/20 group min-h-[200px] sm:min-h-[240px]"
            >
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 group-hover:border-slate-700 mb-3 text-slate-400 group-hover:text-sky-400 transition-colors">
                <FileImage className="w-8 h-8" />
              </div>
              <p className="text-xs font-semibold text-slate-300">
                Drop screenshot here or click to browse
              </p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                Supports PNG, JPEG, WebP. Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Ctrl+V</kbd> to paste.
              </p>
            </div>
          )}

          {/* Additional prompt / Follow-up */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase font-mono mb-1.5">
              Specific Instructions or Follow-up (Optional)
            </label>
            <input
              type="text"
              value={additionalPrompt}
              onChange={(e) => setAdditionalPrompt(e.target.value)}
              placeholder="e.g. 'Solve in Java with O(1) space', 'Identify the compiler syntax error'..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Multimodal Capabilities:</span>
            <p>· Analyzes layout, diagrams, code indentations, and UI components natively.</p>
            <p>· Automatically detects language (Java, TypeScript, SQL, Python, C#).</p>
            <p>· Reports uncertainty explicitly if OCR text is blurry or cropped.</p>
          </div>
        </div>

        {/* Right Column: Multimodal Extraction & Generated Solution (7 cols) */}
        <div
          className={`lg:col-span-7 flex-col overflow-hidden bg-slate-950 ${
            mobileTab === 'solution' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {isAnalyzing ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
              <p className="text-xs font-medium">Extracting question & inspecting visual tokens...</p>
              <p className="text-[11px] text-slate-500">Gemini vision is analyzing layout, code structure, and diagrams</p>
            </div>
          ) : !analysisResult ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
              <ScanLine className="w-12 h-12 text-slate-800" />
              <div>
                <h3 className="text-sm font-medium text-slate-300">Awaiting Screenshot</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Upload an image or paste with Ctrl+V on the left to extract the question and generate an instant technical solution.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-sky-400 uppercase font-semibold">
                    {analysisResult.questionCategory}
                  </span>
                  {analysisResult.identifiedLanguage && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {analysisResult.identifiedLanguage}
                    </span>
                  )}
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {Math.round(analysisResult.confidence * 100)}% Confidence
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copySolution}
                    className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleTransferToWorkspace}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Open in Code Workspace</span>
                  </button>
                </div>
              </div>

              {/* Extracted Question */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block">
                  Extracted Question / Task from Image
                </span>
                <p className="text-sm font-medium text-white leading-relaxed">
                  "{analysisResult.extractedQuestion}"
                </p>
              </div>

              {/* Solution Code / Output */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase text-sky-400 font-semibold block">
                  Generated Solution
                </span>
                <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed select-text">
                  <code>{analysisResult.suggestedSolution}</code>
                </pre>
              </div>

              {/* Step-by-Step Technical Explanation */}
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                <span className="text-xs font-mono uppercase text-slate-300 font-semibold block">
                  Technical Explanation
                </span>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {analysisResult.explanation}
                </p>
              </div>

              {/* Test Cases if present */}
              {analysisResult.testCases && analysisResult.testCases.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                  <span className="text-xs font-mono uppercase text-slate-300 font-semibold block">
                    Validation Checks / Test Cases
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {analysisResult.testCases.map((tc, i) => (
                      <li key={i} className="flex items-start gap-2 font-mono text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                        <span>{tc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Uncertainty / Caveats if any */}
              {analysisResult.uncertaintyNotes && (
                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/30 text-xs text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{analysisResult.uncertaintyNotes}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
