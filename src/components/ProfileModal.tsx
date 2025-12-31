'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, ChevronDown, Check } from 'lucide-react';
import { cn, apiFetch } from '@/lib/utils';
import { SensitiveData } from './common/SensitiveData';

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

interface SelectOption {
  value: string;
  label: string;
}

interface StyledSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: SelectOption[];
  placeholder: string;
}

// Styled Select Component matching CategorySelect design
function StyledSelect({ value, onChange, options, placeholder }: StyledSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue || null);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'category-select-trigger',
          !selectedOption && 'text-slate-400'
        )}
      >
        <SensitiveData className={cn('flex-1 text-right', selectedOption ? 'text-slate-900' : 'text-slate-400')}>
          {selectedOption?.label || placeholder}
        </SensitiveData>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="category-dropdown animate-scale-in">
          <div className="category-options-list">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'category-option',
                  value === option.value && 'selected'
                )}
              >
                <span className="flex-1 text-right">{option.label}</span>
                {value === option.value && (
                  <Check className="w-4 h-4 text-indigo-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Options
const AGE_OPTIONS: SelectOption[] = [
  { value: '', label: 'בחר טווח גיל' },
  { value: '18-25', label: '18-25 שנים' },
  { value: '26-35', label: '26-35 שנים' },
  { value: '36-45', label: '36-45 שנים' },
  { value: '46-55', label: '46-55 שנים' },
  { value: '56-65', label: '56-65 שנים' },
  { value: '65+', label: '65+ שנים' },
];

const MARITAL_OPTIONS: SelectOption[] = [
  { value: '', label: 'בחר מצב משפחתי' },
  { value: 'single', label: 'רווק/ה' },
  { value: 'married', label: 'נשוי/אה' },
  { value: 'divorced', label: 'גרוש/ה' },
  { value: 'widowed', label: 'אלמן/ה' },
];

const EMPLOYMENT_OPTIONS: SelectOption[] = [
  { value: '', label: 'בחר סוג תעסוקה' },
  { value: 'employee', label: 'שכיר/ה' },
  { value: 'self_employed', label: 'עצמאי/ת' },
  { value: 'both', label: 'שכיר/ה + עצמאי/ת' },
];

const MILITARY_OPTIONS: SelectOption[] = [
  { value: '', label: 'בחר סטטוס צבאי' },
  { value: 'none', label: 'ללא שירות צבאי' },
  { value: 'reserve', label: 'מילואימניק/ית' },
  { value: 'career', label: 'קבע' },
];

const INCOME_OPTIONS: SelectOption[] = [
  { value: '', label: 'בחר טווח הכנסה' },
  { value: '0-10000', label: 'עד ₪10,000' },
  { value: '10000-20000', label: '₪10,000 - ₪20,000' },
  { value: '20000-35000', label: '₪20,000 - ₪35,000' },
  { value: '35000-50000', label: '₪35,000 - ₪50,000' },
  { value: '50000+', label: 'מעל ₪50,000' },
];

const RISK_OPTIONS: SelectOption[] = [
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
      const res = await apiFetch('/api/profile');
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
      const res = await apiFetch('/api/profile', {
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
          <h2 className="text-xl font-bold text-slate-900">פרטים אישיים</h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Age Range */}
              <div>
                <label className="label">טווח גיל</label>
                <StyledSelect
                  value={profile.ageRange}
                  onChange={(v) => setProfile({ ...profile, ageRange: v })}
                  options={AGE_OPTIONS}
                  placeholder="בחר טווח גיל"
                />
              </div>

              {/* Marital Status */}
              <div>
                <label className="label">מצב משפחתי</label>
                <StyledSelect
                  value={profile.maritalStatus}
                  onChange={(v) => setProfile({ ...profile, maritalStatus: v })}
                  options={MARITAL_OPTIONS}
                  placeholder="בחר מצב משפחתי"
                />
              </div>

              {/* Employment Type */}
              <div>
                <label className="label">סוג תעסוקה</label>
                <StyledSelect
                  value={profile.employmentType}
                  onChange={(v) => setProfile({ ...profile, employmentType: v })}
                  options={EMPLOYMENT_OPTIONS}
                  placeholder="בחר סוג תעסוקה"
                />
              </div>

              {/* Military Status */}
              <div>
                <label className="label">סטטוס צבאי</label>
                <StyledSelect
                  value={profile.militaryStatus}
                  onChange={(v) => setProfile({ ...profile, militaryStatus: v })}
                  options={MILITARY_OPTIONS}
                  placeholder="בחר סטטוס צבאי"
                />
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
                      className="w-5 h-5 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-slate-700">יש לי ילדים</span>
                  </label>
                  
                  {profile.hasChildren && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">מספר:</span>
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
                <StyledSelect
                  value={profile.monthlyIncome}
                  onChange={(v) => setProfile({ ...profile, monthlyIncome: v })}
                  options={INCOME_OPTIONS}
                  placeholder="בחר טווח הכנסה"
                />
              </div>

              {/* Risk Tolerance */}
              <div>
                <label className="label">רמת סיבולת סיכון</label>
                <StyledSelect
                  value={profile.riskTolerance}
                  onChange={(v) => setProfile({ ...profile, riskTolerance: v })}
                  options={RISK_OPTIONS}
                  placeholder="בחר רמת סיכון"
                />
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
