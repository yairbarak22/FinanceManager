'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import LinkActivityTable from './LinkActivityTable';
import SubscriberActivityTable from './SubscriberActivityTable';
import AbSplitTab from './AbSplitTab';
import type { AbTestData } from './AbSplitTab';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface MetricPair {
  count: number;
  rate: number;
}

interface ReportData {
  success: boolean;
  campaign: {
    id: string;
    name: string;
    subject: string;
    startedAt: string | null;
    sentCount: number;
    isAbTest?: boolean;
  };
  metrics: {
    totalSent: number;
    opens: MetricPair;
    clicks: MetricPair;
    ctor: { rate: number };
    unsubscribes: MetricPair;
    complaints: MetricPair;
    hardBounces: MetricPair;
    softBounces: MetricPair;
  };
  timeline: Array<{ hour: string; opens: number; clicks: number }>;
  abTest?: AbTestData | null;
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function formatSentDate(dateStr: string | null): string {
  if (!dateStr) return 'לא נשלח';
  return new Date(dateStr).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

function ProgressBar({
  label,
  count,
  rate,
  color,
}: {
  label: string;
  count?: number;
  rate: number;
  color: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#303150]">{label}</span>
        <span className="text-sm text-[#7E7F90]">
          {count !== undefined && (
            <span className="font-semibold text-[#303150] me-1">
              {count.toLocaleString()}
            </span>
          )}
          ({rate.toFixed(1)}%)
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${Math.min(rate, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

function MetricCell({
  label,
  count,
  rate,
}: {
  label: string;
  count: number;
  rate: number;
}) {
  return (
    <div>
      <p className="text-xs text-[#7E7F90] mb-1">{label}</p>
      <p className="text-lg font-semibold text-[#303150]">
        {count.toLocaleString()}
      </p>
      <p className="text-xs text-[#BDBDCB]">{rate.toFixed(2)}%</p>
    </div>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function ChartTooltipContent({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="bg-white rounded-xl px-4 py-3 shadow-lg border border-[#E8E8ED] text-sm"
      dir="rtl"
    >
      <p className="font-medium text-[#303150] mb-1">שעה {label}</p>
      {payload.map((entry) => (
        <p
          key={entry.name}
          style={{ color: entry.color }}
          className="text-xs"
        >
          {entry.name === 'opens' ? 'פתיחות' : 'הקלקות'}:{' '}
          <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

type TabId = 'overview' | 'subscribers' | 'links' | 'ab-split';

const BASE_TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'סקירה כללית' },
  { id: 'subscribers', label: 'פעילות מנויים' },
  { id: 'links', label: 'פעילות קישורים' },
];

function getTabs(isAbTest?: boolean): Array<{ id: TabId; label: string }> {
  if (!isAbTest) return BASE_TABS;
  const tabs = [...BASE_TABS];
  tabs.splice(1, 0, { id: 'ab-split', label: 'תוצאות A/B' });
  return tabs;
}

// ────────────────────────────────────────────────────────────
// Skeleton
// ────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6 max-w-4xl mx-auto">
      <div className="h-8 w-64 bg-gray-200 rounded-lg" />
      <div className="h-4 w-48 bg-gray-200 rounded" />
      <div className="flex gap-4 border-b border-gray-200 pb-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 w-20 bg-gray-200 rounded" />
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="h-12 w-24 bg-gray-200 rounded-lg" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-16 bg-gray-200 rounded" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </div>
            <div className="h-2 bg-gray-100 rounded-full" />
          </div>
        ))}
        <div className="border-t border-gray-200 pt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 bg-gray-200 rounded" />
              <div className="h-6 w-10 bg-gray-200 rounded" />
              <div className="h-3 w-12 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="h-5 w-64 bg-gray-200 rounded mb-4" />
        <div className="h-[280px] bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────

export default function CampaignReportDashboard({
  campaignId,
}: {
  campaignId: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  useEffect(() => {
    async function fetchReport() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiFetch(
          `/api/admin/marketing/campaigns/${campaignId}/report`,
        );
        if (!res.ok) {
          if (res.status === 404) throw new Error('קמפיין לא נמצא');
          throw new Error('שגיאה בטעינת הדוח');
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'שגיאה בטעינת הדוח',
        );
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [campaignId]);

  if (loading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-200">
          <AlertCircle className="w-12 h-12 text-[#F18AB5] mx-auto mb-4" />
          <p className="text-[#303150] font-semibold mb-2">שגיאה</p>
          <p className="text-[#7E7F90] mb-6">{error || 'לא ניתן לטעון את הדוח'}</p>
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

  const { campaign, metrics, timeline } = data;
  const hasTimeline = timeline.some((t) => t.opens > 0 || t.clicks > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div>
        <button
          onClick={() =>
            router.push(`/admin/marketing/campaigns/${campaignId}`)
          }
          className="flex items-center gap-1.5 text-sm text-[#7E7F90] hover:text-[#303150] transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          חזרה לקמפיין
        </button>

        <h1 className="text-2xl lg:text-3xl font-bold text-[#303150] mb-1.5">
          {campaign.name}
        </h1>

        <div className="flex items-center gap-1.5 text-sm text-[#7E7F90]">
          <Clock className="w-4 h-4" />
          <span>נשלח ב-{formatSentDate(campaign.startedAt)}</span>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto pb-0">
        {getTabs(data.campaign.isAbTest).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-[#303150] font-semibold border-b-2 border-emerald-500'
                : 'text-[#7E7F90] hover:text-[#303150]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ─────────────────────────────────── */}

      {activeTab === 'overview' && (
        <>
          {/* Main Stats Card */}
          <div className="bg-white border border-[#E8E8ED] rounded-xl p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-sm text-[#7E7F90] mb-1">סה"כ נשלחו</p>
              <p className="text-4xl font-semibold text-[#303150]">
                {metrics.totalSent.toLocaleString()}
              </p>
            </div>

            <div className="space-y-5">
              <ProgressBar
                label="נפתחו"
                count={metrics.opens.count}
                rate={metrics.opens.rate}
                color="#00C875"
              />
              <ProgressBar
                label="הקליקו"
                count={metrics.clicks.count}
                rate={metrics.clicks.rate}
                color="#69ADFF"
              />
              <ProgressBar
                label="שיעור הקלקה מתוך פתיחה (CTOR)"
                rate={metrics.ctor.rate}
                color="#8B5CF6"
              />
            </div>

            <div className="border-t border-[#E8E8ED] pt-6 mt-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCell
                label="הסירו מנוי"
                count={metrics.unsubscribes.count}
                rate={metrics.unsubscribes.rate}
              />
              <MetricCell
                label="תלונות ספאם"
                count={metrics.complaints.count}
                rate={metrics.complaints.rate}
              />
              <MetricCell
                label="דחייה קשה (Hard)"
                count={metrics.hardBounces.count}
                rate={metrics.hardBounces.rate}
              />
              <MetricCell
                label="דחייה רכה (Soft)"
                count={metrics.softBounces.count}
                rate={metrics.softBounces.rate}
              />
            </div>
          </div>

          {/* Timeline Chart Card */}
          <div className="bg-white border border-[#E8E8ED] rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#303150] mb-5">
              פתיחות והקלקות ב-24 השעות הראשונות
            </h3>

            {hasTimeline ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeline}>
                  <defs>
                    <linearGradient id="gOpens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00C875" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#00C875" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#69ADFF" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#69ADFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E8E8ED"
                  />
                  <XAxis
                    dataKey="hour"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#7E7F90' }}
                    tickFormatter={(h: string) => `${h}h`}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#7E7F90' }}
                    width={35}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="opens"
                    stroke="#00C875"
                    strokeWidth={2}
                    fill="url(#gOpens)"
                    name="opens"
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#69ADFF"
                    strokeWidth={2}
                    fill="url(#gClicks)"
                    name="clicks"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px]">
                <p className="text-sm text-[#7E7F90]">
                  אין מספיק נתונים להצגת תרשים
                </p>
              </div>
            )}

            {hasTimeline && (
              <div className="flex items-center justify-center gap-6 mt-4 text-xs text-[#7E7F90]">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#00C875]" />
                  פתיחות
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#69ADFF]" />
                  הקלקות
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'ab-split' && data.abTest && (
        <AbSplitTab data={data.abTest} />
      )}

      {activeTab === 'subscribers' && (
        <div className="bg-white border border-[#E8E8ED] rounded-xl overflow-hidden shadow-sm">
          <SubscriberActivityTable campaignId={campaignId} />
        </div>
      )}

      {activeTab === 'links' && (
        <div className="bg-white border border-[#E8E8ED] rounded-xl overflow-hidden shadow-sm">
          <LinkActivityTable campaignId={campaignId} />
        </div>
      )}
    </div>
  );
}
