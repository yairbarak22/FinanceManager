'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  Mail,
  Send,
  Save,
  Calendar,
  AlertCircle,
  CheckCircle2,
  FileText,
  Users,
  Pencil,
  ClipboardList,
  X,
} from 'lucide-react';
import { apiFetch } from '@/lib/utils';
import SegmentSelector from '@/components/admin/SegmentSelector';
import type { SegmentFilter } from '@/lib/marketing/segment';
import EmailPreview from '@/components/admin/EmailPreview';

interface Template {
  id: string;
  name: string;
  subject: string;
  content: string;
}

const STEP_LABELS = [
  { num: 1, label: 'הגדרות וקהל', icon: Users },
  { num: 2, label: 'תוכן', icon: Pencil },
  { num: 3, label: 'סיכום ושליחה', icon: ClipboardList },
];

export default function NewCampaignPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [inlineMessage, setInlineMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Form data
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>({ type: 'all' });
  const [content, setContent] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [userCount, setUserCount] = useState<number>(0);
  const [sendOption, setSendOption] = useState<'draft' | 'now' | 'scheduled'>('draft');
  const [scheduledAt, setScheduledAt] = useState('');

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const res = await apiFetch('/api/admin/marketing/templates');
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.templates || []);
        }
      } catch {
        // Ignore
      } finally {
        setTemplatesLoading(false);
      }
    };
    loadTemplates();
  }, []);

  // Clear inline message after 4 seconds
  useEffect(() => {
    if (inlineMessage) {
      const timer = setTimeout(() => setInlineMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [inlineMessage]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <Mail className="w-8 h-8 text-[#69ADFF] animate-pulse" />
          </div>
          <p className="text-[#7E7F90]">טוען...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push('/');
    return null;
  }

  const handleTestEmail = async () => {
    if (!session?.user?.email) return;
    if (!subject || !content) {
      setInlineMessage({ type: 'error', text: 'נא למלא נושא ותוכן לפני שליחת מייל בדיקה' });
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/marketing/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: session.user.email, subject, html: content }),
      });

      if (!res.ok) {
        const data = await res.json();
        setInlineMessage({ type: 'error', text: `שגיאה: ${data.error || 'לא ידועה'}` });
      } else {
        setInlineMessage({ type: 'success', text: `מייל בדיקה נשלח ל-${session.user.email}` });
      }
    } catch {
      setInlineMessage({ type: 'error', text: 'שגיאה בשליחת מייל בדיקה' });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    if (selectedTemplateId === templateId) {
      // Deselect
      setSelectedTemplateId('');
      return;
    }
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setContent(template.content);
    }
  };

  const handleSubmit = async () => {
    if (!name || !subject || !content) {
      setError('נא למלא את כל השדות החובה');
      return;
    }

    // If send now, show confirmation modal
    if (sendOption === 'now' && !showConfirmModal) {
      setShowConfirmModal(true);
      return;
    }

    setShowConfirmModal(false);
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch('/api/admin/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          subject,
          content,
          segmentFilter,
          scheduledAt: sendOption === 'scheduled' && scheduledAt ? scheduledAt : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'שגיאה ביצירת הקמפיין');
        return;
      }

      const data = await res.json();
      const campaignId = data.campaign.id;

      // If send now, trigger send
      if (sendOption === 'now') {
        const sendRes = await apiFetch(`/api/admin/marketing/campaigns/${campaignId}/send`, {
          method: 'POST',
        });

        if (!sendRes.ok) {
          setError('הקמפיין נוצר אבל נכשל בשליחה');
          return;
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/marketing/campaigns');
      }, 2000);
    } catch {
      setError('שגיאה ביצירת הקמפיין');
    } finally {
      setLoading(false);
    }
  };

  const getRecipientCount = () => {
    if (segmentFilter.type === 'manual') return (segmentFilter.selectedUserIds || []).length;
    if (segmentFilter.type === 'csv') return (segmentFilter.csvEmails || []).length;
    return userCount;
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <div className="w-16 h-16 bg-[#0DBACC]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#0DBACC]" />
          </div>
          <h2 className="text-2xl font-bold text-[#303150] mb-2">
            {sendOption === 'now' ? 'הקמפיין נשלח בהצלחה!' : 'הקמפיין נוצר בהצלחה!'}
          </h2>
          <p className="text-[#7E7F90]">מעביר לדף הקמפיינים...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.15)] max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#303150]">אישור שליחה</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 hover:bg-[#F7F7F8] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#7E7F90]" />
              </button>
            </div>
            <div className="bg-[#F7F7F8] rounded-xl p-4 mb-6 space-y-2">
              <p className="text-sm text-[#7E7F90]">
                קמפיין: <span className="font-medium text-[#303150]">{name}</span>
              </p>
              <p className="text-sm text-[#7E7F90]">
                נמענים: <span className="font-medium text-[#303150]">{getRecipientCount().toLocaleString()}</span>
              </p>
              <p className="text-sm text-[#7E7F90]">
                נושא: <span className="font-medium text-[#303150]">{subject}</span>
              </p>
            </div>
            <p className="text-sm text-[#7E7F90] mb-6">
              הקמפיין יישלח מיד ל-{getRecipientCount().toLocaleString()} נמענים. פעולה זו לא ניתנת לביטול.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 bg-[#F7F7F8] text-[#303150] rounded-xl hover:bg-[#E8E8ED] transition-colors text-sm font-medium"
              >
                ביטול
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-5 py-2.5 bg-[#69ADFF] text-white rounded-xl hover:bg-[#5A9EE6] transition-colors text-sm font-medium disabled:opacity-50 shadow-[0_4px_12px_rgba(105,173,255,0.3)]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    שולח...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    שלח עכשיו
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#303150] mb-1">קמפיין חדש</h1>
          <p className="text-xs lg:text-sm text-[#7E7F90]">צור קמפיין דיוור חדש</p>
        </div>
        <button
          onClick={() => router.push('/admin/marketing/campaigns')}
          className="text-xs lg:text-sm text-[#7E7F90] hover:text-[#303150] transition-colors"
        >
          ביטול
        </button>
      </div>

      {/* Step Indicator with Labels */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {STEP_LABELS.map((s, idx) => {
            const Icon = s.icon;
            const isActive = s.num === step;
            const isCompleted = s.num < step;
            return (
              <div key={s.num} className="flex items-center">
                <button
                  onClick={() => {
                    if (s.num < step) setStep(s.num);
                  }}
                  disabled={s.num > step}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#69ADFF] text-white shadow-[0_4px_12px_rgba(105,173,255,0.3)]'
                      : isCompleted
                        ? 'bg-[#0DBACC]/10 text-[#0DBACC] cursor-pointer hover:bg-[#0DBACC]/20'
                        : 'bg-[#F7F7F8] text-[#BDBDCB]'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive
                      ? 'bg-white/20'
                      : isCompleted
                        ? 'bg-[#0DBACC]/20'
                        : 'bg-[#E8E8ED]'
                  }`}>
                    {isCompleted ? '✓' : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
                </button>
                {idx < STEP_LABELS.length - 1 && (
                  <div className={`w-8 lg:w-12 h-0.5 mx-1 ${
                    s.num < step ? 'bg-[#0DBACC]' : 'bg-[#E8E8ED]'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Inline Message */}
      {inlineMessage && (
        <div className={`mb-4 px-4 py-3 rounded-xl flex items-center gap-2 text-sm ${
          inlineMessage.type === 'success'
            ? 'bg-[#0DBACC]/10 border border-[#0DBACC]/20 text-[#303150]'
            : 'bg-[#F18AB5]/10 border border-[#F18AB5]/20 text-[#303150]'
        }`}>
          {inlineMessage.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 text-[#0DBACC]" />
            : <AlertCircle className="w-4 h-4 text-[#F18AB5]" />
          }
          {inlineMessage.text}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-[#F18AB5]/10 border border-[#F18AB5]/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[#F18AB5] flex-shrink-0" />
          <p className="text-sm text-[#303150]">{error}</p>
        </div>
      )}

      {/* Step 1: Settings & Audience */}
      {step === 1 && (
        <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <h2 className="text-lg lg:text-xl font-bold text-[#303150] mb-4 lg:mb-6">הגדרות וקהל</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#303150] mb-2">
                שם הקמפיין *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="למשל: ניוזלטר פברואר"
                className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#303150] mb-2">
                נושא המייל *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="נושא המייל שיוצג לנמענים"
                className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent"
              />
            </div>

            <SegmentSelector
              value={segmentFilter}
              onChange={setSegmentFilter}
              onCountChange={setUserCount}
            />
          </div>

          <div className="mt-6 lg:mt-8 flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={
                !name ||
                !subject ||
                (segmentFilter.type !== 'manual' &&
                  segmentFilter.type !== 'csv' &&
                  userCount === 0) ||
                (segmentFilter.type === 'manual' &&
                  (!segmentFilter.selectedUserIds || segmentFilter.selectedUserIds.length === 0)) ||
                (segmentFilter.type === 'csv' &&
                  (!segmentFilter.csvEmails || segmentFilter.csvEmails.length === 0))
              }
              className="flex items-center gap-2 px-5 py-2.5 lg:px-6 lg:py-3 bg-[#69ADFF] text-white rounded-xl hover:bg-[#5A9EE6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
            >
              הבא
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Content */}
      {step === 2 && (
        <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 lg:mb-6">
            <h2 className="text-lg lg:text-xl font-bold text-[#303150]">תוכן ועיצוב</h2>
            <button
              onClick={handleTestEmail}
              disabled={loading || !subject || !content}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[#F7F7F8] text-[#303150] rounded-xl hover:bg-[#E8E8ED] transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              שלח מייל בדיקה
            </button>
          </div>

          <div className="space-y-6">
            {/* Template Selection Cards */}
            {!templatesLoading && templates.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-[#303150] mb-3">
                  בחר תבנית (אופציונלי)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* No template card */}
                  <button
                    onClick={() => {
                      setSelectedTemplateId('');
                      setContent('');
                      setSubject(subject); // Keep subject
                    }}
                    className={`text-right p-4 rounded-xl border-2 transition-all ${
                      !selectedTemplateId
                        ? 'border-[#69ADFF] bg-[#69ADFF]/5'
                        : 'border-[#E8E8ED] bg-white hover:border-[#69ADFF]/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        !selectedTemplateId ? 'bg-[#69ADFF]/20' : 'bg-[#F7F7F8]'
                      }`}>
                        <Pencil className={`w-4 h-4 ${!selectedTemplateId ? 'text-[#69ADFF]' : 'text-[#7E7F90]'}`} />
                      </div>
                      <span className="text-sm font-medium text-[#303150]">HTML ידני</span>
                    </div>
                    <p className="text-xs text-[#BDBDCB]">כתוב את התוכן בעצמך</p>
                  </button>

                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`text-right p-4 rounded-xl border-2 transition-all ${
                        selectedTemplateId === template.id
                          ? 'border-[#69ADFF] bg-[#69ADFF]/5'
                          : 'border-[#E8E8ED] bg-white hover:border-[#69ADFF]/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          selectedTemplateId === template.id ? 'bg-[#69ADFF]/20' : 'bg-[#F7F7F8]'
                        }`}>
                          <FileText className={`w-4 h-4 ${selectedTemplateId === template.id ? 'text-[#69ADFF]' : 'text-[#7E7F90]'}`} />
                        </div>
                        <span className="text-sm font-medium text-[#303150] truncate">{template.name}</span>
                      </div>
                      <p className="text-xs text-[#BDBDCB] truncate">{template.subject}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Split-screen: Editor + Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Editor */}
              <div>
                <label className="block text-sm font-medium text-[#303150] mb-2">
                  תוכן HTML *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="הכנס כאן את תוכן המייל ב-HTML..."
                  rows={18}
                  className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent font-mono text-sm resize-none"
                />
                <p className="text-xs text-[#BDBDCB] mt-2">
                  קישור ביטול מנוי יתווסף אוטומטית בתחתית המייל.
                </p>
              </div>

              {/* Live Preview */}
              <div>
                <label className="block text-sm font-medium text-[#303150] mb-2">
                  תצוגה מקדימה
                </label>
                <div className="rounded-xl bg-white overflow-hidden" style={{ height: 'calc(18 * 1.5rem + 1.5rem)' }}>
                  {content ? (
                    <div>
                      <div className="px-4 pt-3 pb-2 border-b border-[#F7F7F8]">
                        <p className="text-xs text-[#BDBDCB]">מ: myneto &lt;admin@myneto.co.il&gt;</p>
                        <p className="text-xs text-[#BDBDCB]">נושא: {subject || '(ללא נושא)'}</p>
                      </div>
                      <EmailPreview
                        htmlContent={content}
                        maxHeight="calc(18 * 1.5rem - 2rem)"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-[#BDBDCB] text-sm border border-[#E8E8ED] rounded-xl">
                      התצוגה המקדימה תופיע כאן
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 lg:mt-8 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2.5 lg:px-6 lg:py-3 bg-[#F7F7F8] text-[#303150] rounded-xl hover:bg-[#E8E8ED] transition-colors text-sm lg:text-base"
            >
              <ArrowRight className="w-4 h-4" />
              קודם
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!content}
              className="flex items-center gap-2 px-5 py-2.5 lg:px-6 lg:py-3 bg-[#69ADFF] text-white rounded-xl hover:bg-[#5A9EE6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
            >
              הבא
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Send */}
      {step === 3 && (
        <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <h2 className="text-lg lg:text-xl font-bold text-[#303150] mb-4 lg:mb-6">סיכום ושליחה</h2>

          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-[#F7F7F8] rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#7E7F90] mb-1">שם הקמפיין</p>
                  <p className="text-sm font-medium text-[#303150]">{name}</p>
                </div>
                <div>
                  <p className="text-xs text-[#7E7F90] mb-1">נושא</p>
                  <p className="text-sm font-medium text-[#303150]">{subject}</p>
                </div>
                <div>
                  <p className="text-xs text-[#7E7F90] mb-1">נמענים</p>
                  <p className="text-sm font-medium text-[#303150]">
                    {getRecipientCount().toLocaleString()} משתמשים
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#7E7F90] mb-1">שולח</p>
                  <p className="text-sm font-medium text-[#303150]">myneto &lt;admin@myneto.co.il&gt;</p>
                </div>
              </div>
            </div>

            {/* Email preview mini */}
            <div>
              <p className="text-sm font-medium text-[#303150] mb-2">תצוגה מקדימה של התוכן</p>
              <div className="rounded-xl bg-[#FAFAFE] overflow-hidden">
                <EmailPreview
                  htmlContent={content}
                  maxHeight="192px"
                />
              </div>
            </div>

            {/* Send Options */}
            <div>
              <label className="block text-sm font-medium text-[#303150] mb-4">
                מה תרצה לעשות?
              </label>
              <div className="space-y-3">
                <button
                  onClick={() => setSendOption('draft')}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-right ${
                    sendOption === 'draft'
                      ? 'border-[#69ADFF] bg-[#69ADFF]/5'
                      : 'border-[#E8E8ED] bg-white hover:border-[#69ADFF]/50'
                  }`}
                >
                  <Save className={`w-5 h-5 ${sendOption === 'draft' ? 'text-[#69ADFF]' : 'text-[#7E7F90]'}`} />
                  <div className="flex-1">
                    <p className={`font-medium ${sendOption === 'draft' ? 'text-[#303150]' : 'text-[#7E7F90]'}`}>
                      שמור כטיוטה
                    </p>
                    <p className="text-xs text-[#BDBDCB]">הקמפיין יישמר ולא יישלח</p>
                  </div>
                </button>

                <button
                  onClick={() => setSendOption('now')}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-right ${
                    sendOption === 'now'
                      ? 'border-[#69ADFF] bg-[#69ADFF]/5'
                      : 'border-[#E8E8ED] bg-white hover:border-[#69ADFF]/50'
                  }`}
                >
                  <Send className={`w-5 h-5 ${sendOption === 'now' ? 'text-[#69ADFF]' : 'text-[#7E7F90]'}`} />
                  <div className="flex-1">
                    <p className={`font-medium ${sendOption === 'now' ? 'text-[#303150]' : 'text-[#7E7F90]'}`}>
                      שלח עכשיו
                    </p>
                    <p className="text-xs text-[#BDBDCB]">הקמפיין יישלח מיד לכל הנמענים</p>
                  </div>
                </button>

                <button
                  onClick={() => setSendOption('scheduled')}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-right ${
                    sendOption === 'scheduled'
                      ? 'border-[#69ADFF] bg-[#69ADFF]/5'
                      : 'border-[#E8E8ED] bg-white hover:border-[#69ADFF]/50'
                  }`}
                >
                  <Calendar className={`w-5 h-5 ${sendOption === 'scheduled' ? 'text-[#69ADFF]' : 'text-[#7E7F90]'}`} />
                  <div className="flex-1">
                    <p className={`font-medium ${sendOption === 'scheduled' ? 'text-[#303150]' : 'text-[#7E7F90]'}`}>
                      תזמן לשליחה
                    </p>
                    <p className="text-xs text-[#BDBDCB]">הקמפיין יישלח בתאריך וזמן שתבחר</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Date Picker for Scheduled */}
            {sendOption === 'scheduled' && (
              <div>
                <label className="block text-sm font-medium text-[#303150] mb-2">
                  תאריך ושעה לשליחה
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent"
                />
              </div>
            )}
          </div>

          <div className="mt-6 lg:mt-8 flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-4 py-2.5 lg:px-6 lg:py-3 bg-[#F7F7F8] text-[#303150] rounded-xl hover:bg-[#E8E8ED] transition-colors text-sm lg:text-base"
            >
              <ArrowRight className="w-4 h-4" />
              קודם
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || (sendOption === 'scheduled' && !scheduledAt)}
              className="flex items-center gap-2 px-5 py-2.5 lg:px-6 lg:py-3 bg-[#69ADFF] text-white rounded-xl hover:bg-[#5A9EE6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(105,173,255,0.3)] text-sm lg:text-base"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  שומר...
                </>
              ) : sendOption === 'draft' ? (
                <>
                  <Save className="w-4 h-4" />
                  שמור כטיוטה
                </>
              ) : sendOption === 'now' ? (
                <>
                  <Send className="w-4 h-4" />
                  שלח עכשיו
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  תזמן לשליחה
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
