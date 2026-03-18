/**
 * IVR Webhook Integration Tests — DTMF State Machine
 *
 * Tests the 5-state DTMF flow: PIN → TxType → CategoryKey → Amount → Transaction.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    ivrPin: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    ivrCallSession: {
      create: vi.fn().mockResolvedValue({ id: 'session-1', userId: 'user-1', phoneNumber: '0501234567', status: 'started' }),
      findFirst: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn().mockResolvedValue({ id: 'session-1' }),
    },
    transaction: {
      create: vi.fn().mockResolvedValue({ id: 'tx-1' }),
    },
    customCategory: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-pin'),
    compare: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { GET } from '@/app/api/ivr/webhook/route';
import { NextRequest } from 'next/server';

const mockPrisma = vi.mocked(prisma);
const mockBcrypt = vi.mocked(bcrypt);

function makeRequest(params: Record<string, string>) {
  const url = new URL('http://localhost/api/ivr/webhook');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url);
}

const validPinRecord = {
  id: 'pin-1',
  userId: 'user-1',
  hashedPin: 'hashed',
  phoneNumber: '0501234567',
  createdAt: new Date(),
  updatedAt: new Date(),
  user: { id: 'user-1', signupSource: null },
} as never;

const validPinUnique = {
  id: 'pin-1',
  userId: 'user-1',
  hashedPin: 'hashed',
  phoneNumber: '0501234567',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const activeSession = {
  id: 'session-1',
  userId: 'user-1',
  phoneNumber: '0501234567',
  amount: null,
  type: null,
  selectedCategoryKey: null,
  status: 'started',
  createdAt: new Date(),
  updatedAt: new Date(),
  user: { id: 'user-1' },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('IVR Webhook — DTMF State Machine', () => {
  // =====================
  // State 0: Ask for PIN
  // =====================
  it('State 0: should ask for PIN (M1000) when only ApiPhone is provided', async () => {
    const res = await GET(makeRequest({ ApiPhone: '0501234567' }));
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(text).toBe('read=f-M1000=PIN,no,4,4,7,No,no,no,,,,,,');
  });

  // =====================
  // State 1: Validate PIN
  // =====================
  it('State 1: should reject unknown phone with 052 and hangup', async () => {
    mockPrisma.ivrPin.findFirst.mockResolvedValue(null);

    const res = await GET(makeRequest({ ApiPhone: '0501234567', PIN: '1234' }));
    const text = await res.text();

    expect(text).toBe('id_list_message=f-052&hangup');
  });

  it('State 1: should reject wrong PIN with 052 and hangup', async () => {
    mockPrisma.ivrPin.findFirst.mockResolvedValue(validPinRecord);
    mockPrisma.ivrPin.findUnique.mockResolvedValue(validPinUnique);
    mockBcrypt.compare.mockResolvedValue(false as never);

    const res = await GET(makeRequest({ ApiPhone: '0501234567', PIN: '1234' }));
    const text = await res.text();

    expect(text).toBe('id_list_message=f-052&hangup');
  });

  it('State 1: should accept valid PIN, create session, and ask TxType (M1799)', async () => {
    mockPrisma.ivrPin.findFirst.mockResolvedValue(validPinRecord);
    mockPrisma.ivrPin.findUnique.mockResolvedValue(validPinUnique);
    mockBcrypt.compare.mockResolvedValue(true as never);
    mockPrisma.ivrCallSession.findFirst.mockResolvedValue(null);

    const res = await GET(makeRequest({ ApiPhone: '0501234567', PIN: '1234' }));
    const text = await res.text();

    expect(text).toContain('M1799');
    expect(text).toContain('TxType');
    expect(mockPrisma.ivrCallSession.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          userId: 'user-1',
          phoneNumber: '0501234567',
          status: 'started',
        }),
      })
    );
  });

  // =====================
  // State 2: TxType → CategoryKey
  // =====================
  it('State 2: expense (TxType=1) should ask CategoryKey with M1802', async () => {
    mockPrisma.ivrCallSession.findFirst.mockResolvedValue(activeSession as never);

    const res = await GET(makeRequest({
      ApiPhone: '0501234567',
      PIN: '1234',
      TxType: '1',
    }));
    const text = await res.text();

    expect(text).toContain('M1802');
    expect(text).toContain('CategoryKey');
    expect(mockPrisma.ivrCallSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 1 }),
      })
    );
  });

  it('State 2: income (TxType=2) should ask CategoryKey with M1803', async () => {
    mockPrisma.ivrCallSession.findFirst.mockResolvedValue(activeSession as never);

    const res = await GET(makeRequest({
      ApiPhone: '0501234567',
      PIN: '1234',
      TxType: '2',
    }));
    const text = await res.text();

    expect(text).toContain('M1803');
    expect(text).toContain('CategoryKey');
  });

  // =====================
  // State 3: CategoryKey → Amount
  // =====================
  it('State 3: should ask Amount (M1804) after CategoryKey', async () => {
    mockPrisma.ivrCallSession.findFirst.mockResolvedValue(activeSession as never);

    const res = await GET(makeRequest({
      ApiPhone: '0501234567',
      PIN: '1234',
      TxType: '1',
      CategoryKey: '2',
    }));
    const text = await res.text();

    expect(text).toContain('M1804');
    expect(text).toContain('Amount');
    expect(mockPrisma.ivrCallSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ selectedCategoryKey: 2 }),
      })
    );
  });

  // =====================
  // State 4: Amount → Create Transaction
  // =====================
  it('State 4: should create transaction with source=ivr and needsDetailsReview=true', async () => {
    mockPrisma.ivrCallSession.findFirst.mockResolvedValue(activeSession as never);

    const res = await GET(makeRequest({
      ApiPhone: '0501234567',
      PIN: '1234',
      TxType: '1',
      CategoryKey: '2',
      Amount: '150',
    }));
    const text = await res.text();

    expect(text).toContain('M1805');
    expect(text).toContain('hangup');

    expect(mockPrisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          type: 'expense',
          amount: 150,
          currency: 'ILS',
          category: 'food', // CategoryKey 2 maps to 'מזון' → 'food'
          source: 'ivr',
          needsDetailsReview: true,
        }),
      })
    );

    expect(mockPrisma.ivrCallSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'completed',
          amount: 150,
          selectedCategoryKey: 2,
        }),
      })
    );
  });

  it('State 4: income transaction should use income category map', async () => {
    mockPrisma.ivrCallSession.findFirst.mockResolvedValue(activeSession as never);

    const res = await GET(makeRequest({
      ApiPhone: '0501234567',
      PIN: '1234',
      TxType: '2',
      CategoryKey: '2',
      Amount: '5000',
    }));
    const text = await res.text();

    expect(text).toContain('M1805');
    expect(mockPrisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'income',
          amount: 5000,
          category: 'salary', // CategoryKey 2 maps to 'משכורת' → 'salary'
          source: 'ivr',
        }),
      })
    );
  });

  it('State 4: should reject invalid amount (zero)', async () => {
    mockPrisma.ivrCallSession.findFirst.mockResolvedValue(activeSession as never);

    const res = await GET(makeRequest({
      ApiPhone: '0501234567',
      PIN: '1234',
      TxType: '1',
      CategoryKey: '2',
      Amount: '0',
    }));
    const text = await res.text();

    expect(text).toContain('סכום לא תקין');
    expect(text).toContain('hangup');
    expect(mockPrisma.transaction.create).not.toHaveBeenCalled();
  });

  it('State 4: should reject NaN amount', async () => {
    mockPrisma.ivrCallSession.findFirst.mockResolvedValue(activeSession as never);

    const res = await GET(makeRequest({
      ApiPhone: '0501234567',
      PIN: '1234',
      TxType: '1',
      CategoryKey: '2',
      Amount: 'abc',
    }));
    const text = await res.text();

    expect(text).toContain('סכום לא תקין');
  });

  it('State 4: should handle missing session gracefully', async () => {
    mockPrisma.ivrCallSession.findFirst.mockResolvedValue(null);

    const res = await GET(makeRequest({
      ApiPhone: '0501234567',
      PIN: '1234',
      TxType: '1',
      CategoryKey: '2',
      Amount: '100',
    }));
    const text = await res.text();

    expect(text).toContain('M1804');
    expect(text).toContain('hangup');
    expect(mockPrisma.transaction.create).not.toHaveBeenCalled();
  });

  // =====================
  // Edge cases
  // =====================
  it('should handle hangup signal', async () => {
    const res = await GET(makeRequest({
      ApiPhone: '0501234567',
      hangup: 'yes',
    }));
    const text = await res.text();

    expect(text).toBe('ok');
  });

  it('should fallback to M1804 error for unhandled state', async () => {
    const res = await GET(makeRequest({}));
    const text = await res.text();

    expect(text).toContain('M1804');
    expect(text).toContain('hangup');
  });
});

describe('IVR Category Map', () => {
  it('should resolve expense DTMF keys to correct category IDs', async () => {
    const { getCategoryIdForIvr } = await import('@/lib/ivr/categoriesMap');

    expect(getCategoryIdForIvr('expense', 2)).toBe('food');
    expect(getCategoryIdForIvr('expense', 3)).toBe('shopping');
    expect(getCategoryIdForIvr('expense', 4)).toBe('transport');
    expect(getCategoryIdForIvr('expense', 5)).toBe('entertainment');
    expect(getCategoryIdForIvr('expense', 6)).toBe('bills');
    expect(getCategoryIdForIvr('expense', 7)).toBe('health');
    expect(getCategoryIdForIvr('expense', 8)).toBe('education');
    expect(getCategoryIdForIvr('expense', 9)).toBe('housing');
    expect(getCategoryIdForIvr('expense', 1)).toBe('other');
  });

  it('should resolve income DTMF keys to correct category IDs', async () => {
    const { getCategoryIdForIvr } = await import('@/lib/ivr/categoriesMap');

    expect(getCategoryIdForIvr('income', 2)).toBe('salary');
    expect(getCategoryIdForIvr('income', 3)).toBe('freelance');
    expect(getCategoryIdForIvr('income', 4)).toBe('child_allowance');
    expect(getCategoryIdForIvr('income', 5)).toBe('rental');
    expect(getCategoryIdForIvr('income', 6)).toBe('investment');
    expect(getCategoryIdForIvr('income', 7)).toBe('bonus');
    expect(getCategoryIdForIvr('income', 8)).toBe('pension');
    expect(getCategoryIdForIvr('income', 1)).toBe('other');
  });

  it('should fallback to "other" for unknown keys', async () => {
    const { getCategoryIdForIvr } = await import('@/lib/ivr/categoriesMap');

    expect(getCategoryIdForIvr('expense', 99)).toBe('other');
    expect(getCategoryIdForIvr('income', -1)).toBe('other');
  });
});
