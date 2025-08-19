import { useState } from 'react';
import Title from './Title';
import { RecordMessage } from './RecordMessage';

export default function Controller() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  const createBlolUrl = () => {};

  const handleStop = async () => {};

  return (
    <>
      <div className="h-screen overflow-hidden">
        <Title setMessages={setMessages} />
        <div className="flex flex-col justify-between overflow-y-scroll pb-96">
          <div className="fixed bottom-0 w-full py-6 border-t text-center bg-gradient-to-r from-pink-500 to-purple-500 text-white">
            <div className="flex justify-center items-center w-full">
              <RecordMessage handleStop={handleStop} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
