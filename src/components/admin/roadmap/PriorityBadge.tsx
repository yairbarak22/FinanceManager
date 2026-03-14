'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  AdminTaskPriority,
} from '@/types/admin-roadmap';

interface PriorityBadgeProps {
  priority: AdminTaskPriority;
  onChange?: (priority: AdminTaskPriority) => void;
}

const ALL_PRIORITIES = Object.values(AdminTaskPriority) as AdminTaskPriority[];

export default function PriorityBadge({ priority, onChange }: PriorityBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (p: AdminTaskPriority) => {
    if (p !== priority) onChange?.(p);
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => onChange && setIsOpen(!isOpen)}
        className="flex items-center justify-center w-full h-9 rounded-lg text-sm font-medium text-white select-none transition-opacity hover:opacity-90"
        style={{
          backgroundColor: PRIORITY_COLORS[priority],
          cursor: onChange ? 'pointer' : 'default',
        }}
      >
        {PRIORITY_LABELS[priority]}
      </button>

      {isOpen && mounted && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[10000] bg-white rounded-xl overflow-hidden py-1"
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
            border: '1px solid #F7F7F8',
          }}
          dir="rtl"
        >
          {ALL_PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleSelect(p)}
              className="w-full px-2 py-1.5 flex items-center gap-2 hover:bg-[#F7F7F8] transition-colors"
            >
              <div
                className="flex-1 h-7 rounded-md flex items-center justify-center text-xs font-medium text-white"
                style={{ backgroundColor: PRIORITY_COLORS[p] }}
              >
                {PRIORITY_LABELS[p]}
              </div>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
