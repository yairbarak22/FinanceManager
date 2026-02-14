/**
 * User Segmentation Logic
 * Calculates list of users based on segment filters
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface SegmentFilter {
  type: 'all' | 'freeOnly' | 'inactiveDays' | 'hasProfile' | 'noTransactionsThisMonth' | 'haredi' | 'manual' | 'csv' | 'custom';
  // For inactiveDays
  days?: number;
  // For manual selection
  selectedUserIds?: string[];
  // For CSV upload
  csvEmails?: string[];
  // For custom
  customFilter?: Prisma.UserWhereInput;
}

/**
 * Get users matching the segment filter
 * Returns array of user IDs and emails
 */
export async function getSegmentUsers(
  segmentFilter: SegmentFilter
): Promise<Array<{ id: string; email: string; name: string | null }>> {
  const where: Prisma.UserWhereInput = {
    // Always exclude users who unsubscribed from marketing
    isMarketingSubscribed: true,
  };

  switch (segmentFilter.type) {
    case 'all':
      // All subscribed users - no additional filter
      break;

    case 'freeOnly':
      // Users without Pro access
      where.hasProAccess = false;
      break;

    case 'inactiveDays':
      // Users who haven't logged in for X days
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - (segmentFilter.days || 30));
      // Check last session (approximate - based on updatedAt as proxy)
      // Note: This is approximate since we don't track last login directly
      where.updatedAt = {
        lt: daysAgo,
      };
      break;

    case 'hasProfile':
      // Users with complete profile
      where.profile = {
        isNot: null,
      };
      break;

    case 'noTransactionsThisMonth':
      // Users without transactions this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      where.transactions = {
        none: {
          date: {
            gte: startOfMonth,
          },
        },
      };
      break;

    case 'haredi':
      // Haredi users (signupSource === 'prog')
      where.signupSource = 'prog';
      break;

    case 'manual':
      // Manually selected users
      if (!segmentFilter.selectedUserIds || !Array.isArray(segmentFilter.selectedUserIds)) {
        console.warn('[Segment] Manual selectedUserIds not provided or not an array');
        return [];
      }

      if (segmentFilter.selectedUserIds.length === 0) {
        return [];
      }

      // Validate user IDs are strings
      const validUserIds = segmentFilter.selectedUserIds.filter(
        (id): id is string => typeof id === 'string' && id.length > 0
      );

      if (validUserIds.length === 0) {
        console.warn('[Segment] No valid user IDs in manual selection');
        return [];
      }

      where.id = {
        in: validUserIds,
      };
      break;

    case 'csv':
      // CSV uploaded emails - handle both existing users and external emails
      try {
        if (!segmentFilter.csvEmails || !Array.isArray(segmentFilter.csvEmails)) {
          console.warn('[Segment] CSV emails not provided or not an array');
          return [];
        }

        if (segmentFilter.csvEmails.length === 0) {
          return [];
        }

        // Validate emails are strings
        const validEmails = segmentFilter.csvEmails.filter(
          (email): email is string => typeof email === 'string' && email.includes('@')
        );

        if (validEmails.length === 0) {
          console.warn('[Segment] No valid emails in CSV list');
          return [];
        }

        // Find existing users with these emails (only subscribed ones)
        const existingUsers = await prisma.user.findMany({
          where: {
            email: {
              in: validEmails,
            },
            isMarketingSubscribed: true,
          },
          select: {
            id: true,
            email: true,
            name: true,
          },
        });

        // Get emails of existing users
        const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));

        // Create entries for external emails (not in system)
        const externalEmails = validEmails
          .filter((email) => !existingEmails.has(email.toLowerCase()))
          .map((email) => ({
            id: `external-${email.toLowerCase()}`, // Fake ID for external emails
            email: email.toLowerCase(),
            name: null,
          }));

        // Return both existing users and external emails
        return [...existingUsers, ...externalEmails];
      } catch (error) {
        console.error('[Segment] Error processing CSV segment', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return [];
      }

    case 'custom':
      // Custom filter - merge with base filter
      if (segmentFilter.customFilter) {
        Object.assign(where, segmentFilter.customFilter);
      }
      break;

    default:
      // Unknown segment type - log warning and return empty
      console.warn('[Segment] Unknown segment filter type', {
        type: segmentFilter.type,
      });
      return [];
  }

  // For CSV, we already returned above
  if (segmentFilter.type === 'csv') {
    // This should never be reached, but TypeScript needs it
    return [];
  }

  // For manual and other types, query the database
  try {
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return users;
  } catch (error) {
    console.error('[Segment] Error fetching users from database', {
      error: error instanceof Error ? error.message : 'Unknown error',
      segmentType: segmentFilter.type,
    });
    return [];
  }
}

/**
 * Count users matching the segment filter
 * Faster than getSegmentUsers when you only need the count
 */
export async function countSegmentUsers(segmentFilter: SegmentFilter): Promise<number> {
  const where: Prisma.UserWhereInput = {
    isMarketingSubscribed: true,
  };

  switch (segmentFilter.type) {
    case 'all':
      break;

    case 'freeOnly':
      where.hasProAccess = false;
      break;

    case 'inactiveDays':
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - (segmentFilter.days || 30));
      where.updatedAt = {
        lt: daysAgo,
      };
      break;

    case 'hasProfile':
      where.profile = {
        isNot: null,
      };
      break;

    case 'noTransactionsThisMonth':
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      where.transactions = {
        none: {
          date: {
            gte: startOfMonth,
          },
        },
      };
      break;

    case 'haredi':
      where.signupSource = 'prog';
      break;

    case 'manual':
      if (segmentFilter.selectedUserIds && segmentFilter.selectedUserIds.length > 0) {
        where.id = {
          in: segmentFilter.selectedUserIds,
        };
      } else {
        return 0;
      }
      break;

    case 'csv':
      // For CSV, return the total count of emails (including external ones)
      if (segmentFilter.csvEmails && segmentFilter.csvEmails.length > 0) {
        // Return total count (existing + external)
        // Note: This counts all CSV emails, including those not in the system
        return segmentFilter.csvEmails.length;
      } else {
        return 0;
      }

    case 'custom':
      if (segmentFilter.customFilter) {
        Object.assign(where, segmentFilter.customFilter);
      }
      break;
  }

  return prisma.user.count({ where });
}

/**
 * Validate segment filter structure
 */
export function validateSegmentFilter(filter: unknown): filter is SegmentFilter {
  if (!filter || typeof filter !== 'object') {
    console.warn('[Segment Validation] Filter is null or not an object', { filter });
    return false;
  }

  const f = filter as Record<string, unknown>;
  if (typeof f.type !== 'string') {
    console.warn('[Segment Validation] Filter type is not a string', { type: f.type });
    return false;
  }

  const validTypes = ['all', 'freeOnly', 'inactiveDays', 'hasProfile', 'noTransactionsThisMonth', 'haredi', 'manual', 'csv', 'custom'];
  if (!validTypes.includes(f.type)) {
    console.warn('[Segment Validation] Invalid filter type', { type: f.type, validTypes });
    return false;
  }

  // Validate inactiveDays
  if (f.type === 'inactiveDays') {
    if (typeof f.days !== 'number' || f.days < 1) {
      console.warn('[Segment Validation] Invalid days for inactiveDays', { days: f.days });
      return false;
    }
  }

  // Validate manual selection
  if (f.type === 'manual') {
    if (!f.selectedUserIds) {
      console.warn('[Segment Validation] Manual type requires selectedUserIds');
      return false;
    }
    if (!Array.isArray(f.selectedUserIds)) {
      console.warn('[Segment Validation] selectedUserIds must be an array', { selectedUserIds: f.selectedUserIds });
      return false;
    }
    if (f.selectedUserIds.length === 0) {
      console.warn('[Segment Validation] selectedUserIds array is empty');
      return false;
    }
    // Validate all IDs are strings
    if (!f.selectedUserIds.every((id: unknown) => typeof id === 'string' && id.length > 0)) {
      console.warn('[Segment Validation] selectedUserIds must contain only non-empty strings');
      return false;
    }
  }

  // Validate CSV upload
  if (f.type === 'csv') {
    if (!f.csvEmails) {
      console.warn('[Segment Validation] CSV type requires csvEmails');
      return false;
    }
    if (!Array.isArray(f.csvEmails)) {
      console.warn('[Segment Validation] csvEmails must be an array', { csvEmails: f.csvEmails });
      return false;
    }
    if (f.csvEmails.length === 0) {
      console.warn('[Segment Validation] csvEmails array is empty');
      return false;
    }
    // Validate all emails are strings and contain @
    if (!f.csvEmails.every((email: unknown) => typeof email === 'string' && email.includes('@'))) {
      console.warn('[Segment Validation] csvEmails must contain only valid email strings');
      return false;
    }
  }

  return true;
}

