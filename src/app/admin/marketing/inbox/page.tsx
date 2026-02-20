'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Inbox,
  Search,
  Star,
  StarOff,
  Archive,
  ArchiveRestore,
  Mail,
  MailOpen,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Send,
  ArrowRight,
} from 'lucide-react';
import EmailPreview from '@/components/admin/EmailPreview';
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
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type FilterType = 'all' | 'unread' | 'starred' | 'archived';

export default function InboxPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [thread, setThread] = useState<InboxMessage[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 0,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  // Mobile: show preview instead of list
  const [mobileShowPreview, setMobileShowPreview] = useState(false);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        filter,
      });
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/inbox?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      setMessages(data.messages);
      setPagination(data.pagination);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filter, search]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPagination((p) => ({ ...p, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const selectMessage = async (msg: InboxMessage) => {
    setSelectedMessage(msg);
    setMobileShowPreview(true);
    try {
      const res = await fetch(`/api/admin/inbox/${msg.id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSelectedMessage(data.message);
      setThread(data.thread);

      // Mark as read locally
      if (!msg.isRead) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (error) {
      console.error('Failed to fetch message:', error);
    }
  };

  const updateMessage = async (
    id: string,
    updates: { isRead?: boolean; isStarred?: boolean; isArchived?: boolean }
  ) => {
    setActionLoading(id);
    try {
      const res = await apiFetch(`/api/admin/inbox/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update');

      // Update local state
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
      );
      if (selectedMessage?.id === id) {
        setSelectedMessage((prev) => (prev ? { ...prev, ...updates } : null));
      }
      if (updates.isRead !== undefined) {
        fetchMessages(); // Refresh to get correct unread count
      }
      if (updates.isArchived !== undefined) {
        // Remove from current list if archiving in non-archive view
        if (updates.isArchived && filter !== 'archived') {
          setMessages((prev) => prev.filter((m) => m.id !== id));
          if (selectedMessage?.id === id) {
            setSelectedMessage(null);
            setMobileShowPreview(false);
          }
        }
      }
    } catch (error) {
      console.error('Failed to update message:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('למחוק את ההודעה?')) return;
    setActionLoading(id);
    try {
      const res = await apiFetch(`/api/admin/inbox/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
        setMobileShowPreview(false);
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    if (isToday) {
      return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getDisplayName = (from: string) => {
    const match = from.match(/^(.+?)\s*<[^>]+>/);
    return match ? match[1].replace(/^["']|["']$/g, '') : from;
  };

  const getInitial = (from: string) => {
    const name = getDisplayName(from);
    return name.charAt(0).toUpperCase();
  };

  const getPreviewText = (msg: InboxMessage) => {
    if (msg.textBody) return msg.textBody.substring(0, 100);
    if (msg.htmlBody)
      return msg.htmlBody
        .replace(/<[^>]*>/g, '')
        .substring(0, 100);
    return '';
  };

  const filterButtons: { key: FilterType; label: string; shortLabel: string; icon: typeof Mail }[] = [
    { key: 'all', label: 'הכל', shortLabel: 'הכל', icon: Inbox },
    { key: 'unread', label: 'לא נקראו', shortLabel: 'חדש', icon: Mail },
    { key: 'starred', label: 'מסומנים', shortLabel: '★', icon: Star },
    { key: 'archived', label: 'ארכיון', shortLabel: 'ארכ׳', icon: Archive },
  ];

  return (
    <div className="h-[calc(100vh-80px)] lg:h-[calc(100vh-80px)] flex flex-col -mx-3 sm:-mx-4 lg:-mx-6 xl:-mx-8 -mt-3 sm:-mt-4 lg:-mt-6 xl:-mt-8">
      {/* Header */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-[#F7F7F8]">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#69ADFF] to-[#5A9EE6] flex items-center justify-center">
              <Inbox className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-bold text-[#303150]">תיבת דואר</h1>
              <p className="text-[10px] sm:text-xs text-[#7E7F90]">
                {unreadCount > 0
                  ? `${unreadCount} הודעות שלא נקראו`
                  : 'אין הודעות חדשות'}
              </p>
            </div>
          </div>
          <button
            onClick={fetchMessages}
            className="p-2 rounded-lg text-[#7E7F90] hover:bg-[#F7F7F8] transition-colors"
            title="רענון"
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BDBDCB]" />
            <input
              type="text"
              placeholder="חיפוש לפי נושא, שולח..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pr-10 pl-4 py-2 sm:py-2.5 rounded-xl border border-[#E8E8ED] text-sm text-[#303150] placeholder-[#BDBDCB] focus:outline-none focus:border-[#69ADFF] focus:ring-2 focus:ring-[#69ADFF]/20"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {filterButtons.map(({ key, label, shortLabel, icon: Icon }) => (
              <button
                key={key}
                onClick={() => {
                  setFilter(key);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  filter === key
                    ? 'bg-[#69ADFF] text-white'
                    : 'text-[#7E7F90] hover:bg-[#F7F7F8]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{shortLabel}</span>
                {key === 'unread' && unreadCount > 0 && (
                  <span className="bg-white/20 text-white px-1.5 py-0.5 rounded-full text-[10px]">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content - Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Message List (Right) - hidden on mobile when preview is shown */}
        <div className={`w-full lg:w-[400px] border-l border-[#F7F7F8] overflow-y-auto ${
          mobileShowPreview ? 'hidden lg:block' : 'block'
        }`}>
          {loading && messages.length === 0 ? (
            <div className="p-4 sm:p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F7F7F8]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-[#F7F7F8] rounded w-1/3" />
                    <div className="h-3 bg-[#F7F7F8] rounded w-2/3" />
                    <div className="h-2 bg-[#F7F7F8] rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <Inbox className="w-12 h-12 text-[#BDBDCB] mb-3" />
              <p className="text-sm text-[#7E7F90]">
                {search ? 'לא נמצאו תוצאות' : 'תיבת הדואר ריקה'}
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => selectMessage(msg)}
                  className={`w-full flex items-start gap-2 sm:gap-3 p-3 sm:p-4 border-b border-[#F7F7F8] text-right transition-colors ${
                    selectedMessage?.id === msg.id
                      ? 'bg-[#69ADFF]/10'
                      : msg.isRead
                      ? 'bg-white hover:bg-[#FAFAFA]'
                      : 'bg-[#F0F7FF] hover:bg-[#E8F2FF]'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs sm:text-sm font-bold ${
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

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={`text-xs sm:text-sm truncate ${
                          !msg.isRead ? 'font-bold text-[#303150]' : 'text-[#303150]'
                        }`}
                      >
                        {msg.direction === 'outbound' ? `אל: ${msg.to[0]}` : getDisplayName(msg.from)}
                      </span>
                      <span className="text-[10px] text-[#BDBDCB] flex-shrink-0 mr-2">
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>
                    <p
                      className={`text-xs truncate mb-0.5 ${
                        !msg.isRead ? 'font-semibold text-[#303150]' : 'text-[#7E7F90]'
                      }`}
                    >
                      {msg.subject}
                    </p>
                    <p className="text-[11px] text-[#BDBDCB] truncate hidden sm:block">
                      {getPreviewText(msg)}
                    </p>
                  </div>

                  {/* Indicators */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    {!msg.isRead && (
                      <div className="w-2 h-2 rounded-full bg-[#69ADFF]" />
                    )}
                    {msg.isStarred && (
                      <Star className="w-3.5 h-3.5 text-[#E9A800] fill-[#E9A800]" />
                    )}
                  </div>
                </button>
              ))}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-[#F7F7F8]">
                  <button
                    onClick={() =>
                      setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
                    }
                    disabled={pagination.page === 1}
                    className="p-1.5 rounded-lg text-[#7E7F90] hover:bg-[#F7F7F8] disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-[#7E7F90]">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setPagination((p) => ({
                        ...p,
                        page: Math.min(p.totalPages, p.page + 1),
                      }))
                    }
                    disabled={pagination.page === pagination.totalPages}
                    className="p-1.5 rounded-lg text-[#7E7F90] hover:bg-[#F7F7F8] disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Message Preview (Left) - full screen on mobile when shown */}
        <div className={`flex-1 overflow-y-auto bg-[#FAFAFA] ${
          mobileShowPreview ? 'block' : 'hidden lg:block'
        }`}>
          {selectedMessage ? (
            <div className="p-3 sm:p-6">
              {/* Mobile back button */}
              <button
                onClick={() => {
                  setMobileShowPreview(false);
                  setSelectedMessage(null);
                }}
                className="lg:hidden flex items-center gap-2 text-sm text-[#7E7F90] hover:text-[#303150] mb-4 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                חזרה לרשימה
              </button>

              {/* Message header */}
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-lg font-bold flex-shrink-0 ${
                        selectedMessage.direction === 'outbound'
                          ? 'bg-[#0DBACC]/20 text-[#0DBACC]'
                          : 'bg-[#69ADFF]/20 text-[#69ADFF]'
                      }`}
                    >
                      {selectedMessage.direction === 'outbound' ? (
                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        getInitial(selectedMessage.from)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-bold text-[#303150] break-words">
                        {selectedMessage.subject}
                      </h2>
                      <p className="text-xs sm:text-sm text-[#7E7F90] break-all">
                        {selectedMessage.direction === 'outbound'
                          ? `נשלח מ-${selectedMessage.fromEmail} אל ${selectedMessage.to.join(', ')}`
                          : `מאת: ${selectedMessage.from}`}
                      </p>
                      <p className="text-[10px] sm:text-xs text-[#BDBDCB]">
                        {new Date(selectedMessage.createdAt).toLocaleString('he-IL')}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 self-end sm:self-start flex-shrink-0">
                    <button
                      onClick={() =>
                        updateMessage(selectedMessage.id, {
                          isStarred: !selectedMessage.isStarred,
                        })
                      }
                      disabled={actionLoading === selectedMessage.id}
                      className="p-2 rounded-lg hover:bg-[#F7F7F8] transition-colors"
                      title={selectedMessage.isStarred ? 'הסר סימון' : 'סמן'}
                    >
                      {selectedMessage.isStarred ? (
                        <Star className="w-4 h-4 text-[#E9A800] fill-[#E9A800]" />
                      ) : (
                        <StarOff className="w-4 h-4 text-[#7E7F90]" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        updateMessage(selectedMessage.id, {
                          isRead: !selectedMessage.isRead,
                        })
                      }
                      disabled={actionLoading === selectedMessage.id}
                      className="p-2 rounded-lg hover:bg-[#F7F7F8] transition-colors"
                      title={selectedMessage.isRead ? 'סמן כלא נקרא' : 'סמן כנקרא'}
                    >
                      {selectedMessage.isRead ? (
                        <MailOpen className="w-4 h-4 text-[#7E7F90]" />
                      ) : (
                        <Mail className="w-4 h-4 text-[#69ADFF]" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        updateMessage(selectedMessage.id, {
                          isArchived: !selectedMessage.isArchived,
                        })
                      }
                      disabled={actionLoading === selectedMessage.id}
                      className="p-2 rounded-lg hover:bg-[#F7F7F8] transition-colors"
                      title={selectedMessage.isArchived ? 'שחזר' : 'העבר לארכיון'}
                    >
                      {selectedMessage.isArchived ? (
                        <ArchiveRestore className="w-4 h-4 text-[#7E7F90]" />
                      ) : (
                        <Archive className="w-4 h-4 text-[#7E7F90]" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteMessage(selectedMessage.id)}
                      disabled={actionLoading === selectedMessage.id}
                      className="p-2 rounded-lg hover:bg-[#F7F7F8] transition-colors"
                      title="מחק"
                    >
                      <Trash2 className="w-4 h-4 text-[#F18AB5]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Thread messages */}
              {thread.length > 1 && (
                <div className="space-y-3 mb-4">
                  {thread.map((msg) => (
                    <div
                      key={msg.id}
                      className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] ${
                        msg.id === selectedMessage.id
                          ? 'ring-2 ring-[#69ADFF]/30'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            msg.direction === 'outbound'
                              ? 'bg-[#0DBACC]/20 text-[#0DBACC]'
                              : 'bg-[#69ADFF]/20 text-[#69ADFF]'
                          }`}
                        >
                          {msg.direction === 'outbound' ? (
                            <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          ) : (
                            getInitial(msg.from)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs sm:text-sm font-medium text-[#303150] truncate block">
                            {msg.direction === 'outbound'
                              ? `${msg.fromEmail} → ${msg.to[0]}`
                              : getDisplayName(msg.from)}
                          </span>
                          <span className="text-[10px] text-[#BDBDCB]">
                            {new Date(msg.createdAt).toLocaleString('he-IL')}
                          </span>
                        </div>
                      </div>
                      {msg.htmlBody ? (
                        <EmailPreview htmlContent={msg.htmlBody} maxHeight="200px" />
                      ) : (
                        <div className="text-sm text-[#303150] whitespace-pre-wrap">
                          {msg.textBody || '(אין תוכן)'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Single message body (no thread) */}
              {thread.length <= 1 && (
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 mb-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                  {selectedMessage.htmlBody ? (
                    <EmailPreview
                      htmlContent={selectedMessage.htmlBody}
                      maxHeight="400px"
                    />
                  ) : (
                    <div className="text-sm text-[#303150] whitespace-pre-wrap">
                      {selectedMessage.textBody || '(אין תוכן)'}
                    </div>
                  )}
                </div>
              )}

              {/* Reply button */}
              <button
                onClick={() =>
                  router.push(`/admin/marketing/inbox/${selectedMessage.id}`)
                }
                className="w-full bg-[#69ADFF] hover:bg-[#5A9EE6] text-white py-3 px-6 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" />
                הגב להודעה
              </button>
            </div>
          ) : (
            <div className="hidden lg:flex flex-col items-center justify-center h-full text-center">
              <Mail className="w-16 h-16 text-[#BDBDCB] mb-4" />
              <p className="text-sm text-[#7E7F90]">בחר הודעה לצפייה</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
