'use client';

import { useState, useEffect } from 'react';
import { Users, UserCheck, Clock, FileText, CreditCard, UserCog, Upload, UsersRound } from 'lucide-react';
import { apiFetch } from '@/lib/utils';
import UserSelector from './UserSelector';
import CsvUploader from './CsvUploader';

interface SegmentFilter {
  type: 'all' | 'freeOnly' | 'inactiveDays' | 'hasProfile' | 'noTransactionsThisMonth' | 'haredi' | 'manual' | 'csv' | 'custom';
  days?: number;
  selectedUserIds?: string[];
  csvEmails?: string[];
  customFilter?: unknown;
}

interface SegmentSelectorProps {
  value: SegmentFilter;
  onChange: (filter: SegmentFilter) => void;
  onCountChange?: (count: number) => void;
}

export default function SegmentSelector({ value, onChange, onCountChange }: SegmentSelectorProps) {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Skip API call for manual and csv (they have their own counts)
    if (value.type === 'manual' || value.type === 'csv') {
      if (value.type === 'manual') {
        const count = (value.selectedUserIds || []).length;
        setUserCount(count);
        if (onCountChange) {
          onCountChange(count);
        }
      } else if (value.type === 'csv') {
        const count = (value.csvEmails || []).length;
        setUserCount(count);
        if (onCountChange) {
          onCountChange(count);
        }
      }
      return;
    }

    // Calculate user count when filter changes
    const calculateCount = async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/api/admin/marketing/campaigns/preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ segmentFilter: value }),
        });

        if (res.ok) {
          const data = await res.json();
          setUserCount(data.userCount || 0);
          if (onCountChange) {
            onCountChange(data.userCount || 0);
          }
        }
      } catch {
        setUserCount(null);
      } finally {
        setLoading(false);
      }
    };

    calculateCount();
  }, [value, onCountChange]);

  const segmentOptions = [
    {
      id: 'all',
      label: 'כל המשתמשים',
      icon: Users,
      description: 'כל המשתמשים המנויים לדיוור',
    },
    {
      id: 'haredi',
      label: 'משתמשים חרדים',
      icon: UsersRound,
      description: 'משתמשים שהגיעו מ-prog.co.il',
    },
    {
      id: 'freeOnly',
      label: 'משתמשים חינמיים בלבד',
      icon: UserCheck,
      description: 'משתמשים ללא גישה לפרימיום',
    },
    {
      id: 'inactiveDays',
      label: 'משתמשים לא פעילים',
      icon: Clock,
      description: 'משתמשים שלא התחברו X ימים',
    },
    {
      id: 'hasProfile',
      label: 'משתמשים עם פרופיל מלא',
      icon: FileText,
      description: 'משתמשים שהשלימו את הפרופיל',
    },
    {
      id: 'noTransactionsThisMonth',
      label: 'ללא הוצאות החודש',
      icon: CreditCard,
      description: 'משתמשים ללא עסקאות החודש',
    },
    {
      id: 'manual',
      label: 'בחירה ידנית',
      icon: UserCog,
      description: 'בחר משתמשים אחד אחד',
    },
    {
      id: 'csv',
      label: 'העלאת CSV',
      icon: Upload,
      description: 'העלה קובץ CSV עם כתובות אימייל',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#303150] mb-3">
          בחירת קהל
        </label>
        <div className="space-y-2">
          {segmentOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = value.type === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  const newFilter: SegmentFilter = {
                    type: option.id as SegmentFilter['type'],
                    ...(option.id === 'inactiveDays' && { days: 30 }),
                  };
                  onChange(newFilter);
                }}
                className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-[#69ADFF] bg-[#69ADFF]/5'
                    : 'border-[#E8E8ED] bg-white hover:border-[#69ADFF]/50'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-[#69ADFF] text-white' : 'bg-[#F7F7F8] text-[#7E7F90]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-right">
                  <p className={`font-medium ${isSelected ? 'text-[#303150]' : 'text-[#7E7F90]'}`}>
                    {option.label}
                  </p>
                  <p className="text-xs text-[#BDBDCB] mt-1">{option.description}</p>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[#69ADFF] flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Days input for inactiveDays */}
      {value.type === 'inactiveDays' && (
        <div>
          <label className="block text-sm font-medium text-[#303150] mb-2">
            מספר ימים
          </label>
          <input
            type="number"
            min="1"
            value={value.days || 30}
            onChange={(e) => {
              onChange({
                ...value,
                days: parseInt(e.target.value) || 30,
              });
            }}
            className="w-full px-4 py-3 border border-[#E8E8ED] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:border-transparent"
          />
        </div>
      )}

      {/* Manual user selection */}
      {value.type === 'manual' && (
        <div>
          <UserSelector
            selectedUserIds={value.selectedUserIds || []}
            onChange={(userIds) => {
              onChange({
                ...value,
                selectedUserIds: userIds,
              });
            }}
          />
        </div>
      )}

      {/* CSV upload */}
      {value.type === 'csv' && (
        <div>
          <CsvUploader
            emails={value.csvEmails || []}
            onChange={(emails) => {
              onChange({
                ...value,
                csvEmails: emails,
              });
            }}
          />
        </div>
      )}

      {/* User count display */}
      {(value.type !== 'manual' && value.type !== 'csv') && (
        <div className="bg-[#F7F7F8] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#7E7F90]">מספר משתמשים מתאימים:</span>
            {loading ? (
              <span className="text-sm text-[#BDBDCB]">מחשב...</span>
            ) : (
              <span className="text-lg font-bold text-[#303150]">
                {userCount !== null ? userCount.toLocaleString() : '-'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Manual selection count */}
      {value.type === 'manual' && (
        <div className="bg-[#F7F7F8] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#7E7F90]">מספר משתמשים נבחרים:</span>
            <span className="text-lg font-bold text-[#303150]">
              {(value.selectedUserIds || []).length.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* CSV count */}
      {value.type === 'csv' && (
        <div className="bg-[#F7F7F8] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#7E7F90]">מספר כתובות אימייל:</span>
            <span className="text-lg font-bold text-[#303150]">
              {(value.csvEmails || []).length.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

