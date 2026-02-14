import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { defaultTemplates } from '@/lib/marketing/defaultTemplates';

/**
 * POST - Initialize default system templates
 * Idempotent: only creates templates that don't already exist (by name)
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

    // Check which templates already exist
    const existingTemplates = await prisma.emailTemplate.findMany({
      where: { isSystem: true },
      select: { name: true },
    });
    const existingNames = new Set(existingTemplates.map((t) => t.name));

    // Filter out templates that already exist
    const templatesToCreate = defaultTemplates.filter(
      (t) => !existingNames.has(t.name)
    );

    if (templatesToCreate.length === 0) {
      return NextResponse.json({
        message: 'כל תבניות ברירת המחדל כבר קיימות',
        created: 0,
        templates: [],
      });
    }

    // Create missing templates
    const createdTemplates = await Promise.all(
      templatesToCreate.map((t) =>
        prisma.emailTemplate.create({
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
            creator: {
              select: { id: true, name: true, email: true },
            },
          },
        })
      )
    );

    return NextResponse.json({
      message: `נוצרו ${createdTemplates.length} תבניות ברירת מחדל`,
      created: createdTemplates.length,
      templates: createdTemplates,
    });
  } catch (error) {
    console.error('Error initializing templates:', error);
    return NextResponse.json(
      { error: 'Failed to initialize templates' },
      { status: 500 }
    );
  }
}

