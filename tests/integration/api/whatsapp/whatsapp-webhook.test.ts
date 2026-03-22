/**
 * WhatsApp Webhook Integration Tests
 *
 * Tests the 2-step flow: report → PIN confirmation → transaction creation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    whatsappSession: {
      findUnique: vi.fn(),
      upsert: vi.fn().mockResolvedValue({ id: 'session-1' }),
      delete: vi.fn(),
    },
    reportingPhone: {
      findUnique: vi.fn(),
    },
    transaction: {
      create: vi.fn().mockResolvedValue({ id: 'tx-1' }),
    },
    whatsappMonthlyUsage: {
      upsert: vi.fn().mockResolvedValue({ id: 'usage-1', count: 0 }),
      update: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed'),
    compare: vi.fn(),
  },
}));

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, limit: 15, remaining: 14, resetTime: Date.now() + 60000 }),
  RATE_LIMITS: { whatsapp: { maxRequests: 15, windowSeconds: 60 } },
}));

vi.mock('twilio', () => {
  class MockMessagingResponse {
    _lastMsg = '';
    message(text: string) { this._lastMsg = text; }
    toString() { return `<Response><Message>${this._lastMsg}</Message></Response>`; }
  }
  return {
    default: {
      twiml: {
        MessagingResponse: MockMessagingResponse,
      },
      validateRequest: vi.fn().mockReturnValue(true),
    },
  };
});

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { POST } from '@/app/api/whatsapp/webhook/route';
import { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import twilio from 'twilio';

const mockPrisma = vi.mocked(prisma);
const mockBcrypt = vi.mocked(bcrypt);
const mockRateLimit = vi.mocked(checkRateLimit);

function makeRequest(body: Record<string, string>) {
  const formBody = new URLSearchParams(body).toString();
  return new NextRequest('http://localhost/api/whatsapp/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRateLimit.mockResolvedValue({ success: true, limit: 15, remaining: 14, resetTime: Date.now() + 60000 });
});

describe('WhatsApp Webhook — Flow 1: New Report', () => {
  it('should parse valid expense report and ask for PIN', async () => {
    mockPrisma.whatsappSession.findUnique.mockResolvedValue(null);

    const res = await POST(makeRequest({
      From: 'whatsapp:+972501234567',
      Body: 'הוצאה, מזון, שופרסל, 150',
    }));

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/xml');

    expect(mockPrisma.whatsappSession.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          phoneNumber: '0501234567',
          type: 1,
          category: 'מזון',
          business: 'שופרסל',
          amount: 150,
        }),
      })
    );
  });

  it('should parse valid income report', async () => {
    mockPrisma.whatsappSession.findUnique.mockResolvedValue(null);

    await POST(makeRequest({
      From: 'whatsapp:+972501234567',
      Body: 'הכנסה, משכורת, חברה בע"מ, 15000',
    }));

    expect(mockPrisma.whatsappSession.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          type: 2,
          category: 'משכורת',
          business: 'חברה בע"מ',
          amount: 15000,
        }),
      })
    );
  });

  it('should reject invalid format (less than 4 parts)', async () => {
    mockPrisma.whatsappSession.findUnique.mockResolvedValue(null);

    const res = await POST(makeRequest({
      From: 'whatsapp:+972501234567',
      Body: 'הוצאה, מזון',
    }));

    expect(res.status).toBe(200);
    expect(mockPrisma.whatsappSession.upsert).not.toHaveBeenCalled();
  });

  it('should reject invalid type (not הוצאה/הכנסה)', async () => {
    mockPrisma.whatsappSession.findUnique.mockResolvedValue(null);

    const res = await POST(makeRequest({
      From: 'whatsapp:+972501234567',
      Body: 'העברה, מזון, שופרסל, 100',
    }));

    expect(res.status).toBe(200);
    expect(mockPrisma.whatsappSession.upsert).not.toHaveBeenCalled();
  });

  it('should reject invalid amount', async () => {
    mockPrisma.whatsappSession.findUnique.mockResolvedValue(null);

    const res = await POST(makeRequest({
      From: 'whatsapp:+972501234567',
      Body: 'הוצאה, מזון, שופרסל, abc',
    }));

    expect(res.status).toBe(200);
    expect(mockPrisma.whatsappSession.upsert).not.toHaveBeenCalled();
  });
});

describe('WhatsApp Webhook — Flow 2: PIN Confirmation', () => {
  const pendingSession = {
    id: 'session-1',
    phoneNumber: '0501234567',
    type: 1,
    category: 'מזון',
    business: 'שופרסל',
    amount: 150,
    createdAt: new Date(),
  };

  const reportingPhoneRecord = {
    id: 'rp-1',
    userId: 'user-1',
    phoneNumber: '0501234567',
    createdAt: new Date(),
    user: {
      id: 'user-1',
      signupSource: null,
      ivrPin: { hashedPin: 'hashed-pin' },
    },
  };

  it('should create transaction on valid PIN', async () => {
    mockPrisma.whatsappSession.findUnique.mockResolvedValue(pendingSession as never);
    mockPrisma.reportingPhone.findUnique.mockResolvedValue(reportingPhoneRecord as never);
    mockBcrypt.compare.mockResolvedValue(true as never);

    const res = await POST(makeRequest({
      From: 'whatsapp:+972501234567',
      Body: '1234',
    }));

    expect(res.status).toBe(200);
    expect(mockPrisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          type: 'expense',
          amount: 150,
          category: 'food', // 'מזון' matches 'food'
          description: 'שופרסל',
          source: 'whatsapp',
        }),
      })
    );
    expect(mockPrisma.whatsappSession.delete).toHaveBeenCalledWith({
      where: { phoneNumber: '0501234567' },
    });
  });

  it('should reject wrong PIN', async () => {
    mockPrisma.whatsappSession.findUnique.mockResolvedValue(pendingSession as never);
    mockPrisma.reportingPhone.findUnique.mockResolvedValue(reportingPhoneRecord as never);
    mockBcrypt.compare.mockResolvedValue(false as never);

    await POST(makeRequest({
      From: 'whatsapp:+972501234567',
      Body: '9999',
    }));

    expect(mockPrisma.transaction.create).not.toHaveBeenCalled();
    expect(mockPrisma.whatsappSession.delete).not.toHaveBeenCalled();
  });

  it('should handle unregistered phone number', async () => {
    mockPrisma.whatsappSession.findUnique.mockResolvedValue(pendingSession as never);
    mockPrisma.reportingPhone.findUnique.mockResolvedValue(null);

    await POST(makeRequest({
      From: 'whatsapp:+972501234567',
      Body: '1234',
    }));

    expect(mockPrisma.transaction.create).not.toHaveBeenCalled();
    expect(mockPrisma.whatsappSession.delete).toHaveBeenCalledWith({
      where: { phoneNumber: '0501234567' },
    });
  });

  it('income transaction should map correctly', async () => {
    const incomeSession = { ...pendingSession, type: 2, category: 'משכורת', business: 'חברה' };
    mockPrisma.whatsappSession.findUnique.mockResolvedValue(incomeSession as never);
    mockPrisma.reportingPhone.findUnique.mockResolvedValue(reportingPhoneRecord as never);
    mockBcrypt.compare.mockResolvedValue(true as never);

    await POST(makeRequest({
      From: 'whatsapp:+972501234567',
      Body: '1234',
    }));

    expect(mockPrisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'income',
          category: 'salary', // 'משכורת' matches 'salary'
          description: 'חברה',
          source: 'whatsapp',
        }),
      })
    );
  });
});

describe('WhatsApp Webhook — Rate Limiting', () => {
  it('should reject when rate limited', async () => {
    mockRateLimit.mockResolvedValue({ success: false, limit: 15, remaining: 0, resetTime: Date.now() + 60000 });

    const res = await POST(makeRequest({
      From: 'whatsapp:+972501234567',
      Body: 'הוצאה, מזון, שופרסל, 150',
    }));

    expect(res.status).toBe(200);
    expect(mockPrisma.whatsappSession.findUnique).not.toHaveBeenCalled();
  });
});

describe('WhatsApp Webhook — Phone Parsing', () => {
  it('should convert +972 to 0 prefix', async () => {
    mockPrisma.whatsappSession.findUnique.mockResolvedValue(null);

    await POST(makeRequest({
      From: 'whatsapp:+972521234567',
      Body: 'הוצאה, מזון, שופרסל, 100',
    }));

    expect(mockPrisma.whatsappSession.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          phoneNumber: '0521234567',
        }),
      })
    );
  });
});
