'use client';

import { Sparkles } from 'lucide-react';
import { useAIChat } from './AIChatProvider';
import { cn } from '@/lib/utils';

interface HelpTriggerProps {
  /** מזהה הנושא לטעינת הקשר חינוכי */
  topicId: string;
  /** תיאור נוסף להקשר */
  contextDescription?: string;
  /** נתונים דינמיים מהמסך הנוכחי */
  contextData?: Record<string, unknown>;
  /** גודל הכפתור */
  size?: 'sm' | 'md';
  /** מיקום - מוסיף מרווח מתאים */
  className?: string;
}

/**
 * כפתור עזרה AI
 * מעביר הקשר + נתונים דינמיים ל-AI Chat
 * 
 * @example
 * <HelpTrigger 
 *   topicId="assets"
 *   contextData={{ totalValue: 500000 }}
 * />
 */
export default function HelpTrigger({ 
  topicId,
  contextDescription,
  contextData,
  size = 'sm',
  className,
}: HelpTriggerProps) {
  const { openChat } = useAIChat();

  const handleClick = () => {
    openChat({
      topicId,
      description: contextDescription || '',
      data: contextData,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-all',
        'text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50',
        'active:scale-95',
        size === 'sm' && 'w-5 h-5',
        size === 'md' && 'w-6 h-6',
        className
      )}
      title="עזרה"
    >
      <Sparkles className={cn(
        size === 'sm' && 'w-3 h-3',
        size === 'md' && 'w-3.5 h-3.5',
      )} />
    </button>
  );
}
