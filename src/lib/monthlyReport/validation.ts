import { prisma } from '@/lib/prisma';

/**
 * Check if a report can be created for a given month (not already existing)
 */
export async function canCreateReport(
  userId: string,
  monthKey: string
): Promise<{ canCreate: boolean; existingReportId?: string }> {
  const existing = await prisma.monthlyReport.findUnique({
    where: {
      userId_monthKey: { userId, monthKey },
    },
    select: { id: true },
  });

  if (existing) {
    return { canCreate: false, existingReportId: existing.id };
  }

  return { canCreate: true };
}

/**
 * Get months that already have reports
 */
export async function getReportedMonths(
  userId: string
): Promise<string[]> {
  const reports = await prisma.monthlyReport.findMany({
    where: { userId },
    select: { monthKey: true },
    orderBy: { monthKey: 'desc' },
  });

  return reports.map((r) => r.monthKey);
}
