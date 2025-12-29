'use client';

import { Bot } from 'lucide-react';
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
  size?: 'sm' | 'md' | 'lg';
  /** האם להציג טקסט */
  showLabel?: boolean;
  /** מיקום - מוסיף מרווח מתאים */
  className?: string;
  /** מזהה HTML לכפתור */
  id?: string;
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
  size = 'md',
  showLabel = false,
  className,
  id,
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
      id={id}
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full transition-all',
        'bg-gradient-to-r from-violet-500 to-indigo-500 text-white',
        'hover:from-violet-600 hover:to-indigo-600 hover:shadow-md',
        'active:scale-95 shadow-sm',
        size === 'sm' && 'w-6 h-6',
        size === 'md' && 'w-8 h-8',
        size === 'lg' && (showLabel ? 'px-3 py-1.5' : 'w-10 h-10'),
        className
      )}
      title="עזרה AI"
    >
      <Bot className={cn(
        size === 'sm' && 'w-3.5 h-3.5',
        size === 'md' && 'w-4 h-4',
        size === 'lg' && 'w-5 h-5',
      )} />
      {showLabel && size === 'lg' && (
        <span className="text-xs font-medium">AI</span>
      )}
    </button>
  );
}
