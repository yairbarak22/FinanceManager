'use client';

import { useState, useRef, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { GripVertical, Trash2 } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import DateCell from './DateCell';
import OwnerCell from './OwnerCell';
import { GRID_COLS } from './TaskGroup';
import type { AdminTask, AdminTaskStatus, AdminTaskPriority } from '@/types/admin-roadmap';

interface TaskRowProps {
  task: AdminTask;
  index: number;
  onTaskUpdate?: (taskId: string, updates: Record<string, unknown>) => Promise<void>;
  onTaskDelete?: (taskId: string) => Promise<void>;
}

export default function TaskRow({ task, index, onTaskUpdate, onTaskDelete }: TaskRowProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    setEditedTitle(task.title);
  }, [task.title]);

  const handleTitleSave = async () => {
    const trimmed = editedTitle.trim();
    setIsEditingTitle(false);
    if (!trimmed || trimmed === task.title) {
      setEditedTitle(task.title);
      return;
    }
    await onTaskUpdate?.(task.id, { title: trimmed });
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(task.title);
      setIsEditingTitle(false);
    }
  };

  const handleStatusChange = (status: AdminTaskStatus) => {
    onTaskUpdate?.(task.id, { status });
  };

  const handlePriorityChange = (priority: AdminTaskPriority) => {
    onTaskUpdate?.(task.id, { priority });
  };

  const handleStartDateChange = (date: Date | null) => {
    onTaskUpdate?.(task.id, {
      startDate: date ? date.toISOString() : null,
    });
  };

  const handleEndDateChange = (date: Date | null) => {
    onTaskUpdate?.(task.id, {
      endDate: date ? date.toISOString() : null,
    });
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`${GRID_COLS} items-center border-b border-[#F7F7F8] transition-colors duration-150 group relative ${
            snapshot.isDragging
              ? 'bg-white shadow-lg rounded-lg z-50'
              : 'hover:bg-[#FAFAFA]'
          }`}
        >
          {/* Drag Handle */}
          <div
            {...provided.dragHandleProps}
            className="h-11 flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            <GripVertical
              className="w-4 h-4 text-[#BDBDCB] opacity-0 group-hover:opacity-100 transition-opacity"
              strokeWidth={1.5}
            />
          </div>

          {/* Task Title */}
          <div className="h-11 flex items-center pe-4 gap-2 min-w-0">
            {isEditingTitle ? (
              <input
                ref={inputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="flex-1 h-8 text-sm font-medium text-[#303150] bg-white border border-[#69ADFF] rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-[#69ADFF]/20 min-w-0"
              />
            ) : (
              <span
                onClick={() => setIsEditingTitle(true)}
                className="text-sm font-medium text-[#303150] truncate cursor-text hover:text-[#69ADFF] transition-colors"
              >
                {task.title}
              </span>
            )}
          </div>

          {/* Owner */}
          <div className="h-11 flex items-center justify-center px-2">
            <OwnerCell ownerId={task.ownerId} />
          </div>

          {/* Status */}
          <div className="h-11 flex items-center px-1.5">
            <div className="w-full">
              <StatusBadge
                status={task.status}
                onChange={onTaskUpdate ? handleStatusChange : undefined}
              />
            </div>
          </div>

          {/* Start Date */}
          <div className="h-11 flex items-center px-1.5">
            <div className="w-full">
              <DateCell
                date={task.startDate}
                onChange={onTaskUpdate ? handleStartDateChange : undefined}
              />
            </div>
          </div>

          {/* End Date */}
          <div className="h-11 flex items-center px-1.5">
            <div className="w-full">
              <DateCell
                date={task.endDate}
                onChange={onTaskUpdate ? handleEndDateChange : undefined}
              />
            </div>
          </div>

          {/* Priority */}
          <div className="h-11 flex items-center px-1.5">
            <div className="w-full">
              <PriorityBadge
                priority={task.priority}
                onChange={onTaskUpdate ? handlePriorityChange : undefined}
              />
            </div>
          </div>

          {/* Delete */}
          <div className="h-11 flex items-center justify-center">
            {onTaskDelete && (
              <button
                onClick={() => onTaskDelete(task.id)}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                title="מחק משימה"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#BDBDCB] hover:text-red-500 transition-colors" strokeWidth={1.75} />
              </button>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
