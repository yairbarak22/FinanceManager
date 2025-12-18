'use client';

import { useState, useEffect } from 'react';
import { X, User, Shield, Briefcase, Heart, Baby, Calendar, Wallet, TrendingUp } from 'lucide-react';

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

const MILITARY_OPTIONS = [
  { value: '', label: 'לא צוין' },
  { value: 'none', label: 'ללא שירות' },
  { value: 'reserve', label: 'מילואימניק' },
  { value: 'career', label: 'קבע' },
];

const MARITAL_OPTIONS = [
  { value: '', label: 'לא צוין' },
  { value: 'single', label: 'רווק/ה' },
  { value: 'married', label: 'נשוי/אה' },
  { value: 'divorced', label: 'גרוש/ה' },
  { value: 'widowed', label: 'אלמן/ה' },
];

const EMPLOYMENT_OPTIONS = [
  { value: '', label: 'לא צוין' },
  { value: 'employee', label: 'שכיר/ה' },
  { value: 'self_employed', label: 'עצמאי/ת' },
  { value: 'both', label: 'שכיר/ה + עצמאי/ת' },
];

const AGE_OPTIONS = [
  { value: '', label: 'לא צוין' },
  { value: '18-25', label: '18-25' },
  { value: '26-35', label: '26-35' },
  { value: '36-45', label: '36-45' },
  { value: '46-55', label: '46-55' },
  { value: '56-65', label: '56-65' },
  { value: '65+', label: '65+' },
];

const INCOME_OPTIONS = [
  { value: '', label: 'לא צוין' },
  { value: '0-10000', label: 'עד ₪10,000' },
  { value: '10000-20000', label: '₪10,000 - ₪20,000' },
  { value: '20000-35000', label: '₪20,000 - ₪35,000' },
  { value: '35000-50000', label: '₪35,000 - ₪50,000' },
  { value: '50000+', label: 'מעל ₪50,000' },
];

const RISK_OPTIONS = [
  { value: '', label: 'לא צוין' },
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

  const handleSave = async () => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">פרטים אישיים</h2>
              <p className="text-xs text-gray-500">עדכן את הפרטים לקבלת המלצות מותאמות</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Military Status */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Shield className="w-4 h-4 text-gray-400" />
                  שירות צבאי
                </label>
                <select
                  value={profile.militaryStatus || ''}
                  onChange={(e) => setProfile({ ...profile, militaryStatus: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  {MILITARY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Marital Status */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Heart className="w-4 h-4 text-gray-400" />
                  מצב משפחתי
                </label>
                <select
                  value={profile.maritalStatus || ''}
                  onChange={(e) => setProfile({ ...profile, maritalStatus: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  {MARITAL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Employment Type */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  סוג תעסוקה
                </label>
                <select
                  value={profile.employmentType || ''}
                  onChange={(e) => setProfile({ ...profile, employmentType: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  {EMPLOYMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Children */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Baby className="w-4 h-4 text-gray-400" />
                  ילדים
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={profile.hasChildren}
                      onChange={(e) => setProfile({ 
                        ...profile, 
                        hasChildren: e.target.checked,
                        childrenCount: e.target.checked ? profile.childrenCount || 1 : 0
                      })}
                      className="w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                    />
                    <span className="text-sm text-gray-600">יש לי ילדים</span>
                  </label>
                  {profile.hasChildren && (
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={profile.childrenCount}
                      onChange={(e) => setProfile({ ...profile, childrenCount: Number(e.target.value) })}
                      className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  )}
                </div>
              </div>

              {/* Age Range */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  טווח גיל
                </label>
                <select
                  value={profile.ageRange || ''}
                  onChange={(e) => setProfile({ ...profile, ageRange: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  {AGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Monthly Income */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Wallet className="w-4 h-4 text-gray-400" />
                  הכנסה חודשית (ברוטו)
                </label>
                <select
                  value={profile.monthlyIncome || ''}
                  onChange={(e) => setProfile({ ...profile, monthlyIncome: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  {INCOME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Risk Tolerance */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  סיבולת סיכון
                </label>
                <select
                  value={profile.riskTolerance || ''}
                  onChange={(e) => setProfile({ ...profile, riskTolerance: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  {RISK_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ביטול
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </div>
    </div>
  );
}

