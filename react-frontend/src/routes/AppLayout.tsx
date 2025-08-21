// src/routes/AppLayout.tsx
import { Outlet } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import Header from '../components/Header';
import type { ChatMsg } from './Chat';
import type { LayoutContext } from '../types/LayoutContext';
import { clearChatSession } from '../lib/sessions';
import { Toaster } from 'sonner';

export default function AppLayout() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Clear session on initial load
    clearChatSession();
    setIsInitialized(true);

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const hasActiveSession = localStorage.getItem('chat.started');
      if (hasActiveSession) {
        event.preventDefault();
        event.returnValue = 'You have an active conversation. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    const handlePageHide = () => {
      clearChatSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        clearChatSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const [messages, setMessages] = useState<ChatMsg[]>([]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    localStorage.removeItem('chat.started');
  }, []);

  const ctx: LayoutContext = {
    messages,
    setMessages,
    clearMessages,
    isInitialized,
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading Maja VoiceChat...</p>
          <p className="text-gray-500 text-sm mt-1">Getting everything ready for you</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen w-full flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="shrink-0 z-10 shadow-sm">
        <Header setMessages={setMessages} clearMessages={clearMessages} />
      </header>

      {/* Main content area */}
      <main className="flex-1 min-h-0 relative">
        <Outlet context={ctx} />
      </main>

      {/* Global Toast Container */}
      <Toaster
        position="top-right"
        richColors
        theme="light"
        closeButton
        duration={4000}
        visibleToasts={3}
        toastOptions={{
          style: {
            background: 'white',
            color: '#374151',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
          classNames: {
            toast: '!rounded-xl !p-4',
            title: '!font-medium !text-gray-900',
            description: '!text-gray-600',
            success: '!border-green-200 !bg-green-50',
            error: '!border-red-200 !bg-red-50',
            warning: '!border-yellow-200 !bg-yellow-50',
            info: '!border-blue-200 !bg-blue-50',
          },
        }}
      />

      {/* Footer */}
      <footer className="shrink-0 py-3 px-4 border-t border-gray-200 bg-white">
        <div className="text-center text-xs text-gray-500">
          Maja VoiceChat • Built with ❤️ • {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
