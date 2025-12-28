'use client';

import { ExternalLink, BookOpen, TrendingUp, ShoppingCart } from 'lucide-react';
import HelpTrigger from '@/components/ai/HelpTrigger';

const IBI_AFFILIATE_LINK = 'https://cloud.mc.ibi.co.il/rc?c=C00100048';

export default function InvestmentStepper() {
  const handleOpenIBI = () => {
    window.open(IBI_AFFILIATE_LINK, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      {/* שלב 1: Hero - פתיחת חשבון */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold">1</span>
            </div>
            <h3 className="text-xl font-bold">פתח חשבון ב-IBI</h3>
          </div>
          <HelpTrigger topicId="ibi_transfer" size="sm" />
        </div>

        {/* תיבת ההטבה */}
        <div className="bg-yellow-400 text-slate-900 rounded-lg p-4 mb-4">
          <p className="font-bold text-lg">🎁 קבלו 300₪ מתנה לחשבון + שנה ללא דמי טיפול!</p>
        </div>

        <p className="text-white/90 mb-6">
          פתיחת חשבון דיגיטלית ב-5 דקות. הכסף עובר מיידית מהבנק לחשבון המסחר.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleOpenIBI}
            className="btn-primary bg-white text-indigo-600 hover:bg-slate-50 flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-5 h-5" />
            פתח חשבון עכשיו
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(IBI_AFFILIATE_LINK)}
            className="btn-secondary border-white/30 text-white hover:bg-white/10"
          >
            העתק קישור
          </button>
        </div>
      </div>

      {/* שלב 2: אסטרטגיה */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">2. בחר אסטרטגיה</h3>
          </div>
          <HelpTrigger topicId="investment_strategy" size="sm" />
        </div>
        <p className="text-slate-600">
          השקעה ב-S&P 500 - אינדקס של 500 החברות הגדולות בארה"ב.
          גישה מוכחת לצמיחה ארוכת טווח עם ממוצע תשואה של 10% לשנה.
        </p>
      </div>

      {/* שלב 3: מסחר ראשון */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">3. ביצוע המסחר הראשון</h3>
          </div>
          <HelpTrigger topicId="first_trade_guide" size="sm" />
        </div>
        <p className="text-slate-600">
          מדריך פשוט לקניית VOO או SPY באמצעות פקודת Limit.
          התחל בסכום קטן (500-1000₪) ללמידה ואז הגדל בהדרגה.
        </p>
      </div>
    </div>
  );
}
