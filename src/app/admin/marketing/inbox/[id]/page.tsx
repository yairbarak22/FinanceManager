'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Send,
  Star,
  StarOff,
  Mail,
  MailOpen,
  Archive,
  ArchiveRestore,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import EmailPreview from '@/components/admin/EmailPreview';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { SENDER_ADDRESSES } from '@/lib/inbox/constants';
import { apiFetch } from '@/lib/utils';

interface InboxMessage {
  id: string;
  from: string;
  fromEmail: string;
  to: string[];
  subject: string;
  htmlBody: string | null;
  textBody: string | null;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  direction: 'inbound' | 'outbound';
  threadId: string | null;
  replyFromAddress: string | null;
  createdAt: string;
}

export default function MessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [message, setMessage] = useState<InboxMessage | null>(null);
  const [thread, setThread] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replyFromAddress, setReplyFromAddress] = useState<string>(SENDER_ADDRESSES[0].email);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [showSenderDropdown, setShowSenderDropdown] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchMessage = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inbox/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMessage(data.message);
      setThread(data.thread);
    } catch (error) {
      console.error('Failed to fetch message:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!replyContent.trim() || !message) return;
    setSending(true);
    setSendResult(null);

    try {
      const res = await apiFetch(`/api/admin/inbox/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify({
          content: replyContent,
          replyFromAddress,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send');
      }

      setSendResult({ type: 'success', text: 'התגובה נשלחה בהצלחה!' });
      setReplyContent('');
      // Refresh to show the reply in thread
      await fetchMessage();
    } catch (error) {
      setSendResult({
        type: 'error',
        text: error instanceof Error ? error.message : 'שגיאה בשליחת התגובה',
      });
    } finally {
      setSending(false);
    }
  };

  const updateMessage = async (updates: {
    isRead?: boolean;
    isStarred?: boolean;
    isArchived?: boolean;
  }) => {
    if (!message) return;
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/admin/inbox/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update');
      setMessage((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (error) {
      console.error('Failed to update message:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteMessage = async () => {
    if (!confirm('למחוק את ההודעה?')) return;
    try {
      const res = await apiFetch(`/api/admin/inbox/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      router.push('/admin/marketing/inbox');
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const getDisplayName = (from: string) => {
    const match = from.match(/^(.+?)\s*<[^>]+>/);
    return match ? match[1].replace(/^["']|["']$/g, '') : from;
  };

  const getInitial = (from: string) => {
    const name = getDisplayName(from);
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#F7F7F8] rounded-xl w-1/4" />
          <div className="h-32 bg-[#F7F7F8] rounded-2xl sm:rounded-3xl" />
          <div className="h-48 bg-[#F7F7F8] rounded-2xl sm:rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="p-3 sm:p-6 text-center">
        <p className="text-[#7E7F90]">ההודעה לא נמצאה</p>
        <button
          onClick={() => router.push('/admin/marketing/inbox')}
          className="mt-4 text-[#69ADFF] text-sm hover:underline"
        >
          חזרה לתיבת הדואר
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-full lg:max-w-4xl mx-auto px-0 sm:px-2 lg:px-6 py-2 sm:py-6">
      {/* Back button + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <button
          onClick={() => router.push('/admin/marketing/inbox')}
          className="flex items-center gap-2 text-sm text-[#7E7F90] hover:text-[#303150] transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה לתיבת הדואר
        </button>
        <div className="flex items-center gap-1 self-end sm:self-auto">
          <button
            onClick={() => updateMessage({ isStarred: !message.isStarred })}
            disabled={actionLoading}
            className="p-2 rounded-lg hover:bg-[#F7F7F8] transition-colors"
            title={message.isStarred ? 'הסר סימון' : 'סמן'}
          >
            {message.isStarred ? (
              <Star className="w-4 h-4 text-[#E9A800] fill-[#E9A800]" />
            ) : (
              <StarOff className="w-4 h-4 text-[#7E7F90]" />
            )}
          </button>
          <button
            onClick={() => updateMessage({ isRead: !message.isRead })}
            disabled={actionLoading}
            className="p-2 rounded-lg hover:bg-[#F7F7F8] transition-colors"
          >
            {message.isRead ? (
              <MailOpen className="w-4 h-4 text-[#7E7F90]" />
            ) : (
              <Mail className="w-4 h-4 text-[#69ADFF]" />
            )}
          </button>
          <button
            onClick={() => updateMessage({ isArchived: !message.isArchived })}
            disabled={actionLoading}
            className="p-2 rounded-lg hover:bg-[#F7F7F8] transition-colors"
          >
            {message.isArchived ? (
              <ArchiveRestore className="w-4 h-4 text-[#7E7F90]" />
            ) : (
              <Archive className="w-4 h-4 text-[#7E7F90]" />
            )}
          </button>
          <button
            onClick={deleteMessage}
            className="p-2 rounded-lg hover:bg-[#F7F7F8] transition-colors"
          >
            <Trash2 className="w-4 h-4 text-[#F18AB5]" />
          </button>
        </div>
      </div>

      {/* Subject */}
      <h1 className="text-xl sm:text-2xl font-bold text-[#303150] mb-4 sm:mb-6 break-words">{message.subject}</h1>

      {/* Thread */}
      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        {thread.map((msg) => (
          <div
            key={msg.id}
            className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
          >
            {/* Message header */}
            <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 ${
                  msg.direction === 'outbound'
                    ? 'bg-[#0DBACC]/20 text-[#0DBACC]'
                    : 'bg-[#69ADFF]/20 text-[#69ADFF]'
                }`}
              >
                {msg.direction === 'outbound' ? (
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  getInitial(msg.from)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-[#303150]">
                    {msg.direction === 'outbound'
                      ? `אני (${msg.fromEmail})`
                      : getDisplayName(msg.from)}
                  </span>
                  {msg.direction === 'outbound' && (
                    <span className="text-[10px] px-2 py-0.5 bg-[#0DBACC]/10 text-[#0DBACC] rounded-full">
                      נשלח
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-[#BDBDCB] break-all">
                  {msg.direction === 'outbound'
                    ? `אל: ${msg.to.join(', ')}`
                    : msg.fromEmail}
                  {' • '}
                  {new Date(msg.createdAt).toLocaleString('he-IL')}
                </p>
              </div>
            </div>

            {/* Message body */}
            {msg.htmlBody ? (
              <EmailPreview htmlContent={msg.htmlBody} maxHeight="300px" />
            ) : (
              <div className="text-sm text-[#303150] whitespace-pre-wrap leading-relaxed">
                {msg.textBody || '(אין תוכן)'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reply composer */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <h3 className="text-sm font-semibold text-[#303150] mb-3 sm:mb-4">
          הגב להודעה
        </h3>

        {/* From selector */}
        <div className="mb-3 sm:mb-4">
          <label className="text-xs text-[#7E7F90] font-medium mb-1.5 block">
            שלח מ:
          </label>
          <div className="relative">
            <button
              onClick={() => setShowSenderDropdown(!showSenderDropdown)}
              className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 rounded-xl border border-[#E8E8ED] text-xs sm:text-sm text-[#303150] hover:border-[#69ADFF] transition-colors"
            >
              <span className="truncate">
                myneto &lt;{replyFromAddress}&gt;
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[#7E7F90] transition-transform flex-shrink-0 mr-2 ${
                  showSenderDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>
            {showSenderDropdown && (
              <div className="absolute top-full right-0 left-0 mt-1 bg-white rounded-xl border border-[#E8E8ED] shadow-lg z-10 max-h-48 overflow-y-auto">
                {SENDER_ADDRESSES.map((sender) => (
                  <button
                    key={sender.email}
                    onClick={() => {
                      setReplyFromAddress(sender.email);
                      setShowSenderDropdown(false);
                    }}
                    className={`w-full text-right px-3 sm:px-4 py-2.5 text-xs sm:text-sm hover:bg-[#F7F7F8] transition-colors first:rounded-t-xl last:rounded-b-xl ${
                      replyFromAddress === sender.email
                        ? 'bg-[#69ADFF]/10 text-[#69ADFF]'
                        : 'text-[#303150]'
                    }`}
                  >
                    <span className="font-medium">{sender.label}</span>
                    <span className="text-[#7E7F90] text-xs mr-2 block sm:inline">
                      {sender.email}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="mb-3 sm:mb-4">
          <RichTextEditor
            content={replyContent}
            onChange={setReplyContent}
            placeholder="כתוב תגובה..."
            minHeight="120px"
          />
        </div>

        {/* Send result message */}
        {sendResult && (
          <div
            className={`mb-3 sm:mb-4 p-3 rounded-xl text-xs sm:text-sm ${
              sendResult.type === 'success'
                ? 'bg-[#0DBACC]/10 text-[#0DBACC]'
                : 'bg-[#F18AB5]/10 text-[#F18AB5]'
            }`}
          >
            {sendResult.text}
          </div>
        )}

        {/* Send button */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <p className="text-[10px] text-[#BDBDCB] text-center sm:text-right">
            התגובה תישלח אל {message.direction === 'inbound' ? message.fromEmail : message.to[0]}
          </p>
          <button
            onClick={sendReply}
            disabled={sending || !replyContent.trim()}
            className="bg-[#69ADFF] hover:bg-[#5A9EE6] disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm flex-shrink-0"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                שולח...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                שלח תגובה
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
