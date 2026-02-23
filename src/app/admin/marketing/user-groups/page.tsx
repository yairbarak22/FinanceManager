'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Trash2, Eye, AlertCircle, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/utils';

interface Group {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { members: number };
  creator: { id: string; name: string | null; email: string };
}

export default function UserGroupsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'loading') fetchGroups();
  }, [status]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch('/api/admin/user-groups');
      if (!res.ok) {
        setError('שגיאה בטעינת הקבוצות');
        return;
      }
      const data = await res.json();
      setGroups(data.groups || []);
    } catch {
      setError('שגיאה בטעינת הקבוצות');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (group: Group) => {
    if (!confirm(`האם למחוק את הקבוצה "${group.name}"? פעולה זו בלתי הפיכה.`)) return;
    setDeletingId(group.id);
    try {
      const res = await apiFetch(`/api/admin/user-groups/${group.id}`, { method: 'DELETE' });
      if (res.ok) {
        setGroups((prev) => prev.filter((g) => g.id !== group.id));
      }
    } catch {
      /* noop */
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <Users className="w-8 h-8 text-[#69ADFF] animate-pulse" />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#303150] mb-1">קבוצות משתמשים</h1>
          <p className="text-xs sm:text-sm text-[#7E7F90]">ניהול קבוצות משתמשים לשליחת סדרות וקמפיינים</p>
        </div>
        <button
          onClick={() => router.push('/admin/marketing/user-groups/new')}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#69ADFF] text-white rounded-xl hover:bg-[#5A9EE6] transition-colors shadow-[0_4px_12px_rgba(105,173,255,0.3)] text-xs sm:text-sm"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          קבוצה חדשה
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
        {groups.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-[#69ADFF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-[#69ADFF]" />
            </div>
            <p className="text-[#303150] font-medium mb-2">אין קבוצות עדיין</p>
            <p className="text-sm text-[#7E7F90] mb-4">צור את הקבוצה הראשונה שלך</p>
            <button
              onClick={() => router.push('/admin/marketing/user-groups/new')}
              className="px-5 py-2.5 bg-[#69ADFF] text-white rounded-xl hover:bg-[#5A9EE6] transition-colors"
            >
              צור קבוצה ראשונה
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#F7F7F8]">
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between p-4 sm:p-5 hover:bg-[#FAFAFE] transition-colors"
              >
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => router.push(`/admin/marketing/user-groups/${group.id}`)}
                >
                  <p className="text-sm font-semibold text-[#303150] truncate">{group.name}</p>
                  {group.description && (
                    <p className="text-xs text-[#7E7F90] truncate mt-0.5">{group.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-[#BDBDCB]">
                    <span className="font-medium text-[#69ADFF]">
                      {group._count.members} חברים
                    </span>
                    <span>{formatDate(group.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ms-3">
                  <button
                    onClick={() => router.push(`/admin/marketing/user-groups/${group.id}`)}
                    className="p-2 hover:bg-[#F7F7F8] rounded-lg transition-colors"
                    title="צפייה"
                  >
                    <Eye className="w-4 h-4 text-[#7E7F90]" />
                  </button>
                  <button
                    onClick={() => handleDelete(group)}
                    disabled={deletingId === group.id}
                    className="p-2 hover:bg-[#F7F7F8] rounded-lg transition-colors disabled:opacity-50"
                    title="מחיקה"
                  >
                    {deletingId === group.id ? (
                      <Loader2 className="w-4 h-4 text-[#F18AB5] animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-[#F18AB5]" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
