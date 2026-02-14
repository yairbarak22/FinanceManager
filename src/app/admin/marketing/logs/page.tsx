'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FileText, AlertCircle, Eye, MousePointerClick, Mail, CheckCircle2, XCircle } from 'lucide-react';
import { apiFetch } from '@/lib/utils';

interface Event {
  id: string;
  eventType: 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'COMPLAINED' | 'UNSUBSCRIBED';
  timestamp: string;
  campaign: {
    id: string;
    name: string;
    subject: string;
  };
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  metadata: Record<string, unknown> | null;
}

export default function LogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchEvents();
  }, [session, status, router, page]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(`/api/admin/marketing/events?page=${page}&limit=50`);

      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          setError('אין לך הרשאה לצפות בדף זה');
        } else {
          setError('שגיאה בטעינת הלוגים');
        }
        return;
      }

      const data = await res.json();
      setEvents(data.events || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      setError('שגיאה בטעינת הלוגים');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'SENT':
      case 'DELIVERED':
        return <Mail className="w-4 h-4 text-[#69ADFF]" />;
      case 'OPENED':
        return <Eye className="w-4 h-4 text-[#0DBACC]" />;
      case 'CLICKED':
        return <MousePointerClick className="w-4 h-4 text-[#74ACEF]" />;
      case 'BOUNCED':
      case 'COMPLAINED':
        return <XCircle className="w-4 h-4 text-[#F18AB5]" />;
      case 'UNSUBSCRIBED':
        return <CheckCircle2 className="w-4 h-4 text-[#7E7F90]" />;
      default:
        return <FileText className="w-4 h-4 text-[#7E7F90]" />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'SENT':
        return 'נשלח';
      case 'DELIVERED':
        return 'נמסר';
      case 'OPENED':
        return 'נפתח';
      case 'CLICKED':
        return 'נלחץ';
      case 'BOUNCED':
        return 'נדחה';
      case 'COMPLAINED':
        return 'דיווח כספאם';
      case 'UNSUBSCRIBED':
        return 'ביטל מנוי';
      default:
        return type;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <FileText className="w-8 h-8 text-[#69ADFF] animate-pulse" />
          </div>
          <p className="text-[#7E7F90]">טוען...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <AlertCircle className="w-12 h-12 text-[#F18AB5] mx-auto mb-4" />
          <p className="text-[#303150] font-semibold mb-2">שגיאה</p>
          <p className="text-[#7E7F90]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#303150] mb-1">לוגים</h1>
        <p className="text-sm text-[#7E7F90]">מעקב אחרי אירועי דיוור</p>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
        {events.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-[#BDBDCB] mx-auto mb-4" />
            <p className="text-[#7E7F90]">אין אירועים עדיין</p>
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="lg:hidden divide-y divide-[#F7F7F8]">
              {events.map((event) => (
                <div key={event.id} className="p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    {getEventIcon(event.eventType)}
                    <span className="text-sm font-medium text-[#303150]">{getEventLabel(event.eventType)}</span>
                    <span className="text-[11px] text-[#BDBDCB] mr-auto">{formatDate(event.timestamp)}</span>
                  </div>
                  <p className="text-sm text-[#303150] truncate">{event.campaign.name}</p>
                  <p className="text-xs text-[#7E7F90] truncate">{event.user.email}</p>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F7F7F8] border-b border-[#E8E8ED]">
                  <tr>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-[#303150]">תאריך</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-[#303150]">קמפיין</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-[#303150]">משתמש</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-[#303150]">סוג אירוע</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-[#303150]">פרטים</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b border-[#F7F7F8] hover:bg-[#F7F7F8]/50">
                      <td className="px-6 py-4 text-sm text-[#7E7F90]">{formatDate(event.timestamp)}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-[#303150]">{event.campaign.name}</p>
                          <p className="text-xs text-[#7E7F90]">{event.campaign.subject}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#303150]">{event.user.email}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getEventIcon(event.eventType)}
                          <span className="text-sm text-[#303150]">{getEventLabel(event.eventType)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#7E7F90]">
                        {event.metadata && Object.keys(event.metadata).length > 0 ? (
                          <span className="text-xs">יש פרטים נוספים</span>
                        ) : (
                          <span className="text-xs text-[#BDBDCB]">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-[#F7F7F8] flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-[#F7F7F8] text-[#303150] rounded-xl hover:bg-[#E8E8ED] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  קודם
                </button>
                <span className="text-sm text-[#7E7F90]">
                  עמוד {page} מתוך {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-[#F7F7F8] text-[#303150] rounded-xl hover:bg-[#E8E8ED] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  הבא
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

