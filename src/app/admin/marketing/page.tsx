'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  TrendingUp,
  MousePointerClick,
  Eye,
  AlertCircle,
  Activity,
  Plus,
  LayoutGrid,
  FileText,
  RefreshCw,
  ArrowUpLeft,
  ChevronLeft,
} from 'lucide-react';
import { apiFetch } from '@/lib/utils';

interface RecentCampaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  sentCount: number;
  openCount: number;
  clickCount: number;
  completedAt: string | null;
  createdAt: string;
}

interface MarketingStats {
  thisMonth: {
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
    complained: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  };
  activeCampaigns: number;
  totalCampaigns: number;
  allTime: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
  };
  recentCampaigns: RecentCampaign[];
  eventsByDate: Array<{ date: string; count: number }>;
}

function getOpenRateColor(rate: number): string {
  if (rate >= 30) return 'text-[#0DBACC]';   // Turquoise — great
  if (rate >= 15) return 'text-[#69ADFF]';    // Dodger Blue — decent
  return 'text-[#F18AB5]';                    // Cotton Candy Pink — low
}

function getOpenRateBg(rate: number): string {
  if (rate >= 30) return 'bg-[#0DBACC]/10';
  if (rate >= 15) return 'bg-[#69ADFF]/10';
  return 'bg-[#F18AB5]/10';
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'DRAFT': return 'טיוטה';
    case 'SCHEDULED': return 'מתוזמן';
    case 'SENDING': return 'בשליחה';
    case 'COMPLETED': return 'הושלם';
    case 'CANCELLED': return 'בוטל';
    default: return status;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'DRAFT': return 'bg-[#BDBDCB]/20 text-[#7E7F90]';
    case 'SCHEDULED': return 'bg-[#74ACEF]/10 text-[#74ACEF]';
    case 'SENDING': return 'bg-[#69ADFF]/10 text-[#69ADFF]';
    case 'COMPLETED': return 'bg-[#0DBACC]/10 text-[#0DBACC]';
    case 'CANCELLED': return 'bg-[#F18AB5]/10 text-[#F18AB5]';
    default: return 'bg-[#BDBDCB]/20 text-[#7E7F90]';
  }
}

export default function MarketingDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<MarketingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchStats();
  }, [session, status, router]);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await apiFetch('/api/admin/marketing/stats');

      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          setError('אין לך הרשאה לצפות בדף זה');
        } else {
          setError('שגיאה בטעינת הסטטיסטיקות');
        }
        return;
      }

      const data = await res.json();
      setStats(data);
      setLastRefresh(new Date());
    } catch {
      setError('שגיאה בטעינת הסטטיסטיקות');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('he-IL', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (!stats) return null;

  const hasData = stats.allTime.totalSent > 0 || stats.totalCampaigns > 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#303150] mb-0.5">דאשבורד דיוור</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <p className="text-xs lg:text-sm text-[#7E7F90]">סקירה כללית של ביצועי הקמפיינים</p>
            {lastRefresh && (
              <span className="text-[10px] lg:text-xs text-[#BDBDCB]">
                עודכן {lastRefresh.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={fetchStats}
          disabled={refreshing}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-white text-[#303150] rounded-xl hover:bg-[#F7F7F8] transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.06)] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">רענן</span>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
        <button
          onClick={() => router.push('/admin/marketing/campaigns/new')}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#69ADFF] text-white rounded-xl hover:bg-[#5A9EE6] transition-colors text-xs sm:text-sm font-medium shadow-[0_4px_12px_rgba(105,173,255,0.3)]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">קמפיין חדש</span>
          <span className="sm:hidden">חדש</span>
        </button>
        <button
          onClick={() => router.push('/admin/marketing/campaigns')}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-white text-[#303150] rounded-xl hover:bg-[#F7F7F8] transition-colors text-xs sm:text-sm font-medium shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="hidden sm:inline">כל הקמפיינים</span>
          <span className="sm:hidden">קמפיינים</span>
        </button>
        <button
          onClick={() => router.push('/admin/marketing/templates')}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-white text-[#303150] rounded-xl hover:bg-[#F7F7F8] transition-colors text-xs sm:text-sm font-medium shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
        >
          <FileText className="w-4 h-4" />
          תבניות
        </button>
      </div>

      {!hasData ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 shadow-[0_4px_20px_rgba(0,0,0,0.08)] text-center">
          <div className="w-20 h-20 bg-[#69ADFF]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-[#69ADFF]" />
          </div>
          <h2 className="text-xl font-bold text-[#303150] mb-3">עדיין אין קמפיינים</h2>
          <p className="text-[#7E7F90] mb-6 max-w-md mx-auto">
            צור את הקמפיין הראשון שלך כדי להתחיל לשלוח מיילים שיווקיים ללקוחות שלך
          </p>
          <button
            onClick={() => router.push('/admin/marketing/campaigns/new')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#69ADFF] text-white rounded-xl hover:bg-[#5A9EE6] transition-colors font-medium shadow-[0_4px_12px_rgba(105,173,255,0.3)]"
          >
            <Plus className="w-5 h-5" />
            צור קמפיין ראשון
          </button>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            {/* Sent This Month */}
            <div className="bg-white rounded-xl lg:rounded-2xl p-3.5 lg:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-t-[3px] border-[#69ADFF]">
              <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-[#69ADFF]/10 rounded-lg lg:rounded-xl flex items-center justify-center">
                  <Mail className="w-4 h-4 lg:w-5 lg:h-5 text-[#69ADFF]" />
                </div>
                <span className="text-[10px] lg:text-xs text-[#7E7F90]">החודש</span>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-[#303150] mb-0.5 lg:mb-1">
                {stats.thisMonth.sent.toLocaleString()}
              </p>
              <p className="text-[10px] lg:text-xs text-[#7E7F90]">מיילים שנשלחו</p>
            </div>

            {/* Open Rate */}
            <div className="bg-white rounded-xl lg:rounded-2xl p-3.5 lg:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-t-[3px] border-[#0DBACC]">
              <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-[#0DBACC]/10 rounded-lg lg:rounded-xl flex items-center justify-center">
                  <Eye className="w-4 h-4 lg:w-5 lg:h-5 text-[#0DBACC]" />
                </div>
                <span className="text-[10px] lg:text-xs text-[#7E7F90]">החודש</span>
              </div>
              <p className={`text-xl lg:text-2xl font-bold mb-0.5 lg:mb-1 ${getOpenRateColor(stats.thisMonth.openRate)}`}>
                {stats.thisMonth.sent > 0 ? `${stats.thisMonth.openRate.toFixed(1)}%` : '—'}
              </p>
              <p className="text-[10px] lg:text-xs text-[#7E7F90]">אחוז פתיחה</p>
            </div>

            {/* Click Rate */}
            <div className="bg-white rounded-xl lg:rounded-2xl p-3.5 lg:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-t-[3px] border-[#74ACEF]">
              <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-[#74ACEF]/10 rounded-lg lg:rounded-xl flex items-center justify-center">
                  <MousePointerClick className="w-4 h-4 lg:w-5 lg:h-5 text-[#74ACEF]" />
                </div>
                <span className="text-[10px] lg:text-xs text-[#7E7F90]">החודש</span>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-[#303150] mb-0.5 lg:mb-1">
                {stats.thisMonth.sent > 0 ? `${stats.thisMonth.clickRate.toFixed(1)}%` : '—'}
              </p>
              <p className="text-[10px] lg:text-xs text-[#7E7F90]">אחוז הקלקה</p>
            </div>

            {/* Active Campaigns */}
            <div className="bg-white rounded-xl lg:rounded-2xl p-3.5 lg:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-t-[3px] border-[#F18AB5]">
              <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-[#F18AB5]/10 rounded-lg lg:rounded-xl flex items-center justify-center">
                  <Activity className="w-4 h-4 lg:w-5 lg:h-5 text-[#F18AB5]" />
                </div>
                <span className="text-[10px] lg:text-xs text-[#7E7F90]">סה״כ</span>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-[#303150] mb-0.5 lg:mb-1">
                {stats.totalCampaigns}
              </p>
              <p className="text-[10px] lg:text-xs text-[#7E7F90]">
                {stats.activeCampaigns > 0 ? `${stats.activeCampaigns} פעילים` : 'קמפיינים'}
              </p>
            </div>
          </div>

          {/* Recent Campaigns */}
          {stats.recentCampaigns.length > 0 && (
            <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] mb-6 overflow-hidden">
              <div className="flex items-center justify-between p-4 lg:p-5 pb-3">
                <h2 className="text-sm lg:text-base font-bold text-[#303150]">קמפיינים אחרונים</h2>
                <button
                  onClick={() => router.push('/admin/marketing/campaigns')}
                  className="text-xs text-[#69ADFF] hover:underline flex items-center gap-1"
                >
                  הצג הכל
                  <ChevronLeft className="w-3 h-3" />
                </button>
              </div>

              {/* Mobile card list */}
              <div className="lg:hidden divide-y divide-[#F7F7F8]">
                {stats.recentCampaigns.map((campaign) => {
                  const openRate = campaign.sentCount > 0
                    ? (campaign.openCount / campaign.sentCount) * 100
                    : 0;
                  return (
                    <button
                      key={campaign.id}
                      onClick={() => router.push(`/admin/marketing/campaigns/${campaign.id}`)}
                      className="w-full text-right p-4 hover:bg-[#FAFAFE] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-[#303150] truncate">{campaign.name}</p>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium flex-shrink-0 ${getStatusColor(campaign.status)}`}>
                          {getStatusLabel(campaign.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#7E7F90]">
                        <span>{campaign.sentCount} נשלחו</span>
                        {campaign.sentCount > 0 && (
                          <span className={`font-bold ${getOpenRateColor(openRate)}`}>
                            {openRate.toFixed(0)}% פתיחה
                          </span>
                        )}
                        <span className="mr-auto">{formatDate(campaign.completedAt || campaign.createdAt)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-t border-[#F7F7F8] text-[#7E7F90]">
                      <th className="text-right font-medium py-3 px-5">קמפיין</th>
                      <th className="text-center font-medium py-3 px-3">סטטוס</th>
                      <th className="text-center font-medium py-3 px-3">נשלחו</th>
                      <th className="text-center font-medium py-3 px-3">% פתיחה</th>
                      <th className="text-center font-medium py-3 px-3">% הקלקה</th>
                      <th className="text-left font-medium py-3 px-5">תאריך</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentCampaigns.map((campaign) => {
                      const openRate = campaign.sentCount > 0
                        ? (campaign.openCount / campaign.sentCount) * 100
                        : 0;
                      const clickRate = campaign.sentCount > 0
                        ? (campaign.clickCount / campaign.sentCount) * 100
                        : 0;
                      return (
                        <tr
                          key={campaign.id}
                          onClick={() => router.push(`/admin/marketing/campaigns/${campaign.id}`)}
                          className="border-t border-[#F7F7F8] hover:bg-[#FAFAFE] cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-5">
                            <p className="font-medium text-[#303150] text-sm">{campaign.name}</p>
                            <p className="text-xs text-[#BDBDCB] mt-0.5 truncate max-w-[200px]">{campaign.subject}</p>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusColor(campaign.status)}`}>
                              {getStatusLabel(campaign.status)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-medium text-[#303150]">
                            {campaign.sentCount.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {campaign.sentCount > 0 ? (
                              <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${getOpenRateBg(openRate)} ${getOpenRateColor(openRate)}`}>
                                {openRate.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-[#BDBDCB]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {campaign.sentCount > 0 ? (
                              <span className="text-xs font-medium text-[#303150]">
                                {clickRate.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-[#BDBDCB]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-5 text-left text-xs text-[#7E7F90]">
                            {formatDate(campaign.completedAt || campaign.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* All Time Stats - Compact row */}
          <div className="bg-white rounded-2xl p-4 lg:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <h2 className="text-sm lg:text-base font-bold text-[#303150] mb-3 lg:mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#69ADFF]" />
              סה״כ כל הזמנים
            </h2>
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6 lg:gap-8">
              <div className="flex items-center gap-2">
                <ArrowUpLeft className="w-4 h-4 text-[#69ADFF] flex-shrink-0" />
                <span className="text-xs sm:text-sm text-[#7E7F90]">נשלחו</span>
                <span className="text-sm sm:text-base font-bold text-[#303150]">{stats.allTime.totalSent.toLocaleString()}</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-[#E8E8ED]" />
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#0DBACC] flex-shrink-0" />
                <span className="text-xs sm:text-sm text-[#7E7F90]">נפתחו</span>
                <span className="text-sm sm:text-base font-bold text-[#303150]">{stats.allTime.totalOpened.toLocaleString()}</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-[#E8E8ED]" />
              <div className="flex items-center gap-2">
                <MousePointerClick className="w-4 h-4 text-[#74ACEF] flex-shrink-0" />
                <span className="text-xs sm:text-sm text-[#7E7F90]">הקליקו</span>
                <span className="text-sm sm:text-base font-bold text-[#303150]">{stats.allTime.totalClicked.toLocaleString()}</span>
              </div>
              {stats.allTime.totalSent > 0 && (
                <>
                  <div className="hidden sm:block h-4 w-px bg-[#E8E8ED]" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm text-[#7E7F90]">% פתיחה</span>
                    <span className={`text-sm sm:text-base font-bold ${getOpenRateColor((stats.allTime.totalOpened / stats.allTime.totalSent) * 100)}`}>
                      {((stats.allTime.totalOpened / stats.allTime.totalSent) * 100).toFixed(1)}%
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
