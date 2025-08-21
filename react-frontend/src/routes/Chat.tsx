// src/routes/Chat.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { RecordMessage } from '../components/RecordMessage';
import { postAudio } from '../lib/api';
import type { LayoutContext } from '../types/LayoutContext';

export type ChatMsg = {
  id: string;
  sender: 'me' | 'assistant' | 'system' | string;
  blobUrl: string;
  timestamp: number;
  duration?: number; // seconds
};

function generateId(prefix = 'msg') {
  const ts = Date.now();
  const rnd = Math.random().toString(36).slice(2, 11);
  return `${prefix}-${ts}-${rnd}`;
}

/** Robust duration probing for WebM/MP3 blobs */
async function probeDuration(blob: Blob, fallbackMs = 5000): Promise<number> {
  return new Promise(resolve => {
    const a = new Audio();
    const url = URL.createObjectURL(blob);
    let done = false;

    const finish = (val: number) => {
      if (done) return;
      done = true;
      URL.revokeObjectURL(url);
      a.src = '';
      resolve(val > 0 && isFinite(val) ? val : 0);
    };

    const onLoaded = () => {
      if (isFinite(a.duration) && a.duration > 0) return finish(a.duration);
      const onSeeked = () => finish(a.currentTime || a.duration || 0);
      a.addEventListener('seeked', onSeeked, { once: true });
      try {
        a.currentTime = 1e10; // force duration calc
      } catch {
        a.currentTime = 86400;
      }
      setTimeout(() => finish(a.duration || 0), 3000);
    };

    a.addEventListener('loadedmetadata', onLoaded, { once: true });
    a.addEventListener('error', () => finish(0), { once: true });
    a.src = url;
    a.load();

    setTimeout(() => finish(a.duration || 0), fallbackMs);
  });
}

/** Minimal, reliable audio manager (single active player, state-driven) */
function useAudioManager() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const audiosRef = useRef<Record<string, HTMLAudioElement>>({});
  const timersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const ensure = (id: string, url: string) => {
    let a = audiosRef.current[id];
    if (!a) {
      a = new Audio(url);
      a.preload = 'metadata';
      (a as any).playsInline = true;
      audiosRef.current[id] = a;

      a.addEventListener('ended', () => {
        clearInterval(timersRef.current[id]);
        setPlayingId(prev => (prev === id ? null : prev));
        setProgress(prev => ({ ...prev, [id]: 0 }));
      });

      a.addEventListener('pause', () => {
        if (playingId === id) {
          setPlayingId(null);
        }
      });
    } else if (a.src !== url) {
      a.src = url;
    }
    return a;
  };

  const play = async (id: string, url: string) => {
    // Pause any other active audio
    Object.entries(audiosRef.current).forEach(([otherId, other]) => {
      if (otherId !== id && !other.paused) {
        other.pause();
        clearInterval(timersRef.current[otherId]);
      }
    });

    const a = ensure(id, url);

    // If already playing, just update state
    if (playingId === id && !a.paused) {
      return;
    }

    setPlayingId(id); // flip UI instantly
    clearInterval(timersRef.current[id]);

    // Set up progress tracking
    timersRef.current[id] = setInterval(() => {
      setProgress(prev => ({ ...prev, [id]: a.currentTime }));
    }, 120);

    try {
      await a.play();
    } catch (err) {
      console.error('Error playing audio:', err);
      setPlayingId(null);
      clearInterval(timersRef.current[id]);
    }
  };

  const pause = (id: string) => {
    const a = audiosRef.current[id];
    if (!a) return;
    setPlayingId(prev => (prev === id ? null : prev)); // flip UI instantly
    clearInterval(timersRef.current[id]);
    a.pause();
  };

  const toggle = (id: string, url: string) => {
    const a = ensure(id, url);
    if (playingId === id && !a.paused) {
      pause(id);
    } else {
      void play(id, url);
    }
  };

  const seek = (id: string, time: number, duration?: number) => {
    const a = audiosRef.current[id];
    if (!a || !duration) return;
    a.currentTime = Math.max(0, Math.min(time, duration));
    setProgress(prev => ({ ...prev, [id]: a.currentTime }));
  };

  const cleanupAll = () => {
    Object.values(audiosRef.current).forEach(a => {
      a.pause();
      a.src = '';
    });
    Object.values(timersRef.current).forEach(clearInterval);
    audiosRef.current = {};
    timersRef.current = {};
    setPlayingId(null);
    setProgress({});
  };

  return { playingId, progress, toggle, play, pause, seek, cleanupAll };
}

export default function Chat() {
  // shared state from AppLayout
  const { messages, setMessages } = useOutletContext<LayoutContext>();

  const userName = localStorage.getItem('chat.username')?.trim() || 'You';
  const assistantName = 'Maja';

  const [isLoading, setIsLoading] = useState(false);
  const audio = useAudioManager();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // cleanup on unmount
  useEffect(() => {
    return () => audio.cleanupAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // revoke stale blob URLs
  const prevUrlsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const current = new Set(messages.map(m => m.blobUrl));
    for (const u of prevUrlsRef.current) if (!current.has(u)) URL.revokeObjectURL(u);
    prevUrlsRef.current = current;
  }, [messages]);

  // helpers
  const addMessage = useCallback(
    (msg: Omit<ChatMsg, 'timestamp'>): string => {
      const withId = { ...msg, timestamp: Date.now() };
      setMessages(prev => {
        const next = [...prev, withId as ChatMsg];
        const MAX = 50;
        return next.length <= MAX ? next : next.slice(next.length - MAX);
      });
      return msg.id;
    },
    [setMessages]
  );

  const formatTime = (s: number) => {
    if (!isFinite(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // main flow
  const handleStop = useCallback(
    async (localBlobUrl: string) => {
      setIsLoading(true);
      try {
        // fetch recorded blob
        const resp = await fetch(localBlobUrl);
        if (!resp.ok) throw new Error(`Failed to fetch blob: ${resp.status}`);
        const userBlob = await resp.blob();

        // probe duration first, then append "me"
        const myDur = await probeDuration(userBlob);
        const myId = generateId();
        addMessage({ id: myId, sender: 'me', blobUrl: localBlobUrl, duration: myDur || undefined });

        // send to backend, expect MP3 bytes
        const fd = new FormData();
        fd.append('file', userBlob, 'recording.webm');

        const res = await postAudio(fd);
        if (res.status !== 200) throw new Error(`Server returned status ${res.status}`);

        // build playable URL & duration for Maja
        const botBlob = new Blob([res.data], { type: 'audio/mpeg' });
        const botUrl = URL.createObjectURL(botBlob);
        const botDur = await probeDuration(botBlob);

        const botId = generateId();
        addMessage({
          id: botId,
          sender: 'assistant',
          blobUrl: botUrl,
          duration: botDur || undefined,
        });

        // autoplay Maja
        await audio.play(botId, botUrl);
      } catch (err) {
        console.error('Error sending audio:', err);
        addMessage({ id: generateId(), sender: 'system', blobUrl: '' });
      } finally {
        setIsLoading(false);
      }
    },
    [addMessage, audio]
  );

  // UI pieces
  const AudioBubble = ({
    id,
    url,
    isMe,
    duration,
  }: {
    id: string;
    url: string;
    isMe: boolean;
    duration?: number;
  }) => {
    const isPlaying = audio.playingId === id;
    const prog = audio.progress[id] || 0;
    const pct = duration ? Math.min(100, (prog / duration) * 100) : 0;

    return (
      <div
        className={[
          'rounded-2xl p-4 shadow-sm',
          isMe ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200',
        ].join(' ')}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => audio.toggle(id, url)}
            className={[
              'p-3 rounded-full transition',
              isMe
                ? 'bg-blue-700 hover:bg-blue-800'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
            ].join(' ')}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              // pause icon
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
              </svg>
            ) : (
              // play icon
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-end mb-1">
              <span className={`text-xs tabular-nums ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                {formatTime(prog)} / {formatTime(duration || 0)}
              </span>
            </div>

            <div className="relative h-2 rounded-full overflow-hidden">
              <div
                className={`${isMe ? 'bg-blue-300' : 'bg-gray-200'} h-full pointer-events-none`}
              />
              <div
                className={`${isMe ? 'bg-white' : 'bg-pink-600'} absolute left-0 top-0 h-full pointer-events-none`}
                style={{ width: `${pct}%` }}
              />
              <input
                type="range"
                min={0}
                max={Math.max(1, duration || 0)}
                step="0.1"
                value={prog}
                onChange={e => audio.seek(id, parseFloat(e.target.value), duration)}
                className="absolute inset-0 w-full appearance-none bg-transparent cursor-pointer"
                aria-label="Seek"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex flex-col h-full min-h-0">
        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-6 pb-28 scrollbar-hide">
          {messages.length === 0 && !isLoading && (
            <div className="text-center mt-20">
              <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg
                  className="w-12 h-12 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Start the conversation</h2>
              <p className="text-gray-600">Press and hold the microphone to record your message</p>
            </div>
          )}

          {messages.map(msg => {
            const isMe = msg.sender === 'me';
            const isSystem = msg.sender === 'system';
            const label = isSystem ? 'System' : isMe ? userName : assistantName;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md ${isMe ? 'ml-auto' : 'mr-auto'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs font-semibold ${isMe ? 'text-blue-700' : 'text-pink-700'}`}
                    >
                      {label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {isSystem ? (
                    <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                      <p className="text-sm text-red-700">
                        Error processing audio. Please try again.
                      </p>
                    </div>
                  ) : (
                    <AudioBubble
                      id={msg.id}
                      url={msg.blobUrl}
                      isMe={isMe}
                      duration={msg.duration}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-md">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-pink-700">{assistantName}</span>
                  <span className="text-xs text-gray-400">Now</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      />
                      <div
                        className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">Processing your message...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <div className="fixed bottom-0 left-0 right-0 py-6 bg-gradient-to-t from-white via-white to-white/95 backdrop-blur-sm border-t border-gray-200 z-10">
          <div className="flex justify-center items-center w-full">
            <div className="relative">
              <RecordMessage handleStop={handleStop} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
