'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageCircle, Copy, Check, ExternalLink, Shield, Settings } from 'lucide-react';

const WA_NUMBER_RAW = '18392616193';
const WA_NUMBER_DISPLAY = '+1 (839) 261-6193';
const WA_LINK = `https://wa.me/${WA_NUMBER_RAW}`;

interface WhatsAppReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenIvrSettings?: () => void;
}

export default function WhatsAppReportModal({ isOpen, onClose, onOpenIvrSettings }: WhatsAppReportModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`+${WA_NUMBER_RAW}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#F7F7F8]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(37, 211, 102, 0.1)' }}
            >
              <MessageCircle className="w-5 h-5" style={{ color: '#25D366' }} strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-semibold" style={{ color: '#303150' }}>
              דיווח בווצאפ
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-[#F7F7F8]"
            style={{ color: '#7E7F90' }}
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Right: Onboarding */}
          <div className="p-6" style={{ background: 'rgba(248, 248, 250, 0.9)' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#303150' }}>
              דיווח הוצאות בווצאפ
            </h3>

            <div className="space-y-3 mb-6">
              <div className="rounded-xl px-4 py-3 bg-white/80">
                <p className="text-xs font-medium mb-1" style={{ color: '#7E7F90' }}>
                  שלב 1
                </p>
                <p className="text-sm mb-2" style={{ color: '#303150' }}>
                  שמרו את המספר הבא כאיש קשר:
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-bold" dir="ltr" style={{ color: '#25D366' }}>
                    {WA_NUMBER_DISPLAY}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors hover:bg-[#F7F7F8]"
                    style={{ color: copied ? '#25D366' : '#69ADFF' }}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" strokeWidth={1.75} />
                        הועתק
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
                        העתק
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-xl px-4 py-3 bg-white/80">
                <p className="text-xs font-medium mb-1" style={{ color: '#7E7F90' }}>
                  שלב 2
                </p>
                <p className="text-sm leading-relaxed" style={{ color: '#303150' }}>
                  שלחו הודעה בווצאפ בפורמט הבא:
                </p>
                <p className="text-sm mt-1" style={{ color: '#303150' }}>
                  <strong>הוצאה/הכנסה, קטגוריה, שם עסק, סכום</strong>
                </p>
              </div>

              <div className="rounded-xl px-4 py-3 bg-white/80">
                <p className="text-xs font-medium mb-1" style={{ color: '#7E7F90' }}>
                  שלב 3
                </p>
                <p className="text-sm" style={{ color: '#303150' }}>
                  הרישום יתעדכן בטבלת התקציב שלך תוך שניות.
                </p>
              </div>
            </div>
          </div>

          {/* Left: Example & CTA */}
          <div className="p-6 bg-white">
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#303150' }}>
              דוגמה לפורמט הודעה
            </h3>

            <div
              className="rounded-xl px-4 py-4 mb-4"
              style={{ background: 'rgba(37, 211, 102, 0.06)', border: '1px solid rgba(37, 211, 102, 0.15)' }}
            >
              <p className="text-sm font-mono font-semibold mb-3" dir="rtl" style={{ color: '#303150' }}>
                הוצאה, מזון, שופרסל, 150
              </p>
              <div className="space-y-1.5">
                <p className="text-xs" style={{ color: '#7E7F90' }}>
                  • <strong style={{ color: '#303150' }}>הוצאה</strong> – סוג הרישום (הוצאה או הכנסה)
                </p>
                <p className="text-xs" style={{ color: '#7E7F90' }}>
                  • <strong style={{ color: '#303150' }}>מזון</strong> – הקטגוריה
                </p>
                <p className="text-xs" style={{ color: '#7E7F90' }}>
                  • <strong style={{ color: '#303150' }}>שופרסל</strong> – שם העסק
                </p>
                <p className="text-xs" style={{ color: '#7E7F90' }}>
                  • <strong style={{ color: '#303150' }}>150</strong> – הסכום בש״ח
                </p>
              </div>
            </div>

            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3"
              style={{ background: 'rgba(105, 173, 255, 0.08)', border: '1px solid rgba(105, 173, 255, 0.15)' }}
            >
              <span className="text-xs font-medium" style={{ color: '#69ADFF' }}>
                לכל אחד 30 דיווחים בחודש בחינם
              </span>
            </div>

            <div
              className="flex items-start gap-2 px-3 py-2.5 rounded-xl mb-6"
              style={{ background: 'rgba(248, 248, 250, 0.9)', border: '1px solid #E8E8ED' }}
            >
              <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#7E7F90' }} strokeWidth={1.5} />
              <div>
                <p className="text-xs leading-relaxed" style={{ color: '#7E7F90' }}>
                  הדיווח מתאפשר רק מ<strong style={{ color: '#303150' }}>מספרי הטלפון המורשים</strong> (עד 3) ובעזרת <strong style={{ color: '#303150' }}>קוד האימות</strong> שהגדרתם.
                </p>
                {onOpenIvrSettings && (
                  <button
                    type="button"
                    onClick={onOpenIvrSettings}
                    className="flex items-center gap-1 text-xs font-medium mt-1.5 transition-opacity hover:opacity-80"
                    style={{ color: '#69ADFF' }}
                  >
                    <Settings className="w-3 h-3" strokeWidth={1.75} />
                    הגדרת מספרים וקוד אימות
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                סגור
              </button>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex-1 flex items-center justify-center gap-2 no-underline"
              >
                פתח בווצאפ
                <ExternalLink className="w-4 h-4" strokeWidth={1.75} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
