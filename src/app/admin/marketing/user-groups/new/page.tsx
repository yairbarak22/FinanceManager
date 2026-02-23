'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  UserCog,
  Upload,
  ClipboardPaste,
} from 'lucide-react';
import { apiFetch } from '@/lib/utils';
import UserSelector from '@/components/admin/UserSelector';
import CsvUploader from '@/components/admin/CsvUploader';

type AddMode = 'manual' | 'csv' | 'paste';

export default function NewUserGroupPage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [addMode, setAddMode] = useState<AddMode>('manual');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [csvEmails, setCsvEmails] = useState<string[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [inlineMessage, setInlineMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  function showMessage(type: 'success' | 'error', text: string) {
    setInlineMessage({ type, text });
    setTimeout(() => setInlineMessage(null), 5000);
  }

  function parsePasteEmails(text: string): string[] {
    const emailRegex = /[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+/g;
    const matches = text.match(emailRegex) || [];
    return [...new Set(matches.map((e) => e.toLowerCase()))];
  }

  async function handleCreate() {
    if (!name.trim()) {
      showMessage('error', 'שם הקבוצה הוא שדה חובה');
      return;
    }

    setLoading(true);
    try {
      let emails: string[] = [];
      let userIds: string[] = [];

      if (addMode === 'manual') {
        userIds = selectedUserIds;
      } else if (addMode === 'csv') {
        emails = csvEmails;
      } else if (addMode === 'paste') {
        emails = parsePasteEmails(pasteText);
      }

      const res = await apiFetch('/api/admin/user-groups', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          userIds: userIds.length > 0 ? userIds : undefined,
          emails: emails.length > 0 ? emails : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showMessage('error', data.error || 'שגיאה ביצירת הקבוצה');
        return;
      }

      const msg = data.emailsNotFound > 0
        ? `הקבוצה נוצרה עם ${data.membersAdded} חברים. ${data.emailsNotFound} אימיילים לא נמצאו במערכת.`
        : `הקבוצה נוצרה עם ${data.membersAdded} חברים.`;

      showMessage('success', msg);
      setTimeout(() => router.push('/admin/marketing/user-groups'), 2000);
    } catch {
      showMessage('error', 'שגיאה ביצירת הקבוצה');
    } finally {
      setLoading(false);
    }
  }

  const modeOptions: { id: AddMode; label: string; icon: typeof UserCog; description: string }[] = [
    { id: 'manual', label: 'בחירה ידנית', icon: UserCog, description: 'בחר משתמשים מהרשימה' },
    { id: 'csv', label: 'העלאת CSV', icon: Upload, description: 'העלה קובץ CSV עם אימיילים' },
    { id: 'paste', label: 'העתק-הדבק', icon: ClipboardPaste, description: 'הדבק רשימת אימיילים' },
  ];

  const memberCount =
    addMode === 'manual'
      ? selectedUserIds.length
      : addMode === 'csv'
        ? csvEmails.length
        : parsePasteEmails(pasteText).length;

  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-[#69ADFF]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/admin/marketing/user-groups')}
          className="p-2 rounded-xl hover:bg-[#F7F7F8] transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-[#7E7F90]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#303150]">קבוצה חדשה</h1>
          <p className="text-sm text-[#7E7F90] mt-1">צור קבוצת משתמשים לשליחת סדרות וקמפיינים</p>
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

      {/* Name & Description */}
      <div className="bg-white rounded-2xl border border-[#F7F7F8] p-6 mb-6">
        <h2 className="text-lg font-bold text-[#303150] mb-4">פרטי הקבוצה</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#303150] mb-1.5">שם הקבוצה *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="למשל: Premium"
              className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#303150] mb-1.5">תיאור (אופציונלי)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור קצר של הקבוצה..."
              className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Add Members */}
      <div className="bg-white rounded-2xl border border-[#F7F7F8] p-6 mb-6">
        <h2 className="text-lg font-bold text-[#303150] mb-4">הוספת חברים</h2>

        {/* Mode Selection */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {modeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = addMode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setAddMode(option.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                  isSelected
                    ? 'border-[#69ADFF] bg-[#69ADFF]/5'
                    : 'border-[#E8E8ED] bg-white hover:border-[#69ADFF]/50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isSelected ? 'text-[#69ADFF]' : 'text-[#7E7F90]'}`} />
                <span className={`text-xs font-medium ${isSelected ? 'text-[#303150]' : 'text-[#7E7F90]'}`}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Manual Selection */}
        {addMode === 'manual' && (
          <UserSelector selectedUserIds={selectedUserIds} onChange={setSelectedUserIds} />
        )}

        {/* CSV Upload */}
        {addMode === 'csv' && <CsvUploader emails={csvEmails} onChange={setCsvEmails} />}

        {/* Paste Emails */}
        {addMode === 'paste' && (
          <div className="space-y-3">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="הדבק כתובות אימייל כאן, מופרדות בשורה חדשה, פסיק או נקודה-פסיק..."
              className="w-full min-h-[200px] px-4 py-3 border border-[#E8E8ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent text-sm resize-y"
              dir="ltr"
            />
            {pasteText && (
              <div className="bg-[#F7F7F8] rounded-xl p-3 text-sm text-[#7E7F90]">
                נמצאו <strong className="text-[#303150]">{parsePasteEmails(pasteText).length}</strong> כתובות אימייל ייחודיות
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-2xl border border-[#F7F7F8] p-4 flex items-center justify-between">
        <p className="text-sm text-[#7E7F90]">
          {memberCount > 0
            ? `${memberCount} ${addMode === 'manual' ? 'משתמשים נבחרו' : 'אימיילים'}`
            : 'בחר משתמשים לקבוצה'}
        </p>
        <button
          onClick={handleCreate}
          disabled={!name.trim() || loading}
          className="flex items-center gap-2 bg-[#69ADFF] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5a9de8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          צור קבוצה
        </button>
      </div>
    </div>
  );
}
