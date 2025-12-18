'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  User, 
  Shield, 
  Briefcase, 
  Heart, 
  Users, 
  Calendar, 
  Wallet, 
  TrendingUp,
  ChevronDown,
  Check,
  Loader2
} from 'lucide-react';

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

interface CustomSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: SelectOption[];
  placeholder: string;
  icon?: React.ReactNode;
}

// Custom Select Component
function CustomSelect({ value, onChange, options, placeholder, icon }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={selectRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between gap-2 px-4 py-3 
          bg-white border-2 rounded-xl transition-all duration-200
          ${isOpen 
            ? 'border-pink-400 ring-4 ring-pink-100' 
            : 'border-gray-200 hover:border-gray-300'
          }
        `}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-gray-400">{icon}</span>}
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value || null);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-4 py-3 text-right
                  transition-colors duration-150
                  ${option.value === value 
                    ? 'bg-pink-50 text-pink-700' 
                    : 'hover:bg-gray-50 text-gray-700'
                  }
                `}
              >
                <span>{option.label}</span>
                {option.value === value && (
                  <Check className="w-5 h-5 text-pink-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Section Card Component
function SectionCard({ 
  title, 
  icon, 
  color, 
  children 
}: { 
  title: string; 
  icon: React.ReactNode; 
  color: string;
  children: React.ReactNode;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    pink: 'from-pink-500 to-pink-600',
    emerald: 'from-emerald-500 to-emerald-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className={`px-4 py-3 bg-gradient-to-r ${colorClasses[color] || colorClasses.blue} flex items-center gap-3`}>
        <div className="p-1.5 bg-white/20 rounded-lg">
          {icon}
        </div>
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <div className="p-4 space-y-4">
        {children}
      </div>
    </div>
  );
}

// Options
const MILITARY_OPTIONS: SelectOption[] = [
  { value: '', label: 'לא צוין' },
  { value: 'none', label: 'ללא שירות צבאי' },
  { value: 'reserve', label: 'מילואימניק/ית' },
  { value: 'career', label: 'קבע' },
];

const MARITAL_OPTIONS: SelectOption[] = [
  { value: '', label: 'לא צוין' },
  { value: 'single', label: 'רווק/ה' },
  { value: 'married', label: 'נשוי/אה' },
  { value: 'divorced', label: 'גרוש/ה' },
  { value: 'widowed', label: 'אלמן/ה' },
];

const EMPLOYMENT_OPTIONS: SelectOption[] = [
  { value: '', label: 'לא צוין' },
  { value: 'employee', label: 'שכיר/ה' },
  { value: 'self_employed', label: 'עצמאי/ת' },
  { value: 'both', label: 'שכיר/ה + עצמאי/ת' },
];

const AGE_OPTIONS: SelectOption[] = [
  { value: '', label: 'לא צוין' },
  { value: '18-25', label: '18-25 שנים' },
  { value: '26-35', label: '26-35 שנים' },
  { value: '36-45', label: '36-45 שנים' },
  { value: '46-55', label: '46-55 שנים' },
  { value: '56-65', label: '56-65 שנים' },
  { value: '65+', label: '65+ שנים' },
];

const INCOME_OPTIONS: SelectOption[] = [
  { value: '', label: 'לא צוין' },
  { value: '0-10000', label: 'עד ₪10,000' },
  { value: '10000-20000', label: '₪10,000 - ₪20,000' },
  { value: '20000-35000', label: '₪20,000 - ₪35,000' },
  { value: '35000-50000', label: '₪35,000 - ₪50,000' },
  { value: '50000+', label: 'מעל ₪50,000' },
];

const RISK_OPTIONS: SelectOption[] = [
  { value: '', label: 'לא צוין' },
  { value: 'low', label: '🛡️ נמוכה - העדפה לביטחון' },
  { value: 'medium', label: '⚖️ בינונית - מאוזן' },
  { value: 'high', label: '🚀 גבוהה - מוכן לקחת סיכונים' },
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

  // Calculate profile completion
  const calculateCompletion = () => {
    const fields = [
      profile.ageRange,
      profile.maritalStatus,
      profile.employmentType,
      profile.militaryStatus,
      profile.monthlyIncome,
      profile.riskTolerance,
    ];
    const filledCount = fields.filter(f => f !== null && f !== '').length;
    return Math.round((filledCount / fields.length) * 100);
  };

  const completion = calculateCompletion();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">פרטים אישיים</h2>
              <p className="text-white/80 text-sm">עדכן את הפרטים לקבלת המלצות מותאמות</p>
            </div>
          </div>

          {/* Completion Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/80">השלמת פרופיל</span>
              <span className="font-semibold">{completion}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-280px)] space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            </div>
          ) : (
            <>
              {/* Personal Info Section */}
              <SectionCard 
                title="פרטים כלליים" 
                icon={<User className="w-4 h-4 text-white" />}
                color="blue"
              >
                <div className="space-y-3">
                  <CustomSelect
                    value={profile.ageRange}
                    onChange={(v) => setProfile({ ...profile, ageRange: v })}
                    options={AGE_OPTIONS}
                    placeholder="בחר טווח גיל"
                    icon={<Calendar className="w-4 h-4" />}
                  />
                  <CustomSelect
                    value={profile.maritalStatus}
                    onChange={(v) => setProfile({ ...profile, maritalStatus: v })}
                    options={MARITAL_OPTIONS}
                    placeholder="בחר מצב משפחתי"
                    icon={<Heart className="w-4 h-4" />}
                  />
                </div>
              </SectionCard>

              {/* Employment Section */}
              <SectionCard 
                title="תעסוקה" 
                icon={<Briefcase className="w-4 h-4 text-white" />}
                color="purple"
              >
                <div className="space-y-3">
                  <CustomSelect
                    value={profile.employmentType}
                    onChange={(v) => setProfile({ ...profile, employmentType: v })}
                    options={EMPLOYMENT_OPTIONS}
                    placeholder="בחר סוג תעסוקה"
                    icon={<Briefcase className="w-4 h-4" />}
                  />
                  <CustomSelect
                    value={profile.militaryStatus}
                    onChange={(v) => setProfile({ ...profile, militaryStatus: v })}
                    options={MILITARY_OPTIONS}
                    placeholder="בחר סטטוס צבאי"
                    icon={<Shield className="w-4 h-4" />}
                  />
                </div>
              </SectionCard>

              {/* Family Section */}
              <SectionCard 
                title="משפחה" 
                icon={<Users className="w-4 h-4 text-white" />}
                color="pink"
              >
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <div 
                      className={`
                        relative w-12 h-7 rounded-full transition-colors duration-200
                        ${profile.hasChildren ? 'bg-pink-500' : 'bg-gray-300'}
                      `}
                      onClick={() => setProfile({ 
                        ...profile, 
                        hasChildren: !profile.hasChildren,
                        childrenCount: !profile.hasChildren ? 1 : 0
                      })}
                    >
                      <div 
                        className={`
                          absolute top-1 w-5 h-5 bg-white rounded-full shadow-md
                          transition-all duration-200
                          ${profile.hasChildren ? 'right-1' : 'left-1'}
                        `}
                      />
                    </div>
                    <span className="text-gray-700 font-medium">יש לי ילדים</span>
                  </label>
                  
                  {profile.hasChildren && (
                    <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-200">
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
                        className="w-16 px-3 py-2 border-2 border-gray-200 rounded-xl text-center focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all"
                      />
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* Financial Section */}
              <SectionCard 
                title="מצב פיננסי" 
                icon={<Wallet className="w-4 h-4 text-white" />}
                color="emerald"
              >
                <div className="space-y-3">
                  <CustomSelect
                    value={profile.monthlyIncome}
                    onChange={(v) => setProfile({ ...profile, monthlyIncome: v })}
                    options={INCOME_OPTIONS}
                    placeholder="בחר טווח הכנסה חודשית"
                    icon={<Wallet className="w-4 h-4" />}
                  />
                  <CustomSelect
                    value={profile.riskTolerance}
                    onChange={(v) => setProfile({ ...profile, riskTolerance: v })}
                    options={RISK_OPTIONS}
                    placeholder="בחר רמת סיבולת סיכון"
                    icon={<TrendingUp className="w-4 h-4" />}
                  />
                </div>
              </SectionCard>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all font-medium"
          >
            ביטול
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="
              px-8 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 
              text-white rounded-xl font-medium
              hover:from-pink-600 hover:to-purple-600
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 shadow-lg shadow-pink-500/25
              flex items-center gap-2
            "
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                שמור שינויים
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
