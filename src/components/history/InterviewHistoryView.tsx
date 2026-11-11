import React, { useState } from 'react';
import { useInterviewStore } from '../../store/useInterviewStore';
import {
  History,
  Download,
  Trash2,
  Calendar,
  Clock,
  Briefcase,
  ChevronRight,
  FileDown,
} from 'lucide-react';

export const InterviewHistoryView: React.FC = () => {
  const { transcripts, detectedQuestions, activeAnswer } = useInterviewStore();

  const [filterType, setFilterType] = useState('all');

  const mockPastSessions = [
    {
      id: 'sess-1',
      date: 'Nov 04, 2026',
      jobPosition: 'Lead QA Automation Engineer',
      company: 'FinTech Cloud Infrastructure',
      type: 'Technical & Architecture Round',
      duration: '45 mins',
      questionCount: 6,
      notes: 'Strong alignment on Playwright TypeScript migration, Jenkins pipelines, and flaky test elimination.',
    },
    {
      id: 'sess-2',
      date: 'Oct 28, 2026',
      jobPosition: 'Senior SDET / QA Architect',
      company: 'Enterprise SaaS Platforms',
      type: 'System Design & Coding',
      duration: '60 mins',
      questionCount: 8,
      notes: 'Focused on multi-threading in Selenium Java, database reconciliation in MySQL, and Page Object Model standards.',
    },
    {
      id: 'sess-3',
      date: 'Oct 15, 2026',
      jobPosition: 'QA Lead',
      company: 'Digital Health Solutions',
      type: 'Leadership & Behavioral Round',
      duration: '40 mins',
      questionCount: 5,
      notes: 'Covered STAR scenarios resolving critical release blockers with engineering managers and mentoring junior QA.',
    },
  ];

  const handleExportMarkdown = (session: typeof mockPastSessions[0]) => {
    const md = `# Interview Session Notes - ${session.jobPosition} (${session.company})
Date: ${session.date}
Type: ${session.type}
Duration: ${session.duration}
Questions Analyzed: ${session.questionCount}

## Summary & Review
${session.notes}

## Live Transcription Sample
- **Interviewer**: Could you walk me through your background and how you approach building an automation framework from scratch?
- **Candidate Answer**: With 14 years in QA and 11 focused on automation, I start by evaluating the application's technology stack—choosing Playwright with TypeScript or Selenium with Java...

---
*Exported from Interview Copilot AI - Windows Desktop Assistant*
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Interview_Notes_${session.company.replace(/\s+/g, '_')}_${session.date.replace(/[\s,]+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-950">
      {/* Top Header */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <span>Interview Session History</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Archive of past interview sessions, real-time transcripts, detected questions, and exported summaries.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 max-w-5xl mx-auto w-full">
        <div className="space-y-3">
          {mockPastSessions.map((session) => (
            <div
              key={session.id}
              className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{session.date}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{session.duration}</span>
                  </span>
                  <span>·</span>
                  <span className="text-indigo-400">{session.type}</span>
                </div>

                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">{session.jobPosition}</h3>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-slate-300 font-medium">{session.company}</span>
                </div>

                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  {session.notes}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleExportMarkdown(session)}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Export Markdown</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
