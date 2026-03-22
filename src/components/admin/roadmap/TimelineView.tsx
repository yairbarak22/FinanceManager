'use client';

import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import type { RoadmapData, AdminTask, AdminTaskGroupWithTasks, AdminTaskWithChildren } from '@/types/admin-roadmap';
import { STATUS_COLORS } from '@/types/admin-roadmap';

// --- Constants ---

const HEBREW_MONTHS_FULL: Record<number, string> = {
  0: 'ינואר', 1: 'פברואר', 2: 'מרץ', 3: 'אפריל', 4: 'מאי', 5: 'יוני',
  6: 'יולי', 7: 'אוגוסט', 8: 'ספטמבר', 9: 'אוקטובר', 10: 'נובמבר', 11: 'דצמבר',
};

const HEBREW_MONTHS_SHORT: Record<number, string> = {
  0: 'בינו׳', 1: 'בפבר׳', 2: 'במרץ', 3: 'באפר׳', 4: 'במאי', 5: 'ביוני',
  6: 'ביולי', 7: 'באוג׳', 8: 'בספט׳', 9: 'באוק׳', 10: 'בנוב׳', 11: 'בדצמ׳',
};

const ROW_HEIGHT = 44;
const GROUP_HEADER_HEIGHT = 36;
const HEADER_HEIGHT = 56;
const LEFT_PANE_WIDTH = 240;

const MONTH_WIDTH_PX = 220;
const TIMELINE_MONTHS = 13;
const TOTAL_WIDTH = MONTH_WIDTH_PX * TIMELINE_MONTHS;

// --- Types ---

interface TimelineViewProps {
  data: RoadmapData;
}

interface MonthBlock {
  year: number;
  month: number;
  label: string;
  leftPx: number;
  widthPx: number;
  days: number;
  dayOffsetFromStart: number;
}

interface WeekMark {
  dayOfMonth: number;
  leftPx: number;
}

interface TooltipState {
  task: AdminTask;
  x: number;
  y: number;
  startDate: Date;
  endDate: Date;
  durationDays: number;
}

interface FlatRow {
  type: 'group' | 'task';
  group: AdminTaskGroupWithTasks;
  task?: AdminTask;
}

// --- Helpers ---

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function addMonths(d: Date, months: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + months);
  return r;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatHebrewDateShort(date: Date): string {
  const d = new Date(date);
  return `${d.getDate()} ${HEBREW_MONTHS_SHORT[d.getMonth()]}`;
}

function resolveTaskDates(task: AdminTask): { start: Date; end: Date } | null {
  const s = task.startDate ? startOfDay(new Date(task.startDate)) : null;
  const e = task.endDate ? startOfDay(new Date(task.endDate)) : null;

  if (s && e) return { start: s, end: e };
  if (s && !e) {
    const end = new Date(s);
    end.setDate(end.getDate() + 1);
    return { start: s, end };
  }
  if (!s && e) return { start: e, end: e };
  return null;
}

function daysToPx(days: number, totalDays: number): number {
  return (days / totalDays) * TOTAL_WIDTH;
}

// --- Component ---

export default function TimelineView({ data }: TimelineViewProps) {
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightBodyRef = useRef<HTMLDivElement>(null);
  const rightHeaderRef = useRef<HTMLDivElement>(null);
  const isSyncingVertRef = useRef(false);
  const isSyncingHorizRef = useRef(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // --- Flatten data into rows (order already applied by RoadmapBoard) ---
  const flatRows = useMemo<FlatRow[]>(() => {
    const rows: FlatRow[] = [];
    const sorted = [...data.groups].sort((a, b) => a.orderIndex - b.orderIndex);
    for (const group of sorted) {
      rows.push({ type: 'group', group });
      if (!collapsedGroups.has(group.id)) {
        for (const task of group.tasks) {
          rows.push({ type: 'task', group, task });
        }
      }
    }
    return rows;
  }, [data.groups, collapsedGroups]);

  // --- Time scale: fixed 13-month range starting 1 month before current ---
  const { timelineStart, totalDays, months, weekMarks } = useMemo(() => {
    const now = new Date();
    const tlStart = startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const tlEnd = startOfDay(addMonths(tlStart, TIMELINE_MONTHS));
    const total = Math.max(daysBetween(tlStart, tlEnd), 1);

    const monthBlocks: MonthBlock[] = [];
    let cumDays = 0;
    for (let i = 0; i < TIMELINE_MONTHS; i++) {
      const monthDate = addMonths(tlStart, i);
      const y = monthDate.getFullYear();
      const m = monthDate.getMonth();
      const dim = daysInMonth(y, m);
      monthBlocks.push({
        year: y,
        month: m,
        label: `${HEBREW_MONTHS_FULL[m]} ${y}`,
        leftPx: daysToPx(cumDays, total),
        widthPx: daysToPx(dim, total),
        days: dim,
        dayOffsetFromStart: cumDays,
      });
      cumDays += dim;
    }

    const wMarks: WeekMark[] = [];
    for (const mb of monthBlocks) {
      for (let dom = 1; dom <= mb.days; dom += 7) {
        const dateOfMark = new Date(mb.year, mb.month, dom);
        const offsetFromTlStart = daysBetween(tlStart, dateOfMark);
        if (offsetFromTlStart >= 0 && offsetFromTlStart < total) {
          wMarks.push({
            dayOfMonth: dom,
            leftPx: daysToPx(offsetFromTlStart, total),
          });
        }
      }
    }
    wMarks.sort((a, b) => a.leftPx - b.leftPx);

    return { timelineStart: tlStart, totalDays: total, months: monthBlocks, weekMarks: wMarks };
  }, []);

  // --- Vertical scroll sync (left pane <-> right body) ---
  const handleLeftScroll = useCallback(() => {
    if (isSyncingVertRef.current) return;
    isSyncingVertRef.current = true;
    if (rightBodyRef.current && leftPaneRef.current) {
      rightBodyRef.current.scrollTop = leftPaneRef.current.scrollTop;
    }
    requestAnimationFrame(() => { isSyncingVertRef.current = false; });
  }, []);

  const handleRightBodyScroll = useCallback(() => {
    if (!isSyncingVertRef.current && leftPaneRef.current && rightBodyRef.current) {
      isSyncingVertRef.current = true;
      leftPaneRef.current.scrollTop = rightBodyRef.current.scrollTop;
      requestAnimationFrame(() => { isSyncingVertRef.current = false; });
    }
    if (!isSyncingHorizRef.current && rightHeaderRef.current && rightBodyRef.current) {
      isSyncingHorizRef.current = true;
      rightHeaderRef.current.scrollLeft = rightBodyRef.current.scrollLeft;
      requestAnimationFrame(() => { isSyncingHorizRef.current = false; });
    }
  }, []);

  const handleRightHeaderScroll = useCallback(() => {
    if (isSyncingHorizRef.current) return;
    isSyncingHorizRef.current = true;
    if (rightBodyRef.current && rightHeaderRef.current) {
      rightBodyRef.current.scrollLeft = rightHeaderRef.current.scrollLeft;
    }
    requestAnimationFrame(() => { isSyncingHorizRef.current = false; });
  }, []);

  // --- Toggle group collapse ---
  const toggleGroup = useCallback((groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  // --- Tooltip handlers ---
  const handleBarMouseEnter = useCallback((e: React.MouseEvent, task: AdminTask, startDate: Date, endDate: Date, durationDays: number) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({
      task,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      startDate,
      endDate,
      durationDays,
    });
  }, []);

  const handleBarMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  // --- Today marker ---
  const todayLeftPx = useMemo(() => {
    const today = startOfDay(new Date());
    const offset = daysBetween(timelineStart, today);
    if (offset >= 0 && offset <= totalDays) return daysToPx(offset, totalDays);
    return null;
  }, [timelineStart, totalDays]);

  // --- Initial scroll: show current month (second month block, since first is previous month) ---
  useEffect(() => {
    if (!rightBodyRef.current) return;
    const firstMonthPx = months.length > 1 ? months[1].leftPx : 0;
    rightBodyRef.current.scrollLeft = firstMonthPx;
    if (rightHeaderRef.current) {
      rightHeaderRef.current.scrollLeft = firstMonthPx;
    }
  }, [months]);

  return (
    <div className="flex border border-[#F7F7F8] rounded-xl overflow-hidden bg-white" style={{ direction: 'rtl' }}>
      {/* Left Pane - Task Names */}
      <div
        className="shrink-0 bg-white border-l border-[#E8E8ED] z-10"
        style={{ width: LEFT_PANE_WIDTH }}
      >
        {/* Left Header */}
        <div
          className="flex items-center px-4 border-b border-[#E8E8ED] bg-[#FAFAFA]"
          style={{ height: HEADER_HEIGHT }}
        >
          <span className="text-xs font-medium text-[#7E7F90]">משימות</span>
        </div>

        {/* Left scrollable body */}
        <div
          ref={leftPaneRef}
          onScroll={handleLeftScroll}
          className="overflow-y-auto overflow-x-hidden"
          style={{ maxHeight: `calc(100vh - ${HEADER_HEIGHT + 200}px)` }}
        >
          {flatRows.map((row) => {
            if (row.type === 'group') {
              return (
                <button
                  key={`g-${row.group.id}`}
                  onClick={() => toggleGroup(row.group.id)}
                  className="flex items-center gap-2 w-full px-3 border-b border-[#F7F7F8] cursor-pointer hover:bg-[#F7F7F8] transition-colors"
                  style={{ height: GROUP_HEADER_HEIGHT }}
                >
                  {collapsedGroups.has(row.group.id) ? (
                    <ChevronLeft className="w-3.5 h-3.5 text-[#7E7F90]" strokeWidth={2} />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-[#7E7F90]" strokeWidth={2} />
                  )}
                  <span
                    className="text-sm font-semibold truncate"
                    style={{ color: row.group.color }}
                  >
                    {row.group.title}
                  </span>
                  <span className="text-xs text-[#BDBDCB] ms-auto">
                    {row.group.tasks.length}
                  </span>
                </button>
              );
            }
            return (
              <div
                key={`t-${row.task!.id}`}
                className="flex items-center px-4 border-b border-[#F7F7F8] hover:bg-[#FAFAFA] transition-colors"
                style={{ height: ROW_HEIGHT }}
              >
                <span className="text-sm text-[#303150] truncate">
                  {row.task!.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Pane - Timeline with horizontal scrolling */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Timeline Header (scrolls horizontally in sync with body) */}
        <div
          ref={rightHeaderRef}
          onScroll={handleRightHeaderScroll}
          className="border-b border-[#E8E8ED] overflow-x-auto overflow-y-hidden scrollbar-hide"
          style={{ height: HEADER_HEIGHT }}
        >
          <div style={{ width: TOTAL_WIDTH, position: 'relative', height: '100%' }}>
            {/* Month row */}
            <div className="flex h-1/2" style={{ width: TOTAL_WIDTH }}>
              {months.map((mb, i) => (
                <div
                  key={`m-${mb.year}-${mb.month}`}
                  className={`flex items-center justify-center text-[11px] font-semibold text-[#303150] shrink-0 ${
                    i < months.length - 1 ? 'border-l border-[#E8E8ED]' : ''
                  }`}
                  style={{ width: mb.widthPx }}
                >
                  {mb.label}
                </div>
              ))}
            </div>
            {/* Week marks row */}
            <div className="relative h-1/2" style={{ width: TOTAL_WIDTH }}>
              {weekMarks.map((wm, i) => (
                <span
                  key={`wk-${i}`}
                  className="absolute text-[10px] text-[#BDBDCB] top-1/2"
                  style={{ right: wm.leftPx, transform: 'translate(50%, -50%)' }}
                >
                  {wm.dayOfMonth}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Body (scrolls both horizontally and vertically) */}
        <div
          ref={rightBodyRef}
          onScroll={handleRightBodyScroll}
          className="flex-1 overflow-auto"
          style={{ maxHeight: `calc(100vh - ${HEADER_HEIGHT + 200}px)` }}
        >
          <div className="relative" style={{ width: TOTAL_WIDTH }}>
            {/* Today marker */}
            {todayLeftPx !== null && (
              <div
                className="absolute top-0 bottom-0 w-px z-20"
                style={{
                  right: todayLeftPx,
                  background: 'linear-gradient(to bottom, #69ADFF, #69ADFF80)',
                }}
              >
                <div className="absolute -top-0.5 -right-1.5 w-3 h-3 rounded-full bg-[#69ADFF]" />
              </div>
            )}

            {/* Month boundary lines */}
            {months.map((mb, i) => {
              if (i === 0) return null;
              return (
                <div
                  key={`line-${mb.year}-${mb.month}`}
                  className="absolute top-0 bottom-0 w-px bg-[#E8E8ED]"
                  style={{ right: mb.leftPx }}
                />
              );
            })}

            {/* Week vertical lines */}
            {weekMarks.map((wm, i) => (
              <div
                key={`wline-${i}`}
                className="absolute top-0 bottom-0 w-px bg-[#F7F7F8]"
                style={{ right: wm.leftPx }}
              />
            ))}

            {/* Rows */}
            {flatRows.map((row) => {
              if (row.type === 'group') {
                return (
                  <div
                    key={`tl-g-${row.group.id}`}
                    className="border-b border-[#F7F7F8] bg-[#FAFAFA]"
                    style={{ height: GROUP_HEADER_HEIGHT }}
                  />
                );
              }

              const task = row.task!;
              const resolved = resolveTaskDates(task);

              if (!resolved) {
                return (
                  <div
                    key={`tl-t-${task.id}`}
                    className="border-b border-[#F7F7F8] relative"
                    style={{ height: ROW_HEIGHT }}
                  />
                );
              }

              const offsetDays = daysBetween(timelineStart, resolved.start);
              const duration = Math.max(daysBetween(resolved.start, resolved.end) + 1, 1);
              const rightPx = daysToPx(offsetDays, totalDays);
              const widthPx = Math.max(daysToPx(duration, totalDays), 6);
              const barColor = STATUS_COLORS[task.status] || row.group.color;
              const showLabel = widthPx > 60;

              return (
                <div
                  key={`tl-t-${task.id}`}
                  className="border-b border-[#F7F7F8] relative"
                  style={{ height: ROW_HEIGHT }}
                >
                  <div
                    className="absolute top-2 flex items-center rounded-full cursor-pointer transition-all duration-150 hover:brightness-110 hover:shadow-md"
                    style={{
                      right: rightPx,
                      width: widthPx,
                      height: 28,
                      backgroundColor: barColor,
                    }}
                    onMouseEnter={(e) => handleBarMouseEnter(e, task, resolved.start, resolved.end, duration)}
                    onMouseLeave={handleBarMouseLeave}
                  >
                    {showLabel && (
                      <span className="text-[11px] font-medium text-white truncate px-2 w-full text-center leading-none">
                        {task.title}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tooltip Portal */}
      {tooltip && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed z-[10000] pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div
            className="bg-[#303150] text-white rounded-lg px-3 py-2 shadow-xl text-xs whitespace-nowrap"
            style={{ direction: 'rtl' }}
          >
            <p className="font-medium mb-1">{tooltip.task.title}</p>
            <p className="text-[#BDBDCB]">
              {formatHebrewDateShort(tooltip.startDate)} — {formatHebrewDateShort(tooltip.endDate)}
            </p>
            <p className="text-[#BDBDCB]">{tooltip.durationDays} ימים</p>
          </div>
          <div className="w-2 h-2 bg-[#303150] mx-auto rotate-45 -mt-1" />
        </div>,
        document.body,
      )}
    </div>
  );
}
