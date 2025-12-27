'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Users, UserPlus, Copy, Trash2, Crown, User, Mail, Check, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/utils';

interface Member {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface Invite {
  id: string;
  email: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

interface AccountSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountSettings({ isOpen, onClose }: AccountSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [accountName, setAccountName] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [membersRes, invitesRes] = await Promise.all([
        fetch('/api/account/members'),
        fetch('/api/account/invite'),
      ]);

      if (membersRes.ok) {
        const data = await membersRes.json();
        setAccountName(data.accountName);
        setMembers(data.members);
        setCurrentUserId(data.currentUserId || '');
      }

      if (invitesRes.ok) {
        const data = await invitesRes.json();
        setInvites(data);
      }
    } catch (err) {
      console.error('Error fetching account data:', err);
      setError('Failed to load account data');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      setError('נא להזין כתובת מייל תקינה');
      return;
    }

    try {
      setInviting(true);
      setError(null);

      const res = await apiFetch('/api/account/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send invite');
        return;
      }

      setInvites([data, ...invites]);
      setNewEmail('');
    } catch (err) {
      setError('Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteInvite = async (inviteId: string) => {
    try {
      const res = await apiFetch(`/api/account/invite?id=${inviteId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setInvites(invites.filter((i) => i.id !== inviteId));
      }
    } catch (err) {
      console.error('Error deleting invite:', err);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('האם אתה בטוח שברצונך להסיר את המשתמש מהחשבון?')) {
      return;
    }

    try {
      const res = await apiFetch(`/api/account/members?memberId=${memberId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMembers(members.filter((m) => m.id !== memberId));
      }
    } catch (err) {
      console.error('Error removing member:', err);
    }
  };

  const copyInviteLink = async (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // SECURITY: Check if the CURRENT user is an OWNER (not just if any owner exists)
  // Use useMemo so this recalculates when members or currentUserId change
  // IMPORTANT: Must be before the conditional return to follow React Hooks rules
  const isOwner = useMemo(() => {
    return members.some((m) => m.userId === currentUserId && m.role === 'OWNER');
  }, [members, currentUserId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">שיתוף חשבון</h2>
              <p className="text-xs text-slate-500">{accountName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Invite Section */}
              {isOwner && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    הזמן משתמש חדש
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="כתובת מייל"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      dir="ltr"
                    />
                    <button
                      onClick={handleInvite}
                      disabled={inviting}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {inviting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      הזמן
                    </button>
                  </div>
                </div>
              )}

              {/* Pending Invites */}
              {invites.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">הזמנות ממתינות</h3>
                  <div className="space-y-2">
                    {invites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900" dir="ltr">
                            {invite.email}
                          </p>
                          <p className="text-xs text-slate-500">
                            פג תוקף: {new Date(invite.expiresAt).toLocaleDateString('he-IL')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyInviteLink(invite.token)}
                            className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                            title="העתק קישור"
                          >
                            {copiedToken === invite.token ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-amber-600" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteInvite(invite.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="בטל הזמנה"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Members List */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">משתמשים בחשבון</h3>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {member.user.image ? (
                          <img
                            src={member.user.image}
                            alt={member.user.name || 'User'}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                            <User className="w-5 h-5 text-slate-500" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-900">
                              {member.user.name || 'ללא שם'}
                            </p>
                            {member.role === 'OWNER' && (
                              <Crown className="w-4 h-4 text-amber-500" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500" dir="ltr">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                      {isOwner && member.role !== 'OWNER' && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="הסר משתמש"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Note */}
              <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                <p className="font-medium mb-1">שיתוף חשבון מאפשר:</p>
                <ul className="text-xs space-y-1 list-disc list-inside">
                  <li>צפייה ועריכה משותפת של כל הנתונים</li>
                  <li>ניהול פיננסי משותף לבני זוג או שותפים</li>
                  <li>רק בעל החשבון יכול להזמין ולהסיר משתמשים</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}

