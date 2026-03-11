/**
 * IVR Webhook Integration Tests
 *
 * Tests for the IVR webhook State Machine, PIN validation, and command generation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    ivrPin: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    ivrCallSession: {
      create: vi.fn().mockResolvedValue({ id: 'session-1' }),
      update: vi.fn(),
    },
    transaction: { create: vi.fn() },
    customCategory: { findMany: vi.fn().mockResolvedValue([]) },
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 'test-user-1' }),
    },
    sharedAccountMember: {
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock('@/lib/cache', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn(),
  cacheDelete: vi.fn(),
  CacheKeys: { authUser: (id: string) => `auth:${id}` },
  CacheTTL: { AUTH_USER: 3600 },
}));

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, limit: 10, remaining: 9, resetTime: Date.now() + 60000 }),
  RATE_LIMITS: { ivr: { maxRequests: 10, windowSeconds: 60 } },
}));

vi.mock('@/lib/config', () => ({
  config: { encryptionKey: 'a'.repeat(64), nodeEnv: 'test' },
}));

vi.mock('@/lib/auditLog', () => ({
  logAuditEvent: vi.fn(),
  AuditAction: { RATE_LIMITED: 'RATE_LIMITED' },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-pin'),
    compare: vi.fn(),
  },
}));

vi.mock('@/lib/ivr/processExpense', () => ({
  processExpenseBackground: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { GET } from '@/app/api/ivr/webhook/route';
import { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';

const mockPrisma = vi.mocked(prisma);
const mockBcrypt = vi.mocked(bcrypt);
const mockRateLimit = vi.mocked(checkRateLimit);

function makeRequest(params: Record<string, string>) {
  const url = new URL('http://localhost/api/ivr/webhook');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRateLimit.mockResolvedValue({ success: true, limit: 10, remaining: 9, resetTime: Date.now() + 60000 });
});

describe('IVR Webhook - State Machine', () => {
  it('State 0: should ask for PIN when only ApiPhone is provided', async () => {
    const res = await GET(makeRequest({ ApiPhone: '0501234567' }));
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
    expect(text).toContain('PIN');
    expect(text).toContain('ברוך הבא');
  });

  it('State 1: should reject invalid PIN format', async () => {
    const res = await GET(makeRequest({ ApiPhone: '0501234567', PIN: '12' }));
    const text = await res.text();

    expect(text).toContain('קוד שגוי');
    expect(text).toContain('hangup');
  });

  it('State 1: should reject unknown phone number', async () => {
    mockPrisma.ivrPin.findFirst.mockResolvedValue(null);

    const res = await GET(makeRequest({ ApiPhone: '0501234567', PIN: '1234' }));
    const text = await res.text();

    expect(text).toContain('מספר טלפון לא מזוהה');
    expect(text).toContain('hangup');
  });

  it('State 1: should reject wrong PIN', async () => {
    mockPrisma.ivrPin.findFirst.mockResolvedValue({
      id: 'pin-1',
      userId: 'user-1',
      hashedPin: 'hashed',
      phoneNumber: '0501234567',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { id: 'user-1', signupSource: null },
    } as never);
    mockPrisma.ivrPin.findUnique.mockResolvedValue({
      id: 'pin-1',
      userId: 'user-1',
      hashedPin: 'hashed',
      phoneNumber: '0501234567',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockBcrypt.compare.mockResolvedValue(false as never);

    const res = await GET(makeRequest({ ApiPhone: '0501234567', PIN: '1234' }));
    const text = await res.text();

    expect(text).toContain('קוד שגוי');
  });

  it('State 1: should accept valid PIN and ask for category', async () => {
    mockPrisma.ivrPin.findFirst.mockResolvedValue({
      id: 'pin-1',
      userId: 'user-1',
      hashedPin: 'hashed',
      phoneNumber: '0501234567',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { id: 'user-1', signupSource: null },
    } as never);
    mockPrisma.ivrPin.findUnique.mockResolvedValue({
      id: 'pin-1',
      userId: 'user-1',
      hashedPin: 'hashed',
      phoneNumber: '0501234567',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockBcrypt.compare.mockResolvedValue(true as never);

    const res = await GET(makeRequest({ ApiPhone: '0501234567', PIN: '1234' }));
    const text = await res.text();

    expect(text).toContain('קוד התקבל');
    expect(text).toContain('record=CategoryAudio');
  });

  it('State 2: should ask for amount when category audio is provided', async () => {
    const res = await GET(makeRequest({
      ApiPhone: '0501234567',
      PIN: '1234',
      CategoryAudio: 'https://example.com/audio.wav',
    }));
    const text = await res.text();

    expect(text).toContain('סכום');
    expect(text).toContain('Amount');
  });

  it('State 3: should ask for name when amount is provided', async () => {
    const res = await GET(makeRequest({
      ApiPhone: '0501234567',
      PIN: '1234',
      CategoryAudio: 'https://example.com/cat.wav',
      Amount: '150',
    }));
    const text = await res.text();

    expect(text).toContain('פרטי ההוצאה');
    expect(text).toContain('record=NameAudio');
  });

  it('State 4: should confirm and hangup when all data is provided', async () => {
    mockPrisma.ivrPin.findFirst.mockResolvedValue({
      id: 'pin-1',
      userId: 'user-1',
      hashedPin: 'hashed',
      phoneNumber: '0501234567',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { id: 'user-1', signupSource: null },
    } as never);
    mockPrisma.ivrPin.findUnique.mockResolvedValue({
      id: 'pin-1',
      userId: 'user-1',
      hashedPin: 'hashed',
      phoneNumber: '0501234567',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockBcrypt.compare.mockResolvedValue(true as never);

    const res = await GET(makeRequest({
      ApiPhone: '0501234567',
      PIN: '1234',
      CategoryAudio: 'https://example.com/cat.wav',
      Amount: '150',
      NameAudio: 'https://example.com/name.wav',
    }));
    const text = await res.text();

    expect(text).toContain('ההוצאה נקלטה');
    expect(text).toContain('hangup');
    expect(mockPrisma.ivrCallSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          phoneNumber: '0501234567',
          status: 'pending',
        }),
      })
    );
  });

  it('should reject when no phone number is provided', async () => {
    const res = await GET(makeRequest({}));
    const text = await res.text();

    expect(text).toContain('שגיאה');
    expect(text).toContain('hangup');
  });

  it('should rate limit excessive calls', async () => {
    mockRateLimit.mockResolvedValue({ success: false, limit: 10, remaining: 0, resetTime: Date.now() + 60000 });

    const res = await GET(makeRequest({ ApiPhone: '0501234567' }));
    const text = await res.text();

    expect(text).toContain('יותר מדי שיחות');
    expect(text).toContain('hangup');
  });

  it('should reject invalid amount (zero)', async () => {
    mockPrisma.ivrPin.findFirst.mockResolvedValue({
      id: 'pin-1',
      userId: 'user-1',
      hashedPin: 'hashed',
      phoneNumber: '0501234567',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { id: 'user-1', signupSource: null },
    } as never);
    mockPrisma.ivrPin.findUnique.mockResolvedValue({
      id: 'pin-1',
      userId: 'user-1',
      hashedPin: 'hashed',
      phoneNumber: '0501234567',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockBcrypt.compare.mockResolvedValue(true as never);

    const res = await GET(makeRequest({
      ApiPhone: '0501234567',
      PIN: '1234',
      CategoryAudio: 'https://example.com/cat.wav',
      Amount: '0',
      NameAudio: 'https://example.com/name.wav',
    }));
    const text = await res.text();

    expect(text).toContain('סכום לא תקין');
  });
});

describe('IVR Helpers - Category Matching', () => {
  it('should match exact Hebrew category name', async () => {
    const { matchCategory } = await import('@/lib/ivr/helpers');
    const categories = [
      { id: 'food', nameHe: 'מזון' },
      { id: 'transport', nameHe: 'תחבורה' },
    ];

    expect(matchCategory('מזון', categories)).toBe('food');
    expect(matchCategory('תחבורה', categories)).toBe('transport');
  });

  it('should match partial category name', async () => {
    const { matchCategory } = await import('@/lib/ivr/helpers');
    const categories = [
      { id: 'food', nameHe: 'מזון' },
      { id: 'gifts', nameHe: 'מתנות ותרומות' },
    ];

    expect(matchCategory('מתנות', categories)).toBe('gifts');
  });

  it('should fallback to "other" when no match', async () => {
    const { matchCategory } = await import('@/lib/ivr/helpers');
    const categories = [
      { id: 'food', nameHe: 'מזון' },
    ];

    expect(matchCategory('ספורט', categories)).toBe('other');
  });

  it('should fallback to "other" for empty text', async () => {
    const { matchCategory } = await import('@/lib/ivr/helpers');
    expect(matchCategory('', [{ id: 'food', nameHe: 'מזון' }])).toBe('other');
    expect(matchCategory('  ', [{ id: 'food', nameHe: 'מזון' }])).toBe('other');
  });
});
