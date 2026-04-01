'use client';

import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap, Mail, Clock, GitBranch, RefreshCw } from 'lucide-react';
import { WORKFLOW_SENDER_PROFILES } from '@/lib/marketing/workflowSenderProfiles';
import { useWorkflowContext } from '../WorkflowContext';
import { apiFetch } from '@/lib/utils';

/* ──────────────────────────────────────────────
   Shared wrapper
   ────────────────────────────────────────────── */

function NodeShell({
  children,
  accentColor,
  selected,
}: {
  children: React.ReactNode;
  accentColor: string;
  selected?: boolean;
}) {
  return (
    <div
      className={`
        min-w-[200px] bg-white rounded-xl px-4 py-3
        border transition-shadow
        ${selected ? 'border-[#69ADFF] shadow-md ring-2 ring-[#69ADFF]/20' : 'border-gray-200 shadow-sm hover:shadow-md'}
      `}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
        style={{ backgroundColor: accentColor }}
      />
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────
   TRIGGER NODE
   ────────────────────────────────────────────── */

const TRIGGER_TYPE_LABELS: Record<string, string> = {
  MANUAL: 'ידני',
  USER_REGISTERED: 'הרשמה',
  ADDED_TO_GROUP: 'הוספה לקבוצה',
};

const SEGMENT_TYPE_LABELS: Record<string, string> = {
  all: 'כל המשתמשים',
  freeOnly: 'משתמשים חינמיים',
  inactiveDays: 'לא פעילים',
  hasProfile: 'עם פרופיל',
  noTransactionsThisMonth: 'ללא תנועות החודש',
  haredi: 'חרדים',
  manual: 'נבחרו ידנית',
  csv: 'מרשימת CSV',
  group: 'קבוצה',
};

function TriggerNodeComponent({
  data,
  selected,
}: {
  data: {
    triggerType?: string;
    segmentFilter?: { type: string };
    timing?: string;
    scheduledAt?: string;
  };
  selected?: boolean;
}) {
  const triggerLabel = TRIGGER_TYPE_LABELS[data.triggerType || ''] || 'ידני';
  const segmentLabel =
    data.triggerType === 'USER_REGISTERED'
      ? 'כל הנרשמים החדשים'
      : SEGMENT_TYPE_LABELS[data.segmentFilter?.type || ''] || 'כל המשתמשים';
  const timingLabel =
    data.timing === 'scheduled' && data.scheduledAt
      ? `מתוזמן: ${new Date(data.scheduledAt).toLocaleDateString('he-IL')}`
      : 'מיידי';

  return (
    <NodeShell accentColor="#E9A800" selected={selected}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
          <Zap className="w-4 h-4 text-amber-500" />
        </div>
        <span className="text-sm font-semibold text-[#303150]">טריגר</span>
      </div>
      <div className="space-y-0.5 ps-9">
        <p className="text-xs text-[#7E7F90] truncate">{triggerLabel}</p>
        <p className="text-xs text-[#7E7F90] truncate">{segmentLabel}</p>
        <p className="text-xs text-[#7E7F90] truncate">{timingLabel}</p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[#69ADFF] !border-2 !border-white !-bottom-1.5" />
    </NodeShell>
  );
}

/* ──────────────────────────────────────────────
   EMAIL NODE
   ────────────────────────────────────────────── */

function EmailNodeComponent({ data, selected }: { data: { subject: string; htmlContent: string; senderProfileId?: string }; selected?: boolean }) {
  const senderLabel = WORKFLOW_SENDER_PROFILES.find((p) => p.id === data.senderProfileId)?.labelHe
    ?? WORKFLOW_SENDER_PROFILES[0].labelHe;

  return (
    <NodeShell accentColor="#69ADFF" selected={selected}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[#69ADFF] !border-2 !border-white !-top-1.5" />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
          <Mail className="w-4 h-4 text-[#69ADFF]" />
        </div>
        <span className="text-sm font-semibold text-[#303150]">אימייל</span>
      </div>
      <div className="space-y-0.5 ps-9">
        <p className="text-xs text-[#7E7F90] truncate max-w-[180px]">
          {data.subject || 'ללא נושא'}
        </p>
        <p className="text-[10px] text-[#BDBDCB] truncate max-w-[180px]">
          מאת {senderLabel}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[#69ADFF] !border-2 !border-white !-bottom-1.5" />
    </NodeShell>
  );
}

/* ──────────────────────────────────────────────
   DELAY NODE
   ────────────────────────────────────────────── */

function DelayNodeComponent({ data, selected }: { data: { amount: number; unit: string }; selected?: boolean }) {
  const unitLabel = data.unit === 'HOURS' ? 'שעות' : 'ימים';
  return (
    <NodeShell accentColor="#0DBACC" selected={selected}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[#69ADFF] !border-2 !border-white !-top-1.5" />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
          <Clock className="w-4 h-4 text-[#0DBACC]" />
        </div>
        <span className="text-sm font-semibold text-[#303150]">עיכוב</span>
      </div>
      <p className="text-xs text-[#7E7F90] ps-9">
        {data.amount} {unitLabel}
      </p>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[#69ADFF] !border-2 !border-white !-bottom-1.5" />
    </NodeShell>
  );
}

/* ──────────────────────────────────────────────
   CONDITION NODE
   ────────────────────────────────────────────── */

function ConditionNodeComponent({
  data,
  id,
  selected,
}: {
  data: { conditionType: string; targetEmailNodeId?: string; waitHours?: number };
  id: string;
  selected?: boolean;
}) {
  const label =
    data.conditionType === 'OPENED_EMAIL' ? 'פתח אימייל?' : 'לחץ על קישור?';
  const waitHours = data.waitHours ?? 72;
  const ctx = useWorkflowContext();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleReevaluate(e: React.MouseEvent) {
    e.stopPropagation();
    if (!ctx) return;
    setRunning(true);
    setResult(null);
    try {
      const res = await apiFetch(
        `/api/admin/marketing/workflows/${ctx.workflowId}/reevaluate`,
        {
          method: 'POST',
          body: JSON.stringify({ nodeId: id }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'שגיאה');
      setResult(json.message);
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setRunning(false);
      setTimeout(() => setResult(null), 4000);
    }
  }

  return (
    <NodeShell accentColor="#F18AB5" selected={selected}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[#69ADFF] !border-2 !border-white !-top-1.5" />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
          <GitBranch className="w-4 h-4 text-[#F18AB5]" />
        </div>
        <span className="text-sm font-semibold text-[#303150]">תנאי</span>
        {ctx && (
          <button
            onClick={handleReevaluate}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={running}
            className="nodrag nopan ms-auto p-1 rounded-lg hover:bg-pink-50 text-[#7E7F90] hover:text-[#F18AB5] transition-colors disabled:opacity-50 cursor-pointer"
            title="בדוק וחלק עכשיו"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
      <p className="text-xs text-[#7E7F90] ps-9">{label}</p>
      <p className="text-[10px] text-[#BDBDCB] ps-9">המתנה: {waitHours} שעות</p>
      {result && (
        <p className="text-[10px] text-[#F18AB5] ps-9 mt-1 leading-tight">{result}</p>
      )}

      {/* Two source handles with labels */}
      <div className="flex justify-between mt-3 px-2 text-[10px] font-medium">
        <span className="text-emerald-500">כן ✓</span>
        <span className="text-rose-400">לא ✗</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white !-bottom-1.5"
        style={{ left: '25%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!w-3 !h-3 !bg-rose-400 !border-2 !border-white !-bottom-1.5"
        style={{ left: '75%' }}
      />
    </NodeShell>
  );
}

export const TriggerNode = memo(TriggerNodeComponent);
export const EmailNode = memo(EmailNodeComponent);
export const DelayNode = memo(DelayNodeComponent);
export const ConditionNode = memo(ConditionNodeComponent);
