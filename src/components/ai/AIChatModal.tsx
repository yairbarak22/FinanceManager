'use client';

import { useState, useRef, useEffect, FormEvent, useCallback } from 'react';
import { X, Send, Sparkles, Bot, User, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTopic, getDefaultTopic, AITopic } from '@/lib/ai/topics';

/**
 * Simple markdown renderer for AI responses
 * Supports: **bold**, *italic*, - lists, numbered lists, headers
 */
function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();

    // Empty line = paragraph break
    if (trimmedLine === '') {
      elements.push(<br key={`br-${lineIndex}`} />);
      return;
    }

    // Headers (support ### **text** pattern too)
    const h3Match = trimmedLine.match(/^###\s*\*?\*?(.+?)\*?\*?\s*$/);
    if (trimmedLine.startsWith('###')) {
      const content = trimmedLine.replace(/^###\s*/, '');
      elements.push(
        <h4 key={lineIndex} className="font-bold text-indigo-700 mt-3 mb-1">
          {renderInlineMarkdown(content)}
        </h4>
      );
      return;
    }

    const h2Match = trimmedLine.match(/^##\s+/);
    if (h2Match) {
      const content = trimmedLine.replace(/^##\s*/, '');
      elements.push(
        <h3 key={lineIndex} className="font-bold text-indigo-700 mt-3 mb-1 text-base">
          {renderInlineMarkdown(content)}
        </h3>
      );
      return;
    }

    const h1Match = trimmedLine.match(/^#\s+/);
    if (h1Match) {
      const content = trimmedLine.replace(/^#\s*/, '');
      elements.push(
        <h2 key={lineIndex} className="font-bold text-indigo-700 mt-3 mb-1 text-lg">
          {renderInlineMarkdown(content)}
        </h2>
      );
      return;
    }

    // Bullet lists (support * **text**: description pattern)
    if (trimmedLine.match(/^[\-•]\s/) || (trimmedLine.startsWith('* ') && !trimmedLine.startsWith('**'))) {
      const content = trimmedLine.replace(/^[\-•\*]\s*/, '');
      elements.push(
        <div key={lineIndex} className="flex gap-2 mr-2 mb-0.5">
          <span className="text-indigo-500 flex-shrink-0">•</span>
          <span>{renderInlineMarkdown(content)}</span>
        </div>
      );
      return;
    }

    // Numbered lists
    const numberedMatch = trimmedLine.match(/^(\d+)[.\)]\s+(.+)$/);
    if (numberedMatch) {
      elements.push(
        <div key={lineIndex} className="flex gap-2 mr-2 mb-0.5">
          <span className="text-indigo-500 font-medium flex-shrink-0">{numberedMatch[1]}.</span>
          <span>{renderInlineMarkdown(numberedMatch[2])}</span>
        </div>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={lineIndex} className="mb-1">
        {renderInlineMarkdown(trimmedLine)}
      </p>
    );
  });

  return <>{elements}</>;
}

/**
 * Render inline markdown (bold, italic, bold+italic)
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Simple approach: split by ** and * patterns
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);

    if (boldMatch && boldMatch.index !== undefined) {
      // Add text before match
      if (boldMatch.index > 0) {
        parts.push(<span key={keyIndex++}>{remaining.slice(0, boldMatch.index)}</span>);
      }

      // Add bold text
      parts.push(
        <strong key={keyIndex++} className="font-semibold text-slate-900">
          {boldMatch[1]}
        </strong>
      );

      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
    } else {
      // No more matches, add remaining text
      if (remaining) {
        parts.push(<span key={keyIndex++}>{remaining}</span>);
      }
      break;
    }
  }

  return parts.length === 0 ? text : <>{parts}</>;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
}

interface ChatContext {
  description: string;
  topicId?: string;
  data?: Record<string, unknown>;
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: ChatContext | null;
}

export default function AIChatModal({ isOpen, onClose, context }: AIChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingAnimation, setIsTypingAnimation] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesRef = useRef<Message[]>([]);

  // Keep ref in sync with state
  messagesRef.current = messages;

  // Get the topic for current context
  const topic: AITopic = context?.topicId ? getTopic(context.topicId) || getDefaultTopic() : getDefaultTopic();

  // Reset messages when context changes
  useEffect(() => {
    if (context) {
      setMessages([]);
      setDisplayedText('');
      setIsTypingAnimation(false);
    }
  }, [context]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Scroll to bottom only when new messages are added (not during typing)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Cleanup typing interval on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  // Typing animation effect
  const startTypingAnimation = useCallback((fullText: string, messageId: string) => {
    setIsTypingAnimation(true);
    setDisplayedText('');

    let charIndex = 0;
    const charsPerTick = 1; // Type 1 character at a time for natural feel

    typingIntervalRef.current = setInterval(() => {
      charIndex += charsPerTick;
      const newText = fullText.slice(0, charIndex);
      setDisplayedText(newText);

      if (charIndex >= fullText.length) {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
        }
        setIsTypingAnimation(false);
        // Update the message with full content
        setMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, content: fullText, isTyping: false } : m
        ));
      }
    }, 20); // 20ms per character = natural reading speed
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isTypingAnimation) return;
    await sendMessage(input.trim());
  };

  const sendMessage = async (messageText: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
    };

    // Build history from ref (always has latest messages)
    // Include all previous messages (excluding typing placeholders)
    const currentHistory = messagesRef.current
      .filter(m => !m.isTyping && m.content)
      .map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          context: context,
          history: currentHistory,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const assistantMessageId = (Date.now() + 1).toString();

      // Add placeholder message for typing animation
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        isTyping: true,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);

      // Start typing animation
      startTypingAnimation(data.response, assistantMessageId);
    } catch (error) {
      console.error('AI Chat error:', error);
      const errorMessage = 'מצטער, אירעה שגיאה. נסה שוב בעוד כמה שניות.';
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
      }]);
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    if (isLoading || isTypingAnimation) return;
    sendMessage(question);
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-[10002] bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[600px] max-h-[80vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-violet-500 to-purple-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{topic.title}</h3>
              <p className="text-xs text-white/70 truncate max-w-[200px]">
                {topic.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Bot className="w-10 h-10 mb-3 text-indigo-300" />
              <p className="text-sm font-medium text-slate-700 mb-1">יש מושג שלא ברור?</p>
              <p className="text-xs text-slate-400 mb-4 max-w-xs">
                אני כאן כדי להסביר מושגים פיננסיים בצורה פשוטה וברורה
              </p>

              {/* Suggested Questions */}
              <div className="flex flex-wrap justify-center gap-2 max-w-md">
                {topic.suggestedQuestions.slice(0, 6).map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors border border-indigo-200"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'flex-row-reverse' : ''
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                message.role === 'user'
                  ? 'bg-blue-100'
                  : 'bg-indigo-100'
              )}>
                {message.role === 'user'
                  ? <User className="w-4 h-4 text-blue-600" />
                  : <Bot className="w-4 h-4 text-indigo-600" />
                }
              </div>
              <div className="flex flex-col max-w-[80%]">
                <div className={cn(
                  'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                  message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-md whitespace-pre-wrap'
                    : 'bg-slate-100 text-slate-800 rounded-bl-md'
                )}>
                  {message.role === 'user' ? (
                    message.content
                  ) : message.isTyping ? (
                    <div>
                      {renderMarkdown(displayedText)}
                      <span className="inline-block w-1 h-4 bg-indigo-500 ml-0.5 animate-pulse" />
                    </div>
                  ) : (
                    renderMarkdown(message.content)
                  )}
                </div>
                {/* Copy button for assistant messages */}
                {message.role === 'assistant' && !message.isTyping && message.content && (
                  <button
                    onClick={() => copyToClipboard(message.content, message.id)}
                    className="self-start mt-1 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    title="העתק"
                  >
                    {copiedId === message.id ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions (when messages exist) */}
        {messages.length > 0 && !isLoading && !isTypingAnimation && (
          <div className="px-4 py-2 border-t border-gray-100 bg-slate-50">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {topic.suggestedQuestions.slice(0, 3).map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="px-3 py-1 text-xs bg-white text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors border border-indigo-200 whitespace-nowrap flex-shrink-0"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="שאל שאלה..."
              className="flex-1 px-4 py-2.5 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isLoading || isTypingAnimation}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || isTypingAnimation}
              className="px-4 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
