import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { validateRequest } from '@/lib/validateRequest';
import { ivrPinSchema } from '@/lib/validationSchemas';
import { hashPin, normalizePhone, MAX_REPORTING_PHONES } from '@/lib/ivr/helpers';

export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const [ivrPin, phones] = await Promise.all([
    prisma.ivrPin.findUnique({
      where: { userId },
      select: { createdAt: true, updatedAt: true },
    }),
    prisma.reportingPhone.findMany({
      where: { userId },
      select: { phoneNumber: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  return NextResponse.json({
    hasPin: !!ivrPin,
    phoneNumbers: phones.map((p) => p.phoneNumber),
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

  const normalized = [...new Set(data.phoneNumbers.map(normalizePhone))];

  if (normalized.length > MAX_REPORTING_PHONES) {
    return NextResponse.json(
      { error: `ניתן להוסיף עד ${MAX_REPORTING_PHONES} מספרים` },
      { status: 400 }
    );
  }

  // Check no other user owns any of these numbers
  const conflicts = await prisma.reportingPhone.findMany({
    where: {
      phoneNumber: { in: normalized },
      userId: { not: userId },
    },
    select: { phoneNumber: true },
  });

  if (conflicts.length > 0) {
    return NextResponse.json(
      { error: `המספר ${conflicts[0].phoneNumber} כבר רשום למשתמש אחר` },
      { status: 409 }
    );
  }

  const hashedPinValue = await hashPin(data.pin);

  await prisma.$transaction([
    prisma.ivrPin.upsert({
      where: { userId },
      create: { userId, hashedPin: hashedPinValue },
      update: { hashedPin: hashedPinValue },
    }),
    prisma.reportingPhone.deleteMany({ where: { userId } }),
    ...normalized.map((phoneNumber) =>
      prisma.reportingPhone.create({
        data: { userId, phoneNumber },
      })
    ),
  ]);

  return NextResponse.json({
    success: true,
    phoneNumbers: normalized,
  });
}

export async function DELETE() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const existing = await prisma.ivrPin.findUnique({ where: { userId } });
  if (!existing) {
    return NextResponse.json({ error: 'לא הוגדר PIN' }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.reportingPhone.deleteMany({ where: { userId } }),
    prisma.ivrPin.delete({ where: { userId } }),
  ]);

  return NextResponse.json({ success: true });
}
