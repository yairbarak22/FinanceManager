'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  User,
  Loader2,
  Check,
  Save,
  AlertTriangle,
  Trash2,
  Calendar,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import StyledSelect from '@/components/ui/StyledSelect';
import IvrPinSettings from '@/components/IvrPinSettings';
import { SensitiveData } from '@/components/common/SensitiveData';
import { useMonth } from '@/context/MonthContext';
import { apiFetch } from '@/lib/utils';

interface UserProfile {
  maritalStatus: string | null;
  employmentType: string | null;
  hasChildren: boolean;
  childrenCount: number;
  ageRange: string | null;
  monthlyIncome: string | null;
  riskTolerance: string | null;
}

const AGE_OPTIONS = [
  { value: '18-25', label: '18-25 שנים' },
  { value: '26-35', label: '26-35 שנים' },
  { value: '36-45', label: '36-45 שנים' },
  { value: '46-55', label: '46-55 שנים' },
  { value: '56-65', label: '56-65 שנים' },
  { value: '65+', label: '65+ שנים' },
];

const MARITAL_OPTIONS = [
  { value: 'single', label: 'רווק/ה' },
  { value: 'married', label: 'נשוי/אה' },
  { value: 'divorced', label: 'גרוש/ה' },
  { value: 'widowed', label: 'אלמן/ה' },
];

const EMPLOYMENT_OPTIONS = [
  { value: 'employee', label: 'שכיר/ה' },
  { value: 'self_employed', label: 'עצמאי/ת' },
  { value: 'both', label: 'שכיר/ה + עצמאי/ת' },
];

const INCOME_OPTIONS = [
  { value: '0-10000', label: 'עד ₪10,000' },
  { value: '10000-20000', label: '₪10,000 - ₪20,000' },
  { value: '20000-35000', label: '₪20,000 - ₪35,000' },
  { value: '35000-50000', label: '₪35,000 - ₪50,000' },
  { value: '50000+', label: 'מעל ₪50,000' },
];

const RISK_OPTIONS = [
  { value: 'low', label: 'נמוכה - העדפה לביטחון' },
  { value: 'medium', label: 'בינונית - מאוזן' },
  { value: 'high', label: 'גבוהה - מוכן לקחת סיכונים' },
];

type SettingsTab = 'profile' | 'account' | 'privacy';

export default function SettingsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const { setFinancialMonthStartDay: setGlobalFinancialMonthStartDay } = useMonth();

  const tabParam = searchParams.get('tab');
  const activeTab: SettingsTab =
    tabParam === 'account' ? 'account' : tabParam === 'privacy' ? 'privacy' : 'profile';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    maritalStatus: null,
    employmentType: null,
    hasChildren: false,
    childrenCount: 0,
    ageRange: null,
    monthlyIncome: null,
    riskTolerance: null,
  });
  const [monthStartDay, setMonthStartDay] = useState<number>(1);
  const [savingMonthStartDay, setSavingMonthStartDay] = useState(false);
  const [monthStartDaySaved, setMonthStartDaySaved] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, settingsRes] = await Promise.all([
        apiFetch('/api/profile'),
        apiFetch('/api/user/settings'),
      ]);
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data);
      }
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setMonthStartDay(data.monthStartDay ?? 1);
      }
    } catch {
      setError('שגיאה בטעינת הפרופיל');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaved(false);
      const res = await apiFetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError('שגיאה בשמירת הפרופיל');
      }
    } catch {
      setError('שגיאה בשמירת הפרופיל');
    } finally {
      setSaving(false);
    }
  };

  const handleMonthStartDayChange = async (value: string) => {
    const newValue = Number(value);
    setMonthStartDay(newValue);
    setSavingMonthStartDay(true);
    setMonthStartDaySaved(false);
    try {
      const res = await apiFetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthStartDay: newValue }),
      });
      if (res.ok) {
        setGlobalFinancialMonthStartDay(newValue);
        setMonthStartDaySaved(true);
        setTimeout(() => setMonthStartDaySaved(false), 3000);
      } else {
        setError('שגיאה בשמירת ההגדרה');
      }
    } catch {
      setError('שגיאה בשמירת ההגדרה');
    } finally {
      setSavingMonthStartDay(false);
    }
  };

  const { name, email, image } = session?.user || {};

  return (
    <div className="max-w-2xl mx-auto">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="animate-fade-in">
            {loading ? (
              <Card>
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#69ADFF' }} />
                </div>
              </Card>
            ) : (
              <Card padding="none">
                {/* --- User Identity --- */}
                <div className="p-6 pb-0">
                  <div className="flex items-center gap-4">
                    {image ? (
                      <img
                        src={image}
                        alt=""
                        className="w-14 h-14 rounded-2xl ring-2 ring-[#F7F7F8] object-cover"
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #C1DDFF 0%, #69ADFF 100%)' }}
                      >
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <SensitiveData
                        as="h2"
                        className="text-lg font-bold truncate"
                        style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                      >
                        {name || 'משתמש'}
                      </SensitiveData>
                      <SensitiveData
                        as="p"
                        className="text-sm truncate mt-0.5"
                        style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                      >
                        {email}
                      </SensitiveData>
                    </div>
                  </div>
                </div>

                {/* --- Divider --- */}
                <div className="mx-6 my-6" style={{ borderTop: '1px solid #F7F7F8' }} />

                {/* --- Profile Form Section --- */}
                <div className="px-6">
                  <h3
                    className="font-semibold"
                    style={{
                      fontSize: '1.125rem',
                      color: '#303150',
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    }}
                  >
                    פרטים אישיים
                  </h3>
                  <p
                    className="text-xs mt-1 mb-5"
                    style={{ color: '#BDBDCB', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                  >
                    המידע משמש לייעוץ פיננסי מותאם אישית
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="label">טווח גיל</label>
                      <StyledSelect
                        value={profile.ageRange || ''}
                        onChange={(v) => setProfile({ ...profile, ageRange: v || null })}
                        options={AGE_OPTIONS}
                        placeholder="בחר טווח גיל"
                      />
                    </div>

                    <div>
                      <label className="label">מצב משפחתי</label>
                      <StyledSelect
                        value={profile.maritalStatus || ''}
                        onChange={(v) => setProfile({ ...profile, maritalStatus: v || null })}
                        options={MARITAL_OPTIONS}
                        placeholder="בחר מצב משפחתי"
                      />
                    </div>

                    <div>
                      <label className="label">סוג תעסוקה</label>
                      <StyledSelect
                        value={profile.employmentType || ''}
                        onChange={(v) => setProfile({ ...profile, employmentType: v || null })}
                        options={EMPLOYMENT_OPTIONS}
                        placeholder="בחר סוג תעסוקה"
                      />
                    </div>

                    <div>
                      <label className="label">טווח הכנסה חודשית</label>
                      <StyledSelect
                        value={profile.monthlyIncome || ''}
                        onChange={(v) => setProfile({ ...profile, monthlyIncome: v || null })}
                        options={INCOME_OPTIONS}
                        placeholder="בחר טווח הכנסה"
                      />
                    </div>

                    <div>
                      <label className="label">רמת סיבולת סיכון</label>
                      <StyledSelect
                        value={profile.riskTolerance || ''}
                        onChange={(v) => setProfile({ ...profile, riskTolerance: v || null })}
                        options={RISK_OPTIONS}
                        placeholder="בחר רמת סיכון"
                      />
                    </div>

                    <div>
                      <label className="label">ילדים</label>
                      <div
                        className="flex items-center gap-4 px-4 py-3 rounded-xl"
                        style={{ border: '1px solid #E8E8ED', background: '#FFFFFF' }}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={profile.hasChildren}
                            onChange={(e) => {
                              setProfile({
                                ...profile,
                                hasChildren: e.target.checked,
                                childrenCount: e.target.checked
                                  ? Math.max(1, profile.childrenCount)
                                  : 0,
                              });
                            }}
                            className="w-4 h-4 rounded-md border-[#E8E8ED] accent-[#69ADFF] cursor-pointer"
                          />
                          <span
                            className="text-sm"
                            style={{
                              color: '#303150',
                              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                            }}
                          >
                            יש לי ילדים
                          </span>
                        </label>

                        {profile.hasChildren && (
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs"
                              style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                            >
                              מספר:
                            </span>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={profile.childrenCount}
                              onChange={(e) =>
                                setProfile({
                                  ...profile,
                                  childrenCount: Math.max(
                                    1,
                                    Math.min(10, Number(e.target.value) || 1)
                                  ),
                                })
                              }
                              className="input w-16 text-center hide-spinner"
                              style={{ padding: '0.375rem 0.5rem', fontSize: '0.875rem' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div
                      className="mt-5 flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
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

                  {/* Save */}
                  <div className="mt-6 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-primary flex items-center gap-2"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          שמור שינויים
                          <Save className="w-4 h-4" strokeWidth={1.75} />
                        </>
                      )}
                    </button>
                    {saved && (
                      <div
                        className="flex items-center gap-1.5 text-sm animate-fade-in"
                        style={{ color: '#0DBACC', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                      >
                        <Check className="w-4 h-4" strokeWidth={2.5} />
                        <span>נשמר</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* --- Divider --- */}
                <div className="mx-6 my-6" style={{ borderTop: '1px solid #F7F7F8' }} />

                {/* --- Financial Month Start Section --- */}
                <div className="px-6 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-[18px] h-[18px]" style={{ color: '#303150' }} strokeWidth={1.75} />
                    <h3
                      className="font-semibold"
                      style={{
                        fontSize: '1.125rem',
                        color: '#303150',
                        fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                      }}
                    >
                      תחילת חודש פיננסי
                    </h3>
                  </div>
                  <p
                    className="text-xs mt-1 mb-4"
                    style={{ color: '#BDBDCB', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                  >
                    בחר את היום שבו מתחיל החודש הכלכלי שלך (למשל, יום ירידת כרטיס האשראי). טווחי התאריכים יותאמו אוטומטית.
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="w-40">
                      <StyledSelect
                        value={String(monthStartDay)}
                        onChange={(value) => handleMonthStartDayChange(value)}
                        options={Array.from({ length: 28 }, (_, i) => ({
                          value: String(i + 1),
                          label: `יום ${i + 1}`,
                        }))}
                        disabled={savingMonthStartDay}
                      />
                    </div>
                    {savingMonthStartDay && (
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#BDBDCB' }} />
                    )}
                    {monthStartDaySaved && (
                      <div
                        className="flex items-center gap-1.5 text-sm animate-fade-in"
                        style={{ color: '#0DBACC', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                      >
                        <Check className="w-4 h-4" strokeWidth={2.5} />
                        <span>נשמר</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* --- Divider --- */}
                <div className="mx-6 my-6" style={{ borderTop: '1px solid #F7F7F8' }} />

                {/* --- Phone Reporting Section --- */}
                <div className="px-6 pb-6">
                  <h3
                    className="font-semibold"
                    style={{
                      fontSize: '1.125rem',
                      color: '#303150',
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    }}
                  >
                    דיווח הוצאות בטלפון
                  </h3>
                  <p
                    className="text-xs mt-1 mb-5"
                    style={{ color: '#BDBDCB', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                  >
                    הגדרת קוד ומספרי טלפון מורשים לדיווח הוצאות
                  </p>

                  <IvrPinSettings />
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="animate-fade-in">
            <AccountSettingsInline />
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="animate-fade-in">
            <PrivacySettingsInline />
          </div>
        )}
    </div>
  );
}

/* ─── Privacy Settings ─── */

const DELETABLE_DATA = [
  'עסקאות והיסטוריית תזרים',
  'עסקאות קבועות',
  'נכסים והיסטוריית ערכים',
  'התחייבויות והלוואות',
  'יעדים פיננסיים',
  'תיק השקעות והחזקות',
  'קטגוריות מותאמות אישית',
  'פרופיל אישי ועדפות',
  'היסטוריית שווי נקי',
];

function PrivacySettingsInline() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await apiFetch('/api/user/delete-all-data', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'שגיאה במחיקת הנתונים');
        setIsDeleting(false);
        return;
      }
      await signOut({ callbackUrl: '/' });
    } catch {
      setError('שגיאה בחיבור לשרת. נסה שוב.');
      setIsDeleting(false);
    }
  };

  return (
    <Card padding="none">
      <div className="p-6">
        <h3
          className="font-semibold"
          style={{
            fontSize: '1.125rem',
            color: '#303150',
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          }}
        >
          מחיקת נתונים
        </h3>
        <p
          className="text-xs mt-1 mb-5"
          style={{ color: '#BDBDCB', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
        >
          מחיקת כל הנתונים הפיננסיים מהמערכת
        </p>

        {/* Warning */}
        <div
          className="flex gap-3 p-4 rounded-xl mb-5"
          style={{
            background: 'rgba(241, 138, 181, 0.06)',
            border: '1px solid rgba(241, 138, 181, 0.15)',
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(241, 138, 181, 0.12)' }}
          >
            <AlertTriangle className="w-[1.125rem] h-[1.125rem]" style={{ color: '#F18AB5' }} strokeWidth={1.75} />
          </div>
          <div>
            <p
              className="text-[0.8125rem] font-semibold"
              style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
            >
              פעולה זו בלתי הפיכה
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
            >
              לאחר המחיקה תנותק אוטומטית ולא ניתן יהיה לשחזר את הנתונים.
            </p>
          </div>
        </div>

        {/* Data list */}
        <p
          className="text-[0.8125rem] font-medium mb-3"
          style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
        >
          הנתונים הבאים יימחקו לצמיתות:
        </p>
        <div className="space-y-1.5 mb-6">
          {DELETABLE_DATA.map((item) => (
            <div key={item} className="flex items-center gap-2.5">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: '#F18AB5' }}
              />
              <span
                className="text-[0.8125rem]"
                style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
              >
                {item}
              </span>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm animate-fade-in"
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

        {/* Action */}
        {!showConfirm ? (
          <motion.button
            type="button"
            onClick={() => setShowConfirm(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200"
            style={{
              color: '#F18AB5',
              background: 'rgba(241, 138, 181, 0.08)',
              border: '1px solid rgba(241, 138, 181, 0.2)',
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
            }}
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.75} />
            מחק כל הנתונים
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex gap-3"
          >
            <button
              type="button"
              onClick={() => { setShowConfirm(false); setError(null); }}
              disabled={isDeleting}
              className="btn-secondary flex-1"
            >
              ביטול
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-200"
              style={{
                backgroundColor: isDeleting ? 'rgba(241, 138, 181, 0.5)' : '#F18AB5',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              }}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  מוחק...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                  אישור מחיקה
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>
    </Card>
  );
}

/* ─── Account Settings ─── */

function AccountSettingsInline() {
  const [loading, setLoading] = useState(true);
  const [, setAccountName] = useState('');
  const [members, setMembers] = useState<Array<{
    id: string;
    userId: string;
    role: string;
    joinedAt: string;
    user: { id: string; name: string | null; email: string; image: string | null };
  }>>([]);
  const [invites, setInvites] = useState<Array<{
    id: string;
    email: string;
    token: string;
    expiresAt: string;
    createdAt: string;
  }>>([]);
  const [newEmail, setNewEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [membersRes, invitesRes] = await Promise.all([
        apiFetch('/api/account/members'),
        apiFetch('/api/account/invite'),
      ]);
      if (membersRes.ok) {
        const data = await membersRes.json();
        setAccountName(data.accountName);
        setMembers(data.members);
        setCurrentUserId(data.currentUserId || '');
      }
      if (invitesRes.ok) {
        const data = await invitesRes.json();
        setInvites(data);
      }
    } catch {
      setError('שגיאה בטעינת נתוני החשבון');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      setError('נא להזין כתובת מייל תקינה');
      return;
    }
    try {
      setInviting(true);
      setError(null);
      const res = await apiFetch('/api/account/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'שגיאה בשליחת ההזמנה');
        return;
      }
      setNewEmail('');
      await fetchData();
    } catch {
      setError('שגיאה בשליחת ההזמנה');
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = async (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('האם אתה בטוח שברצונך להסיר משתמש זה?')) return;
    try {
      await apiFetch(`/api/account/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });
      await fetchData();
    } catch {
      setError('שגיאה בהסרת המשתמש');
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#69ADFF' }} />
        </div>
      </Card>
    );
  }

  return (
    <Card padding="none">
      <div className="p-6">
        <h3
          className="font-semibold"
          style={{
            fontSize: '1.125rem',
            color: '#303150',
            fontFamily: 'var(--font-nunito), system-ui, sans-serif',
          }}
        >
          חברי חשבון
        </h3>
        <p
          className="text-xs mt-1 mb-5"
          style={{ color: '#BDBDCB', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
        >
          ניהול משתמשים בחשבון המשותף
        </p>

        {error && (
          <div
            className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
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

        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
              style={{ background: '#F7F7F8' }}
            >
              {member.user.image ? (
                <img
                  src={member.user.image}
                  alt=""
                  className="w-9 h-9 rounded-xl object-cover"
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(105, 173, 255, 0.15)' }}
                >
                  <User className="w-4 h-4" style={{ color: '#69ADFF' }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <SensitiveData
                  as="p"
                  className="text-sm font-medium truncate"
                  style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                >
                  {member.user.name || 'משתמש'}
                </SensitiveData>
                <SensitiveData
                  as="p"
                  className="text-xs truncate"
                  style={{ color: '#BDBDCB', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                >
                  {member.user.email}
                </SensitiveData>
              </div>
              {member.role === 'owner' ? (
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-lg"
                  style={{
                    background: 'rgba(13, 186, 204, 0.1)',
                    color: '#0DBACC',
                    fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                  }}
                >
                  בעלים
                </span>
              ) : (
                member.userId !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{
                      color: '#F18AB5',
                      background: 'rgba(241, 138, 181, 0.1)',
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    }}
                  >
                    הסר
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-6" style={{ borderTop: '1px solid #F7F7F8' }} />

      {/* Invite */}
      <div className="p-6">
        <label className="label">הזמנת משתמש חדש</label>
        <div className="flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="כתובת מייל"
            className="input flex-1"
            dir="ltr"
          />
          <button
            type="button"
            onClick={handleInvite}
            disabled={inviting || !newEmail}
            className="btn-primary whitespace-nowrap"
          >
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'הזמן'}
          </button>
        </div>

        {/* Pending Invites */}
        {invites.length > 0 && (
          <div className="mt-5 pt-5" style={{ borderTop: '1px solid #F7F7F8' }}>
            <p
              className="text-xs font-medium mb-3"
              style={{ color: '#7E7F90', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
            >
              הזמנות ממתינות
            </p>
            <div className="space-y-2">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{ background: '#F7F7F8' }}
                >
                  <SensitiveData
                    as="span"
                    className="text-sm"
                    style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                  >
                    {invite.email}
                  </SensitiveData>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(invite.token)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{
                      color: copiedToken === invite.token ? '#0DBACC' : '#69ADFF',
                      background: copiedToken === invite.token
                        ? 'rgba(13, 186, 204, 0.1)'
                        : 'rgba(105, 173, 255, 0.1)',
                      fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                    }}
                  >
                    {copiedToken === invite.token ? 'הועתק!' : 'העתק קישור'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
