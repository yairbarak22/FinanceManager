'use client';

import { useState, useRef, useEffect } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { ChevronDown, ChevronLeft, Info, Plus } from 'lucide-react';
import TaskRow from './TaskRow';
import AddTaskRow from './AddTaskRow';
import type { AdminTaskGroupWithTasks, AdminTaskStatus, AdminTask } from '@/types/admin-roadmap';
import { STATUS_COLORS, STATUS_LABELS } from '@/types/admin-roadmap';

interface TaskGroupProps {
  group: AdminTaskGroupWithTasks;
  onTaskUpdate?: (taskId: string, updates: Record<string, unknown>) => Promise<void>;
  onTaskCreate?: (groupId: string, title: string) => Promise<void>;
  onTaskDelete?: (taskId: string) => Promise<void>;
  onGroupUpdate?: (groupId: string, updates: Record<string, unknown>) => Promise<void>;
}

export const GRID_COLS = 'grid grid-cols-[40px_minmax(200px,_1fr)_100px_130px_120px_120px_130px_40px]';

function getStatusBreakdown(tasks: AdminTask[]) {
  const total = tasks.length;
  if (total === 0) return [];
  const counts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  return Object.entries(counts).map(([status, count]) => ({
    status: status as AdminTaskStatus,
    count,
    percent: (count / total) * 100,
  }));
}

export default function TaskGroup({ group, onTaskUpdate, onTaskCreate, onTaskDelete, onGroupUpdate }: TaskGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(group.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    setEditedTitle(group.title);
  }, [group.title]);

  const handleTitleSave = async () => {
    const trimmed = editedTitle.trim();
    setIsEditingTitle(false);
    if (!trimmed || trimmed === group.title) {
      setEditedTitle(group.title);
      return;
    }
    await onGroupUpdate?.(group.id, { title: trimmed });
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(group.title);
      setIsEditingTitle(false);
    }
  };

  const sortedTasks = [...group.tasks].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="mb-8">
      {/* Group Title Row */}
      <div className="flex items-center gap-2 py-2 px-1 mb-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="cursor-pointer p-0.5 hover:bg-[#F7F7F8] rounded transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-[#7E7F90]" strokeWidth={2} />
          ) : (
            <ChevronLeft className="w-4 h-4 text-[#7E7F90]" strokeWidth={2} />
          )}
        </button>

        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            className="text-base font-semibold bg-white border border-[#69ADFF] rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/20 min-w-[120px]"
            style={{ color: group.color }}
          />
        ) : (
          <span
            onClick={() => onGroupUpdate && setIsEditingTitle(true)}
            className="text-base font-semibold cursor-text hover:opacity-80 transition-opacity"
            style={{ color: group.color }}
          >
            {group.title}
          </span>
        )}
      </div>

      {isExpanded && (
        <div
          className="border-r-[3px] rounded-sm overflow-visible"
          style={{ borderColor: group.color }}
        >
          {/* Column Headers */}
          <div
            className={`${GRID_COLS} items-center border-b border-[#E8E8ED]`}
            style={{ backgroundColor: `${group.color}08` }}
          >
            <div className="h-9 flex items-center justify-center">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-[#E8E8ED] text-[#69ADFF] focus:ring-[#69ADFF]/20 cursor-pointer"
                readOnly
              />
            </div>
            <div className="h-9 flex items-center pe-4">
              <span className="text-xs font-medium text-[#7E7F90]">משימה</span>
            </div>
            <div className="h-9 flex items-center justify-center">
              <span className="text-xs font-medium text-[#7E7F90]">אחראי</span>
            </div>
            <div className="h-9 flex items-center justify-center gap-1">
              <span className="text-xs font-medium text-[#7E7F90]">סטטוס</span>
              <Info className="w-3 h-3 text-[#BDBDCB]" strokeWidth={1.75} />
            </div>
            <div className="h-9 flex items-center justify-center gap-1">
              <span className="text-xs font-medium text-[#7E7F90]">תאריך התחלה</span>
            </div>
            <div className="h-9 flex items-center justify-center gap-1">
              <span className="text-xs font-medium text-[#7E7F90]">תאריך סיום</span>
            </div>
            <div className="h-9 flex items-center justify-center">
              <span className="text-xs font-medium text-[#7E7F90]">עדיפות</span>
            </div>
            <div className="h-9 flex items-center justify-center">
              <Plus className="w-4 h-4 text-[#BDBDCB]" strokeWidth={1.75} />
            </div>
          </div>

          {/* Droppable Task List */}
          <Droppable droppableId={group.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`min-h-[1px] transition-colors duration-200 ${
                  snapshot.isDraggingOver ? 'bg-[#69ADFF]/5' : ''
                }`}
              >
                {sortedTasks.map((task, index) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    index={index}
                    onTaskUpdate={onTaskUpdate}
                    onTaskDelete={onTaskDelete}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Add Task Row */}
          <AddTaskRow groupId={group.id} onCreate={onTaskCreate} />

          {/* Progress Bar */}
          {sortedTasks.length > 0 && (
            <div className="px-4 py-2 border-t border-[#F7F7F8]">
              <div className="flex h-2 rounded-full overflow-hidden">
                {getStatusBreakdown(sortedTasks).map((item) => (
                  <div
                    key={item.status}
                    className="transition-all duration-200 hover:brightness-110"
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: STATUS_COLORS[item.status],
                    }}
                    title={`${STATUS_LABELS[item.status]}: ${item.count} (${Math.round(item.percent)}%)`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
