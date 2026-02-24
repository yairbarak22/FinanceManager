import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { defaultTemplates } from '@/lib/marketing/defaultTemplates';

/**
 * POST - Initialize & sync default system templates
 * Creates new templates and updates existing ones when content/subject changed in code
 */
export async function POST() {
  try {
    const { userId, error } = await requireAdmin();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`admin:${userId}`, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429 }
      );
    }

    const existingTemplates = await prisma.emailTemplate.findMany({
      where: { isSystem: true },
      select: { id: true, name: true, subject: true, content: true, description: true, category: true },
    });
    const existingByName = new Map(existingTemplates.map((t) => [t.name, t]));

    let created = 0;
    let updated = 0;

    const results = await Promise.all(
      defaultTemplates.map(async (t) => {
        const existing = existingByName.get(t.name);

        if (!existing) {
          created++;
          return prisma.emailTemplate.create({
            data: {
              name: t.name,
              subject: t.subject,
              content: t.content,
              description: t.description,
              category: t.category,
              isSystem: true,
              createdBy: userId,
            },
            include: {
              creator: { select: { id: true, name: true, email: true } },
            },
          });
        }

        const needsUpdate =
          existing.subject !== t.subject ||
          existing.content !== t.content ||
          existing.description !== t.description ||
          existing.category !== t.category;

        if (needsUpdate) {
          updated++;
          return prisma.emailTemplate.update({
            where: { id: existing.id },
            data: {
              subject: t.subject,
              content: t.content,
              description: t.description,
              category: t.category,
            },
            include: {
              creator: { select: { id: true, name: true, email: true } },
            },
          });
        }

        return null;
      })
    );

    const changedTemplates = results.filter(Boolean);

    if (changedTemplates.length === 0) {
      return NextResponse.json({
        message: 'כל התבניות מעודכנות',
        created: 0,
        updated: 0,
        templates: [],
      });
    }

    return NextResponse.json({
      message: `${created > 0 ? `נוצרו ${created} תבניות` : ''}${created > 0 && updated > 0 ? ', ' : ''}${updated > 0 ? `עודכנו ${updated} תבניות` : ''}`,
      created,
      updated,
      templates: changedTemplates,
    });
  } catch (error) {
    console.error('Error initializing templates:', error);
    return NextResponse.json(
      { error: 'Failed to initialize templates' },
      { status: 500 }
    );
  }
}

