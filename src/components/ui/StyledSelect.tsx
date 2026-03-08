'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface DropdownPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

interface StyledSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  'aria-label'?: string;
  size?: 'sm' | 'md';
}

export default function StyledSelect({
  value,
  onChange,
  options,
  placeholder = 'בחר...',
  disabled = false,
  'aria-label': ariaLabel,
  size = 'md',
}: StyledSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<DropdownPosition>({ left: 0, width: 0, maxHeight: 260 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const preferredHeight = 260;
    const openBelow = spaceBelow >= Math.min(preferredHeight, 120) || spaceBelow >= spaceAbove;

    if (openBelow) {
      setPosition({
        top: rect.bottom + 6,
        bottom: undefined,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(preferredHeight, spaceBelow),
      });
    } else {
      setPosition({
        top: undefined,
        bottom: window.innerHeight - rect.top + 6,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(preferredHeight, spaceAbove),
      });
    }
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
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
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

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2.5 py-2'
    : 'text-sm px-4 py-3';

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className="fixed z-[10000] bg-white rounded-xl overflow-y-auto"
      style={{
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        width: position.width,
        maxHeight: position.maxHeight,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
        border: '1px solid #F7F7F8',
        animation: 'scaleIn 150ms ease-out',
      }}
      dir="rtl"
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-right transition-colors"
            style={{
              color: isSelected ? '#69ADFF' : '#303150',
              backgroundColor: isSelected ? 'rgba(105, 173, 255, 0.06)' : 'transparent',
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              fontSize: size === 'sm' ? '0.75rem' : '0.875rem',
              borderBottom: '1px solid #F7F7F8',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.backgroundColor = '#F7F7F8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isSelected
                ? 'rgba(105, 173, 255, 0.06)'
                : 'transparent';
            }}
          >
            <span className="truncate">{option.label}</span>
            {isSelected && (
              <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#69ADFF' }} strokeWidth={2.5} />
            )}
          </button>
        );
      })}
      {options.length === 0 && (
        <div
          className="px-3 py-4 text-center"
          style={{
            color: '#BDBDCB',
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
            fontSize: '0.75rem',
          }}
        >
          אין אפשרויות זמינות
        </div>
      )}
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`w-full flex items-center justify-between gap-2 rounded-xl transition-all ${sizeClasses}`}
        style={{
          border: isOpen ? '1px solid #69ADFF' : '1px solid #E8E8ED',
          color: selectedOption ? '#303150' : '#BDBDCB',
          background: disabled ? '#F7F7F8' : '#FFFFFF',
          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          boxShadow: isOpen ? '0 0 0 3px rgba(105, 173, 255, 0.2)' : 'none',
        }}
      >
        <span className="truncate text-right flex-1">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className="w-3.5 h-3.5 flex-shrink-0 transition-transform"
          style={{
            color: '#BDBDCB',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
          strokeWidth={2}
        />
      </button>
      {mounted && isOpen && createPortal(dropdownContent, document.body)}
    </>
  );
}
