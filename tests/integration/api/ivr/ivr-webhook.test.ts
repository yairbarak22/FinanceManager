/**
 * IVR Webhook Integration Tests — DTMF State Machine
 *
 * Tests the 5-state DTMF flow: PIN → TxType → CategoryKey → Amount → Transaction.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    reportingPhone: {
      findUnique: vi.fn(),
    },
    ivrPin: {
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

const validReportingPhone = {
  id: 'rp-1',
  userId: 'user-1',
  phoneNumber: '0501234567',
  createdAt: new Date(),
  user: {
    id: 'user-1',
    signupSource: null,
    ivrPin: { hashedPin: 'hashed' },
  },
} as never;

const validPinUnique = {
  id: 'pin-1',
  userId: 'user-1',
  hashedPin: 'hashed',
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
  it('State 0: should ask for PIN (M1798) when only ApiPhone is provided', async () => {
    const res = await GET(makeRequest({ ApiPhone: '0501234567' }));
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(text).toBe('read=f-M1798=PIN,no,4,4,7,No,no,no,,,,,,');
  });

  // =====================
  // State 1: Validate PIN
  // =====================
  it('State 1: should reject unknown phone with 052 and hangup', async () => {
    mockPrisma.reportingPhone.findUnique.mockResolvedValue(null);

    const res = await GET(makeRequest({ ApiPhone: '0501234567', PIN: '1234' }));
    const text = await res.text();

    expect(text).toBe('id_list_message=f-052&hangup');
  });

  it('State 1: should reject wrong PIN with 052 and hangup', async () => {
    mockPrisma.reportingPhone.findUnique.mockResolvedValue(validReportingPhone);
    mockPrisma.ivrPin.findUnique.mockResolvedValue(validPinUnique);
    mockBcrypt.compare.mockResolvedValue(false as never);

    const res = await GET(makeRequest({ ApiPhone: '0501234567', PIN: '1234' }));
    const text = await res.text();

    expect(text).toBe('id_list_message=f-052&hangup');
  });

  it('State 1: should accept valid PIN, create session, and ask TxType (M1799)', async () => {
    mockPrisma.reportingPhone.findUnique.mockResolvedValue(validReportingPhone);
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

  it('should return error for missing ApiPhone', async () => {
    const res = await GET(makeRequest({}));
    const text = await res.text();

    expect(text).toBe('id_list_message=t-שגיאה במערכת&hangup');
  });

  // =====================
  // Exact read format verification
  // =====================
  it('PIN read should have exact correct format', async () => {
    const res = await GET(makeRequest({ ApiPhone: '0501234567' }));
    const text = await res.text();

    expect(text).toBe('read=f-M1798=PIN,no,4,4,7,No,no,no,,,,,,');
  });

  it('TxType read should restrict to digits 1 and 2', async () => {
    mockPrisma.reportingPhone.findUnique.mockResolvedValue(validReportingPhone);
    mockPrisma.ivrPin.findUnique.mockResolvedValue(validPinUnique);
    mockBcrypt.compare.mockResolvedValue(true as never);
    mockPrisma.ivrCallSession.findFirst.mockResolvedValue(null);

    const res = await GET(makeRequest({ ApiPhone: '0501234567', PIN: '1234' }));
    const text = await res.text();

    expect(text).toBe('read=f-M1799=TxType,no,1,1,7,No,no,no,,1.2,,,,');
  });

  it('CategoryKey read should allow all digits (empty digits_allowed)', async () => {
    mockPrisma.ivrCallSession.findFirst.mockResolvedValue(activeSession as never);

    const res = await GET(makeRequest({
      ApiPhone: '0501234567',
      PIN: '1234',
      TxType: '1',
    }));
    const text = await res.text();

    expect(text).toBe('read=f-M1802=CategoryKey,no,1,1,7,No,no,no,,,,,,');
  });

  it('Amount read should have max_digits=7, min_digits=1 (not reversed)', async () => {
    mockPrisma.ivrCallSession.findFirst.mockResolvedValue(activeSession as never);

    const res = await GET(makeRequest({
      ApiPhone: '0501234567',
      PIN: '1234',
      TxType: '1',
      CategoryKey: '2',
    }));
    const text = await res.text();

    expect(text).toBe('read=f-M1804=Amount,no,7,1,7,No,no,no,,,,,,');
  });
});

describe('Yemot Format Builders', () => {
  it('buildReadTap should produce correct 14-param format', async () => {
    const { buildReadTap } = await import('@/lib/ivr/yemotFormat');

    const result = buildReadTap({
      message: 'f-M1000',
      valName: 'PIN',
      maxDigits: 4,
      minDigits: 4,
      secWait: 7,
    });

    expect(result).toBe('read=f-M1000=PIN,no,4,4,7,No,no,no,,,,,,');
  });

  it('buildReadTap should handle digitsAllowed', async () => {
    const { buildReadTap } = await import('@/lib/ivr/yemotFormat');

    const result = buildReadTap({
      message: 'f-M1799',
      valName: 'TxType',
      maxDigits: 1,
      minDigits: 1,
      digitsAllowed: '1.2',
    });

    expect(result).toBe('read=f-M1799=TxType,no,1,1,7,No,no,no,,1.2,,,,');
  });

  it('buildReadTap defaults should work for minimal options', async () => {
    const { buildReadTap } = await import('@/lib/ivr/yemotFormat');

    const result = buildReadTap({
      message: 'f-M1804',
      valName: 'Amount',
      maxDigits: 7,
      minDigits: 1,
    });

    expect(result).toBe('read=f-M1804=Amount,no,7,1,7,No,no,no,,,,,,');
  });

  it('buildReadTap should support TTS message', async () => {
    const { buildReadTap } = await import('@/lib/ivr/yemotFormat');

    const result = buildReadTap({
      message: 't-הזן סכום',
      valName: 'Amount',
      maxDigits: 7,
      minDigits: 1,
    });

    expect(result).toBe('read=t-הזן סכום=Amount,no,7,1,7,No,no,no,,,,,,');
  });

  it('buildFileAndHangup should format correctly', async () => {
    const { buildFileAndHangup } = await import('@/lib/ivr/yemotFormat');

    expect(buildFileAndHangup('M1805')).toBe('id_list_message=f-M1805&hangup');
    expect(buildFileAndHangup('052')).toBe('id_list_message=f-052&hangup');
  });

  it('buildTtsAndHangup should sanitize forbidden characters', async () => {
    const { buildTtsAndHangup } = await import('@/lib/ivr/yemotFormat');

    expect(buildTtsAndHangup('שגיאה במערכת')).toBe('id_list_message=t-שגיאה במערכת&hangup');
    expect(buildTtsAndHangup('test"value')).toBe('id_list_message=t-testvalue&hangup');
    expect(buildTtsAndHangup("it's.done|now")).toBe('id_list_message=t-itsdonenow&hangup');
  });

  it('sanitizeTtsText should remove forbidden chars', async () => {
    const { sanitizeTtsText } = await import('@/lib/ivr/yemotFormat');

    expect(sanitizeTtsText('hello.world')).toBe('helloworld');
    expect(sanitizeTtsText('"quote"')).toBe('quote');
    expect(sanitizeTtsText("it's")).toBe('its');
    expect(sanitizeTtsText('a&b|c')).toBe('abc');
    expect(sanitizeTtsText('no-dash')).toBe('nodash');
    expect(sanitizeTtsText('שלום')).toBe('שלום');
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
