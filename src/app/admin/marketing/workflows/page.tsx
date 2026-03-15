'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Loader2,
  AlertCircle,
  Workflow,
  Pencil,
  Trash2,
  Users,
} from 'lucide-react';
import { apiFetch } from '@/lib/utils';

interface WorkflowItem {
  id: string;
  name: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED';
  triggerType: string;
  createdAt: string;
  _count: { enrollments: number };
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT: { label: 'טיוטה', bg: 'bg-gray-100', text: 'text-gray-600' },
  ACTIVE: { label: 'פעיל', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  PAUSED: { label: 'מושהה', bg: 'bg-amber-50', text: 'text-amber-700' },
};

const triggerLabels: Record<string, string> = {
  MANUAL: 'ידני',
  USER_REGISTERED: 'הרשמה',
  ADDED_TO_GROUP: 'הוספה לקבוצה',
};

export default function WorkflowsPage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();

  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/marketing/workflows');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setWorkflows(data.workflows || []);
    } catch {
      setError('שגיאה בטעינת תהליכי העבודה');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === 'authenticated') fetchWorkflows();
  }, [sessionStatus, fetchWorkflows]);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await apiFetch('/api/admin/marketing/workflows', {
        method: 'POST',
        body: JSON.stringify({ name: 'תהליך חדש', triggerType: 'MANUAL' }),
      });
      if (!res.ok) throw new Error('Failed to create');
      const data = await res.json();
      router.push(`/admin/marketing/workflows/${data.workflow.id}/edit`);
    } catch {
      setError('שגיאה ביצירת תהליך');
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('האם אתה בטוח שברצונך למחוק תהליך זה?')) return;
    setDeletingId(id);
    try {
      const res = await apiFetch(`/api/admin/marketing/workflows/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
    } catch {
      setError('שגיאה במחיקת תהליך');
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
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
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#303150]">
            תהליכי עבודה
          </h1>
          <p className="text-xs lg:text-sm text-[#7E7F90] mt-1">
            אוטומציות דיוור מבוססות DAG
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-2 bg-[#69ADFF] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5a9de8] transition-colors disabled:opacity-50"
        >
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          תהליך חדש
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-rose-50 text-rose-700 px-4 py-3 rounded-xl mb-4 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Empty state */}
      {workflows.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#F7F7F8]">
          <Workflow className="w-12 h-12 text-[#BDBDCB] mx-auto mb-4" />
          <p className="text-[#7E7F90] text-sm mb-4">
            אין תהליכי עבודה עדיין
          </p>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="text-[#69ADFF] text-sm font-semibold hover:underline"
          >
            צור תהליך חדש
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((wf) => {
            const cfg = statusConfig[wf.status] || statusConfig.DRAFT;
            return (
              <div
                key={wf.id}
                className="bg-white rounded-2xl border border-[#F7F7F8] p-4 sm:p-5 flex items-center gap-4 hover:shadow-sm transition-shadow group"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-[#69ADFF]/10 flex items-center justify-center flex-shrink-0">
                  <Workflow className="w-5 h-5 text-[#69ADFF]" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold text-[#303150] truncate">
                      {wf.name}
                    </h3>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#7E7F90]">
                    <span>טריגר: {triggerLabels[wf.triggerType] || wf.triggerType}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {wf._count.enrollments} רשומים
                    </span>
                    <span>·</span>
                    <span>{formatDate(wf.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() =>
                      router.push(`/admin/marketing/workflows/${wf.id}/edit`)
                    }
                    className="p-2 rounded-xl hover:bg-[#F7F7F8] text-[#7E7F90] hover:text-[#69ADFF] transition-colors"
                    title="ערוך"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(wf.id)}
                    disabled={deletingId === wf.id}
                    className="p-2 rounded-xl hover:bg-rose-50 text-[#7E7F90] hover:text-rose-500 transition-colors disabled:opacity-50"
                    title="מחק"
                  >
                    {deletingId === wf.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
