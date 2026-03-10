'use client';

import { useState, useEffect } from 'react';
import WizardStepper, { WIZARD_STEPS } from './WizardStepper';

const STATUS_MESSAGES = [
  'קורא את הקובץ...',
  'מזהה עסקאות...',
  'מסווג עם AI...',
];

const CARD_STYLE: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: 24,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  padding: '32px',
  minHeight: 420,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
};

export default function ClassifyingStep() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
        setFade(true);
      }, 250);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-2xl mx-auto pt-6 lg:pt-8 pb-12" style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>
      <WizardStepper steps={WIZARD_STEPS} currentStep={2} />

      <div className="max-w-lg mx-auto" style={CARD_STYLE}>
        <div className="flex flex-col items-center pt-8 pb-4 gap-5">
          {/* Double-ring spinner */}
          <div className="relative" style={{ width: 64, height: 64 }}>
            <svg viewBox="0 0 64 64" className="w-full h-full absolute inset-0 animate-spin" style={{ animationDuration: '1.4s' }}>
              <circle cx="32" cy="32" r="28" fill="none" stroke="#F7F7F8" strokeWidth="2.5" />
              <circle
                cx="32" cy="32" r="28" fill="none" stroke="#69ADFF" strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 28 * 0.3} ${2 * Math.PI * 28 * 0.7}`}
              />
            </svg>
            <svg
              viewBox="0 0 64 64"
              className="w-full h-full absolute inset-0"
              style={{ animation: 'spinReverse 1.8s linear infinite' }}
            >
              <circle
                cx="32" cy="32" r="20" fill="none" stroke="rgba(105, 173, 255, 0.25)" strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 20 * 0.2} ${2 * Math.PI * 20 * 0.8}`}
              />
            </svg>
          </div>

          <div className="text-center">
            <h1 className="text-lg font-bold mb-1" style={{ color: '#303150' }}>מעבד עסקאות</h1>
            <p
              className="text-[13px] transition-opacity duration-250"
              style={{ color: '#7E7F90', opacity: fade ? 1 : 0 }}
            >
              {STATUS_MESSAGES[msgIndex]}
            </p>
          </div>

          {/* Wider progress bar */}
          <div className="w-64 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#F7F7F8' }}>
            <div className="h-full rounded-full" style={{ backgroundColor: '#69ADFF', animation: 'progressSlide 2s ease-in-out infinite' }} />
          </div>

          <p className="text-[11px]" style={{ color: '#BDBDCB' }}>זה ייקח כמה שניות...</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes progressSlide {
          0% { width: 0%; margin-inline-start: 0; }
          50% { width: 60%; margin-inline-start: 20%; }
          100% { width: 0%; margin-inline-start: 100%; }
        }
        @keyframes spinReverse {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
      `}</style>
    </div>
  );
}
