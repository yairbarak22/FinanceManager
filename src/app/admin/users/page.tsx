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
  ArrowLeft,
  TrendingUp,
  Wallet,
  CreditCard,
  Receipt,
  Calendar,
  UserPlus,
  Activity
} from 'lucide-react';
import { apiFetch } from '@/lib/utils';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
  hasSeenOnboarding: boolean;
  _count: {
    transactions: number;
    assets: number;
    liabilities: number;
    recurringTransactions: number;
  };
}

interface AdminStats {
  totals: {
    assets: number;
    liabilities: number;
    transactions: number;
    users: number;
  };
  today: {
    assets: number;
    liabilities: number;
    transactions: number;
    users: number;
  };
  activity: {
    multipleLoginUsers: number;
  };
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      setIsAccessDenied(true);
      setLoading(false);
      return;
    }

    fetchData();
  }, [session, status]);

  const fetchData = async () => {
    await Promise.all([fetchUsers(), fetchStats()]);
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsAccessDenied(false);
      const res = await apiFetch('/api/admin/users');

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
    } catch {
      setError('שגיאה בטעינת המשתמשים');
    } finally {
      setLoading(false);
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
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">גישה נדחתה</h1>
          <p className="text-gray-500 mb-6">אין לך הרשאה לצפות בעמוד זה</p>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg mx-auto hover:bg-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            חזור לדף הבית
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-6 px-4 md:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-indigo-500" />
                <h1 className="text-2xl font-bold text-gray-900">ניהול משתמשים</h1>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                צפייה בכל המשתמשים הרשומים במערכת
              </p>
            </div>
          </div>
          
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            רענן
          </button>
        </div>

        {/* System-wide Statistics */}
        {stats && (
          <>
            {/* Total System Counts */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                סה״כ במערכת
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.totals.assets.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">נכסים</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.totals.liabilities.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">התחייבויות</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.totals.transactions.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">עסקאות</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.activity.multipleLoginUsers.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">משתמשים חוזרים</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Changes */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                שינויים היום
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-4 border border-indigo-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-indigo-700">+{stats.today.users}</p>
                      <p className="text-sm text-gray-500">משתמשים חדשים</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-4 border border-emerald-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-700">+{stats.today.assets}</p>
                      <p className="text-sm text-gray-500">נכסים חדשים</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-white rounded-xl p-4 border border-red-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-700">+{stats.today.liabilities}</p>
                      <p className="text-sm text-gray-500">התחייבויות חדשות</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-4 border border-purple-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-700">+{stats.today.transactions}</p>
                      <p className="text-sm text-gray-500">עסקאות חדשות</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* User Stats */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            סטטיסטיקות משתמשים
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                  <p className="text-sm text-gray-500">משתמשים רשומים</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => u.hasSeenOnboarding).length}
                  </p>
                  <p className="text-sm text-gray-500">סיימו onboarding</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => u._count.transactions > 0).length}
                  </p>
                  <p className="text-sm text-gray-500">משתמשים פעילים</p>
                </div>
              </div>
            </div>
          </div>
        </div>

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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      משתמש
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      אימייל
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      תאריך הרשמה
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
                          <span className="font-medium text-gray-900">
                            {user.name || 'ללא שם'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
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
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-6 text-center text-xs text-gray-400">
          <Shield className="w-4 h-4 inline-block ml-1" />
          עמוד זה מוגן ונגיש רק לאדמינים מורשים
        </div>
      </div>
    </main>
  );
}

