'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Split, Send, ChevronDown } from 'lucide-react';
import { apiFetch } from '@/lib/utils';
import GroupOnlyAudienceSelector from '@/components/admin/GroupOnlyAudienceSelector';
import type { SegmentFilter } from '@/lib/marketing/segment';
import EmailPreview from '@/components/admin/EmailPreview';
import { SENDER_ADDRESSES, DEFAULT_SENDER } from '@/lib/inbox/constants';

export default function EditCampaignPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>({ type: 'group' });
  const [content, setContent] = useState('');
  const [userCount, setUserCount] = useState<number>(0);
  const [campaignStatus, setCampaignStatus] = useState<string>('');
  const [inlineMessage, setInlineMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [senderEmail, setSenderEmail] = useState(DEFAULT_SENDER.email);
  const [showSenderDropdown, setShowSenderDropdown] = useState(false);

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

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/');
      return;
    }
    fetchCampaign();
  }, [session, status, router, campaignId]);

  useEffect(() => {
    if (inlineMessage) {
      const timer = setTimeout(() => setInlineMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [inlineMessage]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(`/api/admin/marketing/campaigns/${campaignId}`);

      if (!res.ok) {
        if (res.status === 404) {
          setError('קמפיין לא נמצא');
        } else if (res.status === 403 || res.status === 401) {
          setError('אין לך הרשאה לערוך קמפיין זה');
        } else {
          setError('שגיאה בטעינת הקמפיין');
        }
        return;
      }

      const data = await res.json();
      const campaign = data.campaign;
      setName(campaign.name);
      setSubject(campaign.subject);
      setContent(campaign.content);
      const sf = campaign.segmentFilter;
      setSegmentFilter(sf && sf.type === 'group' && sf.groupId ? sf : { type: 'group' });
      setCampaignStatus(campaign.status);
      setSenderEmail(campaign.senderEmail || DEFAULT_SENDER.email);

      setIsAbTest(campaign.isAbTest || false);
      if (campaign.isAbTest) {
        setAbTestPercentage(campaign.abTestPercentage || 20);
        setAbTestDurationHours(campaign.abTestDurationHours || 4);
        setAbTestWinningMetric(campaign.abTestWinningMetric || 'OPEN_RATE');
        if (campaign.variants && Array.isArray(campaign.variants)) {
          setVariants(campaign.variants as Array<{ id: 'A' | 'B'; subject: string; htmlContent: string }>);
        } else {
          setVariants([
            { id: 'A', subject: campaign.subject || '', htmlContent: campaign.content || '' },
            { id: 'B', subject: '', htmlContent: '' },
          ]);
        }
      } else {
        setVariants([
          { id: 'A', subject: campaign.subject || '', htmlContent: campaign.content || '' },
          { id: 'B', subject: '', htmlContent: '' },
        ]);
      }

      if (campaign.status !== 'DRAFT') {
        setError('ניתן לערוך רק קמפיינים בטיוטה');
      }
    } catch {
      setError('שגיאה בטעינת הקמפיין');
    } finally {
      setLoading(false);
    }
  };

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

    setSaving(true);
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
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (campaignStatus !== 'DRAFT') {
      setError('ניתן לערוך רק קמפיינים בטיוטה');
      return;
    }

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

    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        name,
        subject: isAbTest ? variants[0].subject : subject,
        content: isAbTest ? variants[0].htmlContent : content,
        segmentFilter,
        senderEmail,
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
      } else {
        payload.isAbTest = false;
      }

      const res = await apiFetch(`/api/admin/marketing/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'שגיאה בעדכון הקמפיין');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/admin/marketing/campaigns/${campaignId}`);
      }, 2000);
    } catch {
      setError('שגיאה בעדכון הקמפיין');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <Save className="w-8 h-8 text-[#69ADFF] animate-pulse" />
          </div>
          <p className="text-[#7E7F90]">טוען...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <div className="w-16 h-16 bg-[#0DBACC]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#0DBACC]" />
          </div>
          <h2 className="text-2xl font-bold text-[#303150] mb-2">הקמפיין עודכן בהצלחה!</h2>
          <p className="text-[#7E7F90]">מעביר לדף הקמפיין...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
        <button
          onClick={() => router.push(`/admin/marketing/campaigns/${campaignId}`)}
          className="p-2 hover:bg-[#F7F7F8] rounded-xl transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-[#7E7F90]" />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl lg:text-2xl font-bold text-[#303150] mb-1 truncate">עריכת קמפיין</h1>
          <p className="text-xs sm:text-sm text-[#7E7F90]">ערוך קמפיין דיוור</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 sm:mb-6 bg-[#F18AB5]/10 border border-[#F18AB5]/30 rounded-xl p-3 sm:p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[#F18AB5] flex-shrink-0" />
          <p className="text-xs sm:text-sm text-[#303150]">{error}</p>
        </div>
      )}

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

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <h2 className="text-base sm:text-lg font-bold text-[#303150] mb-3 sm:mb-4">הגדרות וקהל</h2>
            <div className="space-y-4">
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
                  required
                  disabled={campaignStatus !== 'DRAFT'}
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
                    required
                    disabled={campaignStatus !== 'DRAFT'}
                  />
                </div>
              )}

              <GroupOnlyAudienceSelector
                value={segmentFilter}
                onChange={setSegmentFilter}
                onCountChange={setUserCount}
              />

              {/* Sender Address */}
              <div className="relative">
                <label className="block text-sm font-medium text-[#303150] mb-2">שולח</label>
                <button
                  type="button"
                  onClick={() => setShowSenderDropdown(!showSenderDropdown)}
                  disabled={campaignStatus !== 'DRAFT'}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[#E8E8ED] text-sm text-[#303150] hover:border-[#69ADFF] transition-colors disabled:opacity-50"
                >
                  <span className="truncate">myneto &lt;{senderEmail}&gt;</span>
                  <ChevronDown className={`w-4 h-4 text-[#7E7F90] transition-transform flex-shrink-0 mr-2 ${showSenderDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showSenderDropdown && (
                  <div className="absolute top-full right-0 left-0 mt-1 bg-white rounded-xl border border-[#E8E8ED] shadow-lg z-10 max-h-48 overflow-y-auto">
                    {SENDER_ADDRESSES.map((sender) => (
                      <button
                        key={sender.email}
                        type="button"
                        onClick={() => { setSenderEmail(sender.email); setShowSenderDropdown(false); }}
                        className={`w-full text-right px-4 py-2.5 text-sm hover:bg-[#F7F7F8] transition-colors first:rounded-t-xl last:rounded-b-xl ${
                          senderEmail === sender.email ? 'bg-[#69ADFF]/10 text-[#69ADFF]' : 'text-[#303150]'
                        }`}
                      >
                        <span className="font-medium">{sender.label}</span>
                        <span className="text-[#7E7F90] text-xs mr-2">{sender.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* A/B Testing Toggle */}
              <div className="pt-4 border-t border-[#F7F7F8]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Split className="w-4 h-4 text-[#7E7F90]" strokeWidth={1.75} />
                    <label className="text-sm font-medium text-[#303150]">
                      הפעל בדיקת A/B
                    </label>
                  </div>
                  <button
                    type="button"
                    disabled={campaignStatus !== 'DRAFT'}
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
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 disabled:opacity-50 ${
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
                        disabled={campaignStatus !== 'DRAFT'}
                        className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl bg-white text-sm text-[#303150] placeholder:text-[#BDBDCB] focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent transition-colors disabled:opacity-50"
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
                        disabled={campaignStatus !== 'DRAFT'}
                        className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl bg-white text-sm text-[#303150] placeholder:text-[#BDBDCB] focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent transition-colors disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#303150] mb-1.5">
                        מדד ניצחון
                      </label>
                      <select
                        value={abTestWinningMetric}
                        onChange={(e) => setAbTestWinningMetric(e.target.value as 'OPEN_RATE' | 'CLICK_RATE')}
                        disabled={campaignStatus !== 'DRAFT'}
                        className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl bg-white text-sm text-[#303150] focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent transition-colors appearance-none cursor-pointer disabled:opacity-50"
                      >
                        <option value="OPEN_RATE">שיעור פתיחה</option>
                        <option value="CLICK_RATE">שיעור לחיצה</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-bold text-[#303150]">תוכן ועיצוב</h2>
              <button
                type="button"
                onClick={handleTestEmail}
                disabled={saving || campaignStatus !== 'DRAFT' || (isAbTest ? !(variants.find(v => v.id === activeVariantTab)?.subject && variants.find(v => v.id === activeVariantTab)?.htmlContent) : (!subject || !content))}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-[#F7F7F8] text-[#303150] rounded-xl hover:bg-[#E8E8ED] transition-colors disabled:opacity-50"
              >
                שלח מייל בדיקה
                <Send className="w-4 h-4" />
              </button>
            </div>

            {isAbTest ? (
              <div className="space-y-4">
                {/* Variant Tabs */}
                <div className="flex gap-2 border-b border-[#F7F7F8]">
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

                {/* Subject field */}
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
                    disabled={campaignStatus !== 'DRAFT'}
                    className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl bg-white text-base text-[#303150] placeholder:text-[#BDBDCB] focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent transition-colors disabled:opacity-50"
                  />
                  {!variants.find(v => v.id === activeVariantTab)?.subject && (
                    <p className="text-xs text-[#F18AB5] mt-2 font-medium">
                      חובה למלא נושא למייל -- זה מה שהנמענים יראו בתיבת הדואר שלהם
                    </p>
                  )}
                </div>

                {/* Content + Preview */}
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
                      rows={15}
                      disabled={campaignStatus !== 'DRAFT'}
                      className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl bg-white font-mono text-sm text-[#303150] placeholder:text-[#BDBDCB] focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent resize-none transition-colors disabled:opacity-50"
                    />
                    <p className="text-xs text-[#BDBDCB] mt-2">
                      קישור ביטול מנוי יתווסף אוטומטית בתחתית המייל.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#303150] mb-2">
                      תצוגה מקדימה
                    </label>
                    <div className="rounded-xl bg-white overflow-hidden" style={{ height: 'calc(15 * 1.5rem + 1.5rem)' }}>
                      {variants.find(v => v.id === activeVariantTab)?.htmlContent ? (
                        <div>
                          <div className="px-4 pt-3 pb-2 border-b border-[#F7F7F8]">
                            <p className="text-xs text-[#BDBDCB]">מ: myneto &lt;{senderEmail}&gt;</p>
                            <p className="text-xs text-[#BDBDCB]">נושא: {variants.find(v => v.id === activeVariantTab)?.subject || '(ללא נושא)'}</p>
                          </div>
                          <EmailPreview
                            htmlContent={variants.find(v => v.id === activeVariantTab)?.htmlContent || ''}
                            maxHeight="calc(15 * 1.5rem - 2rem)"
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
            ) : (
              <div>
                {/* Standard subject field */}
                <div className={`p-4 rounded-xl border-2 mb-4 ${!subject || subject === '{{title}}' ? 'border-[#F18AB5] bg-[#F18AB5]/5' : 'border-[#0DBACC] bg-[#0DBACC]/5'}`}>
                  <label className="block text-sm font-bold text-[#303150] mb-2">
                    נושא המייל (מה הנמענים יראו בתיבת הדואר) *
                  </label>
                  <input
                    type="text"
                    value={subject === '{{title}}' ? '' : subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="הקלד כאן את נושא המייל..."
                    disabled={campaignStatus !== 'DRAFT'}
                    className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent text-base disabled:opacity-50"
                  />
                  {(!subject || subject === '{{title}}') && (
                    <p className="text-xs text-[#F18AB5] mt-2 font-medium">
                      חובה למלא נושא למייל -- זה מה שהנמענים יראו בתיבת הדואר שלהם
                    </p>
                  )}
                </div>

                {/* Standard content + preview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#303150] mb-2">
                      תוכן HTML *
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="הכנס כאן את תוכן המייל ב-HTML..."
                      rows={15}
                      disabled={campaignStatus !== 'DRAFT'}
                      className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent font-mono text-sm disabled:opacity-50"
                    />
                    <p className="text-xs text-[#BDBDCB] mt-2">
                      קישור ביטול מנוי יתווסף אוטומטית בתחתית המייל.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#303150] mb-2">
                      תצוגה מקדימה
                    </label>
                    <div className="rounded-xl bg-white overflow-hidden" style={{ height: 'calc(15 * 1.5rem + 1.5rem)' }}>
                      {content ? (
                        <div>
                          <div className="px-4 pt-3 pb-2 border-b border-[#F7F7F8]">
                            <p className="text-xs text-[#BDBDCB]">מ: myneto &lt;{senderEmail}&gt;</p>
                            <p className="text-xs text-[#BDBDCB]">נושא: {subject || '(ללא נושא)'}</p>
                          </div>
                          <EmailPreview
                            htmlContent={content}
                            maxHeight="calc(15 * 1.5rem - 2rem)"
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
            )}
          </div>

          {/* A/B Test Summary */}
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
        </div>

        {/* Actions */}
        <div className="mt-4 sm:mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => router.push(`/admin/marketing/campaigns/${campaignId}`)}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[#F7F7F8] text-[#303150] rounded-xl hover:bg-[#E8E8ED] transition-colors text-sm"
          >
            ביטול
          </button>
          <button
            type="submit"
            disabled={
              saving ||
              !name ||
              campaignStatus !== 'DRAFT' ||
              (isAbTest
                ? !variants[0].subject || !variants[0].htmlContent || !variants[1].subject || !variants[1].htmlContent
                : !subject || !content)
            }
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#69ADFF] text-white rounded-xl hover:bg-[#5A9EE6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                שמור שינויים
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

