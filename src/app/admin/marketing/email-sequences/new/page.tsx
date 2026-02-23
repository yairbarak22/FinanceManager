'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Eye,
  Clock,
  Code,
  Users,
  UserCog,
} from 'lucide-react';
import { apiFetch } from '@/lib/utils';
import UserSelector from '@/components/admin/UserSelector';
import GroupSelector from '@/components/admin/GroupSelector';
import EmailPreview from '@/components/admin/EmailPreview';
import { courseSequenceEmails, stepCtaPaths } from '@/lib/emails/courseSequenceTemplates';

export default function NewEmailSequencePage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectionMode, setSelectionMode] = useState<'manual' | 'group'>('manual');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    const groupId = searchParams.get('groupId');
    if (groupId) {
      setSelectionMode('group');
      (async () => {
        try {
          const res = await apiFetch(`/api/admin/user-groups/${groupId}`);
          if (res.ok) {
            const data = await res.json();
            const userIds = (data.group.members || []).map((m: { userId: string }) => m.userId);
            setSelectedGroupId(groupId);
            setSelectedUserIds(userIds);
          }
        } catch { /* noop */ }
      })();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewStep, setPreviewStep] = useState(0);
  const [sendHour, setSendHour] = useState(10);
  const [sendFirstImmediately, setSendFirstImmediately] = useState(false);
  const [subjectOverrides, setSubjectOverrides] = useState<Record<string, string>>({});
  const [contentOverrides, setContentOverrides] = useState<Record<string, string>>({});
  const [editingContent, setEditingContent] = useState(false);
  const [inlineMessage, setInlineMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const getSubject = (step: number) =>
    subjectOverrides[String(step)] || courseSequenceEmails[step]?.subject || '';

  const updateSubject = (step: number, value: string) => {
    setSubjectOverrides((prev) => {
      const next = { ...prev };
      const defaultSubject = courseSequenceEmails[step]?.subject || '';
      if (value === defaultSubject || value === '') {
        delete next[String(step)];
      } else {
        next[String(step)] = value;
      }
      return next;
    });
  };

  const getDefaultHtml = (step: number) => {
    const template = courseSequenceEmails[step];
    if (!template) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const ctaUrl = `${baseUrl}${stepCtaPaths[step] ?? '/courses'}`;
    return template.buildHtml('[שם המשתמש]', ctaUrl);
  };

  const getContent = (step: number) =>
    contentOverrides[String(step)] || getDefaultHtml(step);

  const updateContent = (step: number, value: string) => {
    setContentOverrides((prev) => {
      const next = { ...prev };
      const defaultHtml = getDefaultHtml(step);
      if (value === defaultHtml || value === '') {
        delete next[String(step)];
      } else {
        next[String(step)] = value;
      }
      return next;
    });
  };

  const previewHtml = useMemo(() => {
    if (contentOverrides[String(previewStep)]) {
      return contentOverrides[String(previewStep)];
    }
    return getDefaultHtml(previewStep);
  }, [previewStep, contentOverrides]); // eslint-disable-line react-hooks/exhaustive-deps

  function showMessage(type: 'success' | 'error', text: string) {
    setInlineMessage({ type, text });
    setTimeout(() => setInlineMessage(null), 5000);
  }

  async function handleStart() {
    setLoading(true);
    setConfirmOpen(false);
    try {
      const hasSubjectOverrides = Object.keys(subjectOverrides).length > 0;
      const hasContentOverrides = Object.keys(contentOverrides).length > 0;
      const res = await apiFetch('/api/admin/email-sequences/start', {
        method: 'POST',
        body: JSON.stringify({
          userIds: selectedUserIds,
          sequenceType: 'course-intro',
          sendHour,
          sendFirstImmediately,
          ...(hasSubjectOverrides ? { subjectOverrides } : {}),
          ...(hasContentOverrides ? { contentOverrides } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showMessage('error', data.error || 'שגיאה ביצירת הסדרה');
        return;
      }
      const immediateMsg = sendFirstImmediately && data.immediatelySent
        ? ` המייל הראשון נשלח ל-${data.immediatelySent} משתמשים.`
        : ' המייל הראשון יישלח בריצת ה-cron הבאה.';
      showMessage(
        'success',
        `הסדרה הופעלה עבור ${data.created} משתמשים.${immediateMsg}`,
      );
      setTimeout(() => router.push('/admin/marketing/email-sequences'), 2000);
    } catch {
      showMessage('error', 'שגיאה ביצירת הסדרה');
    } finally {
      setLoading(false);
    }
  }

  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-[#69ADFF]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/admin/marketing/email-sequences')}
          className="p-2 rounded-xl hover:bg-[#F7F7F8] transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-[#7E7F90]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#303150]">
            סדרה חדשה — קורס וידאו
          </h1>
          <p className="text-sm text-[#7E7F90] mt-1">
            5 מיילים עם הפרש של 3 ימים, מלווים את המשתמש בקורס &quot;המסלול
            הבטוח&quot;
          </p>
        </div>
      </div>

      {/* Inline message */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: User selection */}
        <div className="bg-white rounded-2xl border border-[#F7F7F8] p-6">
          <h2 className="text-lg font-bold text-[#303150] mb-1">
            בחירת משתמשים
          </h2>
          <p className="text-sm text-[#7E7F90] mb-4">
            בחר את המשתמשים שיקבלו את סדרת המיילים.
          </p>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => { setSelectionMode('manual'); setSelectedGroupId(null); setSelectedUserIds([]); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                selectionMode === 'manual'
                  ? 'bg-[#69ADFF]/10 text-[#69ADFF] border border-[#69ADFF]/30'
                  : 'bg-[#F7F7F8] text-[#7E7F90] border border-transparent hover:border-[#E8E8ED]'
              }`}
            >
              <UserCog className="w-3.5 h-3.5" />
              בחירה ידנית
            </button>
            <button
              type="button"
              onClick={() => { setSelectionMode('group'); setSelectedUserIds([]); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                selectionMode === 'group'
                  ? 'bg-[#69ADFF]/10 text-[#69ADFF] border border-[#69ADFF]/30'
                  : 'bg-[#F7F7F8] text-[#7E7F90] border border-transparent hover:border-[#E8E8ED]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              קבוצה שמורה
            </button>
          </div>

          {selectionMode === 'manual' ? (
            <UserSelector
              selectedUserIds={selectedUserIds}
              onChange={setSelectedUserIds}
            />
          ) : (
            <GroupSelector
              selectedGroupId={selectedGroupId}
              onChange={(groupId, userIds) => {
                setSelectedGroupId(groupId);
                setSelectedUserIds(userIds);
              }}
            />
          )}

          {selectedUserIds.length > 0 && (
            <p className="text-sm text-[#69ADFF] font-semibold mt-3">
              {selectedUserIds.length} משתמשים נבחרו
            </p>
          )}
        </div>

        {/* Right: Preview */}
        <div className="bg-white rounded-2xl border border-[#F7F7F8] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#303150] flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#69ADFF]" />
              תצוגה מקדימה
            </h2>
            <select
              value={previewStep}
              onChange={(e) => setPreviewStep(Number(e.target.value))}
              className="text-sm border border-[#E8E8ED] rounded-xl px-3 py-2 bg-white text-[#303150] focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/30"
            >
              {courseSequenceEmails.map((email) => (
                <option key={email.step} value={email.step}>
                  מייל {email.step + 1}: {email.subject.slice(0, 40)}
                  {email.subject.length > 40 ? '...' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-[#F5F5F7] rounded-xl p-3 mb-3">
            <div className="flex items-center gap-2 text-xs text-[#7E7F90] mb-2">
              <Mail className="w-3.5 h-3.5" />
              <span className="font-semibold">נושא:</span>
            </div>
            <input
              type="text"
              value={getSubject(previewStep)}
              onChange={(e) => updateSubject(previewStep, e.target.value)}
              placeholder={courseSequenceEmails[previewStep]?.subject}
              className="w-full text-sm border border-[#E8E8ED] rounded-lg px-3 py-2 bg-white text-[#303150] focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/30"
            />
            {subjectOverrides[String(previewStep)] && (
              <button
                type="button"
                onClick={() => updateSubject(previewStep, '')}
                className="text-xs text-[#69ADFF] mt-1 hover:underline"
              >
                איפוס לברירת מחדל
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setEditingContent((v) => !v)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                editingContent
                  ? 'bg-[#69ADFF]/10 text-[#69ADFF]'
                  : 'text-[#7E7F90] hover:bg-[#F7F7F8]'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              {editingContent ? 'חזרה לתצוגה מקדימה' : 'עריכת תוכן HTML'}
            </button>
            {contentOverrides[String(previewStep)] && (
              <button
                type="button"
                onClick={() => updateContent(previewStep, '')}
                className="text-xs text-[#69ADFF] hover:underline"
              >
                איפוס לברירת מחדל
              </button>
            )}
          </div>

          {editingContent ? (
            <textarea
              value={getContent(previewStep)}
              onChange={(e) => updateContent(previewStep, e.target.value)}
              className="w-full min-h-[350px] text-xs border border-[#E8E8ED] rounded-xl px-3 py-3 bg-white text-[#303150] font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/30 resize-y"
              dir="ltr"
            />
          ) : (
            <EmailPreview
              htmlContent={previewHtml}
              maxHeight="400px"
            />
          )}
        </div>
      </div>

      {/* Send time settings */}
      <div className="mt-6 bg-white rounded-2xl border border-[#F7F7F8] p-6">
        <h2 className="text-lg font-bold text-[#303150] mb-1 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#69ADFF]" />
          הגדרות שליחה
        </h2>
        <p className="text-sm text-[#7E7F90] mb-4">
          מיילים לא יישלחו ביום שישי ושבת. אם מועד השליחה חל בסוף שבוע, הוא יידחה ליום ראשון.
        </p>
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-semibold text-[#303150]">שעת שליחה (שעון ישראל):</label>
          <select
            value={sendHour}
            onChange={(e) => setSendHour(Number(e.target.value))}
            className="text-sm border border-[#E8E8ED] rounded-xl px-3 py-2 bg-white text-[#303150] focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/30"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>
                {String(i).padStart(2, '0')}:00
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={sendFirstImmediately}
              onChange={(e) => setSendFirstImmediately(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-[#E8E8ED] rounded-full peer-checked:bg-[#69ADFF] transition-colors" />
            <div className="absolute top-0.5 start-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5" />
          </div>
          <div>
            <span className="text-sm font-semibold text-[#303150]">שלח את המייל הראשון מיד</span>
            <p className="text-xs text-[#7E7F90] mt-0.5">
              {sendFirstImmediately
                ? 'המייל הראשון יישלח מיד עם הפעלת הסדרה, המייל הבא ישלח לאחר 3 ימים'
                : 'המייל הראשון יישלח בריצת ה-cron הבאה בשעה שנבחרה'}
            </p>
          </div>
        </label>
      </div>

      {/* Action bar */}
      <div className="mt-6 bg-white rounded-2xl border border-[#F7F7F8] p-4 flex items-center justify-between">
        <p className="text-sm text-[#7E7F90]">
          {selectedUserIds.length > 0
            ? `${selectedUserIds.length} משתמשים נבחרו — 5 מיילים, הפרש 3 ימים, שליחה ב-${String(sendHour).padStart(2, '0')}:00${sendFirstImmediately ? ' (ראשון מיד)' : ''}`
            : 'בחר משתמשים כדי להפעיל את הסדרה'}
        </p>
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={selectedUserIds.length === 0 || loading}
          className="flex items-center gap-2 bg-[#69ADFF] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5a9de8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          הפעל סדרה
        </button>
      </div>

      {/* Confirm dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-[#303150] mb-2">
              אישור הפעלת סדרה
            </h3>
            <p className="text-sm text-[#7E7F90] mb-4 leading-relaxed">
              הסדרה תופעל עבור{' '}
              <strong className="text-[#303150]">
                {selectedUserIds.length} משתמשים
              </strong>
              . יישלחו 5 מיילים במרווחים של 3 ימים.
              <br />
              <br />
              שעת שליחה: {String(sendHour).padStart(2, '0')}:00 (שעון ישראל). לא יישלחו מיילים בשישי ושבת.
              {sendFirstImmediately && (
                <>
                  <br />
                  <strong className="text-[#303150]">המייל הראשון יישלח מיד.</strong>
                </>
              )}
              {Object.keys(subjectOverrides).length > 0 && (
                <>
                  <br />
                  שונו {Object.keys(subjectOverrides).length} כותרות מיילים.
                </>
              )}
              {Object.keys(contentOverrides).length > 0 && (
                <>
                  <br />
                  שונה תוכן של {Object.keys(contentOverrides).length} מיילים.
                </>
              )}
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-[#7E7F90] hover:bg-[#F7F7F8] transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleStart}
                disabled={loading}
                className="flex items-center gap-2 bg-[#69ADFF] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-[#5a9de8] transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                אישור והפעלה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
