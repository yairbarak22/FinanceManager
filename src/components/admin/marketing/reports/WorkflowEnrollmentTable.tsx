'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/utils';

interface Enrollment {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  currentNodeId: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  ACTIVE: { label: 'פעיל', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  COMPLETED: { label: 'הסתיים', bg: 'bg-blue-50', text: 'text-blue-700' },
  CANCELLED: { label: 'בוטל', bg: 'bg-rose-50', text: 'text-rose-700' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function WorkflowEnrollmentTable({
  workflowId,
  nodeNames,
}: {
  workflowId: string;
  nodeNames: Record<string, string>;
}) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        const res = await apiFetch(
          `/api/admin/marketing/workflows/${workflowId}/report/enrollments`,
        );
        if (!res.ok) throw new Error('שגיאה בטעינה');
        const json = await res.json();
        setEnrollments(json.enrollments || []);
      } catch {
        setError('שגיאה בטעינת נרשמים');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [workflowId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-[#69ADFF]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-sm text-rose-600">{error}</div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-[#7E7F90]">
        אין נרשמים עדיין
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="grid text-xs font-semibold text-[#7E7F90] border-b border-[#E8E8ED] px-4 py-3"
        style={{ gridTemplateColumns: '2fr 2fr 1fr 1.5fr 1.5fr 1.5fr' }}
      >
        <span>שם</span>
        <span>אימייל</span>
        <span>סטטוס</span>
        <span>צומת נוכחי</span>
        <span>נרשם</span>
        <span>עודכן</span>
      </div>
      {enrollments.map((e) => {
        const cfg = STATUS_CONFIG[e.status] || STATUS_CONFIG.ACTIVE;
        const nodeName = e.currentNodeId
          ? nodeNames[e.currentNodeId] || e.currentNodeId
          : '—';

        return (
          <div
            key={e.id}
            className="grid text-xs text-[#303150] border-b border-[#F7F7F8] px-4 py-2.5 hover:bg-[#FAFAFA] transition-colors items-center"
            style={{ gridTemplateColumns: '2fr 2fr 1fr 1.5fr 1.5fr 1.5fr' }}
          >
            <span className="truncate">{e.userName || '—'}</span>
            <span className="truncate text-[#7E7F90]">{e.userEmail}</span>
            <span>
              <span
                className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}
              >
                {cfg.label}
              </span>
            </span>
            <span className="truncate text-[#7E7F90]">{nodeName}</span>
            <span className="text-[#7E7F90]">{formatDate(e.createdAt)}</span>
            <span className="text-[#7E7F90]">{formatDate(e.updatedAt)}</span>
          </div>
        );
      })}
    </div>
  );
}
