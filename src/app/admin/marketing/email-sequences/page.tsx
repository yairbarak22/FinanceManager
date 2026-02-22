'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Pause,
  Play,
  XCircle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import { apiFetch } from '@/lib/utils';

interface SequenceUser {
  id: string;
  name: string | null;
  email: string;
}

interface Sequence {
  id: string;
  userId: string;
  sequenceType: string;
  currentStep: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  sendHour: number;
  startedAt: string;
  lastSentAt: string | null;
  nextSendAt: string | null;
  completedAt: string | null;
  user: SequenceUser;
}

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  ACTIVE: { label: 'פעילה', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  PAUSED: { label: 'מושהית', bg: 'bg-amber-50', text: 'text-amber-700' },
  COMPLETED: { label: 'הושלמה', bg: 'bg-blue-50', text: 'text-blue-700' },
  CANCELLED: { label: 'בוטלה', bg: 'bg-rose-50', text: 'text-rose-700' },
};

const TOTAL_STEPS = 5;

export default function EmailSequencesPage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();

  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [inlineMessage, setInlineMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');

  const showMessage = useCallback(
    (type: 'success' | 'error', text: string) => {
      setInlineMessage({ type, text });
      setTimeout(() => setInlineMessage(null), 4000);
    },
    [],
  );

  const fetchSequences = useCallback(async () => {
    try {
      const url = filterStatus
        ? `/api/admin/email-sequences?status=${filterStatus}`
        : '/api/admin/email-sequences';
      const res = await apiFetch(url);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSequences(data.sequences || []);
    } catch {
      setError('שגיאה בטעינת הסדרות');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    if (sessionStatus === 'authenticated') fetchSequences();
  }, [sessionStatus, fetchSequences]);

  async function handleAction(id: string, action: string) {
    setActionLoading(id);
    try {
      const res = await apiFetch(`/api/admin/email-sequences/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        showMessage('error', data.error || 'שגיאה');
        return;
      }
      showMessage('success', 'הפעולה בוצעה בהצלחה');
      fetchSequences();
    } catch {
      showMessage('error', 'שגיאה בביצוע הפעולה');
    } finally {
      setActionLoading(null);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-[#69ADFF]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#303150]">סדרות מיילים</h1>
          <p className="text-sm text-[#7E7F90] mt-1">
            ניהול סדרות מיילים אוטומטיות
          </p>
        </div>
        <button
          onClick={() =>
            router.push('/admin/marketing/email-sequences/new')
          }
          className="flex items-center gap-2 bg-[#69ADFF] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5a9de8] transition-colors"
        >
          <Plus className="w-4 h-4" />
          סדרה חדשה
        </button>
      </div>

      {/* Inline message */}
      {inlineMessage && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm font-medium ${
            inlineMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-rose-50 text-rose-700'
          }`}
        >
          {inlineMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {inlineMessage.text}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 text-rose-700 px-4 py-3 rounded-xl mb-4 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setLoading(true);
          }}
          className="text-sm border border-[#E8E8ED] rounded-xl px-3 py-2 bg-white text-[#303150] focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/30"
        >
          <option value="">כל הסטטוסים</option>
          <option value="ACTIVE">פעילות</option>
          <option value="PAUSED">מושהות</option>
          <option value="COMPLETED">הושלמו</option>
          <option value="CANCELLED">בוטלו</option>
        </select>
      </div>

      {/* Table / Cards */}
      {sequences.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#F7F7F8]">
          <Mail className="w-12 h-12 text-[#BDBDCB] mx-auto mb-4" />
          <p className="text-[#7E7F90] text-sm">אין סדרות מיילים עדיין</p>
          <button
            onClick={() =>
              router.push('/admin/marketing/email-sequences/new')
            }
            className="mt-4 text-[#69ADFF] text-sm font-semibold hover:underline"
          >
            צור סדרה חדשה
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#F7F7F8] overflow-hidden">
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F7F7F8]">
                  <th className="text-start px-4 py-3 font-semibold text-[#7E7F90]">
                    משתמש
                  </th>
                  <th className="text-start px-4 py-3 font-semibold text-[#7E7F90]">
                    התקדמות
                  </th>
                  <th className="text-start px-4 py-3 font-semibold text-[#7E7F90]">
                    סטטוס
                  </th>
                  <th className="text-start px-4 py-3 font-semibold text-[#7E7F90]">
                    שליחה הבאה
                  </th>
                  <th className="text-start px-4 py-3 font-semibold text-[#7E7F90]">
                    התחלה
                  </th>
                  <th className="text-start px-4 py-3 font-semibold text-[#7E7F90]">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody>
                {sequences.map((seq) => {
                  const cfg = statusConfig[seq.status] || statusConfig.ACTIVE;
                  const progress = Math.min(seq.currentStep, TOTAL_STEPS);
                  return (
                    <tr
                      key={seq.id}
                      className="border-b border-[#F7F7F8] last:border-b-0 hover:bg-[#FAFAFA] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#303150]">
                          {seq.user.name || 'ללא שם'}
                        </p>
                        <p className="text-xs text-[#BDBDCB]">
                          {seq.user.email}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-[#E8E8ED] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#69ADFF] rounded-full transition-all duration-300"
                              style={{
                                width: `${(progress / TOTAL_STEPS) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-[#7E7F90]">
                            {progress}/{TOTAL_STEPS}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${cfg.bg} ${cfg.text}`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#7E7F90] text-xs">
                        {formatDate(seq.nextSendAt)}
                      </td>
                      <td className="px-4 py-3 text-[#7E7F90] text-xs">
                        {formatDate(seq.startedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {seq.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleAction(seq.id, 'pause')}
                              disabled={actionLoading === seq.id}
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors disabled:opacity-50"
                              title="השהה"
                            >
                              <Pause className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {seq.status === 'PAUSED' && (
                            <button
                              onClick={() => handleAction(seq.id, 'resume')}
                              disabled={actionLoading === seq.id}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors disabled:opacity-50"
                              title="חדש"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(seq.status === 'ACTIVE' ||
                            seq.status === 'PAUSED') && (
                            <button
                              onClick={() => handleAction(seq.id, 'cancel')}
                              disabled={actionLoading === seq.id}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors disabled:opacity-50"
                              title="בטל"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-[#F7F7F8]">
            {sequences.map((seq) => {
              const cfg = statusConfig[seq.status] || statusConfig.ACTIVE;
              const progress = Math.min(seq.currentStep, TOTAL_STEPS);
              return (
                <div key={seq.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-[#303150] text-sm">
                        {seq.user.name || 'ללא שם'}
                      </p>
                      <p className="text-xs text-[#BDBDCB]">
                        {seq.user.email}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${cfg.bg} ${cfg.text}`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 bg-[#E8E8ED] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#69ADFF] rounded-full"
                        style={{
                          width: `${(progress / TOTAL_STEPS) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-[#7E7F90]">
                      {progress}/{TOTAL_STEPS}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#BDBDCB]">
                      שליחה הבאה: {formatDate(seq.nextSendAt)}
                    </p>
                    <div className="flex items-center gap-1">
                      {seq.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleAction(seq.id, 'pause')}
                          disabled={actionLoading === seq.id}
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {seq.status === 'PAUSED' && (
                        <button
                          onClick={() => handleAction(seq.id, 'resume')}
                          disabled={actionLoading === seq.id}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(seq.status === 'ACTIVE' ||
                        seq.status === 'PAUSED') && (
                        <button
                          onClick={() => handleAction(seq.id, 'cancel')}
                          disabled={actionLoading === seq.id}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
