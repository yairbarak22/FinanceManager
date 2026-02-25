import { HDate, months } from '@hebcal/core';
import type { DateRange } from '@/lib/periodicReport/types';

/**
 * Hebrew month numbers follow @hebcal/core convention:
 * 1=Nisan, 2=Iyyar, 3=Sivan, 4=Tamuz, 5=Av, 6=Elul,
 * 7=Tishrei, 8=Cheshvan, 9=Kislev, 10=Tevet, 11=Shvat,
 * 12=Adar (or Adar I in leap year), 13=Adar II (leap year only)
 */

const HEBREW_MONTH_NAMES_HE: Record<number, string> = {
  [months.NISAN]: 'ניסן',
  [months.IYYAR]: 'אייר',
  [months.SIVAN]: 'סיוון',
  [months.TAMUZ]: 'תמוז',
  [months.AV]: 'אב',
  [months.ELUL]: 'אלול',
  [months.TISHREI]: 'תשרי',
  [months.CHESHVAN]: 'חשוון',
  [months.KISLEV]: 'כסלו',
  [months.TEVET]: 'טבת',
  [months.SHVAT]: 'שבט',
  [months.ADAR_I]: 'אדר א׳',
  [months.ADAR_II]: 'אדר ב׳',
};

const ADAR_NAME_HE = 'אדר';

export function getHebrewMonthName(month: number, year: number): string {
  if (month === months.ADAR_I && !HDate.isLeapYear(year)) {
    return ADAR_NAME_HE;
  }
  return HEBREW_MONTH_NAMES_HE[month] ?? `חודש ${month}`;
}

/**
 * Returns the list of valid Hebrew months for a given year,
 * ordered from Tishrei to Elul (civil year order).
 */
export function getHebrewMonthsForYear(year: number): { month: number; name: string }[] {
  const isLeap = HDate.isLeapYear(year);
  const civilOrder = [
    months.TISHREI,
    months.CHESHVAN,
    months.KISLEV,
    months.TEVET,
    months.SHVAT,
    ...(isLeap ? [months.ADAR_I, months.ADAR_II] : [months.ADAR_I]),
    months.NISAN,
    months.IYYAR,
    months.SIVAN,
    months.TAMUZ,
    months.AV,
    months.ELUL,
  ];

  return civilOrder.map((m) => ({
    month: m,
    name: getHebrewMonthName(m, year),
  }));
}

/**
 * Converts a Hebrew month + year to a Gregorian date range.
 * Returns the start (day 1) and end (last day) of the Hebrew month
 * as Gregorian Date objects.
 */
export function hebrewMonthToGregorianRange(
  hebrewYear: number,
  hebrewMonth: number
): DateRange {
  const totalMonths = HDate.monthsInYear(hebrewYear);
  if (hebrewMonth < 1 || hebrewMonth > totalMonths) {
    throw new Error(
      `חודש עברי לא תקין: ${hebrewMonth}. השנה ${hebrewYear} מכילה ${totalMonths} חודשים`
    );
  }

  const firstDay = new HDate(1, hebrewMonth, hebrewYear);
  const daysInMonth = HDate.daysInMonth(hebrewMonth, hebrewYear);
  const lastDay = new HDate(daysInMonth, hebrewMonth, hebrewYear);

  const startDate = firstDay.greg();
  const endDate = lastDay.greg();
  // Set endDate to end of day so the range is inclusive
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

/**
 * Converts a Gregorian month + year to a date range.
 */
export function gregorianMonthToDateRange(
  year: number,
  month: number
): DateRange {
  if (month < 1 || month > 12) {
    throw new Error(`חודש לועזי לא תקין: ${month}`);
  }
  if (year < 2020 || year > 2100) {
    throw new Error(`שנה לא תקינה: ${year}`);
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  return { startDate, endDate };
}

/**
 * Builds the period label for the report.
 */
export function buildPeriodLabel(
  calendarType: 'gregorian' | 'hebrew',
  month: number,
  year: number
): string {
  if (calendarType === 'hebrew') {
    const monthName = getHebrewMonthName(month, year);
    return `${monthName} ${formatHebrewYear(year)}`;
  }

  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('he-IL', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Returns the Gregorian month key (YYYY-MM) that a date falls into.
 */
export function dateToMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

const GEMATRIA: Record<number, string> = {
  1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ה',
  6: 'ו', 7: 'ז', 8: 'ח', 9: 'ט', 10: 'י',
  20: 'כ', 30: 'ל', 40: 'מ', 50: 'נ', 60: 'ס',
  70: 'ע', 80: 'פ', 90: 'צ', 100: 'ק', 200: 'ר',
  300: 'ש', 400: 'ת',
};

/**
 * Converts a numeric Hebrew year (e.g. 5787) to its traditional
 * Hebrew-letter representation (e.g. תשפ"ז).
 * The thousands digit is omitted by convention.
 */
export function formatHebrewYear(year: number): string {
  let remainder = year % 1000;
  const letters: string[] = [];

  const hundreds = [400, 300, 200, 100];
  for (const h of hundreds) {
    while (remainder >= h) {
      letters.push(GEMATRIA[h]);
      remainder -= h;
    }
  }

  if (remainder === 15) {
    letters.push('ט', 'ו');
    remainder = 0;
  } else if (remainder === 16) {
    letters.push('ט', 'ז');
    remainder = 0;
  } else {
    const tens = Math.floor(remainder / 10) * 10;
    if (tens > 0 && GEMATRIA[tens]) {
      letters.push(GEMATRIA[tens]);
      remainder -= tens;
    }
    if (remainder > 0 && GEMATRIA[remainder]) {
      letters.push(GEMATRIA[remainder]);
    }
  }

  if (letters.length >= 2) {
    const last = letters.pop()!;
    return letters.join('') + '"' + last;
  }
  return letters.join('') + '׳';
}

/**
 * Returns all Gregorian month keys that a date range spans.
 * For example, Tishrei 5787 (Sep 12 - Oct 11, 2026) spans ['2026-09', '2026-10'].
 */
export function getMonthKeysInRange(startDate: Date, endDate: Date): string[] {
  const keys = new Set<string>();
  const current = new Date(startDate);

  while (current <= endDate) {
    keys.add(dateToMonthKey(current));
    current.setMonth(current.getMonth() + 1);
    current.setDate(1);
  }

  return Array.from(keys).sort();
}
