'use client';

import { ExternalLink, Sparkles, TrendingUp, ShoppingCart, CheckCircle2 } from 'lucide-react';
import HelpTrigger from '@/components/ai/HelpTrigger';

const IBI_AFFILIATE_LINK = 'https://cloud.mc.ibi.co.il/rc?c=C00100048';

interface JourneyStepperProps {
  onStartJourney?: () => void;
}

/**
 * Journey Stepper Component
 *
 * Design Psychology:
 * - Law of Continuity: Vertical timeline creates visual flow
 * - Progressive Disclosure: Steps reveal information gradually
 * - Single Primary CTA: Reduces decision paralysis
 * - Premium Badge: Subtle reward indication, not aggressive banner
 */

export default function JourneyStepper({ onStartJourney }: JourneyStepperProps) {
  const handleOpenIBI = () => {
    window.open(IBI_AFFILIATE_LINK, '_blank', 'noopener,noreferrer');
    onStartJourney?.();
  };

  const steps = [
    {
      number: 1,
      title: 'פתיחת חשבון',
      description: 'פתיחת חשבון דיגיטלית ב-5 דקות. ללא פגישות, ללא ניירת.',
      icon: Sparkles,
      helpTopic: 'ibi_transfer',
      badge: {
        text: '300₪ מתנה + שנה ללא דמי טיפול',
        icon: Sparkles,
      },
      isPrimary: true,
    },
    {
      number: 2,
      title: 'בחירת אסטרטגיה',
      description: 'S&P 500 - השקעה ב-500 החברות הגדולות בארה"ב. תשואה ממוצעת של 10% לשנה.',
      icon: TrendingUp,
      helpTopic: 'investment_strategy',
    },
    {
      number: 3,
      title: 'ביצוע פעולה ראשונה',
      description: 'קניית VOO או SPY בפקודת Limit. התחל עם 500-1000₪ ולמד את התהליך.',
      icon: ShoppingCart,
      helpTopic: 'first_trade_guide',
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100">
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
          המסע שלך להשקעה עצמאית
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          שלושה צעדים פשוטים לשליטה מלאה בכספך
        </p>
      </div>

      {/* Timeline Steps */}
      <div className="p-6">
        <div className="relative">
          {/* Vertical Line - Law of Continuity */}
          <div
            className="absolute top-0 bottom-0 start-5 w-0.5 bg-gradient-to-b from-indigo-200 via-indigo-100 to-emerald-100"
            aria-hidden="true"
          />

          {/* Steps */}
          <div className="space-y-0">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isLast = index === steps.length - 1;

              return (
                <div
                  key={step.number}
                  className={`relative ps-14 ${!isLast ? 'pb-8' : ''}`}
                >
                  {/* Step Circle */}
                  <div
                    className={`absolute start-0 w-10 h-10 rounded-full flex items-center justify-center
                      ${step.isPrimary
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                        : 'bg-white border-2 border-slate-200 text-slate-400'
                      }`}
                  >
                    {step.isPrimary ? (
                      <span className="text-lg font-bold">{step.number}</span>
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="min-h-[60px]">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={`font-semibold ${step.isPrimary ? 'text-slate-900' : 'text-slate-600'}`}>
                        {step.title}
                      </h3>
                      <HelpTrigger topicId={step.helpTopic} size="sm" />
                    </div>

                    {/* Premium Badge - Subtle, NOT a banner */}
                    {step.badge && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200/60 rounded-full mb-2">
                        <step.badge.icon className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-medium text-amber-700">{step.badge.text}</span>
                      </div>
                    )}

                    <p className={`text-sm leading-relaxed ${step.isPrimary ? 'text-slate-600' : 'text-slate-500'}`}>
                      {step.description}
                    </p>

                    {/* Primary CTA - Only on first step */}
                    {step.isPrimary && (
                      <button
                        onClick={handleOpenIBI}
                        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white
                                 rounded-xl font-medium text-sm shadow-sm
                                 hover:bg-indigo-700 active:scale-[0.98] transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                        התחל את המסע שלי
                      </button>
                    )}
                  </div>

                  {/* Completion indicator for future steps */}
                  {!step.isPrimary && (
                    <div className="absolute start-0 -bottom-1 w-10 flex justify-center">
                      <div className="w-2 h-2 rounded-full bg-slate-200" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Final Success State */}
            <div className="relative ps-14 pt-4">
              <div className="absolute start-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="pt-2">
                <h3 className="font-semibold text-emerald-700">משקיע עצמאי</h3>
                <p className="text-sm text-slate-500">שליטה מלאה על העתיד הפיננסי שלך</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
