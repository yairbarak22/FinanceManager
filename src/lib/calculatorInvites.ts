/**
 * Calculator Invites Logic
 * Handles the viral unlock mechanism for pro calculators
 */

import { prisma } from './prisma';
import { CalcInviteStatus } from '@prisma/client';

/**
 * Process pending calculator invites when a new user signs up
 * This is called from the NextAuth signIn event
 */
export async function processCalculatorInvites(newUserEmail: string): Promise<void> {
  const emailLower = newUserEmail.toLowerCase();

  // Find all pending invites for this email
  const pendingInvites = await prisma.calculatorInvite.findMany({
    where: {
      inviteeEmail: emailLower,
      status: CalcInviteStatus.PENDING,
      expiresAt: { gt: new Date() },
    },
  });

  if (pendingInvites.length === 0) {
    return;
  }

  console.log(`[CalculatorInvites] Processing ${pendingInvites.length} pending invites for ${emailLower}`);

  // Process each invite
  for (const invite of pendingInvites) {
    try {
      // Use transaction to ensure atomicity
      await prisma.$transaction([
        // Update invite status to ACCEPTED
        prisma.calculatorInvite.update({
          where: { id: invite.id },
          data: {
            status: CalcInviteStatus.ACCEPTED,
            acceptedAt: new Date(),
          },
        }),
        // Unlock pro access for the inviter
        prisma.user.update({
          where: { id: invite.inviterId },
          data: { hasProAccess: true },
        }),
      ]);

      console.log(`[CalculatorInvites] Unlocked pro access for user ${invite.inviterId}`);
    } catch (error) {
      console.error(`[CalculatorInvites] Failed to process invite ${invite.id}:`, error);
    }
  }
}

/**
 * Check if a user has pro access to calculators
 */
export async function hasCalculatorAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hasProAccess: true },
  });

  return user?.hasProAccess ?? false;
}

/**
 * Get invite statistics for a user
 */
export async function getInviteStats(userId: string): Promise<{
  pendingCount: number;
  acceptedCount: number;
  hasAccess: boolean;
}> {
  const [pendingCount, acceptedCount, user] = await Promise.all([
    prisma.calculatorInvite.count({
      where: {
        inviterId: userId,
        status: CalcInviteStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    }),
    prisma.calculatorInvite.count({
      where: {
        inviterId: userId,
        status: CalcInviteStatus.ACCEPTED,
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { hasProAccess: true },
    }),
  ]);

  return {
    pendingCount,
    acceptedCount,
    hasAccess: user?.hasProAccess ?? false,
  };
}

/**
 * Create a new calculator invite
 */
export async function createCalculatorInvite(
  inviterId: string,
  inviterEmail: string,
  inviteeEmail: string
): Promise<{ success: boolean; error?: string; inviteId?: string; token?: string }> {
  const emailLower = inviteeEmail.toLowerCase();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailLower)) {
    return { success: false, error: 'כתובת אימייל לא תקינה' };
  }

  // Prevent self-invite
  if (emailLower === inviterEmail.toLowerCase()) {
    return { success: false, error: 'לא ניתן להזמין את עצמך' };
  }

  // Check if already invited (pending)
  const existingInvite = await prisma.calculatorInvite.findFirst({
    where: {
      inviterId,
      inviteeEmail: emailLower,
      status: CalcInviteStatus.PENDING,
      expiresAt: { gt: new Date() },
    },
  });

  if (existingInvite) {
    return { success: false, error: 'כבר שלחת הזמנה לכתובת זו' };
  }

  // Check if invitee is already a user
  const existingUser = await prisma.user.findUnique({
    where: { email: emailLower },
  });

  if (existingUser) {
    return { success: false, error: 'משתמש זה כבר רשום ל-NETO' };
  }

  // Rate limit: max 10 invites per day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const invitesToday = await prisma.calculatorInvite.count({
    where: {
      inviterId,
      createdAt: { gte: today },
    },
  });

  if (invitesToday >= 10) {
    return { success: false, error: 'הגעת למגבלת ההזמנות היומית (10 הזמנות ליום)' };
  }

  // Create the invite (expires in 30 days)
  const invite = await prisma.calculatorInvite.create({
    data: {
      inviterId,
      inviteeEmail: emailLower,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    success: true,
    inviteId: invite.id,
    token: invite.token,
  };
}

/**
 * Clean up expired invites (can be run as a cron job)
 */
export async function cleanupExpiredInvites(): Promise<number> {
  const result = await prisma.calculatorInvite.updateMany({
    where: {
      status: CalcInviteStatus.PENDING,
      expiresAt: { lt: new Date() },
    },
    data: {
      status: CalcInviteStatus.EXPIRED,
    },
  });

  return result.count;
}

