'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Phone, Eye, EyeOff, Loader2, Check, Shield, Copy, Save,
} from 'lucide-react';
import { apiFetch } from '@/lib/utils';

const IVR_PHONE_DISPLAY = process.env.NEXT_PUBLIC_IVR_PHONE_NUMBER || '077-252-2203';

interface IvrPinData {
  hasPin: boolean;
  phoneNumbers: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

interface IvrReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function generateRandomPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function formatPhoneDisplay(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 10)}`;
}

function formatPhoneInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 10);
}

export default function IvrReportModal({ isOpen, onClose, onSuccess }: IvrReportModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<IvrPinData | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [initialPhone, setInitialPhone] = useState('');
  const hasChanges = phoneNumber !== initialPhone || pin.length === 4;
  const isConfigured = data?.hasPin ?? false;

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setPin('');
    setShowPin(false);
    fetchStatus();
  }, [isOpen]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/ivr/pin');
      if (res.ok) {
        const d: IvrPinData = await res.json();
        setData(d);
        const phone = d.phoneNumbers?.[0] ?? '';
        setPhoneNumber(phone);
        setInitialPhone(phone);
      }
    } catch {
      setError('שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError(null);

    if (!/^\d{4}$/.test(pin)) {
      setError('הקוד חייב להיות 4 ספרות');
      return;
    }
    if (!phoneNumber || phoneNumber.length < 9) {
      setError('מספר טלפון לא תקין');
      return;
    }

    try {
      setSaving(true);
      const res = await apiFetch('/api/ivr/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, phoneNumbers: [phoneNumber] }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'שגיאה בשמירה');
        return;
      }

      onClose();
      onSuccess?.();
    } catch {
      setError('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
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
              style={{ background: 'rgba(13, 186, 204, 0.1)' }}
            >
              <Phone className="w-5 h-5" style={{ color: '#0DBACC' }} strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-semibold" style={{ color: '#303150' }}>
              דיווח בשיחה
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

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#69ADFF' }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Right: Onboarding - subtle gray bg, no divider */}
            <div className="p-6" style={{ background: 'rgba(248, 248, 250, 0.9)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#303150' }}>
                דיווח הוצאות בשיחת טלפון
              </h3>

              {/* Step cards */}
              <div className="space-y-3 mb-6">
                <div className="rounded-xl px-4 py-3 bg-white/80">
                  <p className="text-xs font-medium mb-1" style={{ color: '#7E7F90' }}>
                    שלב 1
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm" style={{ color: '#303150' }}>
                      התקשרו למספר
                    </p>
                    <span className="text-base font-bold" style={{ color: '#0DBACC' }}>
                      {IVR_PHONE_DISPLAY}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(IVR_PHONE_DISPLAY.replace(/-/g, ''));
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors hover:bg-[#F7F7F8]"
                      style={{ color: '#69ADFF' }}
                    >
                      <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
                      העתק
                    </button>
                  </div>
                </div>
                <div className="rounded-xl px-4 py-3 bg-white/80">
                  <p className="text-xs font-medium mb-1" style={{ color: '#7E7F90' }}>
                    שלב 2
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: '#303150' }}>
                    עקבו אחר ההוראות והקישו בלחיצות מקשים:
                    <br />
                    • קוד (4 ספרות)
                    <br />
                    • סוג פעולה (1=הוצאה, 2=הכנסה)
                    <br />
                    • קטגוריה (לפי מספר 0-9)
                    <br />
                    • סכום
                    <br />
                    <span style={{ color: '#7E7F90' }}>אין צורך להקליד שם עסק.</span>
                  </p>
                </div>
                <div className="rounded-xl px-4 py-3 bg-white/80">
                  <p className="text-xs font-medium mb-1" style={{ color: '#7E7F90' }}>
                    שלב 3
                  </p>
                  <p className="text-sm" style={{ color: '#303150' }}>
                    אחרי הדיווח אפשר להוסיף שם עסק מהאפליקציה.
                  </p>
                </div>
              </div>
            </div>

            {/* Left: Settings - white */}
            <div className="p-6 bg-white">
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#303150' }}>
                הגדרות זיהוי טלפוני
              </h3>

              {isConfigured && !hasChanges && (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4"
                  style={{ background: 'rgba(13, 186, 204, 0.08)', border: '1px solid rgba(13, 186, 204, 0.15)' }}
                >
                  <Check className="w-4 h-4" style={{ color: '#0DBACC' }} strokeWidth={2.5} />
                  <span className="text-xs font-medium" style={{ color: '#0DBACC' }}>
                    מוגדר ומוכן לשימוש
                  </span>
                </div>
              )}

              {error && (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs mb-4"
                  style={{
                    background: 'rgba(241, 138, 181, 0.1)',
                    border: '1px solid rgba(241, 138, 181, 0.3)',
                    color: '#F18AB5',
                  }}
                >
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Phone number - masked */}
                <div>
                  <label className="label">מאיזה מספר תתקשר אלינו?</label>
                  <input
                    type="tel"
                    value={formatPhoneDisplay(phoneNumber)}
                    onChange={(e) => setPhoneNumber(formatPhoneInput(e.target.value))}
                    placeholder="052-3456789"
                    className="input text-sm"
                    dir="ltr"
                    maxLength={12}
                  />
                  <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: '#7E7F90' }}>
                    <Shield className="w-3 h-3" strokeWidth={1.5} />
                    המערכת תאשר פעולות רק ממספרים מורשים (ניתן להוסיף עד 3 בהגדרות)
                  </p>
                </div>

                {/* PIN - Eye inside, Refresh as text link below */}
                <div>
                  <label className="label">
                    {isConfigured ? 'קוד סודי חדש (4 ספרות)' : 'קוד סודי (4 ספרות)'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="••••"
                      className="input text-sm pe-10"
                      dir="ltr"
                      maxLength={4}
                      inputMode="numeric"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute start-2 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors"
                      style={{ color: '#BDBDCB' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#7E7F90'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#BDBDCB'; }}
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setPin(generateRandomPin()); setShowPin(true); }}
                    className="text-xs mt-1.5 underline transition-opacity hover:opacity-80"
                    style={{ color: '#69ADFF' }}
                  >
                    חולל קוד אקראי
                  </button>
                </div>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-2 pt-6">
                {isConfigured && !hasChanges ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary flex-1"
                  >
                    סגור
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn-secondary"
                    >
                      ביטול
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving || pin.length !== 4 || !phoneNumber}
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          {isConfigured ? 'עדכן פרטים' : 'שמור והפעל'}
                          <Save className="w-4 h-4" strokeWidth={1.75} />
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
