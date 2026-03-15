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
  Split,
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

  // A/B Testing state
  const [isAbTest, setIsAbTest] = useState(false);
  const [abTestPercentage, setAbTestPercentage] = useState(20);
  const [abTestDurationHours, setAbTestDurationHours] = useState(4);
  const [abTestWinningMetric, setAbTestWinningMetric] = useState<'OPEN_RATE' | 'CLICK_RATE'>('OPEN_RATE');
  const [variants, setVariants] = useState<Array<{ id: 'A' | 'B'; subject: string; htmlContent: string }>>([
    { id: 'A', subject: '', htmlContent: '' },
    { id: 'B', subject: '', htmlContent: '' },
  ]);
  const [activeVariantTab, setActiveVariantTab] = useState<'A' | 'B'>('A');

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

    const testSubject = isAbTest
      ? variants.find(v => v.id === activeVariantTab)?.subject || ''
      : subject;
    const testContent = isAbTest
      ? variants.find(v => v.id === activeVariantTab)?.htmlContent || ''
      : content;

    if (!testSubject || !testContent) {
      setInlineMessage({ type: 'error', text: 'נא למלא נושא ותוכן לפני שליחת מייל בדיקה' });
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/marketing/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: session.user.email, subject: testSubject, html: testContent }),
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
      setSelectedTemplateId('');
      return;
    }
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setContent(template.content);
      if (template.subject && template.subject !== '{{title}}') {
        setSubject(template.subject);
      } else {
        setSubject('');
      }
    }
  };

  const handleSubmit = async () => {
    if (isAbTest) {
      if (!name) {
        setError('נא למלא שם קמפיין');
        return;
      }
      if (!variants[0].subject || !variants[0].htmlContent || !variants[1].subject || !variants[1].htmlContent) {
        setError('נא למלא את כל השדות עבור שני הוריאנטים');
        return;
      }
    } else {
      if (!name || !subject || !content) {
        setError('נא למלא את כל השדות החובה');
        return;
      }
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
      const payload: Record<string, unknown> = {
        name,
        subject: isAbTest ? variants[0].subject : subject,
        content: isAbTest ? variants[0].htmlContent : content,
        segmentFilter,
        scheduledAt: sendOption === 'scheduled' && scheduledAt ? scheduledAt : null,
      };

      if (isAbTest) {
        payload.isAbTest = true;
        payload.abTestPercentage = abTestPercentage;
        payload.abTestDurationHours = abTestDurationHours;
        payload.abTestWinningMetric = abTestWinningMetric;
        payload.variants = variants.map(v => ({
          id: v.id,
          subject: v.subject,
          htmlContent: v.htmlContent,
        }));
      }

      const res = await apiFetch('/api/admin/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
                נושא: <span className="font-medium text-[#303150]">{isAbTest ? `A: ${variants[0].subject} | B: ${variants[1].subject}` : subject}</span>
              </p>
              {isAbTest && (
                <p className="text-sm text-[#7E7F90]">
                  סוג: <span className="font-medium text-[#303150]">בדיקת A/B ({abTestPercentage}% קבוצת בדיקה, {abTestDurationHours} שעות)</span>
                </p>
              )}
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

            {!isAbTest && (
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
            )}

            <SegmentSelector
              value={segmentFilter}
              onChange={setSegmentFilter}
              onCountChange={setUserCount}
            />

            {/* A/B Testing Toggle */}
            <div className="pt-6 border-t border-[#F7F7F8]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Split className="w-4 h-4 text-[#7E7F90]" strokeWidth={1.75} />
                  <label className="text-sm font-medium text-[#303150]">
                    הפעל בדיקת A/B
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newVal = !isAbTest;
                    setIsAbTest(newVal);
                    if (newVal && subject && content) {
                      setVariants([
                        { id: 'A', subject, htmlContent: content },
                        { id: 'B', subject: '', htmlContent: '' },
                      ]);
                    }
                    if (!newVal && variants[0].subject && variants[0].htmlContent) {
                      setSubject(variants[0].subject);
                      setContent(variants[0].htmlContent);
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    isAbTest ? 'bg-[#69ADFF]' : 'bg-[#E8E8ED]'
                  }`}
                  aria-label={isAbTest ? 'כבה בדיקת A/B' : 'הפעל בדיקת A/B'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      isAbTest ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {isAbTest && (
                <div className="bg-[#F7F7F8] p-6 rounded-3xl border border-[#E8E8ED] grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#303150] mb-1.5">
                      גודל קבוצת הבדיקה (%)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={abTestPercentage}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val >= 1 && val <= 50) setAbTestPercentage(val);
                      }}
                      className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl bg-white text-sm text-[#303150] placeholder:text-[#BDBDCB] focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent transition-colors"
                    />
                    <p className="text-xs text-[#7E7F90] mt-1.5">
                      למשל, 20% משמע 10% יקבלו A, 10% יקבלו B
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#303150] mb-1.5">
                      משך הבדיקה (שעות)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={72}
                      value={abTestDurationHours}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val >= 1 && val <= 72) setAbTestDurationHours(val);
                      }}
                      className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl bg-white text-sm text-[#303150] placeholder:text-[#BDBDCB] focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#303150] mb-1.5">
                      מדד ניצחון
                    </label>
                    <select
                      value={abTestWinningMetric}
                      onChange={(e) => setAbTestWinningMetric(e.target.value as 'OPEN_RATE' | 'CLICK_RATE')}
                      className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl bg-white text-sm text-[#303150] focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent transition-colors appearance-none cursor-pointer"
                    >
                      <option value="OPEN_RATE">שיעור פתיחה</option>
                      <option value="CLICK_RATE">שיעור לחיצה</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 lg:mt-8 flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={
                !name ||
                (!isAbTest && !subject) ||
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
              disabled={loading || (isAbTest ? !(variants.find(v => v.id === activeVariantTab)?.subject && variants.find(v => v.id === activeVariantTab)?.htmlContent) : (!subject || !content))}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[#F7F7F8] text-[#303150] rounded-xl hover:bg-[#E8E8ED] transition-colors disabled:opacity-50"
            >
              שלח מייל בדיקה
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Template Selection Cards */}
            {!templatesLoading && templates.length > 0 && !isAbTest && (
              <div>
                <label className="block text-sm font-medium text-[#303150] mb-3">
                  בחר תבנית (אופציונלי)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setSelectedTemplateId('');
                      setContent('');
                      setSubject(subject);
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

            {isAbTest ? (
              <>
                {/* Variant Tabs */}
                <div className="flex gap-2 mb-2 border-b border-[#F7F7F8]">
                  <button
                    type="button"
                    onClick={() => setActiveVariantTab('A')}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                      activeVariantTab === 'A'
                        ? 'text-[#69ADFF] border-[#69ADFF]'
                        : 'text-[#7E7F90] border-transparent hover:text-[#303150]'
                    }`}
                  >
                    וריאנט A
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveVariantTab('B')}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                      activeVariantTab === 'B'
                        ? 'text-[#8B5CF6] border-[#8B5CF6]'
                        : 'text-[#7E7F90] border-transparent hover:text-[#303150]'
                    }`}
                  >
                    וריאנט B
                  </button>
                </div>

                {/* Active Variant Content */}
                <div className={`p-4 rounded-xl border-2 ${
                  !variants.find(v => v.id === activeVariantTab)?.subject
                    ? 'border-[#F18AB5] bg-[#F18AB5]/5'
                    : 'border-[#0DBACC] bg-[#0DBACC]/5'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-[#303150]">
                      נושא המייל (וריאנט {activeVariantTab}) *
                    </label>
                    {activeVariantTab === 'B' && (
                      <button
                        type="button"
                        onClick={() => {
                          setVariants([
                            variants[0],
                            { ...variants[1], subject: variants[0].subject, htmlContent: variants[0].htmlContent },
                          ]);
                        }}
                        className="text-xs text-[#69ADFF] hover:text-[#5A9EE6] transition-colors font-medium"
                      >
                        העתק מוריאנט A
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={variants.find(v => v.id === activeVariantTab)?.subject || ''}
                    onChange={(e) => {
                      setVariants(variants.map(v =>
                        v.id === activeVariantTab ? { ...v, subject: e.target.value } : v
                      ));
                    }}
                    placeholder={`הקלד כאן את נושא המייל לוריאנט ${activeVariantTab}...`}
                    className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl bg-white text-base text-[#303150] placeholder:text-[#BDBDCB] focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent transition-colors"
                  />
                  {!variants.find(v => v.id === activeVariantTab)?.subject && (
                    <p className="text-xs text-[#F18AB5] mt-2 font-medium">
                      חובה למלא נושא למייל -- זה מה שהנמענים יראו בתיבת הדואר שלהם
                    </p>
                  )}
                </div>

                {/* Split-screen: Editor + Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#303150] mb-2">
                      תוכן HTML (וריאנט {activeVariantTab}) *
                    </label>
                    <textarea
                      value={variants.find(v => v.id === activeVariantTab)?.htmlContent || ''}
                      onChange={(e) => {
                        setVariants(variants.map(v =>
                          v.id === activeVariantTab ? { ...v, htmlContent: e.target.value } : v
                        ));
                      }}
                      placeholder={`הכנס כאן את תוכן המייל ב-HTML לוריאנט ${activeVariantTab}...`}
                      rows={18}
                      className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl bg-white font-mono text-sm text-[#303150] placeholder:text-[#BDBDCB] focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent resize-none transition-colors"
                    />
                    <p className="text-xs text-[#BDBDCB] mt-2">
                      קישור ביטול מנוי יתווסף אוטומטית בתחתית המייל.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#303150] mb-2">
                      תצוגה מקדימה
                    </label>
                    <div className="rounded-xl bg-white overflow-hidden" style={{ height: 'calc(18 * 1.5rem + 1.5rem)' }}>
                      {variants.find(v => v.id === activeVariantTab)?.htmlContent ? (
                        <div>
                          <div className="px-4 pt-3 pb-2 border-b border-[#F7F7F8]">
                            <p className="text-xs text-[#BDBDCB]">מ: myneto &lt;admin@myneto.co.il&gt;</p>
                            <p className="text-xs text-[#BDBDCB]">נושא: {variants.find(v => v.id === activeVariantTab)?.subject || '(ללא נושא)'}</p>
                          </div>
                          <EmailPreview
                            htmlContent={variants.find(v => v.id === activeVariantTab)?.htmlContent || ''}
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
              </>
            ) : (
              <>
                {/* Standard Subject field */}
                <div className={`p-4 rounded-xl border-2 ${!subject || subject === '{{title}}' ? 'border-[#F18AB5] bg-[#F18AB5]/5' : 'border-[#0DBACC] bg-[#0DBACC]/5'}`}>
                  <label className="block text-sm font-bold text-[#303150] mb-2">
                    נושא המייל (מה הנמענים יראו בתיבת הדואר) *
                  </label>
                  <input
                    type="text"
                    value={subject === '{{title}}' ? '' : subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="הקלד כאן את נושא המייל..."
                    className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent text-base"
                  />
                  {(!subject || subject === '{{title}}') && (
                    <p className="text-xs text-[#F18AB5] mt-2 font-medium">
                      חובה למלא נושא למייל -- זה מה שהנמענים יראו בתיבת הדואר שלהם
                    </p>
                  )}
                </div>

                {/* Standard Split-screen: Editor + Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              </>
            )}
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
              disabled={
                isAbTest
                  ? !variants[0].subject || !variants[0].htmlContent || !variants[1].subject || !variants[1].htmlContent
                  : !content || !subject || subject === '{{title}}'
              }
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
            {/* A/B Test Info */}
            {isAbTest && (
              <div className="bg-[#0DBACC]/10 border border-[#0DBACC]/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Split className="w-4 h-4 text-[#0DBACC]" />
                  <span className="text-sm font-medium text-[#303150]">בדיקת A/B פעילה</span>
                </div>
                <div className="text-xs text-[#7E7F90] space-y-1">
                  <p>גודל קבוצה: {abTestPercentage}% ({Math.floor(abTestPercentage / 2)}% לכל וריאנט)</p>
                  <p>משך בדיקה: {abTestDurationHours} שעות</p>
                  <p>מדד ניצחון: {abTestWinningMetric === 'OPEN_RATE' ? 'שיעור פתיחה' : 'שיעור לחיצה'}</p>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-[#F7F7F8] rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#7E7F90] mb-1">שם הקמפיין</p>
                  <p className="text-sm font-medium text-[#303150]">{name}</p>
                </div>
                <div>
                  <p className="text-xs text-[#7E7F90] mb-1">נושא</p>
                  <p className="text-sm font-medium text-[#303150]">
                    {isAbTest ? `A: ${variants[0].subject} | B: ${variants[1].subject}` : subject}
                  </p>
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
                  htmlContent={isAbTest ? variants[0].htmlContent : content}
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
