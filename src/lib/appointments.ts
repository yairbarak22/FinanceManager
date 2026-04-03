import { z } from 'zod';

// ============================================
// CONSTANTS
// ============================================

export const MAX_APPOINTMENTS = 50;
export const SLOT_DURATION_MINUTES = 10;

// ============================================
// ZOD SCHEMAS
// ============================================

export const reserveSchema = z.object({
  slotId: z.string().cuid(),
  name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים').max(100).trim(),
  email: z.string().email('כתובת מייל לא תקינה').max(255).toLowerCase().trim(),
  phone: z
    .string()
    .regex(/^0[2-9]\d{7,8}$/, 'מספר טלפון ישראלי לא תקין')
    .trim(),
});

export const createSlotsSchema = z.object({
  date: z.string().min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'שעה לא תקינה'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'שעה לא תקינה'),
  intervalMinutes: z.number().min(5).max(60).default(SLOT_DURATION_MINUTES),
});

export const deleteSlotSchema = z.object({
  slotId: z.string().cuid(),
});

// ============================================
// TYPES
// ============================================

export type ReserveInput = z.infer<typeof reserveSchema>;
export type CreateSlotsInput = z.infer<typeof createSlotsSchema>;

export interface SlotPublic {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface AppointmentStats {
  total: number;
  booked: number;
  remaining: number;
}

// ============================================
// HELPERS
// ============================================

/**
 * Format a Date to Hebrew date string using Intl API
 */
export function formatHebrewDate(date: Date): string {
  return new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Generate time slots between startTime and endTime with given interval.
 * Returns array of { startTime, endTime } pairs in "HH:MM" format.
 */
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  intervalMinutes: number,
): { startTime: string; endTime: string }[] {
  const slots: { startTime: string; endTime: string }[] = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes + intervalMinutes <= endMinutes) {
    const slotStart = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;
    const slotEnd = `${String(Math.floor((currentMinutes + intervalMinutes) / 60)).padStart(2, '0')}:${String((currentMinutes + intervalMinutes) % 60).padStart(2, '0')}`;
    slots.push({ startTime: slotStart, endTime: slotEnd });
    currentMinutes += intervalMinutes;
  }

  return slots;
}
