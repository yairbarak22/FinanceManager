'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Mail, Plus, Eye, Send, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/utils';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'CANCELLED';
  sentCount: number;
  openCount: number;
  clickCount: number;
  createdAt: string;
  scheduledAt: string | null;
  creator: {
    id: string;
    name: string | null;
    email: string;
  };
}

function getOpenRateColor(rate: number): string {
  if (rate >= 30) return 'text-[#0DBACC]';
  if (rate >= 15) return 'text-[#69ADFF]';
  return 'text-[#F18AB5]';
}

function getOpenRateBg(rate: number): string {
  if (rate >= 30) return 'bg-[#0DBACC]/10';
  if (rate >= 15) return 'bg-[#69ADFF]/10';
  return 'bg-[#F18AB5]/10';
}

export default function CampaignsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [inlineMessage, setInlineMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchCampaigns();
  }, [session, status, router]);

  // Clear inline message after 4 seconds
  useEffect(() => {
    if (inlineMessage) {
      const timer = setTimeout(() => setInlineMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [inlineMessage]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch('/api/admin/marketing/campaigns');

      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          setError('אין לך הרשאה לצפות בדף זה');
        } else {
          setError('שגיאה בטעינת הקמפיינים');
        }
        return;
      }

      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch {
      setError('שגיאה בטעינת הקמפיינים');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCampaign = async (campaignId: string, campaignName: string) => {
    if (!confirm(`האם אתה בטוח שברצונך לשלוח את הקמפיין "${campaignName}"?`)) {
      return;
    }

    setSendingCampaignId(campaignId);
    try {
      const res = await apiFetch(`/api/admin/marketing/campaigns/${campaignId}/send`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        setInlineMessage({ type: 'error', text: data.error || 'שגיאה בשליחת הקמפיין' });
        return;
      }

      setInlineMessage({ type: 'success', text: `הקמפיין "${campaignName}" התחיל להישלח!` });
      fetchCampaigns();
    } catch {
      setInlineMessage({ type: 'error', text: 'שגיאה בשליחת הקמפיין' });
    } finally {
      setSendingCampaignId(null);
    }
  };

  const handleSyncAll = async () => {
    const completedCampaigns = campaigns.filter((c) => c.status === 'COMPLETED');
    if (completedCampaigns.length === 0) {
      setInlineMessage({ type: 'error', text: 'אין קמפיינים שהושלמו לסנכרן' });
      return;
    }

    setSyncingAll(true);
    let synced = 0;
    let errors = 0;

    for (const campaign of completedCampaigns) {
      try {
        const res = await apiFetch(`/api/admin/marketing/campaigns/${campaign.id}/sync`, {
          method: 'POST',
        });
        if (res.ok) {
          synced++;
        } else {
          errors++;
        }
      } catch {
        errors++;
      }
    }

    setInlineMessage({
      type: errors === 0 ? 'success' : 'error',
      text: `סונכרנו ${synced} קמפיינים${errors > 0 ? `, ${errors} שגיאות` : ''}`,
    });

    setSyncingAll(false);
    fetchCampaigns();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-[#BDBDCB]/20 text-[#7E7F90]';
      case 'SCHEDULED': return 'bg-[#74ACEF]/10 text-[#74ACEF]';
      case 'SENDING': return 'bg-[#69ADFF]/10 text-[#69ADFF]';
      case 'COMPLETED': return 'bg-[#0DBACC]/10 text-[#0DBACC]';
      case 'CANCELLED': return 'bg-[#F18AB5]/10 text-[#F18AB5]';
      default: return 'bg-[#BDBDCB]/20 text-[#7E7F90]';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'טיוטה';
      case 'SCHEDULED': return 'מתוזמן';
      case 'SENDING': return 'בשליחה';
      case 'COMPLETED': return 'הושלם';
      case 'CANCELLED': return 'בוטל';
      default: return status;
    }
  };

  if (status === 'loading' || loading) {
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <AlertCircle className="w-12 h-12 text-[#F18AB5] mx-auto mb-4" />
          <p className="text-[#303150] font-semibold mb-2">שגיאה</p>
          <p className="text-[#7E7F90]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#303150] mb-1">קמפיינים</h1>
          <p className="text-sm text-[#7E7F90]">ניהול קמפיינים שיווקיים</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncAll}
            disabled={syncingAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#303150] rounded-xl hover:bg-[#F7F7F8] transition-colors text-sm shadow-[0_2px_8px_rgba(0,0,0,0.06)] disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncingAll ? 'animate-spin' : ''}`} />
            סנכרן הכל
          </button>
          <button
            onClick={() => router.push('/admin/marketing/campaigns/new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#69ADFF] text-white rounded-xl hover:bg-[#5A9EE6] transition-colors shadow-[0_4px_12px_rgba(105,173,255,0.3)]"
          >
            <Plus className="w-5 h-5" />
            קמפיין חדש
          </button>
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

      {/* Campaigns Table */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-[#69ADFF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-[#69ADFF]" />
            </div>
            <p className="text-[#303150] font-medium mb-2">אין קמפיינים עדיין</p>
            <p className="text-sm text-[#7E7F90] mb-4">צור את הקמפיין הראשון שלך</p>
            <button
              onClick={() => router.push('/admin/marketing/campaigns/new')}
              className="px-5 py-2.5 bg-[#69ADFF] text-white rounded-xl hover:bg-[#5A9EE6] transition-colors"
            >
              צור קמפיין ראשון
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F7F7F8] text-[#7E7F90]">
                  <th className="text-right px-6 py-3.5 text-xs font-medium">שם</th>
                  <th className="text-right px-4 py-3.5 text-xs font-medium">נושא</th>
                  <th className="text-center px-4 py-3.5 text-xs font-medium">סטטוס</th>
                  <th className="text-center px-4 py-3.5 text-xs font-medium">נשלחו</th>
                  <th className="text-center px-4 py-3.5 text-xs font-medium">% פתיחה</th>
                  <th className="text-center px-4 py-3.5 text-xs font-medium">% הקלקה</th>
                  <th className="text-right px-4 py-3.5 text-xs font-medium">תאריך</th>
                  <th className="text-center px-4 py-3.5 text-xs font-medium">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => {
                  const openRate = campaign.sentCount > 0
                    ? (campaign.openCount / campaign.sentCount) * 100
                    : 0;
                  const clickRate = campaign.sentCount > 0
                    ? (campaign.clickCount / campaign.sentCount) * 100
                    : 0;
                  return (
                    <tr
                      key={campaign.id}
                      className="border-b border-[#F7F7F8] hover:bg-[#FAFAFE] transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/marketing/campaigns/${campaign.id}`)}
                    >
                      <td className="px-6 py-4 text-sm text-[#303150] font-medium">{campaign.name}</td>
                      <td className="px-4 py-4 text-sm text-[#7E7F90] truncate max-w-[200px]">{campaign.subject}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusColor(campaign.status)}`}>
                          {getStatusLabel(campaign.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-sm font-medium text-[#303150]">
                        {campaign.sentCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {campaign.sentCount > 0 ? (
                          <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${getOpenRateBg(openRate)} ${getOpenRateColor(openRate)}`}>
                            {openRate.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-[#BDBDCB] text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {campaign.sentCount > 0 ? (
                          <span className="text-xs font-medium text-[#303150]">
                            {clickRate.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-[#BDBDCB] text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-[#7E7F90]">{formatDate(campaign.createdAt)}</td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => router.push(`/admin/marketing/campaigns/${campaign.id}`)}
                            className="p-2 hover:bg-[#F7F7F8] rounded-lg transition-colors"
                            title="צפייה"
                          >
                            <Eye className="w-4 h-4 text-[#7E7F90]" />
                          </button>
                          {campaign.status === 'DRAFT' && (
                            <button
                              onClick={() => handleSendCampaign(campaign.id, campaign.name)}
                              disabled={sendingCampaignId === campaign.id}
                              className="p-2 hover:bg-[#F7F7F8] rounded-lg transition-colors disabled:opacity-50"
                              title="שליחה"
                            >
                              <Send className={`w-4 h-4 text-[#69ADFF] ${sendingCampaignId === campaign.id ? 'animate-pulse' : ''}`} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
