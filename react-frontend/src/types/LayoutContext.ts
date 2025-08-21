import type { ChatMsg } from '../routes/Chat.tsx';
import React from 'react';

export type LayoutContext = {
  messages: ChatMsg[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMsg[]>>;
  clearMessages: () => void;
  isInitialized: boolean;
};
