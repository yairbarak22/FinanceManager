'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { TourStep } from './tourSteps';

interface TooltipBoxProps {
  step: TourStep;
  currentIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

type Position = 'top' | 'bottom' | 'left' | 'right' | 'center';

interface TooltipPosition {
  top: number;
  left: number;
  position: Position;
}

export default function TooltipBox({
  step,
  currentIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: TooltipBoxProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    top: 0,
    left: 0,
    position: 'center',
  });

  const calculatePosition = useCallback(() => {
    if (!step.target) {
      // Center position for welcome/final screens
      setTooltipPosition({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
        position: 'center',
      });
      return;
    }

    const element = document.querySelector(step.target);
    const tooltip = tooltipRef.current;

    if (!element || !tooltip) return;

    const targetRect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = 16;

    // Calculate available space in each direction
    const spaceTop = targetRect.top;
    const spaceBottom = window.innerHeight - targetRect.bottom;
    const spaceLeft = targetRect.left;
    const spaceRight = window.innerWidth - targetRect.right;

    // Determine best position
    let position: Position = 'bottom';
    let top = 0;
    let left = 0;

    if (spaceBottom >= tooltipRect.height + padding) {
      // Position below
      position = 'bottom';
      top = targetRect.bottom + padding + window.scrollY;
      left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
    } else if (spaceTop >= tooltipRect.height + padding) {
      // Position above
      position = 'top';
      top = targetRect.top - tooltipRect.height - padding + window.scrollY;
      left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
    } else if (spaceRight >= tooltipRect.width + padding) {
      // Position right
      position = 'right';
      top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2 + window.scrollY;
      left = targetRect.right + padding;
    } else if (spaceLeft >= tooltipRect.width + padding) {
      // Position left
      position = 'left';
      top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2 + window.scrollY;
      left = targetRect.left - tooltipRect.width - padding;
    } else {
      // Default to bottom with scroll
      position = 'bottom';
      top = targetRect.bottom + padding + window.scrollY;
      left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
    }

    // Ensure tooltip stays within viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));

    setTooltipPosition({ top, left, position });
  }, [step.target]);

  useEffect(() => {
    // Initial calculation with a small delay
    const timeout = setTimeout(calculatePosition, 150);

    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition);
    };
  }, [calculatePosition, currentIndex]);

  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === totalSteps - 1;
  const isWelcomeOrFinal = !step.target;
  const progress = ((currentIndex + 1) / totalSteps) * 100;

  return (
    <div
      ref={tooltipRef}
      className={`fixed z-[10000] animate-tooltip-in ${
        isWelcomeOrFinal ? 'transform -translate-x-1/2 -translate-y-1/2' : ''
      }`}
      style={{
        top: tooltipPosition.top,
        left: tooltipPosition.left,
      }}
    >
      <div
        className={`
          relative bg-gradient-to-br from-gray-900 to-gray-800 
          rounded-2xl shadow-2xl border border-gray-700/50
          ${isWelcomeOrFinal ? 'w-[400px] p-8' : 'w-[340px] p-6'}
        `}
      >
        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute top-3 left-3 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
          title="דלג על הסיור"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon for welcome/final */}
        {isWelcomeOrFinal && (
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-pink-400 font-medium">
            {currentIndex + 1} מתוך {totalSteps}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-700 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>

        {/* Description */}
        <p className="text-gray-300 text-sm leading-relaxed mb-6">{step.description}</p>

        {/* Tips (if any) */}
        {step.tips && step.tips.length > 0 && (
          <div className="bg-gray-800/50 rounded-xl p-3 mb-4">
            <p className="text-xs text-teal-400 font-medium mb-1">💡 טיפים:</p>
            <ul className="text-xs text-gray-400 space-y-1">
              {step.tips.map((tip, i) => (
                <li key={i}>• {tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center gap-3">
          {!isFirstStep && (
            <button
              onClick={onPrev}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              הקודם
            </button>
          )}

          <button
            onClick={onNext}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white text-sm font-medium transition-all shadow-lg shadow-pink-500/25"
          >
            {isLastStep ? (
              'התחל להשתמש!'
            ) : (
              <>
                הבא
                <ChevronLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Skip link */}
        {!isLastStep && (
          <button
            onClick={onSkip}
            className="w-full mt-3 text-xs text-gray-500 hover:text-gray-400 transition-colors"
          >
            דלג על הסיור
          </button>
        )}

        {/* Arrow pointing to target */}
        {!isWelcomeOrFinal && (
          <div
            className={`absolute w-3 h-3 bg-gray-900 transform rotate-45 ${
              tooltipPosition.position === 'bottom'
                ? '-top-1.5 right-1/2 translate-x-1/2'
                : tooltipPosition.position === 'top'
                ? '-bottom-1.5 right-1/2 translate-x-1/2'
                : tooltipPosition.position === 'left'
                ? 'top-1/2 -right-1.5 -translate-y-1/2'
                : 'top-1/2 -left-1.5 -translate-y-1/2'
            }`}
          />
        )}
      </div>
    </div>
  );
}

