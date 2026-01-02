'use client';

import Card from '@/components/ui/Card';
import AcademyGrid from './AcademyGrid';
import CompoundInterest from './CompoundInterest';

/**
 * AcademySection - Financial Education Hub
 * 
 * Renders within the main dashboard (like investments tab)
 * Contains: Topic Grid and Calculator
 */
export default function AcademySection() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">מרכז הידע הפיננסי</h1>
        <p className="text-slate-600">עקרונות פשוטים שיעזרו לך לקבל החלטות חכמות יותר</p>
      </div>

      {/* Topics Grid */}
      <Card padding="md">
        <AcademyGrid />
      </Card>

      {/* Compound Interest Calculator */}
      <Card padding="md">
        <CompoundInterest />
      </Card>

      {/* Disclaimer */}
      <p className="text-xs text-slate-400 text-center px-4">
        המידע הוא לצורכי לימוד בלבד ואינו מהווה ייעוץ פיננסי. מומלץ להתייעץ עם מומחה לפני קבלת החלטות.
      </p>
    </div>
  );
}
