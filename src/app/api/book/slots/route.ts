import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp, IP_RATE_LIMITS } from '@/lib/rateLimit';
import { MAX_APPOINTMENTS } from '@/lib/appointments';

export async function GET(request: Request) {
  // Rate limit by IP
  const ip = getClientIp(new Headers(request.headers));
  const rl = await checkRateLimit(`book-slots:ip:${ip}`, IP_RATE_LIMITS.bookSlots);
  if (!rl.success) {
    return NextResponse.json({ error: 'יותר מדי בקשות, נסה שוב בעוד דקה' }, { status: 429 });
  }

  const url = new URL(request.url);
  const dateParam = url.searchParams.get('date'); // optional: filter by specific date

  // Count total booked
  const bookedCount = await prisma.appointment.count({
    where: { status: 'CONFIRMED' },
  });
  const remaining = Math.max(0, MAX_APPOINTMENTS - bookedCount);

  // If all slots taken, return early
  if (remaining === 0) {
    return NextResponse.json({ slots: [], remaining: 0, total: MAX_APPOINTMENTS });
  }

  // Build where clause for available future slots
  const now = new Date();
  const where: Record<string, unknown> = {
    isBooked: false,
    date: { gte: new Date(now.toISOString().split('T')[0]) }, // today or later
  };

  if (dateParam) {
    const targetDate = new Date(dateParam);
    if (!isNaN(targetDate.getTime())) {
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.date = { gte: targetDate, lt: nextDay };
    }
  }

  const slots = await prisma.appointmentSlot.findMany({
    where,
    select: { id: true, date: true, startTime: true, endTime: true },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });

  // Get distinct available dates for calendar highlighting
  const availableDates = [...new Set(slots.map((s) => s.date.toISOString().split('T')[0]))];

  return NextResponse.json({
    slots: slots.map((s) => ({
      id: s.id,
      date: s.date.toISOString().split('T')[0],
      startTime: s.startTime,
      endTime: s.endTime,
    })),
    availableDates,
    remaining,
    total: MAX_APPOINTMENTS,
  });
}
