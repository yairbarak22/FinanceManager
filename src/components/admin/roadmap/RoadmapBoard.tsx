'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Table2,
  GanttChart,
  Check,
} from 'lucide-react';
import {
  getRoadmapData,
  createTask,
  updateTask,
  deleteTask as deleteTaskAction,
  createTaskGroup,
  updateTaskGroup,
} from '@/actions/admin-roadmap-actions';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/Toast';
import TaskGroup from './TaskGroup';
import AddGroupButton from './AddGroupButton';
import TimelineView from './TimelineView';
import type { RoadmapData, AdminTaskGroupWithTasks, AdminTaskStatus, AdminTaskPriority, AdminTaskWithChildren } from '@/types/admin-roadmap';
import { STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS, STATUS_SORT_ORDER, AdminTaskStatus as StatusEnum, AdminTaskPriority as PriorityEnum } from '@/types/admin-roadmap';

type SortField = 'title' | 'startDate' | 'priority' | null;
type SortDir = 'asc' | 'desc';

const PRIORITY_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export default function RoadmapBoard() {
  const [data, setData] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'table' | 'timeline'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<AdminTaskStatus | null>(null);
  const [filterPriority, setFilterPriority] = useState<AdminTaskPriority | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);

  const prevDataRef = useRef<RoadmapData | null>(null);
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const filterDropRef = useRef<HTMLDivElement>(null);
  const sortBtnRef = useRef<HTMLButtonElement>(null);
  const sortDropRef = useRef<HTMLDivElement>(null);

  const { toasts, removeToast, error: showError } = useToast();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    async function load() {
      try {
        const result = await getRoadmapData();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שגיאה בטעינת הנתונים');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!showFilterDropdown && !showSortDropdown) return;
    function handleClick(e: MouseEvent) {
      const t = e.target as Node;
      if (showFilterDropdown && filterBtnRef.current && !filterBtnRef.current.contains(t) && filterDropRef.current && !filterDropRef.current.contains(t)) {
        setShowFilterDropdown(false);
      }
      if (showSortDropdown && sortBtnRef.current && !sortBtnRef.current.contains(t) && sortDropRef.current && !sortDropRef.current.contains(t)) {
        setShowSortDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showFilterDropdown, showSortDropdown]);

  const rollback = useCallback((msg?: string) => {
    if (prevDataRef.current) {
      setData(prevDataRef.current);
      prevDataRef.current = null;
    }
    if (msg) showError(msg);
  }, [showError]);

  const saveSnapshot = useCallback(() => {
    if (data) {
      prevDataRef.current = JSON.parse(JSON.stringify(data));
    }
  }, [data]);

  // --- Filtered + sorted data ---
  const filteredData = useMemo<RoadmapData | null>(() => {
    if (!data) return null;
    const q = searchQuery.trim().toLowerCase();

    let groups = data.groups.map((group) => {
      let tasks = [...group.tasks];

      if (q) {
        tasks = tasks.filter((t) =>
          t.title.toLowerCase().includes(q) ||
          t.children?.some((c) => c.title.toLowerCase().includes(q))
        );
      }
      if (filterStatus) {
        tasks = tasks.filter((t) => t.status === filterStatus);
      }
      if (filterPriority) {
        tasks = tasks.filter((t) => t.priority === filterPriority);
      }

      if (sortBy) {
        tasks.sort((a, b) => {
          let cmp = 0;
          if (sortBy === 'title') {
            cmp = a.title.localeCompare(b.title, 'he');
          } else if (sortBy === 'startDate') {
            const aDate = a.startDate ? new Date(a.startDate).getTime() : Infinity;
            const bDate = b.startDate ? new Date(b.startDate).getTime() : Infinity;
            cmp = aDate - bDate;
          } else if (sortBy === 'priority') {
            cmp = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99);
          }
          return sortDir === 'desc' ? -cmp : cmp;
        });
      } else {
        tasks.sort((a, b) => {
          const statusCmp = (STATUS_SORT_ORDER[a.status] ?? 99) - (STATUS_SORT_ORDER[b.status] ?? 99);
          if (statusCmp !== 0) return statusCmp;
          return a.orderIndex - b.orderIndex;
        });
      }

      return { ...group, tasks };
    });

    if (q || filterStatus || filterPriority) {
      groups = groups.filter((g) =>
        g.tasks.length > 0 || g.title.toLowerCase().includes(q)
      );
    }

    return { groups };
  }, [data, searchQuery, filterStatus, filterPriority, sortBy, sortDir]);

  // --- Drag-and-drop ---
  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result;
      if (!destination || !data) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) return;

      saveSnapshot();

      const newGroups: AdminTaskGroupWithTasks[] = JSON.parse(JSON.stringify(data.groups));
      const srcGroup = newGroups.find((g) => g.id === source.droppableId);
      const destGroup = newGroups.find((g) => g.id === destination.droppableId);
      if (!srcGroup || !destGroup) return;

      const srcTasks = [...srcGroup.tasks].sort((a, b) => a.orderIndex - b.orderIndex);
      const [movedTask] = srcTasks.splice(source.index, 1);
      if (!movedTask) return;

      if (source.droppableId === destination.droppableId) {
        srcTasks.splice(destination.index, 0, movedTask);
        srcTasks.forEach((t, i) => { t.orderIndex = i; });
        srcGroup.tasks = srcTasks as AdminTaskWithChildren[];
      } else {
        srcTasks.forEach((t, i) => { t.orderIndex = i; });
        srcGroup.tasks = srcTasks as AdminTaskWithChildren[];
        const destTasks = [...destGroup.tasks].sort((a, b) => a.orderIndex - b.orderIndex);
        movedTask.groupId = destination.droppableId;
        destTasks.splice(destination.index, 0, movedTask);
        destTasks.forEach((t, i) => { t.orderIndex = i; });
        destGroup.tasks = destTasks as AdminTaskWithChildren[];
      }

      setData({ groups: newGroups });

      try {
        await updateTask(draggableId, {
          groupId: destination.droppableId,
          orderIndex: destination.index,
        });
      } catch {
        rollback('שגיאה בעדכון מיקום המשימה');
      }
    },
    [data, saveSnapshot, rollback],
  );

  // --- Task update ---
  const handleTaskUpdate = useCallback(
    async (taskId: string, updates: Record<string, unknown>) => {
      if (!data) return;

      saveSnapshot();

      const newGroups: AdminTaskGroupWithTasks[] = JSON.parse(JSON.stringify(data.groups));
      let found = false;
      for (const group of newGroups) {
        if (found) break;
        for (const task of group.tasks) {
          if (task.id === taskId) {
            Object.assign(task, updates);
            if (updates.endDate && typeof updates.endDate === 'string') task.endDate = new Date(updates.endDate);
            if (updates.startDate && typeof updates.startDate === 'string') task.startDate = new Date(updates.startDate);
            found = true;
            break;
          }
          const child = task.children?.find((c) => c.id === taskId);
          if (child) {
            Object.assign(child, updates);
            if (updates.endDate && typeof updates.endDate === 'string') child.endDate = new Date(updates.endDate);
            if (updates.startDate && typeof updates.startDate === 'string') child.startDate = new Date(updates.startDate);
            found = true;
            break;
          }
        }
      }
      setData({ groups: newGroups });

      try {
        await updateTask(taskId, updates);
      } catch {
        rollback('שגיאה בעדכון המשימה');
      }
    },
    [data, saveSnapshot, rollback],
  );

  // --- Task delete ---
  const handleTaskDelete = useCallback(
    async (taskId: string) => {
      if (!data) return;

      saveSnapshot();

      const newGroups: AdminTaskGroupWithTasks[] = JSON.parse(JSON.stringify(data.groups));
      let found = false;
      for (const group of newGroups) {
        if (found) break;
        const idx = group.tasks.findIndex((t) => t.id === taskId);
        if (idx !== -1) {
          group.tasks.splice(idx, 1);
          found = true;
          break;
        }
        for (const task of group.tasks) {
          const childIdx = task.children?.findIndex((c) => c.id === taskId) ?? -1;
          if (childIdx !== -1) {
            task.children.splice(childIdx, 1);
            found = true;
            break;
          }
        }
      }
      setData({ groups: newGroups });

      try {
        if (!taskId.startsWith('temp_')) {
          await deleteTaskAction(taskId);
        }
      } catch {
        rollback('שגיאה במחיקת המשימה');
      }
    },
    [data, saveSnapshot, rollback],
  );

  // --- Task create (with proper ID sync) ---
  const handleTaskCreate = useCallback(
    async (groupId: string, title: string, parentId?: string) => {
      if (!data) return;

      const group = data.groups.find((g) => g.id === groupId);
      if (!group) return;

      const tempId = `temp_${Date.now()}`;

      if (parentId) {
        const parentTask = group.tasks.find((t) => t.id === parentId);
        const maxChildOrder = parentTask
          ? Math.max(...(parentTask.children ?? []).map((c) => c.orderIndex), -1)
          : 0;

        const optimisticChild = {
          id: tempId,
          groupId,
          parentId,
          title,
          ownerId: null,
          status: 'NOT_STARTED' as const,
          priority: 'MEDIUM' as const,
          startDate: null,
          endDate: null,
          orderIndex: maxChildOrder + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        saveSnapshot();

        const newGroups: AdminTaskGroupWithTasks[] = JSON.parse(JSON.stringify(data.groups));
        const targetParent = newGroups.find((g) => g.id === groupId)?.tasks.find((t) => t.id === parentId);
        if (targetParent) {
          if (!targetParent.children) targetParent.children = [];
          targetParent.children.push(optimisticChild);
        }
        setData({ groups: newGroups });

        try {
          const serverTask = await createTask({
            groupId,
            parentId,
            title,
            status: 'NOT_STARTED',
            priority: 'MEDIUM',
          });
          setData((prev) => {
            if (!prev) return prev;
            const updated = JSON.parse(JSON.stringify(prev)) as RoadmapData;
            for (const g of updated.groups) {
              for (const t of g.tasks) {
                const idx = t.children?.findIndex((c) => c.id === tempId) ?? -1;
                if (idx !== -1) {
                  t.children[idx] = serverTask as typeof t.children[0];
                  return updated;
                }
              }
            }
            return updated;
          });
        } catch {
          rollback('שגיאה ביצירת תת-משימה');
        }
        return;
      }

      const maxOrder = Math.max(...group.tasks.map((t) => t.orderIndex), -1);
      const optimisticTask: AdminTaskWithChildren = {
        id: tempId,
        groupId,
        parentId: null,
        title,
        ownerId: null,
        status: 'NOT_STARTED' as const,
        priority: 'MEDIUM' as const,
        startDate: null,
        endDate: null,
        orderIndex: maxOrder + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        children: [],
      };

      saveSnapshot();

      const newGroups: AdminTaskGroupWithTasks[] = JSON.parse(JSON.stringify(data.groups));
      const targetGroup = newGroups.find((g) => g.id === groupId);
      if (targetGroup) {
        targetGroup.tasks.push(optimisticTask);
      }
      setData({ groups: newGroups });

      try {
        const serverTask = await createTask({
          groupId,
          title,
          status: 'NOT_STARTED',
          priority: 'MEDIUM',
        });

        setData((prev) => {
          if (!prev) return prev;
          const updated = JSON.parse(JSON.stringify(prev)) as RoadmapData;
          for (const g of updated.groups) {
            const idx = g.tasks.findIndex((t) => t.id === tempId);
            if (idx !== -1) {
              g.tasks[idx] = { ...serverTask, children: [] } as AdminTaskWithChildren;
              break;
            }
          }
          return updated;
        });
      } catch {
        rollback('שגיאה ביצירת משימה');
      }
    },
    [data, saveSnapshot, rollback],
  );

  // --- Group update ---
  const handleGroupUpdate = useCallback(
    async (groupId: string, updates: Record<string, unknown>) => {
      if (!data) return;

      saveSnapshot();

      const newGroups: AdminTaskGroupWithTasks[] = JSON.parse(JSON.stringify(data.groups));
      const group = newGroups.find((g) => g.id === groupId);
      if (group) {
        Object.assign(group, updates);
      }
      setData({ groups: newGroups });

      try {
        await updateTaskGroup(groupId, updates);
      } catch {
        rollback('שגיאה בעדכון הקבוצה');
      }
    },
    [data, saveSnapshot, rollback],
  );

  // --- Group create (with proper ID sync) ---
  const handleGroupCreate = useCallback(
    async (title: string, color: string) => {
      if (!data) return;

      saveSnapshot();

      const tempId = `temp_group_${Date.now()}`;
      const optimisticGroup: AdminTaskGroupWithTasks = {
        id: tempId,
        title,
        color,
        orderIndex: data.groups.length,
        createdAt: new Date(),
        updatedAt: new Date(),
        tasks: [],
      };

      setData({ groups: [...data.groups, optimisticGroup] });

      try {
        const serverGroup = await createTaskGroup({ title, color });
        setData((prev) => {
          if (!prev) return prev;
          const updated = JSON.parse(JSON.stringify(prev)) as RoadmapData;
          const idx = updated.groups.findIndex((g) => g.id === tempId);
          if (idx !== -1) {
            updated.groups[idx] = serverGroup;
          }
          return updated;
        });
      } catch {
        rollback('שגיאה ביצירת קבוצה');
      }
    },
    [data, saveSnapshot, rollback],
  );

  // --- Subtask create handler ---
  const handleSubtaskCreate = useCallback(
    async (groupId: string, parentId: string, title: string) => {
      await handleTaskCreate(groupId, title, parentId);
    },
    [handleTaskCreate],
  );

  // --- Main "new task" button handler ---
  const handleMainNewTask = useCallback(async () => {
    if (!data || data.groups.length === 0) {
      showError('אין קבוצות זמינות. צור קבוצה חדשה קודם.');
      return;
    }
    const firstGroup = [...data.groups].sort((a, b) => a.orderIndex - b.orderIndex)[0];
    await handleTaskCreate(firstGroup.id, 'משימה חדשה');
  }, [data, handleTaskCreate, showError]);

  // --- Filter/Sort helpers ---
  const hasActiveFilters = filterStatus !== null || filterPriority !== null;

  const handleSortSelect = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setShowSortDropdown(false);
  };

  const getFilterBtnPos = () => {
    if (!filterBtnRef.current) return { top: 0, left: 0 };
    const r = filterBtnRef.current.getBoundingClientRect();
    return { top: r.bottom + 4, left: r.left };
  };

  const getSortBtnPos = () => {
    if (!sortBtnRef.current) return { top: 0, left: 0 };
    const r = sortBtnRef.current.getBoundingClientRect();
    return { top: r.bottom + 4, left: r.left };
  };

  if (loading) return <RoadmapSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center p-8 bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <p className="text-[#303150] font-semibold mb-2">שגיאה</p>
          <p className="text-[#7E7F90] text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || !filteredData) return null;

  return (
    <div dir="rtl">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#F7F7F8] mb-5">
        <button
          onClick={() => setCurrentView('table')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold -mb-px transition-colors ${
            currentView === 'table'
              ? 'text-[#303150] border-b-2 border-[#69ADFF]'
              : 'text-[#BDBDCB] hover:text-[#7E7F90]'
          }`}
        >
          טבלה ראשית
          <Table2 className="w-4 h-4" strokeWidth={1.75} />
        </button>
        <button
          onClick={() => setCurrentView('timeline')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold -mb-px transition-colors ${
            currentView === 'timeline'
              ? 'text-[#303150] border-b-2 border-[#69ADFF]'
              : 'text-[#BDBDCB] hover:text-[#7E7F90]'
          }`}
        >
          ציר זמן
          <GanttChart className="w-4 h-4" strokeWidth={1.75} />
        </button>
        <button className="px-3 py-2.5 text-[#BDBDCB] hover:text-[#7E7F90] transition-colors -mb-px">
          <Plus className="w-4 h-4" strokeWidth={1.75} />
        </button>
        <button className="px-2 py-2.5 text-[#BDBDCB] hover:text-[#7E7F90] transition-colors -mb-px">
          <MoreHorizontal className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={handleMainNewTask}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#69ADFF] text-white rounded-xl text-sm font-medium hover:bg-[#5A9EE6] transition-colors shadow-sm"
        >
          משימה חדשה
          <Plus className="w-4 h-4" strokeWidth={2} />
        </button>

        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BDBDCB]" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="חיפוש"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pe-9 ps-3 py-2 text-sm border border-[#E8E8ED] rounded-xl bg-white text-[#303150] placeholder-[#BDBDCB] focus:outline-none focus:border-[#69ADFF] focus:ring-2 focus:ring-[#69ADFF]/20 w-40 transition-all"
          />
        </div>

        {/* Filter Button */}
        <button
          ref={filterBtnRef}
          onClick={() => { setShowFilterDropdown(!showFilterDropdown); setShowSortDropdown(false); }}
          className={`relative flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl transition-colors ${
            hasActiveFilters
              ? 'text-[#69ADFF] bg-[#69ADFF]/10 font-medium'
              : 'text-[#7E7F90] hover:bg-[#F7F7F8]'
          }`}
        >
          סינון
          <Filter className="w-4 h-4" strokeWidth={1.75} />
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#69ADFF] absolute top-1.5 start-1.5" />
          )}
        </button>

        {/* Sort Button */}
        <button
          ref={sortBtnRef}
          onClick={() => { setShowSortDropdown(!showSortDropdown); setShowFilterDropdown(false); }}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl transition-colors ${
            sortBy
              ? 'text-[#69ADFF] bg-[#69ADFF]/10 font-medium'
              : 'text-[#7E7F90] hover:bg-[#F7F7F8]'
          }`}
        >
          מיון
          <ArrowUpDown className="w-4 h-4" strokeWidth={1.75} />
        </button>

        <button className="p-2 text-[#7E7F90] hover:bg-[#F7F7F8] rounded-lg transition-colors">
          <MoreHorizontal className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>

      {/* Filter Dropdown Portal */}
      {showFilterDropdown && mounted && createPortal(
        <div
          ref={filterDropRef}
          className="fixed z-[10000] bg-white rounded-xl py-2 w-56"
          style={{
            top: getFilterBtnPos().top,
            left: getFilterBtnPos().left,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            border: '1px solid #F7F7F8',
          }}
          dir="rtl"
        >
          <p className="px-3 pb-1 text-xs font-semibold text-[#7E7F90]">סטטוס</p>
          {(Object.values(StatusEnum) as AdminTaskStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => { setFilterStatus(filterStatus === s ? null : s); }}
              className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#F7F7F8] transition-colors text-sm text-[#303150]"
            >
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: STATUS_COLORS[s] }} />
              <span className="flex-1 text-start">{STATUS_LABELS[s]}</span>
              {filterStatus === s && <Check className="w-3.5 h-3.5 text-[#69ADFF]" strokeWidth={2} />}
            </button>
          ))}
          <div className="h-px bg-[#F7F7F8] my-1.5" />
          <p className="px-3 pb-1 text-xs font-semibold text-[#7E7F90]">עדיפות</p>
          {(Object.values(PriorityEnum) as AdminTaskPriority[]).map((p) => (
            <button
              key={p}
              onClick={() => { setFilterPriority(filterPriority === p ? null : p); }}
              className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#F7F7F8] transition-colors text-sm text-[#303150]"
            >
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: PRIORITY_COLORS[p] }} />
              <span className="flex-1 text-start">{PRIORITY_LABELS[p]}</span>
              {filterPriority === p && <Check className="w-3.5 h-3.5 text-[#69ADFF]" strokeWidth={2} />}
            </button>
          ))}
          {hasActiveFilters && (
            <>
              <div className="h-px bg-[#F7F7F8] my-1.5" />
              <button
                onClick={() => { setFilterStatus(null); setFilterPriority(null); }}
                className="w-full px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-start"
              >
                נקה סינון
              </button>
            </>
          )}
        </div>,
        document.body,
      )}

      {/* Sort Dropdown Portal */}
      {showSortDropdown && mounted && createPortal(
        <div
          ref={sortDropRef}
          className="fixed z-[10000] bg-white rounded-xl py-2 w-48"
          style={{
            top: getSortBtnPos().top,
            left: getSortBtnPos().left,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            border: '1px solid #F7F7F8',
          }}
          dir="rtl"
        >
          {([
            { field: 'title' as SortField, label: 'לפי שם' },
            { field: 'startDate' as SortField, label: 'לפי תאריך התחלה' },
            { field: 'priority' as SortField, label: 'לפי עדיפות' },
          ]).map(({ field, label }) => (
            <button
              key={field}
              onClick={() => handleSortSelect(field)}
              className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#F7F7F8] transition-colors text-sm text-[#303150]"
            >
              <span className="flex-1 text-start">{label}</span>
              {sortBy === field && (
                <span className="text-xs text-[#69ADFF] font-medium">
                  {sortDir === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
          ))}
          {sortBy && (
            <>
              <div className="h-px bg-[#F7F7F8] my-1.5" />
              <button
                onClick={() => { setSortBy(null); setShowSortDropdown(false); }}
                className="w-full px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-start"
              >
                נקה מיון
              </button>
            </>
          )}
        </div>,
        document.body,
      )}

      {/* View Content */}
      {currentView === 'table' ? (
        <>
          <DragDropContext onDragEnd={handleDragEnd}>
            <div>
              {filteredData.groups
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((group) => (
                  <TaskGroup
                    key={group.id}
                    group={group}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskCreate={handleTaskCreate}
                    onTaskDelete={handleTaskDelete}
                    onGroupUpdate={handleGroupUpdate}
                    onSubtaskCreate={handleSubtaskCreate}
                  />
                ))}
            </div>
          </DragDropContext>
          <AddGroupButton onCreate={handleGroupCreate} />
        </>
      ) : (
        <TimelineView data={filteredData} />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

function RoadmapSkeleton() {
  return (
    <div dir="rtl" className="animate-pulse">
      <div className="flex items-center gap-2 border-b border-[#F7F7F8] mb-5 pb-2">
        <div className="h-5 w-24 bg-[#F7F7F8] rounded" />
      </div>
      <div className="flex items-center gap-2 mb-6">
        <div className="h-9 w-28 bg-[#69ADFF]/20 rounded-xl" />
        <div className="h-9 w-36 bg-[#F7F7F8] rounded-xl" />
        <div className="h-9 w-16 bg-[#F7F7F8] rounded-xl" />
        <div className="h-9 w-16 bg-[#F7F7F8] rounded-xl" />
      </div>
      {[0, 1].map((g) => (
        <div key={g} className="mb-8">
          <div className="h-5 w-20 bg-[#F7F7F8] rounded mb-2" />
          <div className="border-r-[3px] border-[#E8E8ED] rounded-sm">
            <div className="h-9 bg-[#F7F7F8] border-b border-[#E8E8ED]" />
            {[0, 1, 2].map((r) => (
              <div key={r} className="h-11 border-b border-[#F7F7F8] flex items-center gap-4 px-4">
                <div className="w-4 h-4 bg-[#F7F7F8] rounded" />
                <div className="h-4 flex-1 bg-[#F7F7F8] rounded max-w-48" />
                <div className="w-8 h-8 bg-[#F7F7F8] rounded-full" />
                <div className="w-24 h-7 bg-[#F7F7F8] rounded-lg" />
                <div className="w-16 h-4 bg-[#F7F7F8] rounded" />
                <div className="w-24 h-7 bg-[#F7F7F8] rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
