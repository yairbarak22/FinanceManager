'use client';

import { 
  Plane, 
  Car, 
  Home, 
  GraduationCap, 
  Umbrella, 
  Wallet,
  Shield,
  Trash2,
  RefreshCw,
  Link,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { 
  calculateProgressPercentage, 
  calculateMonthlyContribution,
  calculateGoalStatus,
  formatGoalStatus,
} from '@/lib/goalCalculations';
import GoalProgressBar from './GoalProgressBar';
import InfoTooltip from '@/components/ui/InfoTooltip';
import type { FinancialGoal } from '@/lib/api/goals';

const GOAL_ICONS: Record<string, React.ElementType> = {
  travel: Plane,
  car: Car,
  home: Home,
  education: GraduationCap,
  vacation: Umbrella,
  saving: Wallet,
  emergency: Shield,
};

interface GoalCardProps {
  goal: FinancialGoal;
  onEdit?: (goal: FinancialGoal) => void;
  onDelete?: (goal: FinancialGoal) => void;
}

export default function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const Icon = GOAL_ICONS[goal.category] || Wallet;
  const progress = calculateProgressPercentage(goal.currentAmount, goal.targetAmount);
  const requiredMonthly = calculateMonthlyContribution(
    goal.targetAmount, 
    goal.currentAmount, 
    goal.deadline
  );
  
  const status = calculateGoalStatus(
    goal.targetAmount,
    goal.currentAmount,
    goal.deadline,
    goal.recurringTransaction?.amount
  );
  
  const statusDisplay = formatGoalStatus(status);
  const hasRecurring = !!goal.recurringTransaction;

  // Accent bar gradient based on status
  const accentGradient = (() => {
    switch (status) {
      case 'completed': return 'linear-gradient(to left, #0DBACC, #69ADFF)';
      case 'on_track':
      case 'ahead': return 'linear-gradient(to left, #C1DDFF, #69ADFF)';
      case 'behind': return 'linear-gradient(to left, #FFC0DB, #F18AB5)';
      default: return 'linear-gradient(to left, #E8E8ED, #BDBDCB)';
    }
  })();
  
  // Format deadline
  const deadline = new Date(goal.deadline);
  const deadlineStr = deadline.toLocaleDateString('he-IL', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      onClick={onEdit ? () => onEdit(goal) : undefined}
      onKeyDown={onEdit ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit(goal);
        }
      } : undefined}
      role={onEdit ? 'button' : undefined}
      tabIndex={onEdit ? 0 : undefined}
      aria-label={onEdit ? `ערוך יעד: ${goal.name}` : undefined}
      className={`bg-white rounded-3xl relative group transition-all duration-200 overflow-hidden ${
        onEdit ? 'hover:shadow-lg cursor-pointer active:scale-[0.98]' : 'hover:scale-[1.02]'
      }`}
      style={{
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Top Accent Gradient Bar */}
      <div
        className="h-[3px] rounded-t-3xl"
        style={{ background: accentGradient }}
      />

      <div className="p-6">
      {/* Edge Indicator */}
      {onEdit && (
        <div className="absolute right-0 top-4 bottom-4 w-0.5 bg-[#69ADFF] opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(105, 173, 255, 0.15)' }}
          >
            <Icon className="w-5 h-5" style={{ color: '#69ADFF' }} />
          </div>
          <div>
            <h3 
              className="font-semibold text-lg"
              style={{ 
                color: '#303150',
                fontFamily: 'var(--font-nunito), system-ui, sans-serif',
              }}
            >
              {goal.name}
            </h3>
            <span 
              className="text-xs"
              style={{ color: '#BDBDCB' }}
            >
              יעד: {deadlineStr}
            </span>
          </div>
        </div>
        
        {/* Delete button - visible on mobile (with lower opacity), full opacity on hover for desktop */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(goal);
            }}
            className="p-2 rounded-lg hover:bg-red-50 active:bg-red-50 transition-colors opacity-50 md:opacity-0 md:group-hover:opacity-100 active:opacity-100"
            aria-label={`מחיקת יעד: ${goal.name}`}
          >
            <Trash2 className="w-5 h-5" style={{ color: '#7E7F90' }} />
          </button>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="mb-4">
        <GoalProgressBar progress={progress} />
      </div>
      
      {/* Amount info */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span 
            className="text-sm block"
            style={{ 
              color: '#7E7F90',
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
            }}
          >
            נחסך
          </span>
          <span 
            className="font-bold text-lg"
            style={{ 
              color: '#303150',
              fontFamily: 'var(--font-nunito), system-ui, sans-serif',
            }}
          >
            {formatCurrency(goal.currentAmount)}
          </span>
        </div>
        <div className="text-left">
          <span 
            className="text-sm block"
            style={{ color: '#7E7F90' }}
          >
            מתוך
          </span>
          <span 
            className="font-bold text-lg"
            style={{ color: '#303150' }}
          >
            {formatCurrency(goal.targetAmount)}
          </span>
        </div>
      </div>
      
      {/* Status row */}
      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: '#F7F7F8' }}>
        <div className="flex items-center gap-2">
          {hasRecurring ? (
            <>
              <RefreshCw className="w-4 h-4" style={{ color: '#0DBACC' }} />
              <span 
                className="text-xs"
                style={{ 
                  color: '#0DBACC',
                  fontFamily: 'var(--font-nunito), system-ui, sans-serif',
                }}
              >
                מופרש {formatCurrency(goal.recurringTransaction!.amount)}/חודש
              </span>
            </>
          ) : (
            <>
              <Link className="w-4 h-4" style={{ color: '#BDBDCB' }} />
              <span 
                className="text-xs"
                style={{ color: '#BDBDCB' }}
              >
                נדרש: {formatCurrency(requiredMonthly)}/חודש
              </span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div 
            className="px-2 py-1 rounded-lg text-xs font-medium"
            style={{ 
              backgroundColor: `${statusDisplay.color}15`,
              color: statusDisplay.color,
            }}
          >
            {statusDisplay.label}
          </div>
          {!hasRecurring && (
            <InfoTooltip 
              content="סכום החודשי הנדרש כדי להגיע ליעד בזמן. אם יש לך העברה חוזרת, היא תיכלל בחישוב."
              side="top"
            />
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

