import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp, IP_RATE_LIMITS } from '@/lib/rateLimit';
import { reserveSchema, MAX_APPOINTMENTS } from '@/lib/appointments';

export async function POST(request: Request) {
  // Rate limit by IP — strict
  const ip = getClientIp(new Headers(request.headers));
  const rl = await checkRateLimit(`book-reserve:ip:${ip}`, IP_RATE_LIMITS.bookReserve);
  if (!rl.success) {
    return NextResponse.json({ error: 'יותר מדי ניסיונות, נסה שוב בעוד דקה' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'גוף הבקשה לא תקין' }, { status: 400 });
  }

  const parsed = reserveSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'קלט לא תקין';
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { slotId, name, email, phone } = parsed.data;

  try {
    // Atomic transaction: check capacity + book slot
    const appointment = await prisma.$transaction(async (tx) => {
      // Check global capacity
      const bookedCount = await tx.appointment.count({
        where: { status: 'CONFIRMED' },
      });
      if (bookedCount >= MAX_APPOINTMENTS) {
        throw new Error('CAPACITY_FULL');
      }

      // Attempt to book the slot (fails if already booked)
      const slot = await tx.appointmentSlot.updateMany({
        where: { id: slotId, isBooked: false },
        data: { isBooked: true },
      });

      if (slot.count === 0) {
        throw new Error('SLOT_TAKEN');
      }

      // Create appointment
      return tx.appointment.create({
        data: { slotId, name, email, phone },
        include: {
          slot: { select: { date: true, startTime: true, endTime: true } },
        },
      });
    });

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        name: appointment.name,
        date: appointment.slot.date.toISOString().split('T')[0],
        startTime: appointment.slot.startTime,
        endTime: appointment.slot.endTime,
      },
      remaining: Math.max(0, MAX_APPOINTMENTS - (await prisma.appointment.count({ where: { status: 'CONFIRMED' } }))),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';

    if (message === 'CAPACITY_FULL') {
      return NextResponse.json({ error: 'כל המקומות תפוסים' }, { status: 409 });
    }
    if (message === 'SLOT_TAKEN') {
      return NextResponse.json({ error: 'השעה כבר נתפסה, בחר שעה אחרת' }, { status: 409 });
    }

    console.error('Booking error:', err);
    return NextResponse.json({ error: 'שגיאה בקביעת הפגישה' }, { status: 500 });
  }
}
