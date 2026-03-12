'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  User,
  Loader2,
  Check,
  Phone,
  Shield,
  Save,
  UserCog,
  Users,
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
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

type SettingsTab = 'profile' | 'account';

export default function SettingsPage() {
  const { data: session } = useSession();
  const {
    selectedMonth,
    setSelectedMonth,
    allMonths,
    monthsWithData,
    currentMonth,
  } = useMonth();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
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

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
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

  const { name, email, image } = session?.user || {};

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'פרטים אישיים', icon: UserCog },
    { id: 'account' as SettingsTab, label: 'חשבון משותף', icon: Users },
  ];

  return (
    <AppLayout
      pageTitle="הגדרות"
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      allMonths={allMonths}
      monthsWithData={monthsWithData}
      currentMonth={currentMonth}
      showMonthFilter={false}
    >
      <div className="max-w-3xl mx-auto">
        {/* User Identity Header */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            {image ? (
              <img
                src={image}
                alt=""
                className="w-16 h-16 rounded-2xl ring-2 ring-[#F7F7F8] object-cover"
                data-sl="mask"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #C1DDFF 0%, #69ADFF 100%)' }}
              >
                <User className="w-7 h-7 text-white" />
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
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all text-sm font-medium"
                style={{
                  background: isActive ? '#69ADFF' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#7E7F90',
                  border: isActive ? '1px solid #69ADFF' : '1px solid #F7F7F8',
                  boxShadow: isActive
                    ? '0 4px 12px rgba(105, 173, 255, 0.3)'
                    : '0 2px 8px rgba(0, 0, 0, 0.04)',
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                }}
              >
                {tab.label}
                <Icon className="w-4 h-4" strokeWidth={1.75} />
              </button>
            );
          })}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            {/* Loading State */}
            {loading ? (
              <Card>
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#69ADFF' }} />
                </div>
              </Card>
            ) : (
              <>
                {/* Profile Form */}
                <Card>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(105, 173, 255, 0.1)' }}
                    >
                      <UserCog className="w-5 h-5" style={{ color: '#69ADFF' }} strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3
                        className="text-base font-bold"
                        style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                      >
                        פרטים אישיים
                      </h3>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: '#BDBDCB', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                      >
                        המידע משמש לייעוץ פיננסי מותאם אישית
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Age Range */}
                    <div>
                      <label className="label">טווח גיל</label>
                      <StyledSelect
                        value={profile.ageRange || ''}
                        onChange={(v) => setProfile({ ...profile, ageRange: v || null })}
                        options={AGE_OPTIONS}
                        placeholder="בחר טווח גיל"
                      />
                    </div>

                    {/* Marital Status */}
                    <div>
                      <label className="label">מצב משפחתי</label>
                      <StyledSelect
                        value={profile.maritalStatus || ''}
                        onChange={(v) => setProfile({ ...profile, maritalStatus: v || null })}
                        options={MARITAL_OPTIONS}
                        placeholder="בחר מצב משפחתי"
                      />
                    </div>

                    {/* Employment Type */}
                    <div>
                      <label className="label">סוג תעסוקה</label>
                      <StyledSelect
                        value={profile.employmentType || ''}
                        onChange={(v) => setProfile({ ...profile, employmentType: v || null })}
                        options={EMPLOYMENT_OPTIONS}
                        placeholder="בחר סוג תעסוקה"
                      />
                    </div>

                    {/* Monthly Income */}
                    <div>
                      <label className="label">טווח הכנסה חודשית</label>
                      <StyledSelect
                        value={profile.monthlyIncome || ''}
                        onChange={(v) => setProfile({ ...profile, monthlyIncome: v || null })}
                        options={INCOME_OPTIONS}
                        placeholder="בחר טווח הכנסה"
                      />
                    </div>

                    {/* Risk Tolerance */}
                    <div>
                      <label className="label">רמת סיבולת סיכון</label>
                      <StyledSelect
                        value={profile.riskTolerance || ''}
                        onChange={(v) => setProfile({ ...profile, riskTolerance: v || null })}
                        options={RISK_OPTIONS}
                        placeholder="בחר רמת סיכון"
                      />
                    </div>

                    {/* Children */}
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
                            className="w-4.5 h-4.5 rounded-md border-[#E8E8ED] accent-[#69ADFF] cursor-pointer"
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

                  {/* Error Message */}
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

                  {/* Save Button */}
                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      {saved && (
                        <div
                          className="flex items-center gap-2 text-sm animate-fade-in"
                          style={{ color: '#0DBACC', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                        >
                          <Check className="w-4 h-4" strokeWidth={2.5} />
                          <span>השינויים נשמרו בהצלחה</span>
                        </div>
                      )}
                    </div>
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
                  </div>
                </Card>

                {/* IVR Settings */}
                <Card>
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(13, 186, 204, 0.1)' }}
                    >
                      <Phone className="w-5 h-5" style={{ color: '#0DBACC' }} strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3
                        className="text-base font-bold"
                        style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                      >
                        דיווח הוצאות בטלפון
                      </h3>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: '#BDBDCB', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                      >
                        הגדרת PIN לדיווח הוצאות דרך שיחה טלפונית
                      </p>
                    </div>
                  </div>
                  <IvrPinSettings />
                </Card>

                {/* Security Info */}
                <Card>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(159, 127, 224, 0.1)' }}
                    >
                      <Shield className="w-5 h-5" style={{ color: '#9F7FE0' }} strokeWidth={1.75} />
                    </div>
                    <div className="flex-1">
                      <h3
                        className="text-base font-bold"
                        style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                      >
                        אבטחה ופרטיות
                      </h3>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: '#BDBDCB', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
                      >
                        הנתונים שלך מוצפנים ומאובטחים בסטנדרטים הגבוהים ביותר
                      </p>
                    </div>
                  </div>
                  <div
                    className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    {[
                      { label: 'הצפנת AES-256', desc: 'לנתונים רגישים' },
                      { label: 'OAuth 2.0', desc: 'אימות מאובטח' },
                      { label: 'CSRF Protection', desc: 'הגנה מפני תקיפות' },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex flex-col items-center text-center px-4 py-3 rounded-xl"
                        style={{
                          background: '#F7F7F8',
                          fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                        }}
                      >
                        <span className="text-xs font-semibold" style={{ color: '#303150' }}>
                          {item.label}
                        </span>
                        <span className="text-[11px] mt-0.5" style={{ color: '#BDBDCB' }}>
                          {item.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="animate-fade-in">
            <AccountSettingsInline />
          </div>
        )}
      </div>
    </AppLayout>
  );
}

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
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#69ADFF' }} />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Members */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(105, 173, 255, 0.1)' }}
          >
            <Users className="w-5 h-5" style={{ color: '#69ADFF' }} strokeWidth={1.75} />
          </div>
          <div>
            <h3
              className="text-base font-bold"
              style={{ color: '#303150', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
            >
              חברי חשבון
            </h3>
            <p
              className="text-xs mt-0.5"
              style={{ color: '#BDBDCB', fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
            >
              ניהול משתמשים בחשבון המשותף
            </p>
          </div>
        </div>

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
                  data-sl="mask"
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

        {/* Invite */}
        <div className="mt-5 pt-5" style={{ borderTop: '1px solid #F7F7F8' }}>
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
      </Card>
    </div>
  );
}
