'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import AIChatModal from './AIChatModal';

interface ChatContext {
  topicId?: string;
  description: string;
  data?: Record<string, unknown>;
}

interface AIChatContextType {
  openChat: (context: ChatContext) => void;
  closeChat: () => void;
  isOpen: boolean;
}

const AIChatContext = createContext<AIChatContextType | null>(null);

export function useAIChat() {
  const context = useContext(AIChatContext);
  if (!context) {
    throw new Error('useAIChat must be used within AIChatProvider');
  }
  return context;
}

interface AIChatProviderProps {
  children: ReactNode;
}

export default function AIChatProvider({ children }: AIChatProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);

  const openChat = useCallback((context: ChatContext) => {
    setChatContext(context);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    // Keep context for a moment for smooth animation
    setTimeout(() => setChatContext(null), 300);
  }, []);

  return (
    <AIChatContext.Provider value={{ openChat, closeChat, isOpen }}>
      {children}
      <AIChatModal 
        isOpen={isOpen} 
        onClose={closeChat} 
        context={chatContext} 
      />
    </AIChatContext.Provider>
  );
}
