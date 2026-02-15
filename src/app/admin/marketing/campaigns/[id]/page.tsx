'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Send, Trash2, AlertCircle, Calendar, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/utils';
import CampaignStats from '@/components/admin/CampaignStats';
import EmailPreview from '@/components/admin/EmailPreview';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'CANCELLED';
  sentCount: number;
  openCount: number;
  clickCount: number;
  bounceCount: number;
  complaintCount: number;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  creator: {
    id: string;
    name: string | null;
    email: string;
  };
}

export default function CampaignDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
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
          setError('אין לך הרשאה לצפות בקמפיין זה');
        } else {
          setError('שגיאה בטעינת הקמפיין');
        }
        return;
      }

      const data = await res.json();
      setCampaign(data.campaign);
    } catch {
      setError('שגיאה בטעינת הקמפיין');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!confirm(`האם אתה בטוח שברצונך לשלוח את הקמפיין "${campaign?.name}"?`)) {
      return;
    }

    setSending(true);
    try {
      const res = await apiFetch(`/api/admin/marketing/campaigns/${campaignId}/send`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'שגיאה בשליחת הקמפיין');
        return;
      }

      alert('הקמפיין התחיל להישלח!');
      fetchCampaign();
    } catch {
      alert('שגיאה בשליחת הקמפיין');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את הקמפיין "${campaign?.name}"?`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await apiFetch(`/api/admin/marketing/campaigns/${campaignId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'שגיאה במחיקת הקמפיין');
        return;
      }

      router.push('/admin/marketing/campaigns');
    } catch {
      alert('שגיאה במחיקת הקמפיין');
    } finally {
      setDeleting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await apiFetch(`/api/admin/marketing/campaigns/${campaignId}/sync`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        setSyncMessage(data.error || 'שגיאה בסנכרון');
      } else {
        setSyncMessage(data.message || 'סונכרן בהצלחה');
        fetchCampaign(); // Refresh campaign data
      }
    } catch {
      setSyncMessage('שגיאה בסנכרון עם Resend');
    } finally {
      setSyncing(false);
      // Clear message after 4 seconds
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-[#BDBDCB] text-[#303150]';
      case 'SCHEDULED':
        return 'bg-[#74ACEF] text-white';
      case 'SENDING':
        return 'bg-[#69ADFF] text-white';
      case 'COMPLETED':
        return 'bg-[#0DBACC] text-white';
      case 'CANCELLED':
        return 'bg-[#F18AB5] text-white';
      default:
        return 'bg-[#BDBDCB] text-[#303150]';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'טיוטה';
      case 'SCHEDULED':
        return 'מתוזמן';
      case 'SENDING':
        return 'בשליחה';
      case 'COMPLETED':
        return 'הושלם';
      case 'CANCELLED':
        return 'בוטל';
      default:
        return status;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <Calendar className="w-8 h-8 text-[#69ADFF] animate-pulse" />
          </div>
          <p className="text-[#7E7F90]">טוען...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <AlertCircle className="w-12 h-12 text-[#F18AB5] mx-auto mb-4" />
          <p className="text-[#303150] font-semibold mb-2">שגיאה</p>
          <p className="text-[#7E7F90] mb-6">{error || 'קמפיין לא נמצא'}</p>
          <button
            onClick={() => router.push('/admin/marketing/campaigns')}
            className="px-5 py-2.5 bg-[#69ADFF] text-white rounded-xl hover:bg-[#5A9EE6] transition-colors"
          >
            חזור לקמפיינים
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6 lg:mb-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => router.push('/admin/marketing/campaigns')}
            className="p-2 hover:bg-[#F7F7F8] rounded-xl transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-[#7E7F90]" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl lg:text-2xl font-bold text-[#303150] mb-1 truncate">{campaign.name}</h1>
            <p className="text-xs sm:text-sm text-[#7E7F90]">פרטי קמפיין</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mr-10 sm:mr-0">
          {campaign.status === 'DRAFT' && (
            <>
              <button
                onClick={() => router.push(`/admin/marketing/campaigns/${campaignId}/edit`)}
                className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#F7F7F8] text-[#303150] rounded-xl hover:bg-[#E8E8ED] transition-colors text-xs sm:text-sm"
              >
                <Edit className="w-4 h-4" />
                עריכה
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#69ADFF] text-white rounded-xl hover:bg-[#5A9EE6] transition-colors disabled:opacity-50 text-xs sm:text-sm"
              >
                <Send className="w-4 h-4" />
                {sending ? 'שולח...' : 'שלח'}
              </button>
            </>
          )}
          {campaign.status !== 'SENDING' && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#F18AB5]/10 text-[#F18AB5] rounded-xl hover:bg-[#F18AB5]/20 transition-colors disabled:opacity-50 text-xs sm:text-sm"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'מוחק...' : 'מחק'}
            </button>
          )}
        </div>
      </div>

      {/* Sync Message */}
      {syncMessage && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-[#0DBACC]/10 border border-[#0DBACC]/20 text-sm text-[#303150] flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-[#0DBACC]" />
          {syncMessage}
        </div>
      )}

      {/* Stats - Full Width */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-bold text-[#303150]">סטטיסטיקות</h2>
          {campaign.status === 'COMPLETED' && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-[#F7F7F8] text-[#303150] rounded-xl hover:bg-[#E8E8ED] transition-colors disabled:opacity-50 self-end sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'מסנכרן...' : 'סנכרן עם Resend'}
            </button>
          )}
        </div>
        <CampaignStats
          sentCount={campaign.sentCount}
          openCount={campaign.openCount}
          clickCount={campaign.clickCount}
          bounceCount={campaign.bounceCount}
          complaintCount={campaign.complaintCount}
        />
      </div>

      {/* Campaign Info */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)] mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-bold text-[#303150] mb-3 sm:mb-4">פרטי הקמפיין</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 lg:gap-x-8 gap-y-3 sm:gap-y-4">
          <div>
            <p className="text-sm text-[#7E7F90] mb-1">שם</p>
            <p className="text-base font-medium text-[#303150]">{campaign.name}</p>
          </div>
          <div>
            <p className="text-sm text-[#7E7F90] mb-1">נושא</p>
            <p className="text-base font-medium text-[#303150]">{campaign.subject}</p>
          </div>
          <div>
            <p className="text-sm text-[#7E7F90] mb-1">סטטוס</p>
            <span className={`inline-block px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(campaign.status)}`}>
              {getStatusLabel(campaign.status)}
            </span>
          </div>
          <div>
            <p className="text-sm text-[#7E7F90] mb-1">נוצר על ידי</p>
            <p className="text-base font-medium text-[#303150]">
              {campaign.creator.name || campaign.creator.email}
            </p>
          </div>
          <div>
            <p className="text-sm text-[#7E7F90] mb-1">תאריך יצירה</p>
            <p className="text-base font-medium text-[#303150]">{formatDate(campaign.createdAt)}</p>
          </div>
          {campaign.scheduledAt && (
            <div>
              <p className="text-sm text-[#7E7F90] mb-1">מתוזמן ל</p>
              <p className="text-base font-medium text-[#303150]">{formatDate(campaign.scheduledAt)}</p>
            </div>
          )}
          {campaign.startedAt && (
            <div>
              <p className="text-sm text-[#7E7F90] mb-1">התחיל ב</p>
              <p className="text-base font-medium text-[#303150]">{formatDate(campaign.startedAt)}</p>
            </div>
          )}
          {campaign.completedAt && (
            <div>
              <p className="text-sm text-[#7E7F90] mb-1">הושלם ב</p>
              <p className="text-base font-medium text-[#303150]">{formatDate(campaign.completedAt)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Content Preview */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        <h2 className="text-base sm:text-lg font-bold text-[#303150] mb-3 sm:mb-4">תוכן המייל</h2>
        <EmailPreview
          htmlContent={campaign.content}
          maxHeight="384px"
        />
      </div>
    </div>
  );
}

