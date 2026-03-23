'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { apiFetch } from '@/lib/utils';

interface DeleteAllDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteAllDataModal({ isOpen, onClose }: DeleteAllDataModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/user/delete-all-data', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'שגיאה במחיקת הנתונים');
        setIsLoading(false);
        return;
      }
      await signOut({ callbackUrl: '/' });
    } catch {
      setError('שגיאה בחיבור לשרת. נסה שוב.');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const content = (
    <div
      className="modal-overlay"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={(e) => { if (!isLoading && e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#F7F7F8]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(241, 138, 181, 0.12)' }}
            >
              <AlertTriangle className="w-5 h-5" style={{ color: '#F18AB5' }} strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-[1.0625rem] font-semibold" style={{ color: '#303150' }}>
                מחיקת כל הנתונים
              </h2>
              <p className="text-xs mt-0.5" style={{ color: '#F18AB5' }}>
                פעולה זו בלתי הפיכה לחלוטין
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: '#303150' }}>
            פעולה זו תמחק לצמיתות את כל הנתונים הפיננסיים שלך מהמערכת:
          </p>

          <ul className="space-y-1.5 text-sm" style={{ color: '#7E7F90' }}>
            {[
              'עסקאות והיסטוריית תזרים',
              'עסקאות קבועות ויעדים פיננסיים',
              'נכסים, התחייבויות והיסטוריית ערכים',
              'תיק השקעות והחזקות',
              'מסמכים מצורפים',
              'קטגוריות מותאמות אישית',
              'מעשרות (העדפות וקיזוזים)',
              'תקציב ותכנון פסח',
              'דוחות חודשיים',
              'פרופיל פיננסי והעדפות',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5"
                  style={{ backgroundColor: '#F18AB5' }}
                />
                {item}
              </li>
            ))}
          </ul>

          <p className="text-xs leading-relaxed" style={{ color: '#BDBDCB' }}>
            לא יימחקו: מיפוי סוחרים (סיווג AI), היסטוריית שווי נקי, והגדרות דיווח IVR / וואטסאפ.
          </p>

          <div
            className="p-3 rounded-xl text-sm font-medium"
            style={{
              backgroundColor: 'rgba(241, 138, 181, 0.08)',
              border: '1px solid rgba(241, 138, 181, 0.25)',
              color: '#F18AB5',
            }}
          >
            לאחר המחיקה תנותק אוטומטית ולא ניתן יהיה לשחזר את הנתונים שנמחקו.
          </div>

          {error && (
            <div
              className="p-3 rounded-xl text-sm"
              style={{
                backgroundColor: 'rgba(241, 138, 181, 0.1)',
                border: '1px solid rgba(241, 138, 181, 0.3)',
                color: '#F18AB5',
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#F7F7F8] flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn-secondary flex-1"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: isLoading ? 'rgba(241, 138, 181, 0.5)' : '#F18AB5',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                מוחק...
              </>
            ) : (
              <>
                מחק הכל
                <Trash2 className="w-4 h-4" strokeWidth={1.75} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
