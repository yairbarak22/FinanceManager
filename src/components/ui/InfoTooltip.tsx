'use client';

import React, { useState, useEffect, useCallback } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
  learnMoreLink?: string;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

/**
 * InfoTooltip - A contextual help tooltip with info icon
 * Follows Neto Design System with RTL support
 * 
 * Works on both desktop (hover) and mobile (tap to open/close)
 */
export default function InfoTooltip({
  content,
  learnMoreLink,
  className = '',
  side = 'top',
  align = 'center',
}: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch device on mount
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Close tooltip when clicking outside on mobile
  const handleClickOutside = useCallback((e: MouseEvent | TouchEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-tooltip-trigger]') && !target.closest('[data-tooltip-content]')) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && isTouchDevice) {
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('touchstart', handleClickOutside);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isOpen, isTouchDevice, handleClickOutside]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    if (isTouchDevice) {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(!isOpen);
    }
  };

  return (
    <Tooltip.Provider delayDuration={300} skipDelayDuration={100}>
      <Tooltip.Root 
        open={isTouchDevice ? isOpen : undefined}
        onOpenChange={isTouchDevice ? undefined : setIsOpen}
      >
        <Tooltip.Trigger asChild>
          <button
            type="button"
            data-tooltip-trigger
            onClick={handleTriggerClick}
            className={`
              inline-flex items-center justify-center
              w-5 h-5
              text-[#BDBDCB] hover:text-[#69ADFF] active:text-[#69ADFF]
              cursor-help
              transition-colors duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#69ADFF] focus-visible:ring-offset-2
              rounded-full
              ${className}
            `}
            aria-label="מידע נוסף"
            aria-expanded={isOpen}
          >
            <Info className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </Tooltip.Trigger>
        
        <Tooltip.Portal>
          <Tooltip.Content
            data-tooltip-content
            side={side}
            align={align}
            sideOffset={8}
            className="
              z-[9999]
              max-w-xs
              px-4 py-3
              bg-white
              rounded-xl
              border border-[#F7F7F8]
              text-xs text-[#303150]
              leading-relaxed
              animate-in fade-in-0 zoom-in-95
              data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
              data-[side=bottom]:slide-in-from-top-2
              data-[side=left]:slide-in-from-right-2
              data-[side=right]:slide-in-from-left-2
              data-[side=top]:slide-in-from-bottom-2
            "
            style={{
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            }}
            dir="rtl"
            onPointerDownOutside={(e) => {
              // Prevent closing on mobile when tapping the content
              if (isTouchDevice) {
                e.preventDefault();
              }
            }}
          >
            <p className="m-0">{content}</p>
            
            {learnMoreLink && (
              <a
                href={learnMoreLink}
                className="
                  inline-block mt-2
                  text-[#0DBACC] hover:text-[#0AA8B8]
                  font-medium
                  transition-colors duration-200
                "
                style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
              >
                למידע נוסף →
              </a>
            )}
            
            <Tooltip.Arrow 
              className="fill-white"
              style={{
                filter: 'drop-shadow(0 1px 0 #F7F7F8)',
              }}
              width={12}
              height={6}
            />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

