import React, { useState } from 'react';
import { Calendar, Clock, FileDown, History, Search } from 'lucide-react';
import type { InterviewSessionHistory } from '../../types';
import { useInterviewStore } from '../../store/useInterviewStore';

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0 ? `${hours} hr` : `${hours} hr ${remainingMinutes} min`;
}

function sessionMatches(session: InterviewSessionHistory, searchTerm: string): boolean {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return true;

  return [
    session.jobPosition,
    session.company,
    session.interviewType,
    ...session.transcripts.map((item) => item.text),
    ...session.detectedQuestions.map((question) => question.text),
  ].some((value) => value.toLowerCase().includes(query));
}

function exportSession(session: InterviewSessionHistory): void {
  const transcript = session.transcripts.length
    ? session.transcripts
        .map((item) => `- [${item.timestamp}] **${item.speaker}:** ${item.text}`)
        .join('\n')
    : '_No transcript entries were captured._';
  const questions = session.detectedQuestions.length
    ? session.detectedQuestions.map((question) => `- ${question.text}`).join('\n')
    : '_No questions were detected._';
  const answers = session.answers.length
    ? session.answers
        .map((answer) => `### ${answer.questionText}\n\n${answer.answer}`)
        .join('\n\n')
    : '_No suggested answers were saved._';
  const markdown = `# ${session.interviewType}

Date: ${new Date(session.date).toLocaleString()}
Duration: ${formatDuration(session.durationMinutes)}
Transcript entries: ${session.transcripts.length}

## Transcript
${transcript}

## Detected questions
${questions}

## Suggested answers
${answers}
`;
  const blobUrl = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown' }));
  const anchor = document.createElement('a');
  const filenameDate = new Date(session.date).toISOString().slice(0, 10);
  anchor.href = blobUrl;
  anchor.download = `Interview_Session_${filenameDate}.md`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

export const InterviewHistoryView: React.FC = () => {
  const { completedSessions, sessionHistoryError } = useInterviewStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const filteredSessions = completedSessions.filter((session) => sessionMatches(session, searchTerm));

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-950">
      <div className="border-b border-slate-800/80 bg-slate-900/50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-base font-semibold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <span>Interview Session History</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Saved transcripts, detected questions, and suggested answers stay on this device.
          </p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            aria-label="Search saved sessions"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search sessions or transcript"
            className="w-64 max-w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto space-y-4 max-w-5xl mx-auto w-full">
        {sessionHistoryError && (
          <div role="alert" className="rounded-lg border border-amber-800/70 bg-amber-950/30 px-4 py-3 text-xs text-amber-200">
            {sessionHistoryError}
          </div>
        )}

        <div className="text-xs text-slate-500">
          {filteredSessions.length} {filteredSessions.length === 1 ? 'session' : 'sessions'}
          {searchTerm.trim() && ` matching "${searchTerm.trim()}"`}
        </div>

        {filteredSessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 px-6 py-12 text-center">
            <History className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <h2 className="text-sm font-semibold text-slate-200">
              {completedSessions.length === 0 ? 'No saved sessions yet' : 'No matching sessions'}
            </h2>
            <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
              {completedSessions.length === 0
                ? 'Start a live session and stop listening to save its transcript here.'
                : 'Try a different search term.'}
            </p>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const expanded = expandedSessionId === session.id;
            return (
              <article
                key={session.id}
                className="rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {new Date(session.date).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formatDuration(session.durationMinutes)}
                      </span>
                      <span className="text-indigo-400">{session.interviewType}</span>
                    </div>
                    <h2 className="text-sm font-semibold text-white">
                      {session.jobPosition}
                      {session.company && <span className="text-slate-400 font-normal"> · {session.company}</span>}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {session.transcripts.length} transcript entries · {session.detectedQuestions.length} detected questions
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setExpandedSessionId(expanded ? null : session.id)}
                      aria-expanded={expanded}
                      className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-lg transition-colors"
                    >
                      {expanded ? 'Hide transcript' : 'View transcript'}
                    </button>
                    <button
                      type="button"
                      onClick={() => exportSession(session)}
                      className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Export Markdown</span>
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-slate-800 px-5 py-4 space-y-5">
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Transcript</h3>
                      {session.transcripts.length === 0 ? (
                        <p className="text-xs text-slate-500">No transcript entries were captured.</p>
                      ) : (
                        <ol className="space-y-2">
                          {session.transcripts.map((item) => (
                            <li key={item.id} className="text-xs text-slate-300 leading-relaxed">
                              <span className="font-mono text-slate-500">[{item.timestamp}] </span>
                              <span className="font-semibold capitalize text-indigo-300">{item.speaker}: </span>
                              {item.text}
                            </li>
                          ))}
                        </ol>
                      )}
                    </section>

                    {session.detectedQuestions.length > 0 && (
                      <section>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Detected questions</h3>
                        <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
                          {session.detectedQuestions.map((question) => (
                            <li key={question.id}>{question.text}</li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {session.answers.length > 0 && (
                      <section>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Suggested answers</h3>
                        <div className="space-y-3">
                          {session.answers.map((answer) => (
                            <div key={answer.id} className="rounded-lg bg-slate-950/70 border border-slate-800 p-3">
                              <h4 className="text-xs font-medium text-slate-200">{answer.questionText}</h4>
                              <p className="text-xs text-slate-400 mt-2 whitespace-pre-wrap">{answer.answer}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
