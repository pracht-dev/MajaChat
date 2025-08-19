import { useCallback, useState } from 'react';
import Title from './Title';
import { RecordMessage } from './RecordMessage';
import axios from 'axios';

export default function Controller() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  const createBlobUrl = (data: BlobPart | BlobPart[]) => {
    const blob =
      data instanceof Blob
        ? data
        : new Blob(Array.isArray(data) ? data : [data], { type: 'audio/mpeg' });
    return URL.createObjectURL(blob);
  };

  const handleStop = useCallback(async (blobUrl: string) => {
    setIsLoading(true);

    try {
      // Add user message
      setMessages(prev => [...prev, { sender: 'me', blobUrl }]);

      // Convert blobUrl to Blob
      const recordedBlob = await fetch(blobUrl).then(r => r.blob());

      // Send to backend
      const formData = new FormData();
      formData.append('file', recordedBlob, 'recording.webm');

      const res = await axios.post('http://localhost:8000/post-audio', formData, {
        responseType: 'arraybuffer',
      });

      // Response audio
      const serverAudioBlob = new Blob([res.data], { type: 'audio/mpeg' });
      const serverAudioUrl = createBlobUrl(serverAudioBlob);

      setMessages(prev => [...prev, { sender: 'maja', blobUrl: serverAudioUrl }]);

      const audio = new Audio(serverAudioUrl);
      await audio.play();
    } catch (err) {
      console.error('There was an error sending the audio', (err as any)?.message || err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="h-screen overflow-hidden">
      <Title setMessages={setMessages} />
      <div className="flex flex-col justify-between overflow-y-scroll pb-96">
        <div className="mt-5 px-5 space-y-4">
          {messages.map((msg, index) => {
            const isMe = msg.sender === 'me';
            return (
              <div
                key={index}
                className={`flex ${isMe ? 'justify-end text-blue-700' : 'justify-start text-pink-400'}`}
              >
                <div className="max-w-xs rounded-lg p-2 ">
                  <p className="text-xs italic mb-1">{isMe ? 'Me' : msg.sender}</p>
                  <audio src={msg.blobUrl} controls className="w-48" />
                </div>
              </div>
            );
          })}
          {messages.length == 0 && !isLoading && (
            <div className="text-center font-light italic mt-10">Send Maja a message...</div>
          )}

          {!isLoading && (
            <div className="text-center font-light italic mt-10 animate-pulse">
              Gimme a few seconds...
            </div>
          )}
        </div>

        <div className="fixed bottom-0 w-full py-6 border-t text-center bg-gradient-to-r from-pink-500 to-purple-500 text-white">
          <div className="flex justify-center items-center w-full">
            <RecordMessage handleStop={handleStop} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
