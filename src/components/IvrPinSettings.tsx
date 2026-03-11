'use client';

import { useState, useEffect } from 'react';
import { Phone, Loader2, Check, Trash2, Eye, EyeOff } from 'lucide-react';
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
      setError('PIN חייב להיות 4 ספרות');
      return;
    }
    if (pin !== confirmPin) {
      setError('קודי ה-PIN אינם תואמים');
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

      setSuccess('PIN הוגדר בהצלחה');
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
    if (!confirm('האם אתה בטוח שברצונך למחוק את ה-PIN?')) return;

    try {
      setSaving(true);
      const res = await apiFetch('/api/ivr/pin', { method: 'DELETE' });
      if (res.ok) {
        setSuccess('PIN נמחק');
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
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Phone className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-semibold text-slate-700">דיווח הוצאות בטלפון (IVR)</h3>
      </div>

      <p className="text-xs text-slate-500">
        הגדר קוד סודי ומספר טלפון לדיווח הוצאות דרך שיחה טלפונית.
      </p>

      {data?.hasPin && (
        <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-xs text-green-700">
            PIN מוגדר למספר {data.phoneNumber}
          </span>
        </div>
      )}

      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-600">
          {success}
        </div>
      )}

      <div className="space-y-2">
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">מספר טלפון</label>
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
          <label className="text-xs font-medium text-slate-600 block mb-1">
            {data?.hasPin ? 'קוד PIN חדש' : 'קוד PIN (4 ספרות)'}
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
              className="absolute start-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">אישור PIN</label>
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
          className="btn-primary text-xs py-1.5 px-3 flex-1"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          {data?.hasPin ? 'עדכן PIN' : 'שמור PIN'}
        </button>

        {data?.hasPin && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="מחק PIN"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
