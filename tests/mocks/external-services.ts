/**
 * External Services Mocks
 *
 * In-memory implementations of all external service integrations.
 * These mocks prevent any real API calls during tests.
 *
 * Mocked services:
 * - Vercel Blob (file storage)
 * - Resend (email)
 * - OpenAI (AI classification)
 * - EOD Historical Data (financial data)
 * - Upstash Redis (rate limiting)
 */

import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Vercel Blob Mock
// ---------------------------------------------------------------------------

interface BlobEntry {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
  data: Buffer;
}

const blobStore = new Map<string, BlobEntry>();

export const mockVercelBlob = {
  store: blobStore,

  put: vi.fn(async (pathname: string, body: Buffer | string, options?: { contentType?: string }) => {
    const data = typeof body === 'string' ? Buffer.from(body) : body;
    const url = `https://mock-blob.vercel-storage.com/${pathname}`;
    const entry: BlobEntry = {
      url,
      pathname,
      contentType: options?.contentType || 'application/octet-stream',
      size: data.length,
      uploadedAt: new Date(),
      data,
    };
    blobStore.set(url, entry);
    return { url, pathname, contentType: entry.contentType, size: entry.size, uploadedAt: entry.uploadedAt };
  }),

  del: vi.fn(async (url: string | string[]) => {
    const urls = Array.isArray(url) ? url : [url];
    urls.forEach((u) => blobStore.delete(u));
  }),

  head: vi.fn(async (url: string) => {
    const entry = blobStore.get(url);
    if (!entry) return null;
    return { url: entry.url, size: entry.size, contentType: entry.contentType, uploadedAt: entry.uploadedAt };
  }),

  /** Helper: get raw data from mock store */
  getData: (url: string) => blobStore.get(url)?.data,

  /** Reset all stored blobs */
  reset: () => {
    blobStore.clear();
    mockVercelBlob.put.mockClear();
    mockVercelBlob.del.mockClear();
    mockVercelBlob.head.mockClear();
  },
};

// ---------------------------------------------------------------------------
// Resend Mock
// ---------------------------------------------------------------------------

interface SentEmail {
  id: string;
  from: string;
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  sentAt: Date;
}

const sentEmails: SentEmail[] = [];

export const mockResend = {
  emails: sentEmails,

  send: vi.fn(async (params: { from: string; to: string | string[]; subject: string; html?: string; text?: string }) => {
    const email: SentEmail = {
      id: `mock_email_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      from: params.from,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      sentAt: new Date(),
    };
    sentEmails.push(email);
    return { id: email.id };
  }),

  /** Get all sent emails */
  getSentEmails: () => [...sentEmails],

  /** Get emails sent to a specific address */
  getEmailsTo: (email: string) =>
    sentEmails.filter((e) => e.to.includes(email)),

  reset: () => {
    sentEmails.length = 0;
    mockResend.send.mockClear();
  },
};

// ---------------------------------------------------------------------------
// OpenAI Mock
// ---------------------------------------------------------------------------

interface OpenAIResponse {
  choices: Array<{ message: { content: string } }>;
}

let openAIResponseOverride: string | null = null;

export const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn(async (): Promise<OpenAIResponse> => {
        const content = openAIResponseOverride || JSON.stringify({
          category: 'אחר',
          confidence: 0.5,
        });
        return {
          choices: [{ message: { content } }],
        };
      }),
    },
  },

  /** Set a custom response for the next call */
  setResponse: (response: string) => {
    openAIResponseOverride = response;
  },

  reset: () => {
    openAIResponseOverride = null;
    mockOpenAI.chat.completions.create.mockClear();
  },
};

// ---------------------------------------------------------------------------
// EOD Historical Data Mock
// ---------------------------------------------------------------------------

export const mockEOD = {
  search: vi.fn(async (query: string) => {
    return [
      {
        Code: 'AAPL',
        Name: 'Apple Inc',
        Exchange: 'US',
        Type: 'Common Stock',
        Currency: 'USD',
      },
    ];
  }),

  getQuote: vi.fn(async (symbol: string) => {
    return {
      code: symbol,
      close: 150.0,
      change: 2.5,
      change_p: 1.69,
      volume: 1000000,
      previousClose: 147.5,
      timestamp: Date.now() / 1000,
    };
  }),

  reset: () => {
    mockEOD.search.mockClear();
    mockEOD.getQuote.mockClear();
  },
};

// ---------------------------------------------------------------------------
// Upstash Redis Mock (In-Memory Rate Limiter)
// ---------------------------------------------------------------------------

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const mockUpstashRedis = {
  ratelimit: {
    limit: vi.fn(async (identifier: string) => {
      const now = Date.now();
      const windowMs = 60_000; // 1 minute default
      const maxRequests = 100;

      let entry = rateLimitStore.get(identifier);
      if (!entry || entry.resetTime < now) {
        entry = { count: 1, resetTime: now + windowMs };
        rateLimitStore.set(identifier, entry);
        return { success: true, limit: maxRequests, remaining: maxRequests - 1, reset: entry.resetTime };
      }

      entry.count++;
      return {
        success: entry.count <= maxRequests,
        limit: maxRequests,
        remaining: Math.max(0, maxRequests - entry.count),
        reset: entry.resetTime,
      };
    }),
  },

  reset: () => {
    rateLimitStore.clear();
    mockUpstashRedis.ratelimit.limit.mockClear();
  },
};

// ---------------------------------------------------------------------------
// Reset all mocks
// ---------------------------------------------------------------------------

export function resetAllMocks(): void {
  mockVercelBlob.reset();
  mockResend.reset();
  mockOpenAI.reset();
  mockEOD.reset();
  mockUpstashRedis.reset();
}

