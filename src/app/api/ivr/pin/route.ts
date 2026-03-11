import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { validateRequest } from '@/lib/validateRequest';
import { ivrPinSchema } from '@/lib/validationSchemas';
import { hashPin } from '@/lib/ivr/helpers';

export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const ivrPin = await prisma.ivrPin.findUnique({
    where: { userId },
    select: { phoneNumber: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({
    hasPin: !!ivrPin,
    phoneNumber: ivrPin?.phoneNumber ?? null,
    createdAt: ivrPin?.createdAt ?? null,
    updatedAt: ivrPin?.updatedAt ?? null,
  });
}

export async function POST(request: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const rl = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'יותר מדי בקשות. אנא המתן ונסה שוב.' },
      { status: 429 }
    );
  }

  const { data, errorResponse } = await validateRequest(request, ivrPinSchema);
  if (errorResponse) return errorResponse;

  const hashedPinValue = await hashPin(data.pin);

  const ivrPin = await prisma.ivrPin.upsert({
    where: { userId },
    create: {
      userId,
      hashedPin: hashedPinValue,
      phoneNumber: data.phoneNumber,
    },
    update: {
      hashedPin: hashedPinValue,
      phoneNumber: data.phoneNumber,
    },
  });

  return NextResponse.json({
    success: true,
    phoneNumber: ivrPin.phoneNumber,
    updatedAt: ivrPin.updatedAt,
  });
}

export async function DELETE() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const existing = await prisma.ivrPin.findUnique({ where: { userId } });
  if (!existing) {
    return NextResponse.json({ error: 'לא הוגדר PIN' }, { status: 404 });
  }

  await prisma.ivrPin.delete({ where: { userId } });

  return NextResponse.json({ success: true });
}
