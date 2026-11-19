import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useInterviewStore } from '../store/useInterviewStore';
import { useProfileStore } from '../store/useProfileStore';
import { geminiClient, safeParseJsonResponse } from '../services/geminiClient';

const BRIDGE_HTTP = 'http://127.0.0.1:38291';
const BRIDGE_WS = 'ws://127.0.0.1:38291/ws';
const LEADER_KEY = 'copilot_stealth_bridge_leader';

interface QueuedAudioJob {
  wavBase64: string;
  speakerRole: 'interviewer' | 'interviewee';
}

export function useStealthNeuralBridge(enabled: boolean = true) {
  const { setStealthBridgeState, setIsBraveBrowser } = useAppStore();
  const {
    addTranscriptItem,
    addDetectedQuestion,
    setActiveAnswer,
  } = useInterviewStore();
  const { getProfileSummaryForPrompt } = useProfileStore();

  const tabIdRef = useRef<string>(`tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const audioQueueRef = useRef<QueuedAudioJob[]>([]);
  const activeWorkersRef = useRef<number>(0);
  const quotaPauseUntilRef = useRef<number>(0);
  const epochRef = useRef<number>(0);
  const lastClearSeqRef = useRef<number | null>(null);
  const latestAnswerSeqRef = useRef<number>(0);
  const latestDetectSeqRef = useRef<number>(0);
  const lastAutoAnswerTimeRef = useRef<number>(0);
  const lastTranscriptBySpeakerRef = useRef<{ interviewer: string; interviewee: string }>({
    interviewer: '',
    interviewee: '',
  });
  const lastTranscriptBufferRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });
  const lastAnsweredNormRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      setStealthBridgeState('disabled');
      return;
    }

    let cancelled = false;
    let timerId: number | null = null;
    let wsRetryTimer: number | null = null;
    let ws: WebSocket | null = null;
    let wsConnected = false;
    let wsFailures = 0;
    let connected = false;
    let directFailures = 0;
    let hiddenIframe: HTMLIFrameElement | null = null;

    const braveApi = (navigator as any).brave;
    if (braveApi && typeof braveApi.isBrave === 'function') {
      Promise.resolve(braveApi.isBrave())
        .then((res: boolean) => {
          if (!cancelled) setIsBraveBrowser(!!res);
        })
        .catch(() => {});
    }

    const isIframe = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

    const relayTargetRef = { win: null as Window | null, origin: '', lastSeen: 0 };

    const cleanupHiddenIframe = () => {
      if (hiddenIframe) {
        try {
          if (hiddenIframe.parentNode) {
            hiddenIframe.parentNode.removeChild(hiddenIframe);
          }
        } catch {}
        hiddenIframe = null;
      }
    };

    const ensureHiddenIframeFallback = () => {
      if (cancelled || isIframe || hiddenIframe || wsConnected) return;
      try {
        const iframe = document.createElement('iframe');
        iframe.src = `${BRIDGE_HTTP}/relay?origin=${encodeURIComponent(window.location.origin)}`;
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        iframe.style.position = 'fixed';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = '0';
        iframe.style.opacity = '0';
        iframe.style.pointerEvents = 'none';
        iframe.style.left = '-9999px';
        iframe.style.top = '-9999px';
        document.body.appendChild(iframe);
        hiddenIframe = iframe;
      } catch {}
    };

    const postToStealth = async (payload: Record<string, any>) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(payload));
          return;
        } catch {}
      }
      if (
        relayTargetRef.win &&
        !relayTargetRef.win.closed &&
        Date.now() - relayTargetRef.lastSeen < 8000
      ) {
        try {
          relayTargetRef.win.postMessage(
            { source: 'copilot-web-app', type: 'result', payload },
            relayTargetRef.origin || BRIDGE_HTTP
          );
          return;
        } catch {}
      }
      try {
        await fetch(`${BRIDGE_HTTP}/result`, {
          method: 'POST',
          mode: 'cors',
          credentials: 'omit',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {}
    };

    let cooldownSent = false;
    let cooldownClearTimer: number | null = null;

    const notifyGeminiCooldown = (active: boolean, durationMs: number = 0) => {
      if (cooldownClearTimer !== null) {
        window.clearTimeout(cooldownClearTimer);
        cooldownClearTimer = null;
      }
      if (active) {
        if (!cooldownSent) {
          cooldownSent = true;
          void postToStealth({ type: 'cooldown', active: true });
        }
        if (durationMs > 0) {
          cooldownClearTimer = window.setTimeout(() => {
            if (!cancelled && Date.now() >= quotaPauseUntilRef.current) {
              notifyGeminiCooldown(false);
            }
          }, durationMs + 150);
        }
      } else if (cooldownSent) {
        cooldownSent = false;
        void postToStealth({ type: 'cooldown', active: false });
      }
    };

    const formatCleanError = (rawInput: any, fallback: string): string => {
      const raw = String(rawInput?.message || rawInput || fallback).trim();
      const status = Number(rawInput?.status || 0);
      const retrySec = Number(rawInput?.retryAfterSec || 0);
      if (
        status === 429 ||
        raw.includes('429') ||
        raw.includes('RESOURCE_EXHAUSTED') ||
        raw.toLowerCase().includes('quota') ||
        raw.toLowerCase().includes('rate limit')
      ) {
        const waitSec = retrySec >= 5 ? Math.min(60, retrySec) : 20;
        quotaPauseUntilRef.current = Date.now() + waitSec * 1000;
        notifyGeminiCooldown(true, waitSec * 1000);
        return `Gemini quota cooldown (${waitSec}s) — local speech active`;
      }
      if (raw.startsWith('{')) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.error?.message) {
            return String(parsed.error.message).slice(0, 90);
          }
        } catch {}
      }
      if (raw.includes('<!doctype') || raw.includes('Unexpected token')) {
        return 'Server reconnecting — retrying shortly...';
      }
      return raw.slice(0, 90) || fallback;
    };

    const isConnectLaunch =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('bridge') === 'connect';

    const claimLeadership = (force: boolean = false): boolean => {
      if (isIframe) return true;
      try {
        const now = Date.now();
        if (!force) {
          const raw = localStorage.getItem(LEADER_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.id !== tabIdRef.current && now - parsed.ts < 6000) {
              return false;
            }
          }
        }
        localStorage.setItem(LEADER_KEY, JSON.stringify({ id: tabIdRef.current, ts: now }));
        return true;
      } catch {
        return true;
      }
    };

    if (isConnectLaunch) {
      claimLeadership(true);
    }

    const answerAndPush = async (questionText: string, category: any = 'general', isManual: boolean = false) => {
      const cleanQ = questionText.trim();
      if (!cleanQ) return;

      const words = cleanQ.split(/\s+/).filter(Boolean);
      if (!isManual) {
        if (words.length < 4) return;
        if (quotaPauseUntilRef.current > Date.now()) return;
      }

      const norm = cleanQ.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
      const now = Date.now();
      if (!isManual && lastAnsweredNormRef.current.text === norm && now - lastAnsweredNormRef.current.time < 8000) {
        return;
      }
      if (!isManual && now - lastAutoAnswerTimeRef.current < 3000) {
        return;
      }

      lastAnsweredNormRef.current = { text: norm, time: now };
      if (!isManual) {
        lastAutoAnswerTimeRef.current = now;
      }

      const myEpoch = epochRef.current;
      latestAnswerSeqRef.current += 1;
      const myAnswerSeq = latestAnswerSeqRef.current;

      await postToStealth({ type: 'status', message: `Analyzing: ${cleanQ.slice(0, 60)}` });

      try {
        const storeState = useInterviewStore.getState();
        const historyText = storeState.transcripts
          .slice(-8)
          .map((t) => `${t.speaker}: ${t.text}`)
          .join('\n');

        const ans = await geminiClient.generateAnswer({
          question: cleanQ,
          category,
          length: storeState.responseLength || 'standard',
          profileContext: getProfileSummaryForPrompt(),
          conversationContext: historyText,
        });

        if (cancelled || myEpoch !== epochRef.current || myAnswerSeq !== latestAnswerSeqRef.current) {
          return;
        }

        addDetectedQuestion({
          text: cleanQ,
          category,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          confidence: 0.95,
          urgency: 'high',
          suggestedAnswer: ans,
        });
        setActiveAnswer(ans);

        await postToStealth({
          type: 'answer',
          question: cleanQ,
          answer: ans.answer,
          keyPoints: ans.keyPoints || [],
          codeSnippet: ans.codeSnippet || '',
        });
      } catch (err: any) {
        if (cancelled || myEpoch !== epochRef.current || myAnswerSeq !== latestAnswerSeqRef.current) {
          return;
        }
        await postToStealth({
          type: 'status',
          message: formatCleanError(err, 'Failed to generate answer'),
        });
      }
    };

    const trimOverlapWords = (prev: string, next: string): string => {
      if (!prev || !next) return next;
      const pWords = prev.trim().split(/\s+/);
      const nWords = next.trim().split(/\s+/);
      const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
      const maxOverlap = Math.min(6, pWords.length, nWords.length);
      for (let k = maxOverlap; k >= 2; k--) {
        let matched = true;
        for (let i = 0; i < k; i++) {
          if (norm(pWords[pWords.length - k + i]) !== norm(nWords[i])) {
            matched = false;
            break;
          }
        }
        if (matched) {
          return nWords.slice(k).join(' ').trim();
        }
      }
      return next;
    };

    // Zero-quota local interview question detector (reserves Gemini 4 Hydrogen quota 100% for AI answers)
    const handleQuestionAnalysis = (cleanText: string) => {
      const now = Date.now();
      const combinedText =
        now - lastTranscriptBufferRef.current.time < 7500 && lastTranscriptBufferRef.current.text
          ? `${lastTranscriptBufferRef.current.text} ${cleanText}`.slice(-320)
          : cleanText;
      lastTranscriptBufferRef.current = { text: combinedText, time: now };

      const trimmed = cleanText.trim();
      const combinedWords = combinedText.trim().split(/\s+/).filter(Boolean).length;
      const startsQuestion =
        /^(what|whats|what's|how|hows|how's|why|when|where|who|whose|whom|which|can|could|would|will|should|shall|do|does|did|have|has|had|are|is|was|were|tell me|walk me through|talk me through|give me an example|share an example|explain|describe|compare|contrast)\b/i;
      const embeddedQuestion =
        /\b(tell me about|walk me through|give me an example|explain how|describe a time|how would you|how do you|what happens when|what is your approach|have you ever|are you familiar with|why did you|what tools|what frameworks)\b|\?$/i;

      if ((startsQuestion.test(trimmed) || embeddedQuestion.test(trimmed)) && combinedWords >= 4) {
        lastTranscriptBufferRef.current = { text: '', time: 0 };
        void answerAndPush(combinedText, 'qa_technical', false);
      }
    };

    const commitSpokenText = async (
      speakerRole: 'interviewer' | 'interviewee',
      rawText: string,
      myEpoch: number
    ) => {
      if (cancelled || myEpoch !== epochRef.current) return;
      const cleanedRaw = rawText.replace(/\s+/g, ' ').trim();
      const isNoiseTag = /^\[(no_speech|silence|inaudible|noise|music|blank)\]$/i.test(cleanedRaw);
      if (cleanedRaw.length < 2 || isNoiseTag) return;

      const prevForSpeaker = lastTranscriptBySpeakerRef.current[speakerRole] || '';
      const deduped = trimOverlapWords(prevForSpeaker, cleanedRaw);
      const cleanText = deduped.trim();
      if (cleanText.length < 2) return;

      lastTranscriptBySpeakerRef.current[speakerRole] = `${prevForSpeaker} ${cleanText}`
        .trim()
        .slice(-240);

      const nowStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      addTranscriptItem({
        timestamp: nowStr,
        speaker: speakerRole === 'interviewee' ? 'candidate' : 'interviewer',
        text: cleanText,
      });

      await postToStealth({
        type: 'transcript',
        speaker: speakerRole,
        transcript: cleanText,
      });

      if (speakerRole === 'interviewer' && myEpoch === epochRef.current) {
        handleQuestionAnalysis(cleanText);
      }
    };

    // Tier 1: Persistent Gemini Live API Streaming Transcription (gemini-3.5-transcribe-live)
    interface LiveChannelState {
      ws: WebSocket | null;
      ready: boolean;
      connecting: boolean;
      failed: boolean;
      retryTimer: number | null;
      buf: string;
      flushTimer: number | null;
      lastInterimAt: number;
      pendingPcm: string[];
    }

    const createLiveChannel = (): LiveChannelState => ({
      ws: null,
      ready: false,
      connecting: false,
      failed: false,
      retryTimer: null,
      buf: '',
      flushTimer: null,
      lastInterimAt: 0,
      pendingPcm: [],
    });

    const liveChannels: Record<'interviewer' | 'interviewee', LiveChannelState> = {
      interviewer: createLiveChannel(),
      interviewee: createLiveChannel(),
    };

    const flushLiveBuffer = (speakerRole: 'interviewer' | 'interviewee', myEpoch: number) => {
      const ch = liveChannels[speakerRole];
      if (ch.flushTimer !== null) {
        window.clearTimeout(ch.flushTimer);
        ch.flushTimer = null;
      }
      const text = ch.buf.replace(/\s+/g, ' ').trim();
      ch.buf = '';
      if (text.length >= 2) {
        void commitSpokenText(speakerRole, text, myEpoch);
      }
    };

    const closeLiveChannels = () => {
      (['interviewer', 'interviewee'] as const).forEach((role) => {
        const ch = liveChannels[role];
        if (ch.retryTimer !== null) {
          window.clearTimeout(ch.retryTimer);
          ch.retryTimer = null;
        }
        if (ch.flushTimer !== null) {
          window.clearTimeout(ch.flushTimer);
          ch.flushTimer = null;
        }
        ch.buf = '';
        ch.pendingPcm = [];
        ch.ready = false;
        ch.connecting = false;
        if (ch.ws) {
          try { ch.ws.close(); } catch {}
          ch.ws = null;
        }
      });
    };

    const ensureLiveChannel = (speakerRole: 'interviewer' | 'interviewee') => {
      if (cancelled || quotaPauseUntilRef.current > Date.now()) return;
      const ch = liveChannels[speakerRole];
      if (ch.ready || ch.connecting) return;
      if (ch.ws && (ch.ws.readyState === WebSocket.OPEN || ch.ws.readyState === WebSocket.CONNECTING)) {
        return;
      }

      ch.connecting = true;
      const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${wsProto}//${window.location.host}/api/live-transcribe?speaker=${speakerRole}`;

      try {
        const socket = new WebSocket(url);
        ch.ws = socket;

        socket.onmessage = (ev) => {
          if (cancelled || ch.ws !== socket) return;
          try {
            const msg = JSON.parse(ev.data);
            const myEpoch = epochRef.current;

            if (msg.type === 'ready') {
              ch.ready = true;
              ch.connecting = false;
              ch.failed = false;
              notifyGeminiCooldown(false);
              if (ch.pendingPcm.length > 0 && socket.readyState === WebSocket.OPEN) {
                const queued = ch.pendingPcm.splice(0, ch.pendingPcm.length);
                for (const frame of queued) {
                  try {
                    socket.send(JSON.stringify({ audio: frame }));
                  } catch {}
                }
              }
              return;
            }

            if (msg.type === 'interim' && typeof msg.text === 'string') {
              const txt = msg.text.replace(/\s+/g, ' ').trim();
              const now = Date.now();
              if (txt.length >= 2 && now - ch.lastInterimAt > 150) {
                ch.lastInterimAt = now;
                void postToStealth({
                  type: 'interim',
                  speaker: speakerRole,
                  transcript: ch.buf ? `${ch.buf} ${txt}` : txt,
                });
              }
              return;
            }

            if (msg.type === 'transcript' && typeof msg.text === 'string') {
              const frag = msg.text;
              if (!frag || !frag.trim()) return;
              // Preserve natural spacing between Live API chunks
              if (ch.buf && !/\s$/.test(ch.buf) && !/^\s/.test(frag) && !/^[.,?!';:)]/.test(frag)) {
                ch.buf += ' ';
              }
              ch.buf += frag;
              if (ch.flushTimer !== null) {
                window.clearTimeout(ch.flushTimer);
                ch.flushTimer = null;
              }
              const trimmedBuf = ch.buf.trim();
              if (/[.?!]$/.test(trimmedBuf) && trimmedBuf.length >= 6) {
                flushLiveBuffer(speakerRole, myEpoch);
              } else {
                ch.flushTimer = window.setTimeout(() => {
                  flushLiveBuffer(speakerRole, myEpoch);
                }, 950);
              }
              return;
            }

            if (msg.type === 'turnComplete') {
              flushLiveBuffer(speakerRole, myEpoch);
              return;
            }

            if (msg.type === 'error') {
              ch.ready = false;
              ch.connecting = false;
              ch.failed = true;
              const cleanMsg = formatCleanError(msg, 'Live transcription error');
              void postToStealth({ type: 'status', message: cleanMsg });
              try { socket.close(); } catch {}
            }
          } catch {}
        };

        socket.onerror = () => {
          ch.ready = false;
          ch.connecting = false;
          ch.failed = true;
        };

        socket.onclose = () => {
          if (ch.ws === socket) {
            ch.ws = null;
          }
          ch.ready = false;
          ch.connecting = false;
          if (!cancelled) {
            const waitMs = Math.max(4000, quotaPauseUntilRef.current - Date.now());
            if (ch.retryTimer !== null) window.clearTimeout(ch.retryTimer);
            ch.retryTimer = window.setTimeout(() => {
              if (!cancelled && connected) {
                ensureLiveChannel(speakerRole);
              }
            }, waitMs);
          }
        };
      } catch {
        ch.connecting = false;
        ch.ready = false;
        ch.failed = true;
      }
    };

    const drainAudioQueue = () => {
      if (cancelled || activeWorkersRef.current >= 1 || audioQueueRef.current.length === 0) {
        return;
      }
      const waitMs = quotaPauseUntilRef.current - Date.now();
      if (waitMs > 0) {
        notifyGeminiCooldown(true, waitMs);
        window.setTimeout(() => {
          if (!cancelled) drainAudioQueue();
        }, Math.min(waitMs, 10000));
        return;
      }
      notifyGeminiCooldown(false);

      const job = audioQueueRef.current.shift()!;
      const myEpoch = epochRef.current;
      activeWorkersRef.current = 1;

      void (async () => {
        try {
          const prevForSpeaker = lastTranscriptBySpeakerRef.current[job.speakerRole] || '';
          const trRes = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: job.wavBase64,
              mimeType: 'audio/wav',
              previousTranscript: prevForSpeaker,
            }),
          });

          if (cancelled || myEpoch !== epochRef.current) {
            return;
          }

          const trData = await safeParseJsonResponse<{ transcript?: string }>(
            trRes,
            'Transcription request failed'
          );
          if (cancelled || myEpoch !== epochRef.current) {
            return;
          }
          const rawText = typeof trData?.transcript === 'string' ? trData.transcript.trim() : '';
          await commitSpokenText(job.speakerRole, rawText, myEpoch);
        } catch (err: any) {
          if (cancelled || myEpoch !== epochRef.current) {
            return;
          }
          const cleanMsg = formatCleanError(err, 'Transcription paused briefly');
          await postToStealth({
            type: 'status',
            message: cleanMsg,
          });
        } finally {
          activeWorkersRef.current = 0;
          if (!cancelled && audioQueueRef.current.length > 0) {
            drainAudioQueue();
          }
        }
      })();
    };

    const processBridgeData = (data: any) => {
      if (cancelled) return;
      connected = true;
      directFailures = 0;

      const incomingClearSeq = typeof data?.clearSeq === 'number' ? data.clearSeq : null;
      if (incomingClearSeq !== null) {
        if (lastClearSeqRef.current === null) {
          lastClearSeqRef.current = incomingClearSeq;
        } else if (incomingClearSeq !== lastClearSeqRef.current) {
          lastClearSeqRef.current = incomingClearSeq;
          epochRef.current += 1;
          latestAnswerSeqRef.current += 1;
          latestDetectSeqRef.current += 1;
          audioQueueRef.current = [];
          liveChannels.interviewer.buf = '';
          liveChannels.interviewee.buf = '';
          lastTranscriptBySpeakerRef.current = { interviewer: '', interviewee: '' };
          lastTranscriptBufferRef.current = { text: '', time: 0 };
          lastAnsweredNormRef.current = { text: '', time: 0 };
          quotaPauseUntilRef.current = 0;
          notifyGeminiCooldown(false);
        }
      }

      setStealthBridgeState(
        'connected',
        {
          speaker: Number(data?.peak || 0),
          mic: Number(data?.micPeak || 0),
        },
        {
          speakerError: String(data?.speakerError || ''),
          micError: String(data?.micError || ''),
        },
        ''
      );

      // Keep Live API WebSockets active for both interviewer (system audio) and interviewee (mic)
      if (quotaPauseUntilRef.current <= Date.now()) {
        ensureLiveChannel('interviewer');
        ensureLiveChannel('interviewee');
      }

      const livePcmBase64 = typeof data?.livePcmBase64 === 'string' ? data.livePcmBase64.trim() : '';
      const liveSpeaker: 'interviewer' | 'interviewee' =
        data?.livePcmSpeaker === 'interviewee' ? 'interviewee' : 'interviewer';
      const wavBase64 = typeof data?.wavBase64 === 'string' ? data.wavBase64.trim() : '';
      const askQuestion = typeof data?.askQuestion === 'string' ? data.askQuestion.trim() : '';
      const speakerRole: 'interviewer' | 'interviewee' =
        data?.speaker === 'interviewee' ? 'interviewee' : 'interviewer';

      if (askQuestion.length >= 2) {
        void answerAndPush(askQuestion, 'general', true);
      }

      if (livePcmBase64.length >= 64) {
        if (quotaPauseUntilRef.current <= Date.now()) {
          ensureLiveChannel(liveSpeaker);
        }
        const liveCh = liveChannels[liveSpeaker];
        if (liveCh.ready && liveCh.ws && liveCh.ws.readyState === WebSocket.OPEN) {
          try {
            liveCh.ws.send(JSON.stringify({ audio: livePcmBase64 }));
          } catch {}
        } else if (quotaPauseUntilRef.current <= Date.now()) {
          if (liveCh.pendingPcm.length >= 24) {
            liveCh.pendingPcm.shift();
          }
          liveCh.pendingPcm.push(livePcmBase64);
        }
      }

      // Only queue REST WAV fallback if Live API streaming channel is not active for this speaker
      if (wavBase64.length >= 400) {
        const liveCh = liveChannels[speakerRole];
        if (!liveCh.ready) {
          if (audioQueueRef.current.length >= 4) {
            audioQueueRef.current.shift();
          }
          audioQueueRef.current.push({ wavBase64, speakerRole });
          drainAudioQueue();
        }
      }
    };

    const connectWebSocket = () => {
      if (cancelled || isIframe || !claimLeadership() || wsFailures >= 3) return;
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        return;
      }
      try {
        const socket = new WebSocket(BRIDGE_WS);
        ws = socket;

        socket.onopen = () => {
          if (cancelled) {
            try { socket.close(); } catch {}
            return;
          }
          wsConnected = true;
          wsFailures = 0;
          connected = true;
          cleanupHiddenIframe();
          claimLeadership(true);
        };

        socket.onmessage = (ev) => {
          if (cancelled) return;
          try {
            const data = JSON.parse(ev.data);
            processBridgeData(data);
          } catch {}
        };

        socket.onerror = () => {
          wsConnected = false;
        };

        socket.onclose = () => {
          if (ws === socket) {
            ws = null;
          }
          if (!wsConnected) {
            wsFailures += 1;
          }
          wsConnected = false;
          if (!cancelled && wsFailures < 3) {
            if (wsRetryTimer !== null) window.clearTimeout(wsRetryTimer);
            wsRetryTimer = window.setTimeout(connectWebSocket, 2500);
          }
        };
      } catch {
        wsConnected = false;
        wsFailures += 1;
      }
    };

    const handleRelayMessage = (event: MessageEvent) => {
      if (cancelled) return;
      if (
        event.origin !== 'http://127.0.0.1:38291' &&
        event.origin !== 'http://localhost:38291'
      ) {
        return;
      }
      if (event.data?.source !== 'copilot-local-relay' || event.data?.type !== 'audio-poll') {
        return;
      }
      if (event.source && typeof (event.source as Window).postMessage === 'function') {
        relayTargetRef.win = event.source as Window;
        relayTargetRef.origin = event.origin;
        relayTargetRef.lastSeen = Date.now();
      }
      claimLeadership(true);
      processBridgeData(event.data.data);
    };

    const pollOnce = async () => {
      if (cancelled) return;

      if (wsConnected) {
        timerId = window.setTimeout(pollOnce, 1000);
        return;
      }

      if (
        relayTargetRef.win &&
        !relayTargetRef.win.closed &&
        Date.now() - relayTargetRef.lastSeen < 4000
      ) {
        timerId = window.setTimeout(pollOnce, 1000);
        return;
      }

      if (!claimLeadership()) {
        timerId = window.setTimeout(pollOnce, 2500);
        return;
      }

      const controller = new AbortController();
      const timeoutMs = connected ? 2500 : 1200;
      const abortTimer = window.setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(`${BRIDGE_HTTP}/next-audio?wait=250`, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          signal: controller.signal,
        });
        window.clearTimeout(abortTimer);

        if (!res.ok) {
          connected = false;
          setStealthBridgeState(
            isIframe ? 'iframe-blocked' : 'waiting',
            { speaker: 0, mic: 0 },
            undefined,
            `HTTP ${res.status}`
          );
          timerId = window.setTimeout(pollOnce, 2500);
          return;
        }

        const data = await res.json();
        processBridgeData(data);
        if (!wsConnected && !wsRetryTimer && wsFailures < 3) {
          connectWebSocket();
        }
      } catch (err: any) {
        window.clearTimeout(abortTimer);
        if (wsConnected || Date.now() - relayTargetRef.lastSeen < 4000) {
          timerId = window.setTimeout(pollOnce, 1000);
          return;
        }
        connected = false;
        directFailures += 1;
        if (!isIframe && directFailures >= 2) {
          ensureHiddenIframeFallback();
        }
        const errMsg =
          err?.name === 'AbortError'
            ? 'Timeout waiting for 127.0.0.1:38291'
            : err?.message || 'Blocked or .bat not running';
        setStealthBridgeState(
          isIframe ? 'iframe-blocked' : 'waiting',
          { speaker: 0, mic: 0 },
          undefined,
          errMsg
        );
      }

      if (!cancelled) {
        timerId = window.setTimeout(pollOnce, connected ? 20 : 2500);
      }
    };

    const handleRetry = () => {
      if (cancelled) return;
      if (timerId !== null) {
        window.clearTimeout(timerId);
        timerId = null;
      }
      connected = false;
      directFailures = 0;
      wsFailures = 0;
      cleanupHiddenIframe();
      claimLeadership(true);
      connectWebSocket();
      void pollOnce();
    };

    window.addEventListener('message', handleRelayMessage);
    window.addEventListener('copilot-bridge-retry', handleRetry);
    connectWebSocket();
    timerId = window.setTimeout(pollOnce, isConnectLaunch ? 50 : 250);

    return () => {
      cancelled = true;
      window.removeEventListener('message', handleRelayMessage);
      window.removeEventListener('copilot-bridge-retry', handleRetry);
      if (timerId !== null) window.clearTimeout(timerId);
      if (wsRetryTimer !== null) window.clearTimeout(wsRetryTimer);
      if (cooldownClearTimer !== null) window.clearTimeout(cooldownClearTimer);
      closeLiveChannels();
      if (ws) {
        try { ws.close(); } catch {}
        ws = null;
      }
      cleanupHiddenIframe();
    };
  }, [enabled, addTranscriptItem, addDetectedQuestion, setActiveAnswer, getProfileSummaryForPrompt, setStealthBridgeState, setIsBraveBrowser]);
}
