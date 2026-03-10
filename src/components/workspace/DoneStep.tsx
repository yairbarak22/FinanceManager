'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import WizardStepper, { WIZARD_STEPS } from './WizardStepper';

const CARD_STYLE: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: 24,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  padding: '32px',
  minHeight: 420,
};

interface DoneStepProps {
  stats: { total: number; categorized: number; aiClassified: number };
}

function AnimatedCounter({ target, color }: { target: number; color: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<ReturnType<typeof requestAnimationFrame>>(undefined);

  useEffect(() => {
    if (target === 0) return;
    const duration = 600;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        ref.current = requestAnimationFrame(step);
      }
    };
    ref.current = requestAnimationFrame(step);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [target]);

  return (
    <span className="text-xl font-bold tabular-nums" style={{ color }}>
      {value}
    </span>
  );
}

export default function DoneStep({ stats }: DoneStepProps) {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(t);
  }, []);

  const statItems = [
    { value: stats.total, label: 'עסקאות יובאו', color: '#0DBACC', bg: 'rgba(13, 186, 204, 0.06)' },
    { value: stats.categorized, label: 'סווגו', color: '#69ADFF', bg: 'rgba(105, 173, 255, 0.06)' },
    ...(stats.aiClassified > 0
      ? [{ value: stats.aiClassified, label: 'זוהו אוטומטית', color: '#E9A800', bg: 'rgba(233, 168, 0, 0.06)' }]
      : []),
  ];

  return (
    <div className="max-w-2xl mx-auto pt-6 lg:pt-8 pb-12" style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
      <WizardStepper steps={WIZARD_STEPS} currentStep={4} />

      <div className="max-w-lg mx-auto" style={CARD_STYLE}>
        <div
          className="flex flex-col items-center pt-4 gap-4 transition-all duration-500"
          style={{ opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(12px)' }}
        >
          {/* Animated SVG checkmark */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(13, 186, 204, 0.1)',
              animation: show ? 'checkBounce 0.6s ease-out' : 'none',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M6 14.5L11.5 20L22 8"
                stroke="#0DBACC"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 32,
                  strokeDashoffset: show ? 0 : 32,
                  transition: 'stroke-dashoffset 0.6s ease-out 0.2s',
                }}
              />
            </svg>
          </div>

          <div className="text-center">
            <h1 className="text-lg font-bold mb-1" style={{ color: '#303150' }}>הייבוא הושלם</h1>
            <p className="text-[13px]" style={{ color: '#7E7F90' }}>העסקאות שלך מוכנות</p>
          </div>
        </div>

        {/* Stats mini-cards */}
        <div className="flex items-center justify-center gap-3 mt-8 mb-8">
          {statItems.map((stat, i) => (
            <div
              key={stat.label}
              className="text-center rounded-2xl px-5 py-4 transition-all duration-500"
              style={{
                backgroundColor: stat.bg,
                opacity: show ? 1 : 0,
                transform: show ? 'translateY(0)' : 'translateY(10px)',
                transitionDelay: `${100 + i * 100}ms`,
              }}
            >
              <AnimatedCounter target={stat.value} color={stat.color} />
              <p className="text-[11px] font-medium mt-1" style={{ color: '#7E7F90' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-500 delay-300 flex items-center justify-center gap-2"
          style={{
            backgroundColor: '#0DBACC',
            color: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(13, 186, 204, 0.25)',
            opacity: show ? 1 : 0,
            transform: show ? 'translateY(0)' : 'translateY(8px)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(13, 186, 204, 0.35)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(13, 186, 204, 0.25)'; }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          חזרה לדאשבורד
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      <style jsx>{`
        @keyframes checkBounce {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
