// src/components/RecordMessage.tsx
import { ReactMediaRecorder } from 'react-media-recorder';
import RecordIcon from './RecordIcon';

type Props = {
  handleStop: (blobUrl: string) => void;
};

export function RecordMessage({ handleStop }: Props) {
  return (
    <div className="flex flex-col items-center">
      <ReactMediaRecorder
        audio
        onStop={handleStop}
        render={({ status, startRecording, stopRecording }) => (
          <div className="text-center">
            {/* Recording Button */}
            <button
              className={`p-6 rounded-full transition-all duration-300 ${
                status === 'recording'
                  ? 'bg-red-500 shadow-lg shadow-red-500/50 animate-pulse'
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg hover:shadow-xl'
              }`}
              onMouseDown={() => {
                startRecording();
              }}
              onMouseUp={() => {
                stopRecording();
              }}
              onTouchStart={() => {
                startRecording();
              }}
              onTouchEnd={() => {
                stopRecording();
              }}
            >
              <RecordIcon classText="text-white w-8 h-8" />
            </button>

            {/* Text below the button */}
            <div className="mt-3 text-blue-700">
              {status === 'recording' ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    <div
                      className="w-2 h-2 bg-red-400 rounded-full animate-pulse"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-red-400 rounded-full animate-pulse"
                      style={{ animationDelay: '0.4s' }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">🎤 Recording... Release to send</span>
                </div>
              ) : (
                <p className="text-sm font-medium">Hold to record</p>
              )}
            </div>
          </div>
        )}
      />
    </div>
  );
}
