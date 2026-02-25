'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, Download, Plus, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { useMonth } from '@/context/MonthContext';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/utils';
import ProfileModal from '@/components/ProfileModal';
import AccountSettings from '@/components/AccountSettings';
import { useModal } from '@/context/ModalContext';

import MonthSelector from '@/components/monthly-summary/MonthSelector';
import MonthlyBalanceCard from '@/components/monthly-summary/MonthlyBalanceCard';
import AIInsightsCard from '@/components/monthly-summary/AIInsightsCard';
import ExpensesByCategoryCard from '@/components/monthly-summary/ExpensesByCategoryCard';
import GoalsProgressCard from '@/components/monthly-summary/GoalsProgressCard';
import NetWorthCard from '@/components/monthly-summary/NetWorthCard';
import CategoryComparisonCard from '@/components/monthly-summary/CategoryComparisonCard';
import UpcomingObligationsCard from '@/components/monthly-summary/UpcomingObligationsCard';
import CategoryTransactionsDrawer from '@/components/monthly-summary/CategoryTransactionsDrawer';
import ReportSkeleton from '@/components/monthly-summary/ReportSkeleton';
import type { CategoryBreakdownItem, GoalProgressItem, UpcomingObligation } from '@/lib/monthlyReport/calculations';
import type { Transaction } from '@/lib/types';

const MONTH_NAMES: Record<string, string> = {
  '01': 'ינואר',
  '02': 'פברואר',
  '03': 'מרץ',
  '04': 'אפריל',
  '05': 'מאי',
  '06': 'יוני',
  '07': 'יולי',
  '08': 'אוגוסט',
  '09': 'ספטמבר',
  '10': 'אוקטובר',
  '11': 'נובמבר',
  '12': 'דצמבר',
};

interface CategoryHistoryItem {
  monthKey: string;
  categories: CategoryBreakdownItem[];
}

interface ReportData {
  id: string;
  monthKey: string;
  netCashflow: number;
  totalIncome: number;
  totalExpenses: number;
  aiInsights: { success: string; attention: string; forecast: string };
  categoryBreakdown: CategoryBreakdownItem[];
  goalsProgress: GoalProgressItem[];
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorthHistory: { monthKey: string; netWorth: number }[];
  categoryHistory: CategoryHistoryItem[];
  upcomingObligations: UpcomingObligation[];
  transactions: Transaction[];
  isFirstMonth: boolean;
}

export default function MonthlySummaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { openModal, isModalOpen, closeModal } = useModal();
  const {
    selectedMonth: contextMonth,
    setSelectedMonth,
    allMonths,
    monthsWithData,
    currentMonth,
  } = useMonth();

  const exportMode = searchParams.get('export') === 'true';

  const [reportMonthKey, setReportMonthKey] = useState(() => {
    const qMonth = searchParams.get('monthKey');
    if (qMonth && /^\d{4}-\d{2}$/.test(qMonth)) return qMonth;
    return currentMonth;
  });

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [reportExists, setReportExists] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const drawerCategory = searchParams.get('category');

  const fetchReport = useCallback(async (monthKey: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/monthly-reports/${monthKey}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        setReportExists(true);
      } else if (res.status === 404) {
        setReport(null);
        setReportExists(false);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || 'שגיאה בטעינת הדוח');
      }
    } catch {
      setError('שגיאה בטעינת הדוח');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(reportMonthKey);
  }, [reportMonthKey, fetchReport]);

  const handleCreateReport = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await apiFetch('/api/monthly-reports', {
        method: 'POST',
        body: JSON.stringify({ monthKey: reportMonthKey }),
      });
      if (res.ok) {
        await fetchReport(reportMonthKey);
      } else if (res.status === 409) {
        await fetchReport(reportMonthKey);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || 'שגיאה ביצירת הדוח');
      }
    } catch {
      setError('שגיאה ביצירת הדוח');
    } finally {
      setCreating(false);
    }
  };

  const handleMonthChange = (newMonthKey: string) => {
    setReportMonthKey(newMonthKey);
  };

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('category', category);
    router.push(`/monthly-summary?${params.toString()}`, { scroll: false });
  };

  const handleDrawerClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    const qs = params.toString();
    router.push(`/monthly-summary${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  const handleExportPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await apiFetch(
        `/api/monthly-reports/${reportMonthKey}/pdf`
      );
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `סיכום-חודשי-${reportMonthKey}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        setError('שגיאה בייצוא ל-PDF');
      }
    } catch {
      setError('שגיאה בייצוא ל-PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const monthLabel = (() => {
    const [year, month] = reportMonthKey.split('-');
    return `${MONTH_NAMES[month]} ${year}`;
  })();

  const userName = session?.user?.name?.split(' ')[0];

  const pageContent = (
    <>
      {/* Top Bar */}
      {!exportMode && (
        <div className="flex items-center justify-between mb-6">
          <MonthSelector
            monthKey={reportMonthKey}
            onMonthChange={handleMonthChange}
          />

          {reportExists && report && (
            <button
              onClick={handleExportPdf}
              disabled={pdfLoading}
              className="flex items-center gap-2 px-4 py-2.5 text-[0.8125rem] font-medium text-white bg-[#69ADFF] rounded-xl hover:bg-[#5A9EE6] transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-60"
            >
              {pdfLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" strokeWidth={1.75} />
              )}
              ייצוא PDF
            </button>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && <ReportSkeleton />}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] text-center">
          <p className="text-[0.9375rem] text-[#F18AB5] mb-4">{error}</p>
          <button
            onClick={() => fetchReport(reportMonthKey)}
            className="px-5 py-2.5 text-[0.8125rem] font-medium text-white bg-[#69ADFF] rounded-xl hover:bg-[#5A9EE6] transition-all cursor-pointer"
          >
            נסה שוב
          </button>
        </div>
      )}

      {/* No Report - Create */}
      {!loading && !error && !reportExists && (
        <div className="bg-white rounded-3xl p-10 shadow-[0_4px_20px_rgba(0,0,0,0.08)] text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#EBF3FF] flex items-center justify-center mx-auto mb-4">
            <FileText
              className="w-7 h-7 text-[#69ADFF]"
              strokeWidth={1.75}
            />
          </div>
          <h2 className="text-[1.125rem] font-semibold text-[#303150] mb-2">
            אין דוח ל{monthLabel}
          </h2>
          <p className="text-[0.9375rem] text-[#7E7F90] mb-6">
            צור דוח סיכום חודשי כדי לקבל תמונת מצב מלאה
          </p>
          <button
            onClick={handleCreateReport}
            disabled={creating}
            className="inline-flex items-center gap-2 px-6 py-3 text-[0.9375rem] font-medium text-white bg-[#69ADFF] rounded-xl hover:bg-[#5A9EE6] transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-60"
          >
            {creating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" strokeWidth={1.75} />
            )}
            {creating ? 'יוצר דוח...' : 'צור דוח'}
          </button>
        </div>
      )}

      {/* Report Content */}
      {!loading && !error && report && (
        <div className="space-y-6">
          {/* Hero */}
          <MonthlyBalanceCard
            monthLabel={monthLabel}
            netCashflow={report.netCashflow}
            totalIncome={report.totalIncome}
            totalExpenses={report.totalExpenses}
            userName={userName}
          />

          {/* AI Insights */}
          <AIInsightsCard insights={report.aiInsights} />

          {/* Expenses + Category Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpensesByCategoryCard
              categoryBreakdown={report.categoryBreakdown}
              totalExpenses={report.totalExpenses}
              isFirstMonth={report.isFirstMonth}
              onCategoryClick={handleCategoryClick}
            />
            <CategoryComparisonCard
              categoryHistory={report.categoryHistory || []}
            />
          </div>

          {/* Goals + Obligations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GoalsProgressCard goalsProgress={report.goalsProgress} />
            <UpcomingObligationsCard
              obligations={report.upcomingObligations || []}
            />
          </div>

          {/* Net Worth */}
          <NetWorthCard
            netWorth={report.netWorth}
            totalAssets={report.totalAssets}
            totalLiabilities={report.totalLiabilities}
            netWorthHistory={report.netWorthHistory || []}
            isFirstMonth={report.isFirstMonth}
            liabilities={report.upcomingObligations || []}
          />
        </div>
      )}

      {/* Category Transactions Drawer */}
      <CategoryTransactionsDrawer
        category={drawerCategory}
        transactions={report?.transactions || []}
        onClose={handleDrawerClose}
      />
    </>
  );

  if (exportMode) {
    return (
      <div className="bg-[#F5F5F7] min-h-screen p-8">
        <div className="max-w-3xl mx-auto">
          <MonthSelector
            monthKey={reportMonthKey}
            onMonthChange={() => {}}
            exportMode
          />
          <div className="mt-6">{pageContent}</div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout
      pageTitle="סיכום חודשי"
      pageSubtitle="תמונת מצב פיננסית חודשית"
      selectedMonth={contextMonth}
      onMonthChange={setSelectedMonth}
      allMonths={allMonths}
      monthsWithData={monthsWithData}
      currentMonth={currentMonth}
      showMonthFilter={false}
      onOpenProfile={() => openModal('profile')}
      onOpenAccountSettings={() => openModal('accountSettings')}
    >
      {pageContent}

      {/* Modals */}
      <ProfileModal
        isOpen={isModalOpen('profile')}
        onClose={closeModal}
      />
      <AccountSettings
        isOpen={isModalOpen('accountSettings')}
        onClose={closeModal}
      />
    </AppLayout>
  );
}
