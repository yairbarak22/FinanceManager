'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Mail, Clock, GitBranch, Save, X, Play, Pause, Users } from 'lucide-react';
import { createPortal } from 'react-dom';
import { apiFetch } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/Toast';
import SegmentSelector from '@/components/admin/SegmentSelector';
import UserSelector from '@/components/admin/UserSelector';
import type { SegmentFilter } from '@/lib/marketing/segment';
import {
  TriggerNode,
  EmailNode,
  DelayNode,
  ConditionNode,
} from './nodes/CustomNodes';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED';

interface WorkflowBuilderProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  workflowId: string;
  initialStatus?: WorkflowStatus;
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export default function WorkflowBuilder({
  initialNodes,
  initialEdges,
  workflowId,
  initialStatus = 'DRAFT',
}: WorkflowBuilderProps) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<WorkflowStatus>(initialStatus);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const { toasts, removeToast, success, error: showError } = useToast();

  const nodeTypes = useMemo(
    () => ({
      TRIGGER: TriggerNode,
      EMAIL: EmailNode,
      DELAY: DelayNode,
      CONDITION: ConditionNode,
    }),
    [],
  );

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  // ── React Flow handlers ─────────────────────────────────

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge({ ...connection, id: `edge-${Date.now()}` }, eds),
      ),
    [],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // ── Add node helpers ────────────────────────────────────

  function nextPos(): { x: number; y: number } {
    const maxY = nodes.reduce((m, n) => Math.max(m, n.position.y), 0);
    return { x: 250, y: maxY + 120 };
  }

  const addEmailNode = useCallback(() => {
    const pos = nextPos();
    const id = `email-${Date.now()}`;
    setNodes((prev) => [
      ...prev,
      {
        id,
        type: 'EMAIL',
        position: pos,
        data: { subject: '', htmlContent: '' },
      },
    ]);
    setSelectedNodeId(id);
  }, [nodes]);

  const addDelayNode = useCallback(() => {
    const pos = nextPos();
    const id = `delay-${Date.now()}`;
    setNodes((prev) => [
      ...prev,
      {
        id,
        type: 'DELAY',
        position: pos,
        data: { amount: 1, unit: 'DAYS' },
      },
    ]);
    setSelectedNodeId(id);
  }, [nodes]);

  const addConditionNode = useCallback(() => {
    const pos = nextPos();
    const id = `condition-${Date.now()}`;
    setNodes((prev) => [
      ...prev,
      {
        id,
        type: 'CONDITION',
        position: pos,
        data: { conditionType: 'OPENED_EMAIL' },
      },
    ]);
    setSelectedNodeId(id);
  }, [nodes]);

  // ── Update node data ───────────────────────────────────

  const updateNodeData = useCallback(
    (nodeId: string, updates: Record<string, unknown>) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n,
        ),
      );
    },
    [],
  );

  // ── Save ───────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await apiFetch(
        `/api/admin/marketing/workflows/${workflowId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ nodes, edges }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || 'שגיאה בשמירה');
        return;
      }
      success('תהליך העבודה נשמר בהצלחה');
    } catch {
      showError('שגיאה בשמירת תהליך העבודה');
    } finally {
      setSaving(false);
    }
  }, [nodes, edges, workflowId, success, showError]);

  // ── Status toggle ──────────────────────────────────────

  const handleToggleStatus = useCallback(async () => {
    const newStatus: WorkflowStatus = status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setTogglingStatus(true);
    try {
      const res = await apiFetch(
        `/api/admin/marketing/workflows/${workflowId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: newStatus }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || 'שגיאה בשינוי סטטוס');
        return;
      }
      setStatus(newStatus);
      success(newStatus === 'ACTIVE' ? 'התהליך הופעל' : 'התהליך הושהה');
    } catch {
      showError('שגיאה בשינוי סטטוס');
    } finally {
      setTogglingStatus(false);
    }
  }, [status, workflowId, success, showError]);

  // ── Enroll users ──────────────────────────────────────

  const handleEnroll = useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) {
      showError('יש לבחור לפחות משתמש אחד');
      return;
    }
    try {
      const res = await apiFetch(
        `/api/admin/marketing/workflows/${workflowId}/enroll`,
        {
          method: 'POST',
          body: JSON.stringify({ userIds }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || 'שגיאה ברישום משתמשים');
        return;
      }
      success(`${data.enrolled} משתמשים נרשמו בהצלחה${data.skipped ? ` (${data.skipped} דולגו)` : ''}`);
      setShowEnrollModal(false);
    } catch {
      showError('שגיאה ברישום משתמשים');
    }
  }, [workflowId, success, showError]);

  // ── Email nodes list (for condition target picker) ─────

  const emailNodes = useMemo(
    () => nodes.filter((n) => n.type === 'EMAIL'),
    [nodes],
  );

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-120px)] rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
      {/* ── Left sidebar: add-node toolbar ──────────── */}
      <div className="w-56 flex-shrink-0 border-e border-gray-200 bg-[#FAFAFA] p-4 flex flex-col gap-3">
        <p className="text-xs font-bold text-[#303150] mb-1">הוסף צעד</p>

        <button
          type="button"
          onClick={addEmailNode}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#303150] hover:shadow-md hover:border-[#69ADFF]/40 transition-all"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4 text-[#69ADFF]" />
          </div>
          אימייל
        </button>

        <button
          type="button"
          onClick={addDelayNode}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#303150] hover:shadow-md hover:border-[#0DBACC]/40 transition-all"
        >
          <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-[#0DBACC]" />
          </div>
          עיכוב
        </button>

        <button
          type="button"
          onClick={addConditionNode}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#303150] hover:shadow-md hover:border-[#F18AB5]/40 transition-all"
        >
          <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
            <GitBranch className="w-4 h-4 text-[#F18AB5]" />
          </div>
          תנאי
        </button>

        <div className="flex-1" />

        {/* Status badge */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
            status === 'ACTIVE'
              ? 'bg-emerald-50 text-emerald-700'
              : status === 'PAUSED'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-gray-100 text-gray-600'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              status === 'ACTIVE' ? 'bg-emerald-500' : status === 'PAUSED' ? 'bg-amber-500' : 'bg-gray-400'
            }`} />
            {status === 'ACTIVE' ? 'פעיל' : status === 'PAUSED' ? 'מושהה' : 'טיוטה'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-[#69ADFF] text-white text-sm font-medium hover:bg-[#5A9EE6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
        >
          <Save className="w-4 h-4" />
          {saving ? 'שומר...' : 'שמור'}
        </button>

        {/* Activate / Pause */}
        <button
          type="button"
          onClick={handleToggleStatus}
          disabled={togglingStatus}
          className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
            status === 'ACTIVE'
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}
        >
          {status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {togglingStatus
            ? 'מעדכן...'
            : status === 'ACTIVE' ? 'השהה' : 'הפעל'}
        </button>

        {/* Enroll users (only when active) */}
        {status === 'ACTIVE' && (
          <button
            type="button"
            onClick={() => setShowEnrollModal(true)}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-[#69ADFF] text-[#69ADFF] text-sm font-medium hover:bg-[#69ADFF]/5 transition-colors"
          >
            <Users className="w-4 h-4" />
            רשום משתמשים
          </button>
        )}
      </div>

      {/* ── Center: React Flow canvas ──────────────── */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
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

      {/* ── Right sidebar: properties panel ────────── */}
      {selectedNode && (
        <div className="w-80 flex-shrink-0 border-s border-gray-200 bg-white p-5 overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-[#303150]">מאפיינים</h3>
            <button
              type="button"
              onClick={() => setSelectedNodeId(null)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-[#7E7F90]" />
            </button>
          </div>

          {/* ── TRIGGER properties ─── */}
          {selectedNode.type === 'TRIGGER' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#7E7F90] mb-1.5">
                  סוג טריגר
                </label>
                <select
                  value={(selectedNode.data as Record<string, unknown>).triggerType as string ?? 'MANUAL'}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, { triggerType: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#303150] focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/30 focus:border-[#69ADFF] bg-white"
                >
                  <option value="MANUAL">ידני</option>
                  <option value="USER_REGISTERED">הרשמה</option>
                  <option value="ADDED_TO_GROUP">הוספה לקבוצה</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#7E7F90] mb-1.5">
                  קהל יעד
                </label>
                <SegmentSelector
                  value={((selectedNode.data as Record<string, unknown>).segmentFilter as SegmentFilter) || { type: 'all' }}
                  onChange={(filter) =>
                    updateNodeData(selectedNode.id, { segmentFilter: filter })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#7E7F90] mb-1.5">
                  תזמון
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`timing-${selectedNode.id}`}
                      value="immediate"
                      checked={((selectedNode.data as Record<string, unknown>).timing as string ?? 'immediate') === 'immediate'}
                      onChange={() =>
                        updateNodeData(selectedNode.id, { timing: 'immediate', scheduledAt: undefined })
                      }
                      className="w-4 h-4 accent-[#69ADFF]"
                    />
                    <span className="text-sm text-[#303150]">מיידי</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`timing-${selectedNode.id}`}
                      value="scheduled"
                      checked={((selectedNode.data as Record<string, unknown>).timing as string ?? 'immediate') === 'scheduled'}
                      onChange={() =>
                        updateNodeData(selectedNode.id, { timing: 'scheduled' })
                      }
                      className="w-4 h-4 accent-[#69ADFF]"
                    />
                    <span className="text-sm text-[#303150]">תזמון מראש</span>
                  </label>
                </div>
                {((selectedNode.data as Record<string, unknown>).timing as string) === 'scheduled' && (
                  <input
                    type="datetime-local"
                    value={
                      (selectedNode.data as Record<string, unknown>).scheduledAt
                        ? new Date((selectedNode.data as Record<string, unknown>).scheduledAt as string)
                            .toISOString()
                            .slice(0, 16)
                        : ''
                    }
                    onChange={(e) =>
                      updateNodeData(selectedNode.id, {
                        scheduledAt: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : undefined,
                      })
                    }
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#303150] focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/30 focus:border-[#69ADFF]"
                  />
                )}
              </div>
            </div>
          )}

          {/* ── EMAIL properties ─── */}
          {selectedNode.type === 'EMAIL' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#7E7F90] mb-1.5">
                  נושא
                </label>
                <input
                  type="text"
                  value={(selectedNode.data as Record<string, unknown>).subject as string ?? ''}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, { subject: e.target.value })
                  }
                  placeholder="הכנס נושא..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#303150] placeholder:text-[#BDBDCB] focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/30 focus:border-[#69ADFF]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#7E7F90] mb-1.5">
                  תוכן HTML
                </label>
                <textarea
                  value={(selectedNode.data as Record<string, unknown>).htmlContent as string ?? ''}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, {
                      htmlContent: e.target.value,
                    })
                  }
                  placeholder="הכנס תוכן אימייל..."
                  rows={8}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#303150] placeholder:text-[#BDBDCB] focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/30 focus:border-[#69ADFF] resize-none"
                />
              </div>
            </div>
          )}

          {/* ── DELAY properties ─── */}
          {selectedNode.type === 'DELAY' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#7E7F90] mb-1.5">
                  כמות
                </label>
                <input
                  type="number"
                  min={1}
                  value={(selectedNode.data as Record<string, unknown>).amount as number ?? 1}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, {
                      amount: Math.max(1, parseInt(e.target.value) || 1),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#303150] focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/30 focus:border-[#69ADFF]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#7E7F90] mb-1.5">
                  יחידה
                </label>
                <select
                  value={(selectedNode.data as Record<string, unknown>).unit as string ?? 'DAYS'}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, { unit: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#303150] focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/30 focus:border-[#69ADFF] bg-white"
                >
                  <option value="HOURS">שעות</option>
                  <option value="DAYS">ימים</option>
                </select>
              </div>
            </div>
          )}

          {/* ── CONDITION properties ─── */}
          {selectedNode.type === 'CONDITION' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#7E7F90] mb-1.5">
                  סוג תנאי
                </label>
                <select
                  value={(selectedNode.data as Record<string, unknown>).conditionType as string ?? 'OPENED_EMAIL'}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, {
                      conditionType: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#303150] focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/30 focus:border-[#69ADFF] bg-white"
                >
                  <option value="OPENED_EMAIL">פתח אימייל</option>
                  <option value="CLICKED_LINK">לחץ על קישור</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#7E7F90] mb-1.5">
                  אימייל יעד (אופציונלי)
                </label>
                <select
                  value={(selectedNode.data as Record<string, unknown>).targetEmailNodeId as string ?? ''}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, {
                      targetEmailNodeId: e.target.value || undefined,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#303150] focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/30 focus:border-[#69ADFF] bg-white"
                >
                  <option value="">כל אימייל</option>
                  {emailNodes.map((en) => (
                    <option key={en.id} value={en.id}>
                      {(en.data as Record<string, unknown>).subject as string || `אימייל (${en.id})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Enrollment modal ─────────────────────── */}
      {showEnrollModal && createPortal(
        <EnrollModal
          onEnroll={handleEnroll}
          onClose={() => setShowEnrollModal(false)}
        />,
        document.body,
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Enrollment modal (inline — uses UserSelector)
// ────────────────────────────────────────────────────────────

function EnrollModal({
  onEnroll,
  onClose,
}: {
  onEnroll: (userIds: string[]) => void;
  onClose: () => void;
}) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onEnroll(selectedUserIds);
    setSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content max-w-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#303150]">רישום משתמשים לתהליך</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-[#7E7F90]" />
          </button>
        </div>

        <UserSelector
          selectedUserIds={selectedUserIds}
          onChange={setSelectedUserIds}
        />

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#F7F7F8]">
          <span className="text-sm text-[#7E7F90]">
            {selectedUserIds.length} משתמשים נבחרו
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-[#7E7F90] hover:bg-[#F7F7F8] transition-colors"
            >
              ביטול
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={selectedUserIds.length === 0 || submitting}
              className="px-4 py-2.5 rounded-xl bg-[#69ADFF] text-white text-sm font-medium hover:bg-[#5A9EE6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'רושם...' : 'רשום'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
