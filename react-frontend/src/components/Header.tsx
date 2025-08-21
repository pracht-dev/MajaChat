import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { resetDialog } from '../lib/api';
import type { ChatMsg } from '../routes/Chat';
import { clearChatSession } from '../lib/sessions.ts';
import { toast } from 'sonner';

type Props = {
  setMessages: React.Dispatch<React.SetStateAction<ChatMsg[]>>;
  clearMessages: () => void;
};

export default function Header({ setMessages, clearMessages }: Props) {
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const goBack = () => {
    clearChatSession();
    clearMessages();
    resetDialog();
    navigate('/welcome', { replace: true });
  };

  const resetConversation = async () => {
    setIsResetting(true);
    try {
      const res = await resetDialog();
      if (res.status === 200) {
        setMessages([]);
        clearMessages();
        toast.success('Conversation reset successfully!', {
          duration: 3000,
          position: 'top-right',
          icon: '🔄',
        });
      }
    } catch (err: any) {
      console.error('There was an error resetting the conversation', err?.message);
      toast.error('Failed to reset conversation. Please try again.', {
        duration: 4000,
        position: 'top-right',
        icon: '❌',
      });
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  const confirmReset = () => {
    if (showResetConfirm) {
      resetConversation();
    } else {
      setShowResetConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => {
        setShowResetConfirm(false);
      }, 3000);
    }
  };

  const onChat = location.pathname === '/chat';

  return (
    <div className="flex justify-between items-center w-full p-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-semibold shadow-lg border-b border-gray-700">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
          M
        </div>
        <span className="text-lg font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
          Maja VoiceChat
        </span>
      </div>

      {onChat && (
        <div className="flex items-center gap-4">
          {/* Back Button */}
          <button
            onClick={goBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-all duration-200 hover:scale-105 group"
            aria-label="Go back to setup"
            title="Back to setup"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="size-5 group-hover:-translate-x-1 transition-transform"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
            <span className="text-sm hidden sm:block">Back</span>
          </button>

          {/* Reset Button with Confirmation */}
          <div className="relative">
            <button
              onClick={confirmReset}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                showResetConfirm
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                  : 'bg-gray-700 hover:bg-gray-600'
              } ${isResetting ? 'opacity-75 cursor-wait' : ''}`}
              aria-label={showResetConfirm ? 'Confirm reset' : 'Reset conversation'}
              title={showResetConfirm ? 'Confirm reset' : 'Reset conversation'}
              disabled={isResetting}
            >
              {isResetting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="text-sm hidden sm:block">Resetting...</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="size-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                    />
                  </svg>
                  <span className="text-sm hidden sm:block">
                    {showResetConfirm ? 'Confirm Reset' : 'Reset Chat'}
                  </span>
                </>
              )}
            </button>

            {/* Confirmation Tooltip */}
            {showResetConfirm && (
              <div className="absolute top-full right-0 mt-2 bg-red-600 text-white text-xs px-3 py-1 rounded-lg shadow-lg z-10 animate-bounce">
                Click again to confirm
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
