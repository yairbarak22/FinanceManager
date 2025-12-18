'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface UserProfile {
  militaryStatus: string | null;
  maritalStatus: string | null;
  employmentType: string | null;
  hasChildren: boolean;
  childrenCount: number;
  ageRange: string | null;
  monthlyIncome: string | null;
  riskTolerance: string | null;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Options
const AGE_OPTIONS = [
  { value: '', label: 'בחר טווח גיל' },
  { value: '18-25', label: '18-25 שנים' },
  { value: '26-35', label: '26-35 שנים' },
  { value: '36-45', label: '36-45 שנים' },
  { value: '46-55', label: '46-55 שנים' },
  { value: '56-65', label: '56-65 שנים' },
  { value: '65+', label: '65+ שנים' },
];

const MARITAL_OPTIONS = [
  { value: '', label: 'בחר מצב משפחתי' },
  { value: 'single', label: 'רווק/ה' },
  { value: 'married', label: 'נשוי/אה' },
  { value: 'divorced', label: 'גרוש/ה' },
  { value: 'widowed', label: 'אלמן/ה' },
];

const EMPLOYMENT_OPTIONS = [
  { value: '', label: 'בחר סוג תעסוקה' },
  { value: 'employee', label: 'שכיר/ה' },
  { value: 'self_employed', label: 'עצמאי/ת' },
  { value: 'both', label: 'שכיר/ה + עצמאי/ת' },
];

const MILITARY_OPTIONS = [
  { value: '', label: 'בחר סטטוס צבאי' },
  { value: 'none', label: 'ללא שירות צבאי' },
  { value: 'reserve', label: 'מילואימניק/ית' },
  { value: 'career', label: 'קבע' },
];

const INCOME_OPTIONS = [
  { value: '', label: 'בחר טווח הכנסה' },
  { value: '0-10000', label: 'עד ₪10,000' },
  { value: '10000-20000', label: '₪10,000 - ₪20,000' },
  { value: '20000-35000', label: '₪20,000 - ₪35,000' },
  { value: '35000-50000', label: '₪35,000 - ₪50,000' },
  { value: '50000+', label: 'מעל ₪50,000' },
];

const RISK_OPTIONS = [
  { value: '', label: 'בחר רמת סיכון' },
  { value: 'low', label: 'נמוכה - העדפה לביטחון' },
  { value: 'medium', label: 'בינונית - מאוזן' },
  { value: 'high', label: 'גבוהה - מוכן לקחת סיכונים' },
];

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    militaryStatus: null,
    maritalStatus: null,
    employmentType: null,
    hasChildren: false,
    childrenCount: 0,
    ageRange: null,
    monthlyIncome: null,
    riskTolerance: null,
  });

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="text-xl font-bold text-gray-900">פרטים אישיים</h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Age Range */}
              <div>
                <label className="label">טווח גיל</label>
                <select
                  value={profile.ageRange || ''}
                  onChange={(e) => setProfile({ ...profile, ageRange: e.target.value || null })}
                  className="select"
                >
                  {AGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Marital Status */}
              <div>
                <label className="label">מצב משפחתי</label>
                <select
                  value={profile.maritalStatus || ''}
                  onChange={(e) => setProfile({ ...profile, maritalStatus: e.target.value || null })}
                  className="select"
                >
                  {MARITAL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employment Type */}
              <div>
                <label className="label">סוג תעסוקה</label>
                <select
                  value={profile.employmentType || ''}
                  onChange={(e) => setProfile({ ...profile, employmentType: e.target.value || null })}
                  className="select"
                >
                  {EMPLOYMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Military Status */}
              <div>
                <label className="label">סטטוס צבאי</label>
                <select
                  value={profile.militaryStatus || ''}
                  onChange={(e) => setProfile({ ...profile, militaryStatus: e.target.value || null })}
                  className="select"
                >
                  {MILITARY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Children */}
              <div>
                <label className="label">ילדים</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.hasChildren}
                      onChange={(e) => setProfile({ 
                        ...profile, 
                        hasChildren: e.target.checked,
                        childrenCount: e.target.checked ? Math.max(1, profile.childrenCount) : 0
                      })}
                      className="w-5 h-5 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                    />
                    <span className="text-gray-700">יש לי ילדים</span>
                  </label>
                  
                  {profile.hasChildren && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">מספר:</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={profile.childrenCount}
                        onChange={(e) => setProfile({ 
                          ...profile, 
                          childrenCount: Math.max(1, Math.min(10, Number(e.target.value) || 1))
                        })}
                        className="input w-20 text-center"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Monthly Income */}
              <div>
                <label className="label">טווח הכנסה חודשית</label>
                <select
                  value={profile.monthlyIncome || ''}
                  onChange={(e) => setProfile({ ...profile, monthlyIncome: e.target.value || null })}
                  className="select"
                >
                  {INCOME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Risk Tolerance */}
              <div>
                <label className="label">רמת סיבולת סיכון</label>
                <select
                  value={profile.riskTolerance || ''}
                  onChange={(e) => setProfile({ ...profile, riskTolerance: e.target.value || null })}
                  className="select"
                >
                  {RISK_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                ביטול
              </button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    שומר...
                  </>
                ) : (
                  'שמור'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
