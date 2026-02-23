'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Users,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail,
  Megaphone,
  UserPlus,
  X,
} from 'lucide-react';
import { apiFetch } from '@/lib/utils';

interface GroupMember {
  id: string;
  userId: string;
  addedAt: string;
  user: { id: string; name: string | null; email: string };
}

interface GroupDetail {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { members: number };
  creator: { id: string; name: string | null; email: string };
  members: GroupMember[];
}

export default function UserGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [addingEmails, setAddingEmails] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [addingLoading, setAddingLoading] = useState(false);
  const [inlineMessage, setInlineMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (sessionStatus !== 'loading') fetchGroup();
  }, [sessionStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  function showMessage(type: 'success' | 'error', text: string) {
    setInlineMessage({ type, text });
    setTimeout(() => setInlineMessage(null), 5000);
  }

  const fetchGroup = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/admin/user-groups/${id}`);
      if (!res.ok) {
        setError('קבוצה לא נמצאה');
        return;
      }
      const data = await res.json();
      setGroup(data.group);
      setEditName(data.group.name);
      setEditDescription(data.group.description || '');
    } catch {
      setError('שגיאה בטעינת הקבוצה');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setRemovingId(userId);
    try {
      await apiFetch(`/api/admin/user-groups/${id}/members`, {
        method: 'DELETE',
        body: JSON.stringify({ userIds: [userId] }),
      });
      setGroup((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members.filter((m) => m.userId !== userId),
              _count: { members: prev._count.members - 1 },
            }
          : null,
      );
    } catch {
      /* noop */
    } finally {
      setRemovingId(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/admin/user-groups/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName.trim(), description: editDescription.trim() || null }),
      });
      if (res.ok) {
        setGroup((prev) =>
          prev ? { ...prev, name: editName.trim(), description: editDescription.trim() || null } : null,
        );
        setEditing(false);
        showMessage('success', 'הקבוצה עודכנה');
      }
    } catch {
      showMessage('error', 'שגיאה בעדכון הקבוצה');
    } finally {
      setSaving(false);
    }
  };

  const handleAddEmails = async () => {
    const emailRegex = /[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+/g;
    const emails = emailInput.match(emailRegex) || [];
    if (emails.length === 0) {
      showMessage('error', 'לא נמצאו כתובות אימייל');
      return;
    }

    setAddingLoading(true);
    try {
      const res = await apiFetch(`/api/admin/user-groups/${id}/members`, {
        method: 'POST',
        body: JSON.stringify({ emails }),
      });
      const data = await res.json();
      if (!res.ok) {
        showMessage('error', data.error || 'שגיאה בהוספת משתמשים');
        return;
      }
      const msg = data.totalNotFound > 0
        ? `נוספו ${data.added} חברים. ${data.totalNotFound} אימיילים לא נמצאו.`
        : `נוספו ${data.added} חברים.`;
      showMessage('success', msg);
      setEmailInput('');
      setAddingEmails(false);
      fetchGroup();
    } catch {
      showMessage('error', 'שגיאה בהוספת משתמשים');
    } finally {
      setAddingLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`האם למחוק את הקבוצה "${group?.name}"? פעולה זו בלתי הפיכה.`)) return;
    try {
      const res = await apiFetch(`/api/admin/user-groups/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/marketing/user-groups');
      }
    } catch {
      showMessage('error', 'שגיאה במחיקת הקבוצה');
    }
  };

  if (loading || sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-[#69ADFF]" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <AlertCircle className="w-12 h-12 text-[#F18AB5] mx-auto mb-4" />
          <p className="text-[#303150] font-semibold mb-2">שגיאה</p>
          <p className="text-[#7E7F90]">{error || 'קבוצה לא נמצאה'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/admin/marketing/user-groups')}
          className="p-2 rounded-xl hover:bg-[#F7F7F8] transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-[#7E7F90]" />
        </button>
        <div className="flex-1">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-xl font-bold text-[#303150] border border-[#E8E8ED] rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/30"
              />
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="text-xs text-[#69ADFF] font-semibold hover:underline"
              >
                {saving ? 'שומר...' : 'שמור'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-xs text-[#7E7F90] hover:underline"
              >
                ביטול
              </button>
            </div>
          ) : (
            <h1
              className="text-2xl font-bold text-[#303150] cursor-pointer hover:text-[#69ADFF] transition-colors"
              onClick={() => setEditing(true)}
            >
              {group.name}
            </h1>
          )}
          <p className="text-sm text-[#7E7F90] mt-1">
            {group._count.members} חברים
            {group.description && ` — ${group.description}`}
          </p>
        </div>
      </div>

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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        <button
          onClick={() => router.push(`/admin/marketing/email-sequences/new?groupId=${id}`)}
          className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#F7F7F8] hover:border-[#69ADFF]/50 transition-colors text-sm"
        >
          <Mail className="w-4 h-4 text-[#69ADFF]" />
          <span className="text-[#303150] font-medium">שלח סדרה</span>
        </button>
        <button
          onClick={() => router.push(`/admin/marketing/campaigns/new?groupId=${id}`)}
          className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#F7F7F8] hover:border-[#69ADFF]/50 transition-colors text-sm"
        >
          <Megaphone className="w-4 h-4 text-[#69ADFF]" />
          <span className="text-[#303150] font-medium">שלח קמפיין</span>
        </button>
        <button
          onClick={() => setAddingEmails(true)}
          className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#F7F7F8] hover:border-[#69ADFF]/50 transition-colors text-sm"
        >
          <UserPlus className="w-4 h-4 text-[#0DBACC]" />
          <span className="text-[#303150] font-medium">הוסף חברים</span>
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#F7F7F8] hover:border-[#F18AB5]/50 transition-colors text-sm"
        >
          <Trash2 className="w-4 h-4 text-[#F18AB5]" />
          <span className="text-[#303150] font-medium">מחק קבוצה</span>
        </button>
      </div>

      {/* Add Emails Inline */}
      {addingEmails && (
        <div className="bg-white rounded-2xl border border-[#F7F7F8] p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#303150]">הוספת חברים לפי אימייל</h3>
            <button onClick={() => setAddingEmails(false)} className="p-1 hover:bg-[#F7F7F8] rounded-lg">
              <X className="w-4 h-4 text-[#7E7F90]" />
            </button>
          </div>
          <textarea
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="הדבק כתובות אימייל מופרדות בשורה חדשה, פסיק או נקודה-פסיק..."
            className="w-full min-h-[120px] px-4 py-3 border border-[#E8E8ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent text-sm resize-y mb-3"
            dir="ltr"
          />
          <button
            onClick={handleAddEmails}
            disabled={addingLoading || !emailInput.trim()}
            className="flex items-center gap-2 bg-[#69ADFF] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-[#5a9de8] transition-colors disabled:opacity-40"
          >
            {addingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            הוסף חברים
          </button>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white rounded-2xl border border-[#F7F7F8] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F7F7F8]">
          <h2 className="text-base font-bold text-[#303150] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#69ADFF]" />
            חברי הקבוצה ({group.members.length})
          </h2>
        </div>
        {group.members.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-10 h-10 text-[#BDBDCB] mx-auto mb-3" />
            <p className="text-sm text-[#7E7F90]">אין חברים בקבוצה</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F7F7F8] max-h-[500px] overflow-y-auto">
            {group.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-[#FAFAFE] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#303150] truncate">
                    {member.user.name || 'ללא שם'}
                  </p>
                  <p className="text-xs text-[#7E7F90] truncate">{member.user.email}</p>
                </div>
                <button
                  onClick={() => handleRemoveMember(member.userId)}
                  disabled={removingId === member.userId}
                  className="p-1.5 hover:bg-[#F7F7F8] rounded-lg transition-colors ms-2 flex-shrink-0 disabled:opacity-50"
                  title="הסר מהקבוצה"
                >
                  {removingId === member.userId ? (
                    <Loader2 className="w-3.5 h-3.5 text-[#F18AB5] animate-spin" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-[#7E7F90]" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
