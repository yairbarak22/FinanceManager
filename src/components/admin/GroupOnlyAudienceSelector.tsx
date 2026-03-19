'use client';

import { useState, useEffect } from 'react';
import { Users, Plus } from 'lucide-react';
import { apiFetch } from '@/lib/utils';
import type { SegmentFilter } from '@/lib/marketing/segment';

interface GroupOption {
  id: string;
  name: string;
  _count: { members: number };
}

interface GroupOnlyAudienceSelectorProps {
  value: SegmentFilter;
  onChange: (filter: SegmentFilter) => void;
  onCountChange?: (count: number) => void;
}

export default function GroupOnlyAudienceSelector({
  value,
  onChange,
  onCountChange,
}: GroupOnlyAudienceSelectorProps) {
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribedCount, setSubscribedCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiFetch('/api/admin/user-groups')
      .then((res) => res.json())
      .then((data) => setGroups(data.groups || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectedGroupId = value.type === 'group' ? value.groupId : null;

  useEffect(() => {
    if (!selectedGroupId) {
      setSubscribedCount(null);
      onCountChange?.(0);
      return;
    }

    let cancelled = false;
    setCountLoading(true);

    apiFetch('/api/admin/marketing/campaigns/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ segmentFilter: { type: 'group', groupId: selectedGroupId } }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          const count = data.userCount || 0;
          setSubscribedCount(count);
          onCountChange?.(count);
        }
      })
      .catch(() => {
        if (!cancelled) setSubscribedCount(null);
      })
      .finally(() => {
        if (!cancelled) setCountLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedGroupId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="text-center py-8 text-sm text-[#7E7F90]">
        טוען קבוצות...
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-8 bg-[#F7F7F8] rounded-xl">
        <Users className="w-10 h-10 text-[#BDBDCB] mx-auto mb-3" />
        <p className="text-sm font-medium text-[#7E7F90] mb-1">
          אין קבוצות משתמשים
        </p>
        <p className="text-xs text-[#BDBDCB] mb-4">
          יש ליצור קבוצה לפני שליחת קמפיין
        </p>
        <a
          href="/admin/marketing/user-groups/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#69ADFF] text-white text-sm rounded-xl hover:bg-[#5A9EE6] transition-colors"
        >
          <Plus className="w-4 h-4" />
          צור קבוצה
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-[#303150] mb-3">
        בחירת קהל
      </label>

      <div className="space-y-2">
        {groups.map((group) => {
          const isSelected = selectedGroupId === group.id;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => onChange({ type: 'group', groupId: group.id })}
              className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-[#69ADFF] bg-[#69ADFF]/5'
                  : 'border-[#E8E8ED] bg-white hover:border-[#69ADFF]/50'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isSelected
                    ? 'bg-[#69ADFF] text-white'
                    : 'bg-[#F7F7F8] text-[#7E7F90]'
                }`}
              >
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1 text-right">
                <p
                  className={`font-medium ${
                    isSelected ? 'text-[#303150]' : 'text-[#7E7F90]'
                  }`}
                >
                  {group.name}
                </p>
                <p className="text-xs text-[#BDBDCB] mt-1">
                  {group._count.members} חברים בקבוצה
                </p>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-[#69ADFF] flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Subscribed user count for the selected group */}
      <div className="bg-[#F7F7F8] rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#7E7F90]">
            משתמשים מנויים לדיוור:
          </span>
          {!selectedGroupId ? (
            <span className="text-sm text-[#BDBDCB]">בחר קבוצה</span>
          ) : countLoading ? (
            <span className="text-sm text-[#BDBDCB]">מחשב...</span>
          ) : (
            <span className="text-lg font-bold text-[#303150]">
              {subscribedCount !== null ? subscribedCount.toLocaleString() : '-'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
