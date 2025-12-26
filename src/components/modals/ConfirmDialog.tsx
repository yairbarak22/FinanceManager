'use client';

import { AlertTriangle, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    setMounted(true);
  }, []);

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
    >
      <div
        className="modal-content max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <p className="text-slate-600">{message}</p>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary flex-1">
            ביטול
          </button>
          <button
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
