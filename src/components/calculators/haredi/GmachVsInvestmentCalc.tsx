'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Weight,
  KeyRound,
  TrendingDown,
  TrendingUp,
  Sparkles,
  ArrowLeft,
  Info,
  Baby,
  Wallet,
  Home,
} from 'lucide-react';
import { CurrencySlider } from '@/components/ui/Slider';
import Slider from '@/components/ui/Slider';
import { formatCurrency } from '@/lib/utils';
import Card from '@/components/ui/Card';

// ============================================================================
// Types
// ============================================================================

interface GmachResult {
  totalDeposits: number;
  realValue: number;
  inflationLoss: number;
}

interface InvestmentResult {
  totalDeposits: number;
  totalBeforeTax: number;
  gains: number;
  capitalGainsTax: number;
  managementFees: number;
  totalAfterTax: number;
}

// ============================================================================
// Hardcoded Constants
// ============================================================================

const SP500_ANNUAL_RETURN = 9; // % conservative historical average
const ANNUAL_INFLATION = 3; // % money erosion
const MANAGEMENT_FEES = 0.7; // % average for kosher fund
const CAPITAL_GAINS_TAX_RATE = 25; // % on real gains
const AVERAGE_WEDDING_AGE = 21;
const GMACH_LOAN_REPAYMENT_YEARS = 5; // typical Gmach loan repayment period

// ============================================================================
// Calculation Functions
// ============================================================================

function calculateGmach(monthlyDeposit: number, years: number): GmachResult {
  const months = years * 12;
  const totalDeposits = monthlyDeposit * months;
  // Real purchasing power after inflation erosion
  const realValue = totalDeposits / Math.pow(1 + ANNUAL_INFLATION / 100, years);
  const inflationLoss = totalDeposits - realValue;

  return { totalDeposits, realValue, inflationLoss };
}

function calculateInvestment(monthlyDeposit: number, years: number): InvestmentResult {
  const months = years * 12;
  const totalDeposits = monthlyDeposit * months;
  
  // Net annual return after management fees
  const netAnnualReturn = SP500_ANNUAL_RETURN - MANAGEMENT_FEES;
  const monthlyRate = netAnnualReturn / 100 / 12;
  
  // Future value of monthly deposits with compound interest
  let totalBeforeTax: number;
  if (monthlyRate <= 0) {
    totalBeforeTax = totalDeposits;
  } else {
    const growthFactor = Math.pow(1 + monthlyRate, months);
    totalBeforeTax = monthlyDeposit * ((growthFactor - 1) / monthlyRate);
  }
  
  const gains = totalBeforeTax - totalDeposits;
  
  // Real gains (adjust for inflation) for tax calculation
  const realGains = gains > 0 ? gains : 0;
  const capitalGainsTax = realGains * (CAPITAL_GAINS_TAX_RATE / 100);
  
  // Approximate management fees paid
  const grossMonthlyRate = SP500_ANNUAL_RETURN / 100 / 12;
  const grossGrowthFactor = Math.pow(1 + grossMonthlyRate, months);
  const grossTotal = monthlyDeposit * ((grossGrowthFactor - 1) / grossMonthlyRate);
  const managementFees = grossTotal - totalBeforeTax;
  
  const totalAfterTax = totalBeforeTax - capitalGainsTax;

  return {
    totalDeposits,
    totalBeforeTax,
    gains,
    capitalGainsTax,
    managementFees,
    totalAfterTax: Math.round(totalAfterTax),
  };
}

// ============================================================================
// Tooltip Component
// ============================================================================

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="text-[#BDBDCB] hover:text-[#7E7F90] transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        aria-label="מידע נוסף"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full right-0 mb-2 w-56 bg-[#303150] text-white text-xs p-3 rounded-xl shadow-lg z-50 leading-relaxed"
        >
          {text}
        </motion.div>
      )}
    </span>
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface GmachVsInvestmentCalcProps {
  className?: string;
}

export default function GmachVsInvestmentCalc({ className = '' }: GmachVsInvestmentCalcProps) {
  // Inputs
  const [monthlyDeposit, setMonthlyDeposit] = useState(500);
  const [childAge, setChildAge] = useState(3);
  const [apartmentPrice, setApartmentPrice] = useState(400000);

  // Derived
  const investmentYears = Math.max(AVERAGE_WEDDING_AGE - childAge, 1);

  // Calculations
  const gmachResult = useMemo(
    () => calculateGmach(monthlyDeposit, investmentYears),
    [monthlyDeposit, investmentYears]
  );

  const investmentResult = useMemo(
    () => calculateInvestment(monthlyDeposit, investmentYears),
    [monthlyDeposit, investmentYears]
  );

  const gap = investmentResult.totalAfterTax - gmachResult.totalDeposits;
  const netProfit = investmentResult.totalAfterTax - investmentResult.totalDeposits;

  // Percentages for regret chart
  const maxValue = Math.max(investmentResult.totalAfterTax, gmachResult.totalDeposits);
  const gmachBarPercent = maxValue > 0 ? (gmachResult.totalDeposits / maxValue) * 100 : 0;
  const investmentBarPercent = maxValue > 0 ? (investmentResult.totalAfterTax / maxValue) * 100 : 0;

  // Coverage of apartment price
  const gmachCoverage = apartmentPrice > 0 ? (gmachResult.realValue / apartmentPrice) * 100 : 0;
  const investmentCoverage = apartmentPrice > 0 ? (investmentResult.totalAfterTax / apartmentPrice) * 100 : 0;

  // Gmach loan calculation: how much loan is needed to cover the apartment
  const gmachLoanNeeded = Math.max(apartmentPrice - gmachResult.totalDeposits, 0);
  const gmachLoanMonthlyRepayment = gmachLoanNeeded > 0
    ? gmachLoanNeeded / (GMACH_LOAN_REPAYMENT_YEARS * 12)
    : 0;

  return (
    <Card className={className} padding="none">
      <div className="p-5 lg:p-8 space-y-6" dir="rtl">
        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-lg lg:text-xl font-bold text-[#303150]">
            גמ״ח מול תיק מסחר עצמאי כשר
          </h2>
          <p className="text-xs text-[#7E7F90]">
            כמה כסף הילד שלך יכול לצבור עד החתונה?
          </p>
        </div>

        {/* ======================================================== */}
        {/* Input Section — Compact 2-column grid on desktop          */}
        {/* ======================================================== */}
        <div className="bg-[#F7F7F8] rounded-3xl p-4 lg:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
            {/* Monthly deposit */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Wallet className="w-3.5 h-3.5 text-[#69ADFF]" />
                <span className="text-xs font-medium text-[#7E7F90]">חיסכון חודשי</span>
              </div>
              <CurrencySlider
                label=""
                value={monthlyDeposit}
                min={100}
                max={5000}
                step={100}
                onChange={setMonthlyDeposit}
              />
            </div>

            {/* Child age */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Baby className="w-3.5 h-3.5 text-[#69ADFF]" />
                <span className="text-xs font-medium text-[#7E7F90]">גיל הילד/ה</span>
              </div>
              <Slider
                label=""
                value={childAge}
                min={0}
                max={18}
                step={1}
                onChange={setChildAge}
                formatValue={(v) => v === 0 ? 'נולד/ה' : v === 1 ? 'שנה' : `${v} שנים`}
              />
            </div>

            {/* Apartment price */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Home className="w-3.5 h-3.5 text-[#69ADFF]" />
                <span className="text-xs font-medium text-[#7E7F90]">מחיר דירה</span>
              </div>
              <CurrencySlider
                label=""
                value={apartmentPrice}
                min={100000}
                max={1500000}
                step={50000}
                onChange={setApartmentPrice}
              />
            </div>
          </div>

          {/* Period summary strip */}
          <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-[#E8E8ED]">
            <span className="text-xs text-[#7E7F90]">תקופת חיסכון:</span>
            <span className="text-xs font-bold text-[#303150]">{investmentYears} שנים</span>
            <span className="text-xs text-[#BDBDCB]">|</span>
            <span className="text-xs text-[#7E7F90]">עד גיל {AVERAGE_WEDDING_AGE}</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* Split View Results                                        */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ---- Right Side: Gmach (Gray/Red) ---- */}
          <div className="bg-gradient-to-br from-[#F7F7F8] to-[#EFEFF2] rounded-3xl p-4 lg:p-5 border border-[#E8E8ED] relative overflow-hidden">
            {/* Top accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-[#F18AB5]/40 to-transparent" />
            
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#E8E8ED] rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-[#7E7F90]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#303150] text-sm">חיסכון רגיל (גמ״ח)</h3>
                  <p className="text-[10px] text-[#BDBDCB]">המסלול המוכר</p>
                </div>
              </div>

              {/* Main Number */}
              <div>
                <p className="text-[10px] text-[#7E7F90]">סה״כ הפקדות</p>
                <p className="text-xl font-bold text-[#7E7F90]">
                  {formatCurrency(gmachResult.totalDeposits)}
                </p>
              </div>

              {/* Inflation Loss */}
              <div className="bg-[#F18AB5]/10 rounded-xl p-2.5 border border-[#F18AB5]/20">
                <div className="flex items-center gap-1.5">
                  <InfoTooltip text="יוקר המחיה עולה כל שנה. הכסף ששוכב בגמ״ח פשוט נשחק ונעלם." />
                  <p className="text-[10px] text-[#7E7F90]">שחיקת ערך (אינפלציה {ANNUAL_INFLATION}%)</p>
                </div>
                <p className="text-base font-bold text-[#F18AB5] mt-0.5">
                  -{formatCurrency(Math.round(gmachResult.inflationLoss))}
                </p>
              </div>

              {/* Coverage */}
              <div>
                <p className="text-[10px] text-[#7E7F90]">כיסוי מחיר דירה (בערך ריאלי)</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-[#E8E8ED] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#7E7F90] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(gmachCoverage, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-[#7E7F90]">
                    {gmachCoverage.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Loan Needed */}
              {gmachLoanNeeded > 0 && (
                <div className="bg-white/70 rounded-xl p-2.5 border border-[#E8E8ED]">
                  <p className="text-[10px] text-[#7E7F90]">זכאות להלוואה ללא ריבית של</p>
                  <p className="text-base font-bold text-[#303150] mt-0.5">
                    {formatCurrency(Math.round(gmachLoanNeeded))}
                  </p>
                  <div className="mt-2 pt-2 border-t border-[#E8E8ED]">
                    <p className="text-[10px] text-[#7E7F90]">
                      החזר חודשי ({GMACH_LOAN_REPAYMENT_YEARS} שנים)
                    </p>
                    <p className="text-sm font-bold text-[#F18AB5] mt-0.5">
                      {formatCurrency(Math.round(gmachLoanMonthlyRepayment))} / חודש
                    </p>
                  </div>
                </div>
              )}

              {/* Bottom Line */}
              <div className="flex items-center gap-2 pt-2.5 border-t border-[#E8E8ED]">
                <Weight className="w-4 h-4 text-[#F18AB5] flex-shrink-0" />
                <p className="text-[10px] text-[#7E7F90] leading-relaxed">
                  בסוף התקופה: חוב של {formatCurrency(Math.round(gmachLoanNeeded))} שצריך להחזיר
                </p>
              </div>
            </div>
          </div>

          {/* ---- Left Side: Investment (Green/Glowing) ---- */}
          <div className="bg-gradient-to-br from-[#F0FAFA] to-[#E6F9F9] rounded-3xl p-4 lg:p-5 border border-[#0DBACC]/20 relative overflow-hidden">
            {/* Glowing top accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-[#0DBACC] to-[#0DBACC]/30" />
            
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#B4F1F1] rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[#0DBACC]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#303150] text-sm">תיק מסחר עצמאי (כשר)</h3>
                  <div className="flex items-center gap-1">
                    <p className="text-[10px] text-[#0DBACC]">בכשרות מהודרת (מסלולי הלכה)</p>
                    <InfoTooltip text="זהו רווח מפעילות של חברות אמיתיות (היתר עסקה), לא ריבית נשך חלילה." />
                  </div>
                </div>
              </div>

              {/* Main Number - 30% larger */}
              <div>
                <p className="text-[10px] text-[#7E7F90]">סה״כ אחרי מס ודמי ניהול</p>
                <p className="text-2xl font-bold text-[#0DBACC]">
                  {formatCurrency(investmentResult.totalAfterTax)}
                </p>
              </div>

              {/* Net Profit */}
              <div className="bg-[#0DBACC]/10 rounded-xl p-2.5 border border-[#0DBACC]/20">
                <p className="text-[10px] text-[#7E7F90]">הכסף עשה לבד</p>
                <p className="text-base font-bold text-[#0DBACC] mt-0.5">
                  +{formatCurrency(Math.round(netProfit))}
                </p>
                <div className="flex gap-3 mt-1.5 text-[10px] text-[#7E7F90]">
                  <span>מס: -{formatCurrency(Math.round(investmentResult.capitalGainsTax))}</span>
                  <span>ד״נ: -{formatCurrency(Math.round(investmentResult.managementFees))}</span>
                </div>
              </div>

              {/* Coverage */}
              <div>
                <p className="text-[10px] text-[#7E7F90]">כיסוי מחיר דירה</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-[#B4F1F1]/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0DBACC] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(investmentCoverage, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-[#0DBACC]">
                    {investmentCoverage.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Bottom Line */}
              <div className="flex items-center gap-2 pt-2.5 border-t border-[#0DBACC]/20">
                <KeyRound className="w-4 h-4 text-[#0DBACC] flex-shrink-0" />
                <p className="text-[10px] text-[#303150] leading-relaxed font-medium">
                  בסוף התקופה: יש לך נכס ביד. 0 חובות
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* Regret Index - Bar Chart                                  */}
        {/* ======================================================== */}
        <div className="bg-[#303150] rounded-3xl p-4 lg:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#0DBACC]" />
            <h3 className="font-semibold text-white text-sm">מדד החרטה</h3>
          </div>

          <div className="space-y-3">
            {/* Gmach Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#BDBDCB]">גמ״ח (הפקדות בלבד)</span>
                <span className="text-xs font-semibold text-[#BDBDCB]">
                  {formatCurrency(gmachResult.totalDeposits)}
                </span>
              </div>
              <div className="h-6 bg-white/10 rounded-lg overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${gmachBarPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-[#7E7F90] rounded-lg"
                />
              </div>
            </div>

            {/* Investment Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#BDBDCB]">תיק מסחר עצמאי (כשר)</span>
                <span className="text-xs font-semibold text-[#0DBACC]">
                  {formatCurrency(investmentResult.totalAfterTax)}
                </span>
              </div>
              <div className="h-6 bg-white/10 rounded-lg overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${investmentBarPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  className="h-full bg-gradient-to-l from-[#0DBACC] to-[#0DBACC]/70 rounded-lg"
                />
              </div>
            </div>

            {/* Gap Label */}
            {gap > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center pt-2.5 border-t border-white/10"
              >
                <p className="text-xs text-[#F18AB5] font-semibold">
                  הפסד של {formatCurrency(Math.round(gap))} מחוסר ידע
                </p>
                <p className="text-[10px] text-[#BDBDCB] mt-0.5">
                  תקופה: {investmentYears} שנים | הפקדה חודשית: {formatCurrency(monthlyDeposit)}
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* CTA Banner                                                */}
        {/* ======================================================== */}
        {gap > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gradient-to-l from-[#0DBACC] to-[#0DBACC]/90 rounded-3xl p-4 lg:p-5 text-white"
          >
            <p className="text-xs leading-relaxed mb-3">
              ראיתם את הפער? ה-{formatCurrency(Math.round(gap))} האלה הם ההבדל בין חתונה ברווח
              לבין חתונה בחובות. בואו נפתח תוכנית השתדלות לילד עכשיו.
            </p>
            <button
              onClick={() => window.location.href = '/goals'}
              className="bg-white text-[#0DBACC] px-5 py-2.5 rounded-xl font-semibold text-sm
                         hover:bg-white/90 transition-all duration-200 shadow-lg shadow-black/10
                         flex items-center gap-2 mx-auto lg:mx-0"
            >
              <span>התחל כאן</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] text-[#BDBDCB] text-center leading-relaxed px-2">
          * חישוב מבוסס על תשואה ממוצעת של {SP500_ANNUAL_RETURN}% בשנה (S&P 500), אינפלציה של {ANNUAL_INFLATION}%, 
          דמי ניהול {MANAGEMENT_FEES}% ומס רווחי הון {CAPITAL_GAINS_TAX_RATE}%. 
          תשואות עבר אינן מעידות על תשואות עתידיות. אינו מהווה ייעוץ פיננסי.
        </p>
      </div>
    </Card>
  );
}
