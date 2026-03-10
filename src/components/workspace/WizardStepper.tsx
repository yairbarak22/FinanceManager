'use client';

import { Check } from 'lucide-react';

export const WIZARD_STEPS: { label: string }[] = [
  { label: 'העלאת קובץ' },
  { label: 'הגדרות' },
  { label: 'עיבוד' },
  { label: 'הושלם' },
];

interface WizardStepperProps {
  steps: { label: string }[];
  currentStep: number;
}

export default function WizardStepper({ steps, currentStep }: WizardStepperProps) {
  return (
    <div
      className="mb-10"
      style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}
    >
      <div className="flex items-center justify-center">
        {steps.map((step, i) => {
          const isCompleted = i < currentStep;
          const isActive = i === currentStep;
          const isLast = i === steps.length - 1;

          return (
            <div key={i} className="flex items-center" style={{ flex: isLast ? '0 0 auto' : '1 1 0' }}>
              {/* Circle + Label column */}
              <div className="flex flex-col items-center" style={{ minWidth: 60 }}>
                <div
                  className="flex items-center justify-center rounded-full transition-all duration-300"
                  style={{
                    width: 36,
                    height: 36,
                    backgroundColor: isCompleted
                      ? '#0DBACC'
                      : isActive
                        ? '#69ADFF'
                        : '#F7F7F8',
                    boxShadow: isActive
                      ? '0 0 0 4px rgba(105,173,255,0.15)'
                      : 'none',
                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                  ) : (
                    <span
                      className="text-[13px] font-bold"
                      style={{ color: isActive ? '#FFFFFF' : '#BDBDCB' }}
                    >
                      {i + 1}
                    </span>
                  )}
                </div>
                <span
                  className="text-[12px] mt-2 whitespace-nowrap transition-colors duration-300"
                  style={{
                    fontWeight: isActive ? 600 : 500,
                    color: isActive
                      ? '#303150'
                      : isCompleted
                        ? '#0DBACC'
                        : '#BDBDCB',
                  }}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div
                  className="flex-1 mx-2 transition-colors duration-300"
                  style={{
                    height: 2,
                    backgroundColor: isCompleted ? '#0DBACC' : '#E8E8ED',
                    marginBottom: 22,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
