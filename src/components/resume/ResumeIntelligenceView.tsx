import React, { useState, useRef } from 'react';
import { useProfileStore } from '../../store/useProfileStore';
import { geminiClient } from '../../services/geminiClient';
import {
  FileText,
  Upload,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Briefcase,
  Layers,
  Sparkles,
  ClipboardPaste,
  FileType,
} from 'lucide-react';

export const ResumeIntelligenceView: React.FC = () => {
  const { profile, updateProfile, resetToDefault } = useProfileStore();

  const [isParsing, setIsParsing] = useState(false);
  const [parseSuccess, setParseSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'experience' | 'projects' | 'upload'>('upload');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const cleanErrorMessage = (msg: string): string => {
    if (!msg) return 'Resume parsing failed. Please try again or paste your resume text.';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Connection lost') || msg.includes('Upload timed out')) {
      return 'Network connection timed out or interrupted while uploading document. Mobile browsers often drop multi-megabyte file uploads. Please copy & paste your resume text directly into the box below (100% reliable) or try a smaller PDF/Word file.';
    }
    if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
      return 'The AI model is experiencing a brief high-demand spike. We have activated our backup model pool. Please try uploading again or paste your resume text below for instant parsing.';
    }
    if (msg.includes('{')) {
      try {
        const parsed = JSON.parse(msg);
        return parsed?.error?.message || parsed?.message || msg;
      } catch {
        // ignore
      }
    }
    return msg;
  };

  const processFile = async (file: File) => {
    setIsParsing(true);
    setErrorMsg(null);
    setParseSuccess(false);

    // Guard: Prevent mobile connection drop on files > 8MB
    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Mobile networks often drop uploads over 8MB. Please upload a smaller PDF/Word document, or simply copy & paste your resume text into the box below.`
      );
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const fileName = file.name.toLowerCase();
    const isPlainText = fileName.endsWith('.txt') || fileName.endsWith('.md') || file.type === 'text/plain';

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const content = reader.result as string;
          let parsed: any;

          if (isPlainText) {
            parsed = await geminiClient.parseResume({
              documentText: content,
              fileName: file.name,
            });
          } else {
            let detectedMime = file.type;
            if (!detectedMime) {
              if (fileName.endsWith('.pdf')) detectedMime = 'application/pdf';
              else if (fileName.endsWith('.docx')) detectedMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
              else if (fileName.endsWith('.doc')) detectedMime = 'application/msword';
              else detectedMime = 'application/pdf';
            }

            parsed = await geminiClient.parseResume({
              documentBase64: content,
              mimeType: detectedMime,
              fileName: file.name,
            });
          }

          if (parsed && (parsed.name || parsed.title || parsed.summary)) {
            updateProfile(parsed);
            setParseSuccess(true);
            setActiveTab('profile');
            setTimeout(() => setParseSuccess(false), 5000);
          } else {
            throw new Error('Could not extract structured data. Please verify file content or paste your resume text below.');
          }
        } catch (err: any) {
          setErrorMsg(cleanErrorMessage(err.message));
        } finally {
          setIsParsing(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };

      reader.onerror = () => {
        setErrorMsg('Error reading file from disk. Please try another file or paste text directly.');
        setIsParsing(false);
      };

      if (isPlainText) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      setErrorMsg(cleanErrorMessage(err.message));
      setIsParsing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    processFile(e.target.files[0]);
  };

  const handleInsertSampleResume = () => {
    setPasteText(`Candidate Name: Alex Mercer
Title: Senior QA Automation Engineer & QA Lead
Total Experience: 14+ years (11+ years automation testing)

Professional Summary:
Accomplished Senior QA Automation Architect and Quality Engineering Lead with extensive hands-on experience designing, scaling, and maintaining enterprise-grade test automation frameworks. Specialized in Selenium WebDriver, Playwright, Java, TypeScript, and Cucumber BDD across financial and cloud platforms. Proven track record of reducing regression testing cycles by 75% and driving 99.2% automated pipeline pass rates.

Core Technical Skills:
- Programming & Scripting: Java, TypeScript, JavaScript, SQL, Python, Bash
- Frameworks & Libraries: Selenium WebDriver, Playwright, TestNG, Cucumber BDD, JUnit, REST Assured, Cypress
- Build & CI/CD: Maven, Gradle, Jenkins, GitHub Actions, Docker, Kubernetes
- Databases & Tools: MySQL, PostgreSQL, Oracle DB, Postman, Git, Jira, YouTrack, Allure Reports

Professional Experience:
1. Lead QA Automation Architect | Apex Financial Solutions (2020 - Present)
- Architected a modular parallel Playwright and TypeScript framework with dynamic explicit waits and Page Object Model, cutting regression runs from 16 hours to 40 minutes.
- Integrated automated smoke and regression suites into Jenkins CI/CD pipelines with real-time Slack and Allure alerts.
- Mentored a distributed team of 8 QA engineers on automation best practices and code review standards.

2. Senior Automation Test Engineer | CloudCore Systems (2015 - 2020)
- Developed and maintained hybrid Selenium WebDriver with Java and TestNG frameworks covering 1,800+ end-to-end regression test cases.
- Implemented robust database validation scripts using JDBC and MySQL to verify transactional state across microservices.
- Championed BDD adoption with Cucumber, aligning product owners, developers, and testers around Gherkin specifications.`);
  };

  const handleParseText = async () => {
    if (!pasteText.trim()) {
      setErrorMsg('Please paste your resume text before parsing.');
      return;
    }
    setIsParsing(true);
    setErrorMsg(null);
    setParseSuccess(false);

    try {
      const parsed = await geminiClient.parseResume({ documentText: pasteText });
      if (parsed && (parsed.name || parsed.title || parsed.summary)) {
        updateProfile(parsed);
        setParseSuccess(true);
        setActiveTab('profile');
        setPasteText('');
        setTimeout(() => setParseSuccess(false), 5000);
      } else {
        throw new Error('Could not parse resume text. Please ensure it contains work experience or technical skills.');
      }
    } catch (err: any) {
      setErrorMsg(cleanErrorMessage(err.message));
    } finally {
      setIsParsing(false);
    }
  };

  const handleRemoveSkill = (type: 'programmingLanguages' | 'automationFrameworks' | 'testTools', skill: string) => {
    const current = profile[type] || [];
    updateProfile({ [type]: current.filter((s) => s !== skill) });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-950">
      {/* Top Header */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            <span>Resume Intelligence & Professional Profile</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload or paste your resume to ground live AI responses in your authentic career experience.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx,.doc,.txt,.md"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsing}
            className="px-3.5 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            {isParsing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Parsing Document...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Resume File</span>
              </>
            )}
          </button>

          <button
            onClick={resetToDefault}
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Reset to Default Profile
          </button>
        </div>
      </div>

      {parseSuccess && (
        <div className="bg-emerald-950/80 border-b border-emerald-800 px-6 py-2.5 text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Resume successfully parsed! Candidate profile has been updated and grounded for all live interviews.</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-950/80 border-b border-rose-800 px-6 py-3 text-xs text-rose-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <span className="leading-relaxed">{errorMsg}</span>
            {activeTab !== 'upload' && (
              <div className="pt-0.5">
                <button
                  onClick={() => setActiveTab('upload')}
                  className="text-xs font-semibold text-rose-300 underline hover:text-white cursor-pointer"
                >
                  Switch to Text Paste tab &rarr;
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Form Tabs */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-5xl mx-auto w-full">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs w-fit">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload or Paste Resume</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            General Profile & Summary
          </button>
          <button
            onClick={() => setActiveTab('experience')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'experience' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Employment History ({profile.employmentHistory.length})
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'projects' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Featured Framework Projects
          </button>
        </div>

        {/* Tab 1: Upload & Paste Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            {/* File Upload Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-slate-700 hover:border-purple-500/80 rounded-2xl bg-slate-900/40 hover:bg-slate-900/70 transition-all flex flex-col items-center justify-center text-center cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                {isParsing ? (
                  <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>
              <p className="text-sm font-semibold text-white">
                {isParsing ? 'Analyzing and Extracting Career Details...' : 'Click or Drag & Drop Resume File'}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Supports <strong>PDF</strong>, Microsoft Word (<strong>.docx</strong>, <strong>.doc</strong>), and plain text (<strong>.txt</strong>).
              </p>
              <span className="mt-2 text-[11px] font-mono text-purple-400/80 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-900/40">
                Max recommended file size: 8 MB
              </span>
            </div>

            {/* Direct Text Paste Box */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
                  <ClipboardPaste className="w-4 h-4" />
                  <span>Or Paste Resume / CV Text Directly</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleInsertSampleResume}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium underline cursor-pointer"
                  >
                    Load Sample Senior QA Lead Resume
                  </button>
                  <span className="text-slate-600">·</span>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    100% Reliable & Fast
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                If your file is protected, formatted with complex tables, or fails to upload, simply copy your resume text and paste it here:
              </p>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste candidate work history, skills, frameworks, and job titles here... (e.g. Senior QA Automation Engineer with 12+ years experience in Selenium, Playwright, Java, TypeScript...)"
                rows={7}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-indigo-500 font-mono"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 font-mono">
                  {pasteText.length > 0 ? `${pasteText.length} characters` : 'No text entered yet'}
                </span>
                <button
                  onClick={handleParseText}
                  disabled={isParsing || !pasteText.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  {isParsing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Extracting Profile...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Parse & Ground Profile</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Profile General Info */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase font-mono mb-1.5">
                  Candidate Title
                </label>
                <input
                  type="text"
                  value={profile.title}
                  onChange={(e) => updateProfile({ title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase font-mono mb-1.5">
                  Total QA Experience (Years)
                </label>
                <input
                  type="number"
                  value={profile.yearsExperience}
                  onChange={(e) => updateProfile({ yearsExperience: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase font-mono mb-1.5">
                  Automation Testing Experience (Years)
                </label>
                <input
                  type="number"
                  value={profile.automationExperience}
                  onChange={(e) => updateProfile({ automationExperience: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Professional Summary */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase font-mono mb-1.5">
                Executive Professional Summary
              </label>
              <textarea
                value={profile.summary}
                onChange={(e) => updateProfile({ summary: e.target.value })}
                rows={5}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            {/* Skill Matrices */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Programming Languages */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <span className="text-xs font-mono uppercase text-slate-300 font-semibold block">
                  Languages & Scripting
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.programmingLanguages.map((lang) => (
                    <span
                      key={lang}
                      className="px-2 py-1 rounded bg-slate-800 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700"
                    >
                      <span>{lang}</span>
                      <button
                        onClick={() => handleRemoveSkill('programmingLanguages', lang)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Automation Frameworks */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <span className="text-xs font-mono uppercase text-slate-300 font-semibold block">
                  Automation Frameworks
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.automationFrameworks.map((fw) => (
                    <span
                      key={fw}
                      className="px-2 py-1 rounded bg-slate-800 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700"
                    >
                      <span>{fw}</span>
                      <button
                        onClick={() => handleRemoveSkill('automationFrameworks', fw)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Tools & CI/CD */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <span className="text-xs font-mono uppercase text-slate-300 font-semibold block">
                  CI/CD, Databases & Tools
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.testTools.map((tool) => (
                    <span
                      key={tool}
                      className="px-2 py-1 rounded bg-slate-800 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700"
                    >
                      <span>{tool}</span>
                      <button
                        onClick={() => handleRemoveSkill('testTools', tool)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Employment History */}
        {activeTab === 'experience' && (
          <div className="space-y-4">
            {profile.employmentHistory.map((rec, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-semibold text-white">{rec.role}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-xs text-indigo-300 font-medium">{rec.company}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">{rec.period}</span>
                </div>
                <ul className="space-y-1.5 pt-2 text-xs text-slate-300">
                  {rec.highlights.map((h, hIdx) => (
                    <li key={hIdx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Featured Projects */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            {profile.projects.map((proj, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">{proj.name}</h3>
                  <div className="flex gap-1.5">
                    {proj.technologies.map((t, tIdx) => (
                      <span key={tIdx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-300">{proj.description}</p>
                <div className="text-xs text-emerald-400 font-mono mt-1">
                  Outcomes: {proj.outcomes}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
