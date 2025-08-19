import { ReactMediaRecorder } from 'react-media-recorder';
import RecordIcon from './RecordIcon';

type Props = {
  handleStop: any;
};

export function RecordMessage({ handleStop }) {
  return (
    <div>
      <ReactMediaRecorder
        audio
        render={({ status, startRecording, stopRecording, mediaBlobUrl }) => (
          <div className="mt-2">
            <button
              className="bg-white p-4 rounded-full"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
            >
              <RecordIcon />
            </button>
            <p className="mt-2 text-white font-light">{status}</p>
          </div>
        )}
      />
    </div>
  );
}
