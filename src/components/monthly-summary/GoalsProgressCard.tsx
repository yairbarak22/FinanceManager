'use client';

import { motion } from 'framer-motion';
import { Target, Check, ShoppingCart, Utensils, Home, Car, Briefcase, Heart, GraduationCap, Gamepad2, PiggyBank } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { SensitiveData } from '@/components/common/SensitiveData';
import type { GoalProgressItem } from '@/lib/monthlyReport/calculations';

interface GoalsProgressCardProps {
  goalsProgress: GoalProgressItem[];
}

const CATEGORY_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  food: Utensils,
  shopping: ShoppingCart,
  housing: Home,
  transport: Car,
  entertainment: Gamepad2,
  health: Heart,
  education: GraduationCap,
  savings: PiggyBank,
  bills: Briefcase,
};

function getBarColor(percentage: number): string {
  if (percentage > 100) return '#F18AB5';
  if (percentage > 80) return '#E9A800';
  return '#69ADFF';
}

export default function GoalsProgressCard({
  goalsProgress,
}: GoalsProgressCardProps) {
  const hasGoals = goalsProgress.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
      className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-[#EBF3FF] flex items-center justify-center">
          <Target className="w-4 h-4 text-[#69ADFF]" strokeWidth={1.75} />
        </div>
        <h3 className="text-[1.125rem] font-semibold text-[#303150]">
          עמידה ביעדים
        </h3>
      </div>

      {!hasGoals ? (
        <div className="py-8 text-center">
          <p className="text-[0.9375rem] text-[#7E7F90] mb-1">
            לא הוגדרו יעדים עדיין
          </p>
          <p className="text-[0.8125rem] text-[#BDBDCB]">
            הגדר יעדים כדי לעקוב אחרי ההתקדמות שלך
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {goalsProgress.map((goal) => {
            const clampedPercentage = Math.min(goal.percentage, 100);
            const barColor = getBarColor(goal.percentage);
            const isCompleted = goal.percentage >= 100;
            const overshoot =
              goal.percentage > 100 ? goal.current - goal.target : 0;

            const goalNameLower = goal.name.toLowerCase();
            const IconComponent = Object.entries(CATEGORY_ICONS).find(
              ([key]) => goalNameLower.includes(key)
            )?.[1] || Target;

            return (
              <div
                key={goal.goalId}
                className="p-3 rounded-xl bg-[#F5F5F7]/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${barColor}14` }}
                    >
                      <IconComponent
                        className="w-4 h-4"
                        style={{ color: barColor }}
                        strokeWidth={1.75}
                      />
                    </div>
                    <span className="text-[0.9375rem] font-medium text-[#303150]">
                      {goal.name}
                    </span>
                    {isCompleted && (
                      <div className="w-5 h-5 rounded-full bg-[#0DBACC] flex items-center justify-center">
                        <Check
                          className="w-3 h-3 text-white"
                          strokeWidth={2.5}
                        />
                      </div>
                    )}
                  </div>
                  <SensitiveData>
                    <span className="text-[0.75rem] font-medium text-[#7E7F90]">
                      {formatCurrency(goal.current)} /{' '}
                      {formatCurrency(goal.target)}
                    </span>
                  </SensitiveData>
                </div>

                {/* Progress bar with visible track */}
                <div className="h-2.5 w-full bg-[#E8E8ED] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${clampedPercentage}%` }}
                    transition={{
                      duration: 0.8,
                      ease: 'easeOut',
                      delay: 0.4,
                    }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: barColor }}
                  />
                </div>

                <div className="flex items-center justify-between mt-1.5">
                  <span
                    className="text-[0.75rem] font-semibold"
                    style={{ color: barColor }}
                  >
                    {goal.percentage}%
                  </span>
                  {overshoot > 0 && (
                    <span className="text-[0.6875rem] font-medium text-[#F18AB5]">
                      חריגה של {formatCurrency(overshoot)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
