/**
 * Mixpanel Consent Tests
 *
 * Tests for initMixpanel() opt-out model from src/lib/mixpanel.ts.
 * Verifies consent gating, env var token, and absence of ignore_dnt.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock mixpanel-browser before any imports
const mockInit = vi.fn();
const mockTrack = vi.fn();

vi.mock('mixpanel-browser', () => ({
  default: {
    init: mockInit,
    track: mockTrack,
    identify: vi.fn(),
    people: { set: vi.fn(), set_once: vi.fn() },
    register: vi.fn(),
    reset: vi.fn(),
  },
}));

let savedToken: string | undefined;
let savedNodeEnv: string | undefined;

beforeEach(() => {
  vi.resetModules();
  mockInit.mockReset();
  mockTrack.mockReset();

  savedToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  savedNodeEnv = process.env.NODE_ENV;

  // Set a valid token by default
  process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = 'test-token-abc123';
});

afterEach(() => {
  if (savedToken === undefined) {
    delete process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  } else {
    process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = savedToken;
  }
  if (savedNodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = savedNodeEnv;
  }

  // Clean up localStorage mock
  if ('localStorage' in globalThis) {
    delete (globalThis as Record<string, unknown>).localStorage;
  }
});

function setupBrowserEnv(consentValue: string | null) {
  // Ensure window exists
  if (typeof globalThis.window === 'undefined') {
    (globalThis as Record<string, unknown>).window = {};
  }

  const store: Record<string, string> = {};
  if (consentValue !== null) {
    store['analytics-consent'] = consentValue;
  }

  (globalThis as Record<string, unknown>).localStorage = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
}

describe('initMixpanel consent gating', () => {
  it('should NOT init when analytics-consent is "false" (opt-out)', async () => {
    setupBrowserEnv('false');
    const { initMixpanel } = await import('../mixpanel');
    initMixpanel();
    expect(mockInit).not.toHaveBeenCalled();
  });

  it('should init when consent is null (default — opt-out model)', async () => {
    setupBrowserEnv(null);
    const { initMixpanel } = await import('../mixpanel');
    initMixpanel();
    expect(mockInit).toHaveBeenCalled();
  });

  it('should init when consent is "true"', async () => {
    setupBrowserEnv('true');
    const { initMixpanel } = await import('../mixpanel');
    initMixpanel();
    expect(mockInit).toHaveBeenCalled();
  });

  it('should NOT init when NEXT_PUBLIC_MIXPANEL_TOKEN is empty', async () => {
    setupBrowserEnv(null);
    process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = '';
    const { initMixpanel } = await import('../mixpanel');
    initMixpanel();
    expect(mockInit).not.toHaveBeenCalled();
  });

  it('should read token from NEXT_PUBLIC_MIXPANEL_TOKEN env var', async () => {
    setupBrowserEnv(null);
    process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = 'my-custom-token';
    const { initMixpanel } = await import('../mixpanel');
    initMixpanel();
    expect(mockInit).toHaveBeenCalledWith('my-custom-token', expect.any(Object));
  });

  it('should NOT pass ignore_dnt in config', async () => {
    setupBrowserEnv(null);
    const { initMixpanel } = await import('../mixpanel');
    initMixpanel();
    expect(mockInit).toHaveBeenCalled();
    const configArg = mockInit.mock.calls[0][1];
    expect(configArg).not.toHaveProperty('ignore_dnt');
  });

  it('should NOT init on server side (no window)', async () => {
    // Remove window to simulate server
    const savedWindow = globalThis.window;
    delete (globalThis as Record<string, unknown>).window;

    const { initMixpanel } = await import('../mixpanel');
    initMixpanel();
    expect(mockInit).not.toHaveBeenCalled();

    // Restore
    (globalThis as Record<string, unknown>).window = savedWindow;
  });
});
