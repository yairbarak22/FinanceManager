'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  AlertCircle,
  Users,
  Play,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/utils';
import type { Node, Edge } from '@xyflow/react';
import WorkflowFlowStats from './WorkflowFlowStats';
import WorkflowEnrollmentTable from './WorkflowEnrollmentTable';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface MetricPair {
  count: number;
  rate: number;
}

interface NodeMetrics {
  sent: number;
  opened: MetricPair;
  clicked: MetricPair;
  bounced: number;
  unsubscribed: number;
}

interface ReportData {
  success: boolean;
  workflow: {
    id: string;
    name: string;
    status: string;
    nodes: Node[];
    edges: Edge[];
    createdAt: string;
  };
  enrollment: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
  };
  nodeDistribution: Record<string, number>;
  perNode: Record<string, NodeMetrics>;
  aggregate: {
    totalSent: number;
    opens: MetricPair;
    clicks: MetricPair;
    ctor: { rate: number };
    unsubscribes: MetricPair;
    bounces: MetricPair;
  };
}

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="bg-white border border-[#E8E8ED] rounded-xl p-4 shadow-sm relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ backgroundColor: color }}
      />
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}14` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-2xl font-bold text-[#303150]">
            {value.toLocaleString()}
          </p>
          <p className="text-xs text-[#7E7F90]">{label}</p>
        </div>
      </div>
    </div>
  );
}

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

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT: { label: 'טיוטה', bg: 'bg-gray-100', text: 'text-gray-600' },
  ACTIVE: { label: 'פעיל', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  PAUSED: { label: 'מושהה', bg: 'bg-amber-50', text: 'text-amber-700' },
};

type TabId = 'overview' | 'flow' | 'enrollments';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'סקירה כללית' },
  { id: 'flow', label: 'תהליך עם נתונים' },
  { id: 'enrollments', label: 'פעילות נרשמים' },
];

// ────────────────────────────────────────────────────────────
// Skeleton
// ────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6 max-w-5xl mx-auto">
      <div className="h-8 w-64 bg-gray-200 rounded-lg" />
      <div className="h-4 w-48 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
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
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────

export default function WorkflowReportDashboard({
  workflowId,
}: {
  workflowId: string;
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
          `/api/admin/marketing/workflows/${workflowId}/report`,
        );
        if (!res.ok) {
          if (res.status === 404) throw new Error('תהליך עבודה לא נמצא');
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
  }, [workflowId]);

  const nodeNames = useMemo(() => {
    if (!data) return {};
    const map: Record<string, string> = {};
    for (const node of data.workflow.nodes) {
      if (node.type === 'TRIGGER') map[node.id] = 'טריגר';
      else if (node.type === 'EMAIL')
        map[node.id] =
          (node.data as Record<string, unknown>).subject as string || 'אימייל';
      else if (node.type === 'DELAY') {
        const d = node.data as Record<string, unknown>;
        map[node.id] = `עיכוב ${d.amount} ${d.unit === 'HOURS' ? 'שעות' : 'ימים'}`;
      } else if (node.type === 'CONDITION')
        map[node.id] = 'תנאי';
    }
    return map;
  }, [data]);

  const emailNodeTable = useMemo(() => {
    if (!data) return [];
    return data.workflow.nodes
      .filter((n) => n.type === 'EMAIL')
      .map((n) => {
        const d = n.data as Record<string, unknown>;
        const metrics = data.perNode[n.id];
        return {
          id: n.id,
          subject: (d.subject as string) || 'ללא נושא',
          sent: metrics?.sent || 0,
          opened: metrics?.opened || { count: 0, rate: 0 },
          clicked: metrics?.clicked || { count: 0, rate: 0 },
          bounced: metrics?.bounced || 0,
          unsubscribed: metrics?.unsubscribed || 0,
        };
      });
  }, [data]);

  if (loading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-200">
          <AlertCircle className="w-12 h-12 text-[#F18AB5] mx-auto mb-4" />
          <p className="text-[#303150] font-semibold mb-2">שגיאה</p>
          <p className="text-[#7E7F90] mb-6">
            {error || 'לא ניתן לטעון את הדוח'}
          </p>
          <button
            onClick={() =>
              router.push('/admin/marketing/workflows')
            }
            className="px-5 py-2.5 bg-[#69ADFF] text-white rounded-xl hover:bg-[#5A9EE6] transition-colors"
          >
            חזור לתהליכי עבודה
          </button>
        </div>
      </div>
    );
  }

  const { workflow, enrollment, aggregate } = data;
  const statusCfg = STATUS_LABELS[workflow.status] || STATUS_LABELS.DRAFT;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div>
        <button
          onClick={() => router.push('/admin/marketing/workflows')}
          className="flex items-center gap-1.5 text-sm text-[#7E7F90] hover:text-[#303150] transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          חזרה לתהליכי עבודה
        </button>

        <div className="flex items-center gap-3">
          <h1 className="text-2xl lg:text-3xl font-bold text-[#303150]">
            {workflow.name}
          </h1>
          <span
            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}
          >
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* ── Summary cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="סה״כ נרשמו"
          value={enrollment.total}
          icon={Users}
          color="#69ADFF"
        />
        <SummaryCard
          label="פעילים"
          value={enrollment.active}
          icon={Play}
          color="#00C875"
        />
        <SummaryCard
          label="סיימו"
          value={enrollment.completed}
          icon={CheckCircle}
          color="#0DBACC"
        />
        <SummaryCard
          label="בוטלו"
          value={enrollment.cancelled}
          icon={XCircle}
          color="#F18AB5"
        />
      </div>

      {/* ── Tabs ────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto pb-0">
        {TABS.map((tab) => (
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
          {/* Aggregate stats card */}
          <div className="bg-white border border-[#E8E8ED] rounded-xl p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-sm text-[#7E7F90] mb-1">סה״כ מיילים שנשלחו</p>
              <p className="text-4xl font-semibold text-[#303150]">
                {aggregate.totalSent.toLocaleString()}
              </p>
            </div>

            <div className="space-y-5">
              <ProgressBar
                label="נפתחו"
                count={aggregate.opens.count}
                rate={aggregate.opens.rate}
                color="#00C875"
              />
              <ProgressBar
                label="הקליקו"
                count={aggregate.clicks.count}
                rate={aggregate.clicks.rate}
                color="#69ADFF"
              />
              <ProgressBar
                label="שיעור הקלקה מתוך פתיחה (CTOR)"
                rate={aggregate.ctor.rate}
                color="#8B5CF6"
              />
            </div>

            <div className="border-t border-[#E8E8ED] pt-6 mt-6 grid grid-cols-2 gap-6">
              <MetricCell
                label="הסירו מנוי"
                count={aggregate.unsubscribes.count}
                rate={aggregate.unsubscribes.rate}
              />
              <MetricCell
                label="נדחו"
                count={aggregate.bounces.count}
                rate={aggregate.bounces.rate}
              />
            </div>
          </div>
        </>
      )}

      {activeTab === 'flow' && (
        <>
          <WorkflowFlowStats
            nodes={workflow.nodes}
            edges={workflow.edges}
            nodeDistribution={data.nodeDistribution}
            perNode={data.perNode}
            totalEnrolled={enrollment.total}
          />

          {/* Per-email-node table */}
          {emailNodeTable.length > 0 && (
            <div className="bg-white border border-[#E8E8ED] rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E8E8ED]">
                <h3 className="text-sm font-bold text-[#303150]">
                  פירוט לפי צומת אימייל
                </h3>
              </div>
              <div className="overflow-x-auto">
                <div
                  className="grid text-xs font-semibold text-[#7E7F90] border-b border-[#E8E8ED] px-4 py-3"
                  style={{
                    gridTemplateColumns:
                      '2.5fr 1fr 1.5fr 1.5fr 1fr 1fr',
                  }}
                >
                  <span>נושא</span>
                  <span>נשלחו</span>
                  <span>נפתחו</span>
                  <span>הקליקו</span>
                  <span>נדחו</span>
                  <span>הסירו מנוי</span>
                </div>
                {emailNodeTable.map((row) => (
                  <div
                    key={row.id}
                    className="grid text-xs text-[#303150] border-b border-[#F7F7F8] px-4 py-2.5 hover:bg-[#FAFAFA] transition-colors items-center"
                    style={{
                      gridTemplateColumns:
                        '2.5fr 1fr 1.5fr 1.5fr 1fr 1fr',
                    }}
                  >
                    <span className="truncate font-medium">{row.subject}</span>
                    <span>{row.sent.toLocaleString()}</span>
                    <span>
                      {row.opened.count.toLocaleString()}{' '}
                      <span className="text-[#7E7F90]">
                        ({row.opened.rate.toFixed(1)}%)
                      </span>
                    </span>
                    <span>
                      {row.clicked.count.toLocaleString()}{' '}
                      <span className="text-[#7E7F90]">
                        ({row.clicked.rate.toFixed(1)}%)
                      </span>
                    </span>
                    <span>{row.bounced}</span>
                    <span>{row.unsubscribed}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'enrollments' && (
        <div className="bg-white border border-[#E8E8ED] rounded-xl overflow-hidden shadow-sm">
          <WorkflowEnrollmentTable
            workflowId={workflowId}
            nodeNames={nodeNames}
          />
        </div>
      )}
    </div>
  );
}
