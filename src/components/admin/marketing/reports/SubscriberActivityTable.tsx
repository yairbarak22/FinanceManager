'use client';

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/utils';

interface SubscriberData {
  emailId: string;
  email: string;
  status: string;
  opens: number;
  clicks: number;
}

const GRID_COLS = 'grid grid-cols-[1fr_120px_100px_100px]';

const STATUS_COLORS: Record<string, string> = {
  Complained: 'bg-red-100 text-red-700',
  Bounced: 'bg-red-100 text-red-700',
  Unsubscribed: 'bg-orange-100 text-orange-700',
  Clicked: 'bg-green-100 text-green-700',
  Opened: 'bg-blue-100 text-blue-700',
  Sent: 'bg-gray-100 text-gray-700',
};

const STATUS_LABELS: Record<string, string> = {
  Complained: 'תלונה',
  Bounced: 'דחייה',
  Unsubscribed: 'הסרת מנוי',
  Clicked: 'הקליק',
  Opened: 'פתח',
  Sent: 'נשלח',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`px-2.5 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[status] || STATUS_COLORS.Sent}`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className={`${GRID_COLS} bg-[#FAFAFA] border-b border-[#E8E8ED]`}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="px-4 py-3">
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={`${GRID_COLS} border-b border-[#E8E8ED]`}>
          <div className="px-4 py-3">
            <div className="h-4 w-40 bg-gray-200 rounded" />
          </div>
          <div className="px-4 py-3">
            <div className="h-5 w-14 bg-gray-200 rounded-lg" />
          </div>
          <div className="px-4 py-3">
            <div className="h-4 w-6 bg-gray-200 rounded" />
          </div>
          <div className="px-4 py-3">
            <div className="h-4 w-6 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SubscriberActivityTable({
  campaignId,
}: {
  campaignId: string;
}) {
  const [subscribers, setSubscribers] = useState<SubscriberData[] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch(
          `/api/admin/marketing/campaigns/${campaignId}/report/subscribers`,
        );
        if (!res.ok) throw new Error('שגיאה בטעינת הנתונים');
        const json = await res.json();
        setSubscribers(json.subscribers);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'שגיאה בטעינת הנתונים',
        );
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [campaignId]);

  if (loading) return <TableSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-[#F18AB5] mx-auto mb-2" />
          <p className="text-sm text-[#7E7F90]">{error}</p>
        </div>
      </div>
    );
  }

  if (!subscribers || subscribers.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-[#7E7F90]">אין מנויים להצגה</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        className={`${GRID_COLS} bg-[#FAFAFA] border-b border-[#E8E8ED]`}
      >
        <div className="px-4 py-3 text-xs font-semibold text-[#7E7F90]">
          אימייל
        </div>
        <div className="px-4 py-3 text-xs font-semibold text-[#7E7F90]">
          סטטוס
        </div>
        <div className="px-4 py-3 text-xs font-semibold text-[#7E7F90]">
          פתיחות
        </div>
        <div className="px-4 py-3 text-xs font-semibold text-[#7E7F90]">
          הקלקות
        </div>
      </div>

      {/* Rows */}
      {subscribers.map((sub, idx) => (
        <div
          key={sub.emailId}
          className={`${GRID_COLS} hover:bg-[#FAFAFE] transition-colors ${
            idx < subscribers.length - 1
              ? 'border-b border-[#E8E8ED]'
              : ''
          }`}
        >
          <div className="px-4 py-3 text-sm font-medium text-[#303150] truncate min-w-0">
            {sub.email}
          </div>
          <div className="px-4 py-3">
            <StatusBadge status={sub.status} />
          </div>
          <div className="px-4 py-3 text-sm font-medium text-[#303150]">
            {sub.opens}
          </div>
          <div className="px-4 py-3 text-sm font-medium text-[#303150]">
            {sub.clicks}
          </div>
        </div>
      ))}
    </div>
  );
}
