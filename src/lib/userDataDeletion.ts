/**
 * Granular User Data Deletion
 *
 * Provides domain-aware, dependency-ordered deletion of user data.
 * Used by both the selective-delete API and the legacy delete-all-data route.
 */

import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import { del } from '@vercel/blob';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Domain definitions
// ---------------------------------------------------------------------------

export const DATA_DOMAINS = [
  'transactions',
  'recurringAndGoals',
  'assetsAndLiabilities',
  'holdings',
  'documents',
  'customCategories',
  'maaser',
  'budgets',
  'monthlyReports',
  'profile',
] as const;

export type DataDomain = (typeof DATA_DOMAINS)[number];

export const dataDeletionSchema = z.object({
  domains: z
    .array(z.enum(DATA_DOMAINS))
    .min(1, 'יש לבחור לפחות קבוצת נתונים אחת'),
});

export type DataDeletionInput = z.infer<typeof dataDeletionSchema>;

/** Hebrew labels + icons for the UI */
export const DOMAIN_META: Record<
  DataDomain,
  { label: string; description: string; icon: string }
> = {
  transactions: {
    label: 'עסקאות',
    description: 'כל העסקאות והיסטוריית התזרים',
    icon: 'Receipt',
  },
  recurringAndGoals: {
    label: 'קבועות ויעדים',
    description: 'הוצאות/הכנסות קבועות ויעדי חיסכון',
    icon: 'Repeat',
  },
  assetsAndLiabilities: {
    label: 'נכסים והתחייבויות',
    description: 'נכסים, היסטוריית ערכים, התחייבויות ומשכנתאות',
    icon: 'Landmark',
  },
  holdings: {
    label: 'תיק השקעות',
    description: 'החזקות, מחירים, והקצאות',
    icon: 'TrendingUp',
  },
  documents: {
    label: 'מסמכים',
    description: 'קבצים מצורפים (יימחקו גם מהאחסון)',
    icon: 'FileText',
  },
  customCategories: {
    label: 'קטגוריות מותאמות',
    description: 'קטגוריות שיצרת באופן אישי',
    icon: 'Tags',
  },
  maaser: {
    label: 'מעשרות',
    description: 'העדפות מעשר/חומש וקיזוזים',
    icon: 'Heart',
  },
  budgets: {
    label: 'תקציב',
    description: 'תקציבי קטגוריות חודשיים ותכנון פסח',
    icon: 'PieChart',
  },
  monthlyReports: {
    label: 'דוחות חודשיים',
    description: 'דוחות שנוצרו (ניתן ליצירה מחדש)',
    icon: 'BarChart3',
  },
  profile: {
    label: 'פרופיל פיננסי',
    description: 'נתונים אישיים, מצב משפחתי, העדפות',
    icon: 'UserCog',
  },
};

/**
 * Domains that require another domain to be deleted alongside them
 * to prevent broken UI state.
 */
export const DOMAIN_DEPENDENCIES: Partial<Record<DataDomain, DataDomain[]>> = {
  customCategories: ['transactions', 'recurringAndGoals', 'budgets'],
};

// ---------------------------------------------------------------------------
// Preview (counts)
// ---------------------------------------------------------------------------

export type DeletionPreview = Record<DataDomain, number>;

export async function getDeletionPreview(
  userId: string
): Promise<DeletionPreview> {
  const [
    transactions,
    recurring,
    goals,
    assets,
    liabilities,
    holdings,
    documents,
    customCategories,
    maaserPrefs,
    maaserOffsets,
    budgets,
    passoverSections,
    monthlyReports,
    profile,
  ] = await Promise.all([
    prisma.transaction.count({ where: { userId } }),
    prisma.recurringTransaction.count({ where: { userId } }),
    prisma.financialGoal.count({ where: { userId } }),
    prisma.asset.count({ where: { userId } }),
    prisma.liability.count({ where: { userId } }),
    prisma.holding.count({ where: { userId } }),
    prisma.document.count({ where: { userId } }),
    prisma.customCategory.count({ where: { userId } }),
    prisma.maaserPreference.count({ where: { userId } }),
    prisma.maaserExpenseOffset.count({ where: { userId } }),
    prisma.budget.count({ where: { userId } }),
    prisma.passoverSection.count({ where: { userId } }),
    prisma.monthlyReport.count({ where: { userId } }),
    prisma.userProfile.count({ where: { userId } }),
  ]);

  return {
    transactions,
    recurringAndGoals: recurring + goals,
    assetsAndLiabilities: assets + liabilities,
    holdings,
    documents,
    customCategories,
    maaser: maaserPrefs + maaserOffsets,
    budgets: budgets + passoverSections,
    monthlyReports,
    profile,
  };
}

// ---------------------------------------------------------------------------
// Deletion execution
// ---------------------------------------------------------------------------

export interface DeletionResult {
  deleted: Partial<Record<DataDomain, number>>;
  blobErrors: number;
}

/**
 * Delete user data for the selected domains, respecting FK order.
 * Document blobs are cleaned up before the DB transaction.
 */
export async function executeSelectiveDeletion(
  userId: string,
  domains: DataDomain[]
): Promise<DeletionResult> {
  const selected = new Set(domains);
  const deleted: Partial<Record<DataDomain, number>> = {};
  let blobErrors = 0;

  // --- Pre-transaction: clean up Vercel Blob files ---
  if (selected.has('documents')) {
    const docs = await prisma.document.findMany({
      where: { userId },
      select: { url: true },
    });
    for (const doc of docs) {
      if (doc.url) {
        try {
          await del(doc.url);
        } catch {
          blobErrors++;
        }
      }
    }
  }

  // --- Transaction: ordered deletes ---
  // The order matters for FK constraints. We always check `selected` before
  // issuing a deleteMany so we only touch what the user asked for.
  await prisma.$transaction(async (tx) => {
    // 1. Asset value history (FK → Asset)
    if (selected.has('assetsAndLiabilities')) {
      await tx.assetValueHistory.deleteMany({
        where: { asset: { userId } },
      });
    }

    // 2. Financial goals (FK → RecurringTransaction, SetNull)
    if (selected.has('recurringAndGoals')) {
      const r = await tx.financialGoal.deleteMany({ where: { userId } });
      deleted.recurringAndGoals = r.count;
    }

    // 3. Transactions
    if (selected.has('transactions')) {
      const r = await tx.transaction.deleteMany({ where: { userId } });
      deleted.transactions = r.count;
    }

    // 4. Recurring transactions
    if (selected.has('recurringAndGoals')) {
      const r = await tx.recurringTransaction.deleteMany({ where: { userId } });
      deleted.recurringAndGoals = (deleted.recurringAndGoals ?? 0) + r.count;
    }

    // 5. Assets (cascade removes AssetValueHistory already deleted above)
    if (selected.has('assetsAndLiabilities')) {
      const r = await tx.asset.deleteMany({ where: { userId } });
      deleted.assetsAndLiabilities = r.count;
    }

    // 6. Liabilities (cascade removes MortgageTrack)
    if (selected.has('assetsAndLiabilities')) {
      const r = await tx.liability.deleteMany({ where: { userId } });
      deleted.assetsAndLiabilities =
        (deleted.assetsAndLiabilities ?? 0) + r.count;
    }

    // 7. Holdings
    if (selected.has('holdings')) {
      const r = await tx.holding.deleteMany({ where: { userId } });
      deleted.holdings = r.count;
    }

    // 8. Documents (blobs already cleaned above)
    if (selected.has('documents')) {
      const r = await tx.document.deleteMany({ where: { userId } });
      deleted.documents = r.count;
    }

    // 9. Custom categories
    if (selected.has('customCategories')) {
      const r = await tx.customCategory.deleteMany({ where: { userId } });
      deleted.customCategories = r.count;
    }

    // 10. Maaser
    if (selected.has('maaser')) {
      const r1 = await tx.maaserPreference.deleteMany({ where: { userId } });
      const r2 = await tx.maaserExpenseOffset.deleteMany({
        where: { userId },
      });
      deleted.maaser = r1.count + r2.count;
    }

    // 11. Budgets
    if (selected.has('budgets')) {
      const r1 = await tx.budget.deleteMany({ where: { userId } });
      const r2 = await tx.passoverSection.deleteMany({ where: { userId } });
      deleted.budgets = r1.count + r2.count;
    }

    // 12. Monthly reports
    if (selected.has('monthlyReports')) {
      const r = await tx.monthlyReport.deleteMany({ where: { userId } });
      deleted.monthlyReports = r.count;
    }

    // 13. Profile
    if (selected.has('profile')) {
      const r = await tx.userProfile.deleteMany({ where: { userId } });
      deleted.profile = r.count;
    }
  });

  return { deleted, blobErrors };
}

/**
 * Delete ALL user financial data (backwards-compatible wrapper).
 * Used by the existing delete-all-data route.
 */
export async function executeFullDeletion(
  userId: string
): Promise<DeletionResult> {
  return executeSelectiveDeletion(userId, [...DATA_DOMAINS]);
}

// ---------------------------------------------------------------------------
// Full account reset
// ---------------------------------------------------------------------------

export const fullResetSchema = z.object({
  confirm: z.literal('אפס הכל'),
});

export interface FullResetResult {
  totalDeleted: number;
  blobErrors: number;
}

/**
 * Complete account reset — deletes ALL user data and resets User fields.
 * Preserves: User record, Account (OAuth), Session, AuditLog.
 *
 * This goes beyond executeFullDeletion by also removing models that aren't
 * part of the 10 selectable DATA_DOMAINS (net-worth history, merchant
 * mappings, IVR, import sessions, etc.) and resetting User-level fields.
 */
export async function executeFullReset(
  userId: string
): Promise<FullResetResult> {
  let blobErrors = 0;
  let totalDeleted = 0;

  // --- Pre-transaction: clean up Vercel Blob files ---
  // Documents
  const docs = await prisma.document.findMany({
    where: { userId },
    select: { url: true },
  });
  for (const doc of docs) {
    if (doc.url) {
      try {
        await del(doc.url);
      } catch {
        blobErrors++;
      }
    }
  }

  // Quarantined files
  const quarantined = await prisma.quarantinedFile.findMany({
    where: { userId },
    select: { url: true },
  });
  for (const file of quarantined) {
    if (file.url) {
      try {
        await del(file.url);
      } catch {
        blobErrors++;
      }
    }
  }

  // --- Single transaction: delete everything ---
  await prisma.$transaction(async (tx) => {
    // FK-ordered deletes: children before parents

    // 1. Asset value history (FK → Asset)
    const r1 = await tx.assetValueHistory.deleteMany({ where: { asset: { userId } } });
    totalDeleted += r1.count;

    // 2. Mortgage tracks (FK → Liability)
    const r2 = await tx.mortgageTrack.deleteMany({ where: { liability: { userId } } });
    totalDeleted += r2.count;

    // 3. Workspace import rows (FK → WorkspaceImportSession)
    const r3 = await tx.workspaceImportRow.deleteMany({ where: { session: { userId } } });
    totalDeleted += r3.count;

    // 4. Financial goals (FK → RecurringTransaction)
    const r4 = await tx.financialGoal.deleteMany({ where: { userId } });
    totalDeleted += r4.count;

    // 5. Transactions
    const r5 = await tx.transaction.deleteMany({ where: { userId } });
    totalDeleted += r5.count;

    // 6. Recurring monthly coverage (FK → RecurringTransaction)
    const r6 = await tx.recurringMonthlyCoverage.deleteMany({ where: { userId } });
    totalDeleted += r6.count;

    // 7. Recurring transactions
    const r7 = await tx.recurringTransaction.deleteMany({ where: { userId } });
    totalDeleted += r7.count;

    // 8. Assets
    const r8 = await tx.asset.deleteMany({ where: { userId } });
    totalDeleted += r8.count;

    // 9. Liabilities
    const r9 = await tx.liability.deleteMany({ where: { userId } });
    totalDeleted += r9.count;

    // 10. Holdings
    const r10 = await tx.holding.deleteMany({ where: { userId } });
    totalDeleted += r10.count;

    // 11. Documents (blobs already cleaned above)
    const r11 = await tx.document.deleteMany({ where: { userId } });
    totalDeleted += r11.count;

    // 12. Custom categories
    const r12 = await tx.customCategory.deleteMany({ where: { userId } });
    totalDeleted += r12.count;

    // 13. Maaser
    const r13a = await tx.maaserPreference.deleteMany({ where: { userId } });
    const r13b = await tx.maaserExpenseOffset.deleteMany({ where: { userId } });
    totalDeleted += r13a.count + r13b.count;

    // 14. Budgets + Passover
    const r14a = await tx.budget.deleteMany({ where: { userId } });
    const r14b = await tx.passoverSection.deleteMany({ where: { userId } });
    totalDeleted += r14a.count + r14b.count;

    // 15. Monthly reports
    const r15 = await tx.monthlyReport.deleteMany({ where: { userId } });
    totalDeleted += r15.count;

    // 16. User profile
    const r16 = await tx.userProfile.deleteMany({ where: { userId } });
    totalDeleted += r16.count;

    // --- Models not covered by selective deletion ---

    // 17. Net worth history
    const r17 = await tx.netWorthHistory.deleteMany({ where: { userId } });
    totalDeleted += r17.count;

    // 18. Merchant category mappings
    const r18 = await tx.merchantCategoryMap.deleteMany({ where: { userId } });
    totalDeleted += r18.count;

    // 19. Workspace import sessions (rows already deleted above)
    const r19 = await tx.workspaceImportSession.deleteMany({ where: { userId } });
    totalDeleted += r19.count;

    // 20. IVR & reporting
    const r20a = await tx.ivrCallSession.deleteMany({ where: { userId } });
    const r20b = await tx.ivrPin.deleteMany({ where: { userId } });
    const r20c = await tx.reportingPhone.deleteMany({ where: { userId } });
    totalDeleted += r20a.count + r20b.count + r20c.count;

    // 21. WhatsApp usage
    const r21 = await tx.whatsappMonthlyUsage.deleteMany({ where: { userId } });
    totalDeleted += r21.count;

    // 22. Calculator invites
    const r22 = await tx.calculatorInvite.deleteMany({ where: { inviterId: userId } });
    totalDeleted += r22.count;

    // 23. Marketing events
    const r23 = await tx.marketingEvent.deleteMany({ where: { userId } });
    totalDeleted += r23.count;

    // 24. Workflow enrollments
    const r24 = await tx.workflowEnrollment.deleteMany({ where: { userId } });
    totalDeleted += r24.count;

    // 25. CTA clicks
    const r25 = await tx.ctaClick.deleteMany({ where: { userId } });
    totalDeleted += r25.count;

    // 26. Quarantined files (blobs already cleaned above)
    const r26 = await tx.quarantinedFile.deleteMany({ where: { userId } });
    totalDeleted += r26.count;

    // 27. Shared account memberships
    const r27 = await tx.sharedAccountMember.deleteMany({ where: { userId } });
    totalDeleted += r27.count;

    // 28. User group memberships
    const r28 = await tx.userGroupMember.deleteMany({ where: { userId } });
    totalDeleted += r28.count;

    // --- Reset User-level fields to defaults ---
    await tx.user.update({
      where: { id: userId },
      data: {
        hasSeenOnboarding: false,
        monthStartDay: 1,
        dashboardLayout: Prisma.JsonNull,
        openHoursLog: [],
        preferredSendHour: null,
      },
    });
  });

  return { totalDeleted, blobErrors };
}
