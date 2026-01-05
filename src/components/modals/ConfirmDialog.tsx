'use client';

import { AlertTriangle, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useState, useRef, useCallback } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Store the previously focused element and set initial focus
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus the cancel button (safer default) after a short delay
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  // Return focus when dialog closes
  useEffect(() => {
    if (!isOpen && previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard events (Escape to close, Tab trapping)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    // Tab trapping
    if (e.key === 'Tab' && dialogRef.current) {
      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }
  }, [onClose]);

  if (!isOpen || !mounted) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const dialogContent = (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="modal-content max-w-sm"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center" aria-hidden="true">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 id="confirm-dialog-title" className="text-lg font-semibold text-slate-900">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            aria-label="סגור"
          >
            <X className="w-5 h-5 text-slate-500" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <p id="confirm-dialog-description" className="text-slate-600">{message}</p>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200"
          >
            מחק
          </button>
        </div>
      </div>
    </div>
  );

  // Render to document.body using Portal
  return createPortal(dialogContent, document.body);
}
