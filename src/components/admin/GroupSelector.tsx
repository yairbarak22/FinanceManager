'use client';

import { useState, useEffect } from 'react';
import { Users, Loader2, Check } from 'lucide-react';
import { apiFetch } from '@/lib/utils';

interface Group {
  id: string;
  name: string;
  description: string | null;
  _count: { members: number };
}

interface GroupSelectorProps {
  selectedGroupId: string | null;
  onChange: (groupId: string | null, userIds: string[]) => void;
}

export default function GroupSelector({ selectedGroupId, onChange }: GroupSelectorProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/user-groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (groupId: string) => {
    if (selectedGroupId === groupId) {
      onChange(null, []);
      return;
    }

    setLoadingMembers(true);
    try {
      const res = await apiFetch(`/api/admin/user-groups/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        const userIds = (data.group.members || []).map(
          (m: { userId: string }) => m.userId,
        );
        onChange(groupId, userIds);
      }
    } catch {
      /* noop */
    } finally {
      setLoadingMembers(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-[#69ADFF] mx-auto mb-2" />
        <p className="text-xs text-[#7E7F90]">טוען קבוצות...</p>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-6 bg-[#F7F7F8] rounded-xl">
        <Users className="w-8 h-8 text-[#BDBDCB] mx-auto mb-2" />
        <p className="text-sm text-[#7E7F90]">אין קבוצות שמורות</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {loadingMembers && (
        <div className="flex items-center gap-2 text-xs text-[#69ADFF] mb-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          טוען חברי קבוצה...
        </div>
      )}
      {groups.map((group) => {
        const isSelected = selectedGroupId === group.id;
        return (
          <button
            key={group.id}
            type="button"
            onClick={() => handleSelect(group.id)}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-right ${
              isSelected
                ? 'border-[#69ADFF] bg-[#69ADFF]/5'
                : 'border-[#E8E8ED] bg-white hover:border-[#69ADFF]/50'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isSelected ? 'bg-[#69ADFF] text-white' : 'bg-[#F7F7F8] text-[#7E7F90]'
              }`}
            >
              {isSelected ? <Check className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isSelected ? 'text-[#303150]' : 'text-[#7E7F90]'}`}>
                {group.name}
              </p>
              <p className="text-xs text-[#BDBDCB]">{group._count.members} חברים</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
