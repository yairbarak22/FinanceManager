'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
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

import { Mail, Clock, GitBranch, Save, X, Play, Pause, Users, Monitor, Smartphone, Send, Maximize2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/Toast';
import EmailPreview from '@/components/admin/EmailPreview';
import SegmentSelector from '@/components/admin/SegmentSelector';
import UserSelector from '@/components/admin/UserSelector';
import type { SegmentFilter } from '@/lib/marketing/segment';
import {
  WORKFLOW_SENDER_PROFILES,
  DEFAULT_SENDER_PROFILE_ID,
} from '@/lib/marketing/workflowSenderProfiles';
import {
  TriggerNode,
  EmailNode,
  DelayNode,
  ConditionNode,
} from './nodes/CustomNodes';
import { WorkflowContext } from './WorkflowContext';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED';

interface WorkflowBuilderProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  workflowId: string;
  initialStatus?: WorkflowStatus;
  initialPromoteToActive?: boolean;
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export default function WorkflowBuilder({
  initialNodes,
  initialEdges,
  workflowId,
  initialStatus = 'DRAFT',
  initialPromoteToActive = false,
}: WorkflowBuilderProps) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<WorkflowStatus>(initialStatus);
  const [promoteToActive, setPromoteToActive] = useState(initialPromoteToActive);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [emailPreviewMode, setEmailPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [sendingTest, setSendingTest] = useState(false);
  const [emailHtmlEditorOpen, setEmailHtmlEditorOpen] = useState(false);
  const { data: session } = useSession();
  const { toasts, removeToast, success, error: showError } = useToast();

  useEffect(() => {
    setEmailHtmlEditorOpen(false);
  }, [selectedNodeId]);

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

  const selectedTriggerType = useMemo(() => {
    if (!selectedNode || selectedNode.type !== 'TRIGGER') return null;
    return (
      ((selectedNode.data as Record<string, unknown>).triggerType as string) ??
      'MANUAL'
    );
  }, [selectedNode]);

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
        data: { subject: '', htmlContent: '', senderProfileId: DEFAULT_SENDER_PROFILE_ID },
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
          body: JSON.stringify({ nodes, edges, promoteToActiveOnComplete: promoteToActive }),
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
  }, [nodes, edges, promoteToActive, workflowId, success, showError]);

  // ── Status toggle ──────────────────────────────────────

  const handleToggleStatus = useCallback(async () => {
    const newStatus: WorkflowStatus = status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setTogglingStatus(true);
    try {
      const res = await apiFetch(
        `/api/admin/marketing/workflows/${workflowId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            status: newStatus,
            nodes,
            edges,
            promoteToActiveOnComplete: promoteToActive,
          }),
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
  }, [status, workflowId, nodes, edges, promoteToActive, success, showError]);

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

  const contextValue = useMemo(() => ({ workflowId }), [workflowId]);

  return (
    <WorkflowContext.Provider value={contextValue}>
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

        {/* Promote to active on completion */}
        <label className="flex items-center gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={promoteToActive}
            onChange={(e) => setPromoteToActive(e.target.checked)}
            className="w-4 h-4 accent-[#69ADFF] rounded"
          />
          <span className="text-xs text-[#303150] leading-tight">
            בסיום — העבר לקבוצת &quot;פעילים&quot;
          </span>
        </label>

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
                  value={selectedTriggerType ?? 'MANUAL'}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === 'USER_REGISTERED') {
                      updateNodeData(selectedNode.id, {
                        triggerType: v,
                        segmentFilter: { type: 'all' },
                      });
                    } else {
                      updateNodeData(selectedNode.id, { triggerType: v });
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#303150] focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/30 focus:border-[#69ADFF] bg-white"
                >
                  <option value="MANUAL">ידני</option>
                  <option value="USER_REGISTERED">הרשמה</option>
                  <option value="ADDED_TO_GROUP">הוספה לקבוצה</option>
                </select>
              </div>

              {selectedTriggerType === 'USER_REGISTERED' ? (
                <div className="rounded-xl border border-gray-200 bg-[#FAFAFA] px-3 py-2.5">
                  <p className="text-xs font-medium text-[#303150] mb-1">קהל</p>
                  <p className="text-xs text-[#7E7F90] leading-relaxed">
                    התהליך יופעל אוטומטית לכל משתמש חדש שנרשם לאתר. אין צורך לבחור
                    קבוצה או סגמנט.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-[#7E7F90] mb-1.5">
                    קהל יעד
                  </label>
                  <SegmentSelector
                    value={
                      ((selectedNode.data as Record<string, unknown>)
                        .segmentFilter as SegmentFilter) || { type: 'all' }
                    }
                    onChange={(filter) =>
                      updateNodeData(selectedNode.id, { segmentFilter: filter })
                    }
                  />
                </div>
              )}

              {selectedTriggerType !== 'USER_REGISTERED' && (
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
              )}
            </div>
          )}

          {/* ── EMAIL properties ─── */}
          {selectedNode.type === 'EMAIL' && (() => {
            const emailData = selectedNode.data as Record<string, unknown>;
            const emailSubject = emailData.subject as string ?? '';
            const emailHtml = emailData.htmlContent as string ?? '';
            const emailSenderProfileId = (emailData.senderProfileId as string) || DEFAULT_SENDER_PROFILE_ID;
            return (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#7E7F90] mb-1.5">
                  שולח
                </label>
                <select
                  value={emailSenderProfileId}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, { senderProfileId: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#303150] focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/30 focus:border-[#69ADFF] bg-white"
                >
                  {WORKFLOW_SENDER_PROFILES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.labelHe}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#7E7F90] mb-1.5">
                  נושא
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, { subject: e.target.value })
                  }
                  placeholder="הכנס נושא..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#303150] placeholder:text-[#BDBDCB] focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/30 focus:border-[#69ADFF]"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[#7E7F90]">
                    תוכן HTML
                  </label>
                  <button
                    type="button"
                    onClick={() => setEmailHtmlEditorOpen(true)}
                    className="flex items-center gap-1 text-[11px] text-[#69ADFF] hover:text-[#5A9EE6] transition-colors"
                  >
                    <Maximize2 className="w-3 h-3" />
                    הרחב עריכה
                  </button>
                </div>
                <textarea
                  value={emailHtml}
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

              <p className="text-[11px] text-[#BDBDCB] leading-relaxed">
                ניתן לכתוב <code className="bg-gray-100 px-1 rounded text-[#7E7F90]">[שם המשתמש]</code> בנושא או ב-HTML — יוחלף אוטומטית בשם הנמען.
              </p>

              {/* Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[#7E7F90]">תצוגה מקדימה</label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEmailPreviewMode('desktop')}
                      className={`p-1 rounded-md transition-colors ${emailPreviewMode === 'desktop' ? 'bg-[#69ADFF]/10 text-[#69ADFF]' : 'text-[#BDBDCB] hover:text-[#7E7F90]'}`}
                      title="שולחן עבודה"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailPreviewMode('mobile')}
                      className={`p-1 rounded-md transition-colors ${emailPreviewMode === 'mobile' ? 'bg-[#69ADFF]/10 text-[#69ADFF]' : 'text-[#BDBDCB] hover:text-[#7E7F90]'}`}
                      title="מובייל"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {emailHtml ? (
                  <EmailPreview
                    htmlContent={emailHtml}
                    previewMode={emailPreviewMode}
                    maxHeight="280px"
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-[#FAFAFA] px-3 py-6 text-center">
                    <p className="text-xs text-[#BDBDCB]">הזן HTML כדי לראות תצוגה מקדימה</p>
                  </div>
                )}
              </div>

              {/* Test email */}
              <button
                type="button"
                disabled={sendingTest || !emailSubject || !emailHtml}
                onClick={async () => {
                  const to = session?.user?.email;
                  if (!to) {
                    showError('לא נמצאה כתובת אימייל למשתמש המחובר');
                    return;
                  }
                  setSendingTest(true);
                  try {
                    const res = await apiFetch('/api/admin/marketing/test-email', {
                      method: 'POST',
                      body: JSON.stringify({
                        to,
                        subject: emailSubject.replace(/\[שם המשתמש\]/g, session?.user?.name || 'משתמש'),
                        html: emailHtml.replace(/\[שם המשתמש\]/g, session?.user?.name || 'משתמש'),
                        senderProfileId: emailSenderProfileId,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      showError(data.error || 'שגיאה בשליחת מייל בדיקה');
                    } else {
                      success(`מייל בדיקה נשלח ל-${to}`);
                    }
                  } catch {
                    showError('שגיאה בשליחת מייל בדיקה');
                  } finally {
                    setSendingTest(false);
                  }
                }}
                className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl border border-[#69ADFF] text-[#69ADFF] text-xs font-medium hover:bg-[#69ADFF]/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                {sendingTest ? 'שולח...' : 'שלח מייל בדיקה'}
              </button>
            </div>
            );
          })()}

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
              <div>
                <label className="block text-xs font-medium text-[#7E7F90] mb-1.5">
                  זמן המתנה לפני ניתוב ל&quot;לא&quot; (שעות)
                </label>
                <input
                  type="number"
                  min={1}
                  max={720}
                  value={(selectedNode.data as Record<string, unknown>).waitHours as number ?? 72}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, {
                      waitHours: Math.max(1, Math.min(720, parseInt(e.target.value) || 72)),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#303150] focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/30 focus:border-[#69ADFF] bg-white"
                />
                <p className="text-[10px] text-[#BDBDCB] mt-1">
                  כמה שעות לחכות שהמשתמש יפתח/ילחץ לפני שמנתבים לצד ה&quot;לא&quot;. בדיקה כל שעה.
                </p>
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

      {/* ── Expanded HTML editor modal ────────────── */}
      {emailHtmlEditorOpen && selectedNode?.type === 'EMAIL' && createPortal(
        <ExpandedHtmlEditorModal
          htmlContent={(selectedNode.data as Record<string, unknown>).htmlContent as string ?? ''}
          onChange={(value) => updateNodeData(selectedNode.id, { htmlContent: value })}
          previewMode={emailPreviewMode}
          onPreviewModeChange={setEmailPreviewMode}
          onClose={() => setEmailHtmlEditorOpen(false)}
        />,
        document.body,
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
    </WorkflowContext.Provider>
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

// ────────────────────────────────────────────────────────────
// Expanded HTML editor modal
// ────────────────────────────────────────────────────────────

function ExpandedHtmlEditorModal({
  htmlContent,
  onChange,
  previewMode,
  onPreviewModeChange,
  onClose,
}: {
  htmlContent: string;
  onChange: (value: string) => void;
  previewMode: 'desktop' | 'mobile';
  onPreviewModeChange: (mode: 'desktop' | 'mobile') => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="modal-content flex flex-col"
        style={{ maxWidth: 'min(1200px, 95vw)', maxHeight: '90vh', width: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-sm font-bold text-[#303150]">עריכת HTML ותצוגה מקדימה</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-[#7E7F90]" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0 overflow-hidden">
          {/* Editor */}
          <div className="flex flex-col min-h-0">
            <label className="text-xs font-medium text-[#7E7F90] mb-1.5 flex-shrink-0">
              תוכן HTML
            </label>
            <textarea
              value={htmlContent}
              onChange={(e) => onChange(e.target.value)}
              placeholder="הכנס תוכן אימייל..."
              className="flex-1 min-h-[200px] px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#303150] placeholder:text-[#BDBDCB] focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/30 focus:border-[#69ADFF] resize-y font-mono leading-relaxed"
            />
            <p className="text-[11px] text-[#BDBDCB] leading-relaxed mt-1.5 flex-shrink-0">
              ניתן לכתוב <code className="bg-gray-100 px-1 rounded text-[#7E7F90]">[שם המשתמש]</code> — יוחלף אוטומטית בשם הנמען.
            </p>
          </div>

          {/* Preview */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
              <label className="text-xs font-medium text-[#7E7F90]">תצוגה מקדימה</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onPreviewModeChange('desktop')}
                  className={`p-1 rounded-md transition-colors ${previewMode === 'desktop' ? 'bg-[#69ADFF]/10 text-[#69ADFF]' : 'text-[#BDBDCB] hover:text-[#7E7F90]'}`}
                  title="שולחן עבודה"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onPreviewModeChange('mobile')}
                  className={`p-1 rounded-md transition-colors ${previewMode === 'mobile' ? 'bg-[#69ADFF]/10 text-[#69ADFF]' : 'text-[#BDBDCB] hover:text-[#7E7F90]'}`}
                  title="מובייל"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-[#E8E8ED] bg-[#F7F7F8]">
              {htmlContent ? (
                <EmailPreview
                  htmlContent={htmlContent}
                  previewMode={previewMode}
                  maxHeight="720px"
                />
              ) : (
                <div className="flex items-center justify-center h-full min-h-[200px]">
                  <p className="text-xs text-[#BDBDCB]">הזן HTML כדי לראות תצוגה מקדימה</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
