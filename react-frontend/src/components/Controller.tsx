import { useCallback, useEffect, useRef, useState } from 'react';
import Title from './Title';
import { RecordMessage } from './RecordMessage';
import { postAudio } from '../lib/api';

export type ChatMsg = {
  id: string;
  sender: 'me' | 'maja' | 'system' | string;
  blobUrl: string;
};

function generateId(prefix = 'msg') {
  const ts = Date.now();
  const rnd = Math.random().toString(36).slice(2, 11); // 9 chars
  return `${prefix}-${ts}-${rnd}`;
}

export default function Controller() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const isHandlingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // === Auto-scroll container ref
  const containerRef = useRef<HTMLDivElement | null>(null);

  // --- Blob URL lifecycle management ----------------------------------------
  const prevUrlsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const current = new Set(messages.map(m => m.blobUrl));
    const prev = prevUrlsRef.current;

    for (const url of prev) {
      if (!current.has(url)) {
        URL.revokeObjectURL(url);
      }
    }
    prevUrlsRef.current = current;
  }, [messages]);

  useEffect(() => {
    return () => {
      for (const url of prevUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
      prevUrlsRef.current.clear();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // --- Auto-scroll whenever messages change ---------------------------------
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = prefersReduced ? 'auto' : 'smooth';

    el.scrollTo({ top: el.scrollHeight, behavior });
  }, [messages]);

  // --- Helpers ---------------------------------------------------------------
  const createBlobUrl = useCallback((data: BlobPart | BlobPart[]) => {
    const blob =
      data instanceof Blob
        ? data
        : new Blob(Array.isArray(data) ? data : [data], { type: 'audio/mpeg' });
    return URL.createObjectURL(blob);
  }, []);

  const clearMessages = useCallback(() => {
    // removed URLs will be auto-revoked by the messages effect
    setMessages([]);
  }, []);

  // Optional: keep memory bounded (e.g., max 50 messages)
  const appendMessage = useCallback((msg: Omit<ChatMsg, 'id'>) => {
    setMessages(prev => {
      const next = [...prev, { id: generateId(), ...msg }];
      const MAX = 50;
      if (next.length <= MAX) return next;
      return next.slice(next.length - MAX);
    });
  }, []);

  // --- Core flow: handleStop -------------------------------------------------
  const handleStop = useCallback(
    async (blobUrl: string) => {
      if (isHandlingRef.current) {
        console.warn('Handler already processing, ignoring duplicate call');
        return;
      }

      isHandlingRef.current = true;
      setIsLoading(true);

      try {
        // De-dupe same last "me" message
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.sender === 'me' && last.blobUrl === blobUrl) return prev;
          return [...prev, { id: generateId(), sender: 'me', blobUrl }];
        });

        // Fetch local blob back from its object URL
        const response = await fetch(blobUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
        }
        const recordedBlob = await response.blob();

        // Send to backend; expect raw MP3 bytes in response
        const formData = new FormData();
        formData.append('file', recordedBlob, 'recording.webm');

        const res = await postAudio(formData);

        if (res.status !== 200) {
          throw new Error(`Server returned status ${res.status}`);
        }

        // Convert server response to Blob URL
        const serverAudioBlob = new Blob([res.data], { type: 'audio/mpeg' });
        const serverAudioUrl = createBlobUrl(serverAudioBlob);

        appendMessage({ sender: 'maja', blobUrl: serverAudioUrl });

        // Auto-play reply
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audio = new Audio(serverAudioUrl);
        audio.preload = 'metadata';
        audioRef.current = audio;

        await audio.play().catch(err => {
          console.warn('Auto-play failed:', err);
        });
      } catch (err) {
        console.error('Error sending audio:', err);
      } finally {
        setIsLoading(false);
        isHandlingRef.current = false;
      }
    },
    [appendMessage, createBlobUrl]
  );

  // --- Render ---------------------------------------------------------------
  return (
    <div className="h-screen overflow-hidden">
      <Title setMessages={setMessages} clearMessages={clearMessages} />

      <div className="flex flex-col justify-between h-[calc(100vh-56px)]">
        {/* messages area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-scroll mt-5 mb-20 px-10 space-y-4 pb-40"
        >
          {messages.map(msg => {
            const isMe = msg.sender === 'me';
            const isSystem = msg.sender === 'system';

            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end text-blue-700 text-right' : 'justify-start ml-2 text-pink-500'}`}
              >
                <div className="max-w-xs">
                  <p className="text-[11px] opacity-80 italic mx-4 mb-1">{msg.sender}</p>
                  {isSystem ? (
                    <p className="text-sm">Error processing audio. Please try again.</p>
                  ) : (
                    <audio
                      key={msg.blobUrl}
                      src={msg.blobUrl}
                      controls
                      preload="metadata"
                      className="appearance-none"
                    />
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty-state hint only when not loading */}
          {messages.length === 0 && !isLoading && (
            <div className="text-center font-light italic mt-10">Send Maja a message...</div>
          )}

          {/* Loading hint only while loading */}
          {isLoading && (
            <div className="text-center font-light italic mt-10 animate-pulse">
              Gimme a few seconds...
            </div>
          )}
        </div>

        {/* composer */}
        <div className="fixed bottom-0 left-0 right-0 py-6 border-t text-center bg-gradient-to-r from-pink-500 to-purple-500 text-white">
          <div className="flex justify-center items-center w-full gap-3">
            <RecordMessage handleStop={handleStop} />
          </div>
        </div>
      </div>
    </div>
  );
}
