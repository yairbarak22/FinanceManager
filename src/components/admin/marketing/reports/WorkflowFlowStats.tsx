'use client';

import { useMemo, memo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Zap, Mail, Clock, GitBranch, Users, RefreshCw } from 'lucide-react';
import { useWorkflowContext } from '@/components/admin/workflows/WorkflowContext';
import { WorkflowContext } from '@/components/admin/workflows/WorkflowContext';
import { apiFetch } from '@/lib/utils';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface NodeMetrics {
  sent: number;
  opened: { count: number; rate: number };
  clicked: { count: number; rate: number };
  bounced: number;
  unsubscribed: number;
}

interface WorkflowFlowStatsProps {
  workflowId: string;
  nodes: Node[];
  edges: Edge[];
  nodeDistribution: Record<string, number>;
  perNode: Record<string, NodeMetrics>;
  totalEnrolled: number;
}

// ────────────────────────────────────────────────────────────
// Stat badge
// ────────────────────────────────────────────────────────────

function StatBadge({
  label,
  value,
  color = '#7E7F90',
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium"
      style={{ backgroundColor: `${color}12`, color }}
    >
      {label} {value}
    </span>
  );
}

// ────────────────────────────────────────────────────────────
// Node shell (read-only version)
// ────────────────────────────────────────────────────────────

function StatNodeShell({
  children,
  accentColor,
}: {
  children: React.ReactNode;
  accentColor: string;
}) {
  return (
    <div className="min-w-[220px] bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm relative" style={{ pointerEvents: 'all' }}>
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
        style={{ backgroundColor: accentColor }}
      />
      {children}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// TRIGGER node (stats)
// ────────────────────────────────────────────────────────────

function StatTriggerNodeComponent({ data }: { data: Record<string, unknown> }) {
  const totalEnrolled = (data._totalEnrolled as number) || 0;
  const waiting = (data._waiting as number) || 0;

  return (
    <StatNodeShell accentColor="#E9A800">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
          <Zap className="w-4 h-4 text-amber-500" />
        </div>
        <span className="text-sm font-semibold text-[#303150]">טריגר</span>
      </div>
      <div className="flex flex-wrap gap-1 ps-9">
        <StatBadge label="" value={`${totalEnrolled} נרשמו`} color="#E9A800" />
        {waiting > 0 && (
          <StatBadge label="" value={`${waiting} ממתינים`} color="#7E7F90" />
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[#69ADFF] !border-2 !border-white !-bottom-1.5" />
    </StatNodeShell>
  );
}

// ────────────────────────────────────────────────────────────
// EMAIL node (stats)
// ────────────────────────────────────────────────────────────

function StatEmailNodeComponent({ data }: { data: Record<string, unknown> }) {
  const subject = (data.subject as string) || 'ללא נושא';
  const metrics = data._metrics as NodeMetrics | undefined;
  const waiting = (data._waiting as number) || 0;

  return (
    <StatNodeShell accentColor="#69ADFF">
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[#69ADFF] !border-2 !border-white !-top-1.5" />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
          <Mail className="w-4 h-4 text-[#69ADFF]" />
        </div>
        <span className="text-sm font-semibold text-[#303150]">אימייל</span>
      </div>
      <p className="text-xs text-[#7E7F90] truncate ps-9 max-w-[200px] mb-1.5">
        {subject}
      </p>
      <div className="flex flex-wrap gap-1 ps-9">
        {metrics ? (
          <>
            <StatBadge label="" value={`${metrics.sent} נשלחו`} color="#69ADFF" />
            <StatBadge label="" value={`${metrics.opened.rate}% פתחו`} color="#00C875" />
            <StatBadge label="" value={`${metrics.clicked.rate}% הקליקו`} color="#8B5CF6" />
          </>
        ) : (
          <StatBadge label="" value="טרם נשלח" color="#BDBDCB" />
        )}
        {waiting > 0 && (
          <StatBadge label="" value={`${waiting} ממתינים`} color="#7E7F90" />
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[#69ADFF] !border-2 !border-white !-bottom-1.5" />
    </StatNodeShell>
  );
}

// ────────────────────────────────────────────────────────────
// DELAY node (stats)
// ────────────────────────────────────────────────────────────

function StatDelayNodeComponent({ data }: { data: Record<string, unknown> }) {
  const amount = (data.amount as number) || 0;
  const unit = (data.unit as string) || 'DAYS';
  const unitLabel = unit === 'HOURS' ? 'שעות' : 'ימים';
  const waiting = (data._waiting as number) || 0;

  return (
    <StatNodeShell accentColor="#0DBACC">
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[#69ADFF] !border-2 !border-white !-top-1.5" />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
          <Clock className="w-4 h-4 text-[#0DBACC]" />
        </div>
        <span className="text-sm font-semibold text-[#303150]">עיכוב</span>
      </div>
      <p className="text-xs text-[#7E7F90] ps-9 mb-1">
        {amount} {unitLabel}
      </p>
      {waiting > 0 && (
        <div className="ps-9">
          <StatBadge label="" value={`${waiting} ממתינים כאן`} color="#0DBACC" />
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[#69ADFF] !border-2 !border-white !-bottom-1.5" />
    </StatNodeShell>
  );
}

// ────────────────────────────────────────────────────────────
// CONDITION node (stats)
// ────────────────────────────────────────────────────────────

function StatConditionNodeComponent({ data, id }: { data: Record<string, unknown>; id: string }) {
  const conditionType = (data.conditionType as string) || 'OPENED_EMAIL';
  const label = conditionType === 'OPENED_EMAIL' ? 'פתח אימייל?' : 'לחץ על קישור?';
  const waiting = (data._waiting as number) || 0;
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
        { method: 'POST', body: JSON.stringify({ nodeId: id }) },
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
    <StatNodeShell accentColor="#F18AB5">
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
      <p className="text-xs text-[#7E7F90] ps-9 mb-1">{label}</p>
      {waiting > 0 && (
        <div className="ps-9">
          <StatBadge label="" value={`${waiting} ממתינים`} color="#F18AB5" />
        </div>
      )}
      {result && (
        <p className="text-[10px] text-[#F18AB5] ps-9 mt-1 leading-tight">{result}</p>
      )}
      <div className="flex justify-between mt-2 px-2 text-[10px] font-medium">
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
    </StatNodeShell>
  );
}

// ────────────────────────────────────────────────────────────
// Memoised exports
// ────────────────────────────────────────────────────────────

const StatTriggerNode = memo(StatTriggerNodeComponent);
const StatEmailNode = memo(StatEmailNodeComponent);
const StatDelayNode = memo(StatDelayNodeComponent);
const StatConditionNode = memo(StatConditionNodeComponent);

// ────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────

export default function WorkflowFlowStats({
  workflowId,
  nodes: rawNodes,
  edges,
  nodeDistribution,
  perNode,
  totalEnrolled,
}: WorkflowFlowStatsProps) {
  const contextValue = useMemo(() => ({ workflowId }), [workflowId]);
  const nodeTypes = useMemo(
    () => ({
      TRIGGER: StatTriggerNode,
      EMAIL: StatEmailNode,
      DELAY: StatDelayNode,
      CONDITION: StatConditionNode,
    }),
    [],
  );

  const annotatedNodes = useMemo(() => {
    return rawNodes.map((node) => ({
      ...node,
      draggable: false,
      connectable: false,
      selectable: false,
      data: {
        ...node.data,
        _waiting: nodeDistribution[node.id] || 0,
        _metrics: perNode[node.id] || undefined,
        _totalEnrolled: node.type === 'TRIGGER' ? totalEnrolled : undefined,
      },
    }));
  }, [rawNodes, nodeDistribution, perNode, totalEnrolled]);

  return (
    <WorkflowContext.Provider value={contextValue}>
    <div className="h-[500px] rounded-xl border border-[#E8E8ED] bg-[#FAFAFA] overflow-hidden">
      <ReactFlow
        nodes={annotatedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        fitView
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#BDBDCB', strokeWidth: 2 },
        }}
      >
        <Background color="#E8E8ED" gap={20} size={1} />
        <Controls
          showInteractive={false}
          className="!rounded-xl !border-gray-200 !shadow-sm"
        />
      </ReactFlow>
    </div>
    </WorkflowContext.Provider>
  );
}
