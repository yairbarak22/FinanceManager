import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { MAX_APPOINTMENTS } from '@/lib/appointments';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [bookedCount, totalSlots, appointments] = await Promise.all([
    prisma.appointment.count({ where: { status: 'CONFIRMED' } }),
    prisma.appointmentSlot.count(),
    prisma.appointment.findMany({
      include: {
        slot: { select: { date: true, startTime: true, endTime: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return NextResponse.json({
    stats: {
      total: MAX_APPOINTMENTS,
      booked: bookedCount,
      remaining: Math.max(0, MAX_APPOINTMENTS - bookedCount),
      totalSlots,
    },
    appointments: appointments.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      status: a.status,
      date: a.slot.date.toISOString().split('T')[0],
      startTime: a.slot.startTime,
      endTime: a.slot.endTime,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}
