'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Shield,
  RefreshCw,
  User,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Wallet,
  CreditCard,
  Receipt,
  Calendar,
  UserPlus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  MousePointerClick,
  Phone,
  Target,
  Flag,
} from 'lucide-react';
import { apiFetch } from '@/lib/utils';
import { SensitiveData } from '@/components/common/SensitiveData';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  uniqueLoginDays: number;
  hasSeenOnboarding: boolean;
  _count: {
    transactions: number;
    assets: number;
    liabilities: number;
    recurringTransactions: number;
  };
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface AdminStats {
  totals: {
    assets: number;
    liabilities: number;
    transactions: number;
    users: number;
    budgets: number;
    goals: number;
  };
  today: {
    assets: number;
    liabilities: number;
    transactions: number;
    users: number;
  };
  activity: {
    multipleLoginUsers: number;
    todayUniqueLogins: number;
    usersWithMultipleLoginDays: number;
  };
  ivr: {
    usersWithPhone: number;
    expensesCount: number;
  };
}

interface CtaClickUser {
  id: string | null;
  name: string | null;
  email: string | null;
  image: string | null;
  clickCount: number;
  lastClickedAt: string;
}

interface CtaClickData {
  totalClicks: number;
  anonymousClicks: number;
  uniqueUsers: number;
  sourceBreakdown: Record<string, number>;
  users: CtaClickUser[];
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [ctaData, setCtaData] = useState<CtaClickData | null>(null);
  const [showCtaUsers, setShowCtaUsers] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      setIsAccessDenied(true);
      setLoading(false);
      return;
    }

    fetchData();

    // Auto-refresh stats every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 30_000);
    return () => clearInterval(interval);
  }, [session, status]);

  const fetchData = async () => {
    setCurrentPage(1);
    await Promise.all([fetchUsers(1), fetchStats(), fetchCtaClicks()]);
  };

  const fetchStats = async () => {
    try {
      const res = await apiFetch('/api/admin/stats');

      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          setIsAccessDenied(true);
        }
        return;
      }

      const data = await res.json();
      setStats(data);
    } catch {
      // Stats fetch failed silently - not critical
      console.error('Failed to fetch admin stats');
    }
  };

  const fetchUsers = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      setIsAccessDenied(false);
      const res = await apiFetch(`/api/admin/users?page=${page}&pageSize=10`);

      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          setIsAccessDenied(true);
        } else {
          setError('שגיאה בטעינת המשתמשים');
        }
        return;
      }

      const data = await res.json();
      setUsers(data.users);
      setPagination(data.pagination);
      setCurrentPage(data.pagination.page);
    } catch {
      setError('שגיאה בטעינת המשתמשים');
    } finally {
      setLoading(false);
    }
  };

  const fetchCtaClicks = async () => {
    try {
      const res = await apiFetch('/api/admin/stats/cta-clicks');
      if (res.ok) {
        const data = await res.json();
        setCtaData(data);
      }
    } catch {
      console.error('Failed to fetch CTA click stats');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Show access denied if API returned 403/401
  if (isAccessDenied) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <div className="w-16 h-16 bg-[#F18AB5]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-[#F18AB5]" />
          </div>
          <h1 className="text-2xl font-bold text-[#303150] mb-2">גישה נדחתה</h1>
          <p className="text-[#7E7F90] mb-6">אין לך הרשאה לצפות בעמוד זה</p>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 bg-[#69ADFF] text-white rounded-xl hover:bg-[#5A9EE6] transition-colors"
          >
            חזור לדף הבית
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#303150] mb-1">ניהול משתמשים</h1>
          <p className="text-xs sm:text-sm text-[#7E7F90]">
            10 משתמשים אחרונים שהתחברו
          </p>
        </div>
        
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-white border border-[#E8E8ED] rounded-xl hover:bg-[#F7F7F8] transition-colors disabled:opacity-50 text-[#303150] self-end sm:self-auto text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          רענן
        </button>
      </div>

      {/* System-wide Statistics */}
      {stats && (
        <>
          {/* Total System Counts */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-[#303150] mb-2 sm:mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#69ADFF]" />
              סה״כ במערכת
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
                <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totals.assets.toLocaleString()}</p>
                      <p className="text-xs sm:text-sm text-gray-500">נכסים</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totals.liabilities.toLocaleString()}</p>
                      <p className="text-xs sm:text-sm text-gray-500">התחייבויות</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totals.transactions.toLocaleString()}</p>
                      <p className="text-xs sm:text-sm text-gray-500">עסקאות</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totals.budgets.toLocaleString()}</p>
                      <p className="text-xs sm:text-sm text-gray-500">תקציבים</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Flag className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totals.goals.toLocaleString()}</p>
                      <p className="text-xs sm:text-sm text-gray-500">יעדים</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Changes */}
            <div className="mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
                שינויים היום
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
                <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-3 sm:p-4 border border-indigo-100 shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-indigo-700">+{stats.today.users}</p>
                      <p className="text-xs sm:text-sm text-gray-500">משתמשים חדשים</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-3 sm:p-4 border border-emerald-100 shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-emerald-700">+{stats.today.assets}</p>
                      <p className="text-xs sm:text-sm text-gray-500">נכסים חדשים</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-white rounded-xl p-3 sm:p-4 border border-red-100 shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-red-700">+{stats.today.liabilities}</p>
                      <p className="text-xs sm:text-sm text-gray-500">התחייבויות חדשות</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-3 sm:p-4 border border-purple-100 shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-purple-700">+{stats.today.transactions}</p>
                      <p className="text-xs sm:text-sm text-gray-500">עסקאות חדשות</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-3 sm:p-4 border border-amber-100 shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-amber-700">{stats.activity.todayUniqueLogins.toLocaleString()}</p>
                      <p className="text-xs sm:text-sm text-gray-500">כניסות ייחודיות היום</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-teal-50 to-white rounded-xl p-3 sm:p-4 border border-teal-100 shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-teal-700">{(stats.activity.usersWithMultipleLoginDays ?? 0).toLocaleString()}</p>
                      <p className="text-xs sm:text-sm text-gray-500">משתמשים חוזרים (2+ ימים)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* IVR Statistics */}
            <div className="mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-[#303150] mb-2 sm:mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-[#69ADFF]" />
                סטטיסטיקות IVR
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.ivr.usersWithPhone.toLocaleString()}</p>
                      <p className="text-xs sm:text-sm text-gray-500">משתמשים עם מספר טלפון</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.ivr.expensesCount.toLocaleString()}</p>
                      <p className="text-xs sm:text-sm text-gray-500">הוצאות דרך IVR</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* User Stats */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
            סטטיסטיקות משתמשים
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats?.totals.users ?? pagination.total}</p>
                  <p className="text-xs sm:text-sm text-gray-500">משתמשים רשומים</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCtaUsers((v) => !v)}
              className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm cursor-pointer hover:bg-[#F7F7F8] transition-colors text-right"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#0DBACC]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MousePointerClick className="w-4 h-4 sm:w-5 sm:h-5 text-[#0DBACC]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{ctaData?.uniqueUsers ?? 0}</p>
                  <p className="text-xs sm:text-sm text-gray-500">לחצו על פתיחת חשבון</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#BDBDCB] transition-transform duration-200 flex-shrink-0 ${showCtaUsers ? 'rotate-180' : ''}`} />
              </div>
            </button>
          </div>
        </div>

        {showCtaUsers && ctaData && (ctaData.users.length > 0 || ctaData.anonymousClicks > 0) && (
          <div className="mb-4 sm:mb-6 space-y-4">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <h3 className="text-sm sm:text-base font-semibold text-[#303150] mb-4 flex items-center gap-2">
                <MousePointerClick className="w-4 h-4 text-[#0DBACC]" />
                לחיצות על פתיחת חשבון מסחר
                <span className="text-xs text-[#7E7F90] font-normal">({ctaData.totalClicks} סה״כ, {ctaData.anonymousClicks} אנונימיות)</span>
              </h3>

              {ctaData.sourceBreakdown && Object.keys(ctaData.sourceBreakdown).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(ctaData.sourceBreakdown).map(([src, count]) => (
                    <span
                      key={src}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-50 text-[#6E6E73] border border-gray-100"
                    >
                      <span className="text-[#303150]">{count}</span>
                      {src.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}

              {ctaData.users.length > 0 && (
                <div className="divide-y divide-gray-100">
                  {ctaData.users.map((ctaUser) => (
                    <div key={ctaUser.id ?? 'anon'} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      {ctaUser.image ? (
                        <img
                          src={ctaUser.image}
                          alt={ctaUser.name || 'User'}
                          className="w-9 h-9 rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#0DBACC]/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-[#0DBACC]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <SensitiveData as="p" className="text-sm font-medium text-[#303150] truncate">
                          {ctaUser.name || 'ללא שם'}
                        </SensitiveData>
                        <SensitiveData as="p" className="text-xs text-[#7E7F90] truncate">
                          {ctaUser.email || ''}
                        </SensitiveData>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#0DBACC]/10 text-[#0DBACC]">
                          {ctaUser.clickCount} {ctaUser.clickCount === 1 ? 'לחיצה' : 'לחיצות'}
                        </span>
                        <span className="text-[11px] text-[#BDBDCB]">
                          {new Date(ctaUser.lastClickedAt).toLocaleDateString('he-IL', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Users Table */}
        {!loading && !error && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Mobile card list */}
            <div className="lg:hidden divide-y divide-gray-100">
              {users.map((user) => (
                <div key={user.id} className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name || 'User'}
                        className="w-9 h-9 rounded-full"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-indigo-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <SensitiveData as="p" className="text-sm font-medium text-gray-900 truncate">
                        {user.name || 'ללא שם'}
                      </SensitiveData>
                      <SensitiveData as="p" className="text-xs text-gray-500 truncate">
                        {user.email}
                      </SensitiveData>
                    </div>
                    {user.hasSeenOnboarding ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 mr-12">
                    <span>
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'מעולם לא נכנס'}
                    </span>
                    <span>{user._count.transactions} עסקאות</span>
                    <span>{user._count.assets} נכסים</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      משתמש
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      אימייל
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      כניסה אחרונה
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ימי כניסה
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Onboarding
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      פעילות
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name || 'User'}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-indigo-600" />
                            </div>
                          )}
                          <SensitiveData as="span" className="font-medium text-gray-900">
                            {user.name || 'ללא שם'}
                          </SensitiveData>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <SensitiveData>{user.email}</SensitiveData>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLoginAt
                          ? formatDate(user.lastLoginAt)
                          : <span className="text-gray-300 text-xs">מעולם לא נכנס</span>
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.uniqueLoginDays > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                            {user.uniqueLoginDays} ימים
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.hasSeenOnboarding ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle2 className="w-3 h-3" />
                            הושלם
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <XCircle className="w-3 h-3" />
                            לא הושלם
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex gap-3 text-xs">
                          <span title="עסקאות">{user._count.transactions} עסקאות</span>
                          <span title="נכסים">{user._count.assets} נכסים</span>
                          <span title="התחייבויות">{user._count.liabilities} התחייבויות</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {users.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">אין משתמשים רשומים עדיין</p>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => fetchUsers(currentPage + 1)}
                  disabled={currentPage >= pagination.totalPages || loading}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  הבא
                </button>

                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <span>עמוד</span>
                  <span className="font-semibold text-gray-900">{currentPage}</span>
                  <span>מתוך</span>
                  <span className="font-semibold text-gray-900">{pagination.totalPages}</span>
                  <span className="text-gray-400 mr-2">({pagination.total} משתמשים)</span>
                </div>

                <button
                  onClick={() => fetchUsers(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  קודם
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

      {/* Security Notice */}
      <div className="mt-6 text-center text-xs text-[#BDBDCB]">
        <Shield className="w-4 h-4 inline-block ml-1" />
        עמוד זה מוגן ונגיש רק לאדמינים מורשים
      </div>
    </div>
  );
}

