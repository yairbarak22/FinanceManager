'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap, Mail, Clock, GitBranch } from 'lucide-react';

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
  const segmentLabel = SEGMENT_TYPE_LABELS[data.segmentFilter?.type || ''] || 'כל המשתמשים';
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

function EmailNodeComponent({ data, selected }: { data: { subject: string; htmlContent: string }; selected?: boolean }) {
  return (
    <NodeShell accentColor="#69ADFF" selected={selected}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[#69ADFF] !border-2 !border-white !-top-1.5" />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
          <Mail className="w-4 h-4 text-[#69ADFF]" />
        </div>
        <span className="text-sm font-semibold text-[#303150]">אימייל</span>
      </div>
      <p className="text-xs text-[#7E7F90] truncate ps-9 max-w-[180px]">
        {data.subject || 'ללא נושא'}
      </p>
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
  selected,
}: {
  data: { conditionType: string; targetEmailNodeId?: string };
  selected?: boolean;
}) {
  const label =
    data.conditionType === 'OPENED_EMAIL' ? 'פתח אימייל?' : 'לחץ על קישור?';

  return (
    <NodeShell accentColor="#F18AB5" selected={selected}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[#69ADFF] !border-2 !border-white !-top-1.5" />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
          <GitBranch className="w-4 h-4 text-[#F18AB5]" />
        </div>
        <span className="text-sm font-semibold text-[#303150]">תנאי</span>
      </div>
      <p className="text-xs text-[#7E7F90] ps-9">{label}</p>

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
