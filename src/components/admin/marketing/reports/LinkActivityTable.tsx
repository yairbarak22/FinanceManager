'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/utils';

interface LinkData {
  url: string;
  uniqueClicks: number;
  totalClicks: number;
}

const GRID_COLS = 'grid grid-cols-[1fr_120px_120px]';

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className={`${GRID_COLS} bg-[#FAFAFA] border-b border-[#E8E8ED]`}>
        {['', '', ''].map((_, i) => (
          <div key={i} className="px-4 py-3">
            <div className="h-3 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={`${GRID_COLS} border-b border-[#E8E8ED]`}>
          <div className="px-4 py-3">
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </div>
          <div className="px-4 py-3">
            <div className="h-4 w-10 bg-gray-200 rounded" />
          </div>
          <div className="px-4 py-3">
            <div className="h-4 w-10 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LinkActivityTable({
  campaignId,
}: {
  campaignId: string;
}) {
  const [links, setLinks] = useState<LinkData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch(
          `/api/admin/marketing/campaigns/${campaignId}/report/links`,
        );
        if (!res.ok) throw new Error('שגיאה בטעינת הנתונים');
        const json = await res.json();
        setLinks(json.links);
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

  if (!links || links.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-[#7E7F90]">אין קישורים להצגה</p>
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
          קישור
        </div>
        <div className="px-4 py-3 text-xs font-semibold text-[#7E7F90]">
          הקלקות ייחודיות
        </div>
        <div className="px-4 py-3 text-xs font-semibold text-[#7E7F90]">
          סה"כ הקלקות
        </div>
      </div>

      {/* Rows */}
      {links.map((link, idx) => (
        <div
          key={link.url}
          className={`${GRID_COLS} hover:bg-[#FAFAFE] transition-colors ${
            idx < links.length - 1 ? 'border-b border-[#E8E8ED]' : ''
          }`}
        >
          <div className="px-4 py-3 flex items-center gap-2 min-w-0">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              title={link.url}
              className="text-sm text-[#303150] hover:text-[#69ADFF] truncate transition-colors"
            >
              {link.url.length > 60
                ? `${link.url.slice(0, 60)}…`
                : link.url}
            </a>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#7E7F90]" />
            </a>
          </div>
          <div className="px-4 py-3 text-sm font-medium text-[#303150]">
            {link.uniqueClicks.toLocaleString()}
          </div>
          <div className="px-4 py-3 text-sm text-[#7E7F90]">
            {link.totalClicks.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
