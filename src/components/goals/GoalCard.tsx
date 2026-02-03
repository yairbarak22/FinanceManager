'use client';

import { useState } from 'react';
import { 
  Plane, 
  Car, 
  Home, 
  GraduationCap, 
  Umbrella, 
  PiggyBank,
  Shield,
  MoreHorizontal,
  Edit2,
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
import type { FinancialGoal } from '@/lib/api/goals';

const GOAL_ICONS: Record<string, React.ElementType> = {
  travel: Plane,
  car: Car,
  home: Home,
  education: GraduationCap,
  vacation: Umbrella,
  saving: PiggyBank,
  emergency: Shield,
};

interface GoalCardProps {
  goal: FinancialGoal;
  onEdit?: (goal: FinancialGoal) => void;
  onDelete?: (goal: FinancialGoal) => void;
}

export default function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  const Icon = GOAL_ICONS[goal.category] || PiggyBank;
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
  
  // Format deadline
  const deadline = new Date(goal.deadline);
  const deadlineStr = deadline.toLocaleDateString('he-IL', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className="bg-white rounded-3xl p-6 relative group transition-all hover:scale-[1.02]"
      style={{
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      }}
    >
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
        
        {/* Menu button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            style={{ 
              backgroundColor: showMenu ? '#F7F7F8' : 'transparent',
            }}
          >
            <MoreHorizontal className="w-5 h-5" style={{ color: '#7E7F90' }} />
          </button>
          
          {showMenu && (
            <div 
              className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-lg py-1 z-10 min-w-[140px]"
              style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' }}
            >
              <button
                onClick={() => {
                  onEdit?.(goal);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 px-4 py-2 w-full text-right hover:bg-[#F7F7F8] transition-colors"
                style={{ color: '#303150' }}
              >
                <Edit2 className="w-4 h-4" />
                <span>עריכה</span>
              </button>
              <button
                onClick={() => {
                  onDelete?.(goal);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 px-4 py-2 w-full text-right hover:bg-[#F7F7F8] transition-colors"
                style={{ color: '#F18AB5' }}
              >
                <Trash2 className="w-4 h-4" />
                <span>מחיקה</span>
              </button>
            </div>
          )}
        </div>
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
        
        <div 
          className="px-2 py-1 rounded-lg text-xs font-medium"
          style={{ 
            backgroundColor: `${statusDisplay.color}15`,
            color: statusDisplay.color,
          }}
        >
          {statusDisplay.label}
        </div>
      </div>
    </div>
  );
}

