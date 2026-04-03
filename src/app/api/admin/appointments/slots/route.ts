import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { createSlotsSchema, deleteSlotSchema, generateTimeSlots } from '@/lib/appointments';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const slots = await prisma.appointmentSlot.findMany({
    include: {
      appointment: {
        select: { id: true, name: true, email: true, phone: true, status: true },
      },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });

  return NextResponse.json({
    slots: slots.map((s) => ({
      id: s.id,
      date: s.date.toISOString().split('T')[0],
      startTime: s.startTime,
      endTime: s.endTime,
      isBooked: s.isBooked,
      appointment: s.appointment
        ? {
            id: s.appointment.id,
            name: s.appointment.name,
            email: s.appointment.email,
            phone: s.appointment.phone,
            status: s.appointment.status,
          }
        : null,
    })),
  });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'גוף הבקשה לא תקין' }, { status: 400 });
  }

  const parsed = createSlotsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'קלט לא תקין' }, { status: 400 });
  }

  const { date, startTime, endTime, intervalMinutes } = parsed.data;
  const timeSlots = generateTimeSlots(startTime, endTime, intervalMinutes);

  if (timeSlots.length === 0) {
    return NextResponse.json({ error: 'לא ניתן ליצור slots בטווח הזה' }, { status: 400 });
  }

  // Create all slots in a batch
  const dateObj = new Date(date);
  dateObj.setUTCHours(0, 0, 0, 0);

  const created = await prisma.appointmentSlot.createMany({
    data: timeSlots.map((s) => ({
      date: dateObj,
      startTime: s.startTime,
      endTime: s.endTime,
    })),
  });

  return NextResponse.json({ created: created.count });
}

export async function DELETE(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'גוף הבקשה לא תקין' }, { status: 400 });
  }

  const parsed = deleteSlotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'קלט לא תקין' }, { status: 400 });
  }

  // Only allow deleting un-booked slots
  const deleted = await prisma.appointmentSlot.deleteMany({
    where: { id: parsed.data.slotId, isBooked: false },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: 'לא ניתן למחוק slot תפוס או שלא קיים' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
