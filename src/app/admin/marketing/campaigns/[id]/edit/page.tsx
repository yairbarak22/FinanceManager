'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/utils';
import SegmentSelector from '@/components/admin/SegmentSelector';
import type { SegmentFilter } from '@/lib/marketing/segment';
import EmailPreview from '@/components/admin/EmailPreview';

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
  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>({ type: 'all' });
  const [content, setContent] = useState('');
  const [userCount, setUserCount] = useState<number>(0);
  const [campaignStatus, setCampaignStatus] = useState<string>('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/');
      return;
    }
    fetchCampaign();
  }, [session, status, router, campaignId]);

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
      setSegmentFilter(campaign.segmentFilter || { type: 'all' });
      setCampaignStatus(campaign.status);

      if (campaign.status !== 'DRAFT') {
        setError('ניתן לערוך רק קמפיינים בטיוטה');
      }
    } catch {
      setError('שגיאה בטעינת הקמפיין');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (campaignStatus !== 'DRAFT') {
      setError('ניתן לערוך רק קמפיינים בטיוטה');
      return;
    }

    if (!name || !subject || !content) {
      setError('נא למלא את כל השדות החובה');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await apiFetch(`/api/admin/marketing/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          subject,
          content,
          segmentFilter,
        }),
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
    } catch (err) {
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

              <SegmentSelector
                value={segmentFilter}
                onChange={setSegmentFilter}
                onCountChange={setUserCount}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <h2 className="text-base sm:text-lg font-bold text-[#303150] mb-3 sm:mb-4">תוכן ועיצוב</h2>
            <div>
              <label className="block text-sm font-medium text-[#303150] mb-2">
                תוכן HTML *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="הכנס כאן את תוכן המייל ב-HTML..."
                rows={15}
                className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent font-mono text-sm"
                required
                disabled={campaignStatus !== 'DRAFT'}
              />
              <p className="text-xs text-[#BDBDCB] mt-2">
                תוכל להשתמש ב-HTML כדי לעצב את המייל. קישור ביטול מנוי יתווסף אוטומטית.
              </p>
            </div>

            {/* Preview */}
            {content && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-[#303150] mb-2">
                  תצוגה מקדימה
                </label>
                <EmailPreview
                  htmlContent={content}
                  maxHeight="384px"
                />
              </div>
            )}
          </div>
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
            disabled={saving || !name || !subject || !content || campaignStatus !== 'DRAFT'}
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

