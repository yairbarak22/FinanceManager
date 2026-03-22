'use client';

import { useState, useEffect } from 'react';
import { Loader2, Check, Trash2, Eye, EyeOff, Save, Plus, X } from 'lucide-react';
import { apiFetch } from '@/lib/utils';

const MAX_PHONES = 3;

interface IvrPinData {
  hasPin: boolean;
  phoneNumbers: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

export default function IvrPinSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<IvrPinData | null>(null);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>(['']);
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
        const d: IvrPinData = await res.json();
        setData(d);
        if (d.phoneNumbers.length > 0) {
          setPhoneNumbers(d.phoneNumbers);
        }
      }
    } catch {
      setError('שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  };

  const updatePhone = (index: number, value: string) => {
    const updated = [...phoneNumbers];
    updated[index] = value.replace(/\D/g, '');
    setPhoneNumbers(updated);
  };

  const addPhone = () => {
    if (phoneNumbers.length < MAX_PHONES) {
      setPhoneNumbers([...phoneNumbers, '']);
    }
  };

  const removePhone = (index: number) => {
    if (phoneNumbers.length <= 1) return;
    setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
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

    const validPhones = phoneNumbers.filter((p) => p.length >= 9);
    if (validPhones.length === 0) {
      setError('יש להזין לפחות מספר טלפון אחד תקין');
      return;
    }

    const uniquePhones = [...new Set(validPhones)];
    if (uniquePhones.length < validPhones.length) {
      setError('מספרי טלפון חייבים להיות שונים זה מזה');
      return;
    }

    try {
      setSaving(true);
      const res = await apiFetch('/api/ivr/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, phoneNumbers: validPhones }),
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
    if (!confirm('האם אתה בטוח שברצונך למחוק את הקוד ואת כל מספרי הטלפון המורשים?')) return;

    try {
      setSaving(true);
      const res = await apiFetch('/api/ivr/pin', { method: 'DELETE' });
      if (res.ok) {
        setSuccess('הקוד נמחק');
        setData({ hasPin: false, phoneNumbers: [], createdAt: null, updatedAt: null });
        setPhoneNumbers(['']);
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
        הגדירו קוד סודי אחד ועד {MAX_PHONES} מספרי טלפון לדיווח הוצאות, כך שמספר בני משפחה יוכלו לדווח לאותו חשבון.
      </p>

      {data?.hasPin && data.phoneNumbers.length > 0 && (
        <div
          className="px-3 py-2.5 rounded-xl space-y-1"
          style={{ background: 'rgba(13, 186, 204, 0.08)', border: '1px solid rgba(13, 186, 204, 0.15)' }}
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" style={{ color: '#0DBACC' }} strokeWidth={2.5} />
            <span
              className="text-xs font-medium"
              style={{ color: '#0DBACC', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
            >
              קוד מוגדר ל-{data.phoneNumbers.length} {data.phoneNumbers.length === 1 ? 'מספר' : 'מספרים'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 ps-6">
            {data.phoneNumbers.map((phone) => (
              <span
                key={phone}
                className="text-xs px-2 py-0.5 rounded-lg"
                dir="ltr"
                style={{
                  background: 'rgba(13, 186, 204, 0.1)',
                  color: '#0DBACC',
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                }}
              >
                {phone}
              </span>
            ))}
          </div>
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
        <div className="space-y-2">
          <label className="label">מספרי טלפון מורשים (עד {MAX_PHONES})</label>
          {phoneNumbers.map((phone, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => updatePhone(index, e.target.value)}
                placeholder={`מספר ${index + 1} — 0501234567`}
                className="input text-sm flex-1"
                dir="ltr"
                maxLength={15}
              />
              {phoneNumbers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePhone(index)}
                  className="p-1.5 rounded-lg transition-colors shrink-0"
                  style={{ color: '#BDBDCB' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#F18AB5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#BDBDCB'; }}
                >
                  <X className="w-4 h-4" strokeWidth={1.75} />
                </button>
              )}
            </div>
          ))}
          {phoneNumbers.length < MAX_PHONES && (
            <button
              type="button"
              onClick={addPhone}
              className="flex items-center gap-1.5 text-xs font-medium py-1 transition-colors"
              style={{ color: '#69ADFF', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              הוסף מספר
            </button>
          )}
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
          disabled={saving || !pin || !confirmPin || phoneNumbers.every((p) => p.length < 9)}
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
            title="מחק קוד וכל המספרים"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
