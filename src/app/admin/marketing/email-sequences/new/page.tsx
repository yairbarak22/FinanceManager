'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Eye,
  Clock,
} from 'lucide-react';
import { apiFetch } from '@/lib/utils';
import UserSelector from '@/components/admin/UserSelector';
import EmailPreview from '@/components/admin/EmailPreview';
import { courseSequenceEmails, stepCtaPaths } from '@/lib/emails/courseSequenceTemplates';

export default function NewEmailSequencePage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewStep, setPreviewStep] = useState(0);
  const [sendHour, setSendHour] = useState(10);
  const [inlineMessage, setInlineMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const previewHtml = useMemo(() => {
    const template = courseSequenceEmails[previewStep];
    if (!template) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const ctaUrl = `${baseUrl}${stepCtaPaths[previewStep] ?? '/courses'}`;
    return template.buildHtml('[שם המשתמש]', ctaUrl);
  }, [previewStep]);

  function showMessage(type: 'success' | 'error', text: string) {
    setInlineMessage({ type, text });
    setTimeout(() => setInlineMessage(null), 5000);
  }

  async function handleStart() {
    setLoading(true);
    setConfirmOpen(false);
    try {
      const res = await apiFetch('/api/admin/email-sequences/start', {
        method: 'POST',
        body: JSON.stringify({
          userIds: selectedUserIds,
          sequenceType: 'course-intro',
          sendHour,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showMessage('error', data.error || 'שגיאה ביצירת הסדרה');
        return;
      }
      showMessage(
        'success',
        `הסדרה הופעלה עבור ${data.created} משתמשים. המייל הראשון יישלח בריצת ה-cron הבאה.`,
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
            בחר את המשתמשים שיקבלו את סדרת המיילים. רק משתמשים עם מנוי שיווקי
            פעיל יופיעו.
          </p>
          <UserSelector
            selectedUserIds={selectedUserIds}
            onChange={setSelectedUserIds}
          />
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
            <div className="flex items-center gap-2 text-xs text-[#7E7F90]">
              <Mail className="w-3.5 h-3.5" />
              <span className="font-semibold">נושא:</span>
              <span>{courseSequenceEmails[previewStep]?.subject}</span>
            </div>
          </div>

          <EmailPreview
            htmlContent={previewHtml}
            maxHeight="400px"
          />
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
        <div className="flex items-center gap-3">
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
      </div>

      {/* Action bar */}
      <div className="mt-6 bg-white rounded-2xl border border-[#F7F7F8] p-4 flex items-center justify-between">
        <p className="text-sm text-[#7E7F90]">
          {selectedUserIds.length > 0
            ? `${selectedUserIds.length} משתמשים נבחרו — 5 מיילים, הפרש 3 ימים, שליחה ב-${String(sendHour).padStart(2, '0')}:00`
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
