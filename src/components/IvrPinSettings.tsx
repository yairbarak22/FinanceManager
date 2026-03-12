'use client';

import { useState, useEffect } from 'react';
import { Loader2, Check, Trash2, Eye, EyeOff, Save } from 'lucide-react';
import { apiFetch } from '@/lib/utils';

interface IvrPinData {
  hasPin: boolean;
  phoneNumber: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export default function IvrPinSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<IvrPinData | null>(null);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchPinStatus();
  }, []);

  const fetchPinStatus = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/ivr/pin');
      if (res.ok) {
        const d = await res.json();
        setData(d);
        if (d.phoneNumber) setPhoneNumber(d.phoneNumber);
      }
    } catch {
      setError('שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    if (!/^\d{4}$/.test(pin)) {
      setError('הקוד חייב להיות 4 ספרות');
      return;
    }
    if (pin !== confirmPin) {
      setError('הקודות אינם תואמים');
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
        body: JSON.stringify({ pin, phoneNumber }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'שגיאה בשמירה');
        return;
      }

      setSuccess('הקוד הוגדר בהצלחה');
      setPin('');
      setConfirmPin('');
      await fetchPinStatus();
    } catch {
      setError('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הקוד?')) return;

    try {
      setSaving(true);
      const res = await apiFetch('/api/ivr/pin', { method: 'DELETE' });
      if (res.ok) {
        setSuccess('הקוד נמחק');
        setData({ hasPin: false, phoneNumber: null, createdAt: null, updatedAt: null });
        setPhoneNumber('');
      }
    } catch {
      setError('שגיאה במחיקה');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#69ADFF' }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p
        className="text-xs"
        style={{ color: '#BDBDCB', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
      >
        הגדר קוד סודי ומספר טלפון לדיווח הוצאות דרך שיחה טלפונית.
      </p>

      {data?.hasPin && (
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(13, 186, 204, 0.08)', border: '1px solid rgba(13, 186, 204, 0.15)' }}
        >
          <Check className="w-4 h-4" style={{ color: '#0DBACC' }} strokeWidth={2.5} />
          <span
            className="text-xs font-medium"
            style={{ color: '#0DBACC', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
          >
            קוד מוגדר למספר {data.phoneNumber}
          </span>
        </div>
      )}

      {error && (
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
          style={{
            background: 'rgba(241, 138, 181, 0.1)',
            border: '1px solid rgba(241, 138, 181, 0.3)',
            color: '#F18AB5',
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          }}
        >
          {error}
        </div>
      )}
      {success && !data?.hasPin && (
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
          style={{
            background: 'rgba(13, 186, 204, 0.08)',
            border: '1px solid rgba(13, 186, 204, 0.15)',
            color: '#0DBACC',
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          }}
        >
          {success}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="label">מספר טלפון</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
            placeholder="0501234567"
            className="input text-sm"
            dir="ltr"
            maxLength={15}
          />
        </div>

        <div>
          <label className="label">
            {data?.hasPin ? 'קוד חדש' : 'קוד (4 ספרות)'}
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
        </div>

        <div>
          <label className="label">אישור קוד</label>
          <input
            type={showPin ? 'text' : 'password'}
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            className="input text-sm"
            dir="ltr"
            maxLength={4}
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !pin || !confirmPin || !phoneNumber}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {data?.hasPin ? 'עדכן קוד' : 'שמור קוד'}
              <Save className="w-4 h-4" strokeWidth={1.75} />
            </>
          )}
        </button>

        {data?.hasPin && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#F18AB5' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(241, 138, 181, 0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            title="מחק קוד"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
