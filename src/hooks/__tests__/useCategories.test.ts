// @vitest-environment jsdom
/**
 * Unit Tests — useCategories hook (deleteCustomCategory)
 *
 * Covers:
 *   1. On API 200: removes category from the correct type array in state
 *   2. On API 404: still removes from state (stale-UI cleanup — key bug fix)
 *   3. On API 500: throws AND does not mutate state
 *   4. Type isolation: deleting an asset only touches the asset array
 *   5. Type isolation: deleting a liability only touches the liability array
 *   6. Deleting an ID not present in the array leaves array unchanged
 *
 * Root cause of previous timeout: useSession mock returned a new object on
 * every call, making `session` reference unstable, which caused fetchCategories
 * to be recreated every render and the effect to fire in an infinite loop.
 * Fixed by returning a STABLE reference from the useSession mock (see below).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks — MUST be declared before any imports that pull in the real modules.
// vi.mock() calls are hoisted, so the factory runs before module imports.
// ---------------------------------------------------------------------------

// CRITICAL: use a STABLE object so `session` reference doesn't change between
// renders. An unstable reference would recreate fetchCategories on every render,
// triggering the effect in an infinite loop.
const STABLE_SESSION = { user: { id: 'user-abc', email: 'test@example.com' } };

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: STABLE_SESSION, status: 'authenticated' }),
}));

vi.mock('@/lib/utils', () => ({
  apiFetch: vi.fn(),
  cn: (...args: unknown[]) => (args.filter(Boolean) as string[]).join(' '),
}));

vi.mock('@/lib/categories', () => ({
  customCategoryToInfo: vi.fn((cat: { id: string; name: string; icon?: string; color?: string }) => ({
    id: cat.id,
    name: cat.name,
    nameHe: cat.name,
    icon: null,
    color: '#888',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    isCustom: true,
  })),
  harediExpenseCategories: [],
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { apiFetch } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';

const mockApiFetch = vi.mocked(apiFetch);

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const EXPENSE_CAT_1 = { id: 'exp-1', name: 'אינטרנט', type: 'expense', icon: null, color: null, isMaaserEligible: false, isCustom: true };
const EXPENSE_CAT_2 = { id: 'exp-2', name: 'חשמל', type: 'expense', icon: null, color: null, isMaaserEligible: false, isCustom: true };
const INCOME_CAT   = { id: 'inc-1', name: 'משכורת', type: 'income', icon: null, color: null, isMaaserEligible: true, isCustom: true };
const ASSET_CAT    = { id: 'ast-1', name: 'דירה', type: 'asset', icon: null, color: null, isMaaserEligible: false, isCustom: true };
const LIABILITY_CAT = { id: 'lia-1', name: 'הלוואה', type: 'liability', icon: null, color: null, isMaaserEligible: false, isCustom: true };

const ALL_CATEGORIES = {
  expense: [EXPENSE_CAT_1, EXPENSE_CAT_2],
  income: [INCOME_CAT],
  asset: [ASSET_CAT],
  liability: [LIABILITY_CAT],
};

// ---------------------------------------------------------------------------
// Response factories
// ---------------------------------------------------------------------------

function makeJsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    headers: { get: () => 'application/json' },
  } as never;
}

function okDelete()  { return makeJsonResponse(200, { success: true }); }
function notFound()  { return makeJsonResponse(404, { error: 'not found' }); }
function serverErr() { return makeJsonResponse(500, { error: 'internal error' }); }

// ---------------------------------------------------------------------------
// beforeEach: configure default apiFetch behaviour
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  mockApiFetch.mockImplementation((url) => {
    const urlStr = String(url);
    if (urlStr.includes('/api/goals'))             return Promise.resolve(makeJsonResponse(200, []));
    if (urlStr.includes('/api/user/onboarding'))   return Promise.resolve(makeJsonResponse(200, { signupSource: 'regular' }));
    if (urlStr.match(/\/api\/categories$/))        return Promise.resolve(makeJsonResponse(200, ALL_CATEGORIES));
    return Promise.resolve(makeJsonResponse(200, { success: true }));
  });
});

// ---------------------------------------------------------------------------
// Helper: render hook and wait until initial fetch completes
// ---------------------------------------------------------------------------

async function renderAndLoad() {
  const rendered = renderHook(() => useCategories());
  // Wait until fetchCategories finishes (loading goes false)
  await waitFor(() => expect(rendered.result.current.loading).toBe(false), { timeout: 5000 });
  return rendered;
}

// ===========================================================================
// deleteCustomCategory — API 200 (success)
// ===========================================================================

describe('deleteCustomCategory — API 200', () => {
  it('removes the deleted category from the expense array', async () => {
    const { result } = await renderAndLoad();

    expect(result.current.customCategories.expense).toHaveLength(2);

    mockApiFetch.mockResolvedValueOnce(okDelete());
    await act(async () => {
      await result.current.deleteCustomCategory('exp-1', 'expense');
    });

    expect(result.current.customCategories.expense).toHaveLength(1);
    expect(result.current.customCategories.expense[0].id).toBe('exp-2');
  });

  it('leaves all other type arrays unchanged when deleting an expense', async () => {
    const { result } = await renderAndLoad();

    mockApiFetch.mockResolvedValueOnce(okDelete());
    await act(async () => {
      await result.current.deleteCustomCategory('exp-1', 'expense');
    });

    expect(result.current.customCategories.income).toHaveLength(1);
    expect(result.current.customCategories.asset).toHaveLength(1);
    expect(result.current.customCategories.liability).toHaveLength(1);
  });

  it('calls apiFetch with DELETE and the correct category URL', async () => {
    const { result } = await renderAndLoad();

    mockApiFetch.mockResolvedValueOnce(okDelete());
    await act(async () => {
      await result.current.deleteCustomCategory('exp-1', 'expense');
    });

    const deleteCalls = mockApiFetch.mock.calls.filter(
      ([url, opts]) => String(url).includes('exp-1') && (opts as { method?: string })?.method === 'DELETE'
    );
    expect(deleteCalls).toHaveLength(1);
    expect(String(deleteCalls[0][0])).toContain('/api/categories/exp-1');
  });
});

// ===========================================================================
// deleteCustomCategory — API 404 (stale-UI cleanup — key bug fix)
// ===========================================================================

describe('deleteCustomCategory — API 404', () => {
  it('still removes the category from state on 404 (stale-UI cleanup)', async () => {
    const { result } = await renderAndLoad();

    expect(result.current.customCategories.expense).toHaveLength(2);

    mockApiFetch.mockResolvedValueOnce(notFound());
    await act(async () => {
      await result.current.deleteCustomCategory('exp-1', 'expense');
    });

    // Category must be removed from UI even when DB says 404 (already gone)
    expect(result.current.customCategories.expense).toHaveLength(1);
    expect(result.current.customCategories.expense.find((c) => c.id === 'exp-1')).toBeUndefined();
  });

  it('does not throw when API returns 404', async () => {
    const { result } = await renderAndLoad();

    mockApiFetch.mockResolvedValueOnce(notFound());

    await expect(
      act(async () => {
        await result.current.deleteCustomCategory('exp-1', 'expense');
      })
    ).resolves.not.toThrow();
  });

  it('does not affect other type arrays on 404', async () => {
    const { result } = await renderAndLoad();

    mockApiFetch.mockResolvedValueOnce(notFound());
    await act(async () => {
      await result.current.deleteCustomCategory('exp-1', 'expense');
    });

    expect(result.current.customCategories.income).toHaveLength(1);
    expect(result.current.customCategories.asset).toHaveLength(1);
    expect(result.current.customCategories.liability).toHaveLength(1);
  });
});

// ===========================================================================
// deleteCustomCategory — API 500 (server error: must throw, state unchanged)
// ===========================================================================

describe('deleteCustomCategory — API 500', () => {
  it('throws when API returns 500', async () => {
    const { result } = await renderAndLoad();

    mockApiFetch.mockResolvedValueOnce(serverErr());

    await expect(
      act(async () => {
        await result.current.deleteCustomCategory('exp-1', 'expense');
      })
    ).rejects.toThrow();
  });

  it('does NOT remove category from state when API returns 500', async () => {
    const { result } = await renderAndLoad();

    mockApiFetch.mockResolvedValueOnce(serverErr());

    await act(async () => {
      try {
        await result.current.deleteCustomCategory('exp-1', 'expense');
      } catch {
        // expected
      }
    });

    // Both expense categories must still be present
    expect(result.current.customCategories.expense).toHaveLength(2);
  });
});

// ===========================================================================
// Type isolation — asset, liability, income arrays
// ===========================================================================

describe('deleteCustomCategory — type isolation', () => {
  it('deleting an asset removes only from the asset array', async () => {
    const { result } = await renderAndLoad();

    mockApiFetch.mockResolvedValueOnce(okDelete());
    await act(async () => {
      await result.current.deleteCustomCategory('ast-1', 'asset');
    });

    expect(result.current.customCategories.asset).toHaveLength(0);
    expect(result.current.customCategories.expense).toHaveLength(2);
    expect(result.current.customCategories.income).toHaveLength(1);
    expect(result.current.customCategories.liability).toHaveLength(1);
  });

  it('deleting a liability removes only from the liability array', async () => {
    const { result } = await renderAndLoad();

    mockApiFetch.mockResolvedValueOnce(okDelete());
    await act(async () => {
      await result.current.deleteCustomCategory('lia-1', 'liability');
    });

    expect(result.current.customCategories.liability).toHaveLength(0);
    expect(result.current.customCategories.expense).toHaveLength(2);
    expect(result.current.customCategories.income).toHaveLength(1);
    expect(result.current.customCategories.asset).toHaveLength(1);
  });

  it('deleting income removes only from the income array', async () => {
    const { result } = await renderAndLoad();

    mockApiFetch.mockResolvedValueOnce(okDelete());
    await act(async () => {
      await result.current.deleteCustomCategory('inc-1', 'income');
    });

    expect(result.current.customCategories.income).toHaveLength(0);
    expect(result.current.customCategories.expense).toHaveLength(2);
    expect(result.current.customCategories.asset).toHaveLength(1);
    expect(result.current.customCategories.liability).toHaveLength(1);
  });

  it('deleting a non-existent ID leaves the array unchanged', async () => {
    const { result } = await renderAndLoad();

    mockApiFetch.mockResolvedValueOnce(okDelete());
    await act(async () => {
      await result.current.deleteCustomCategory('no-such-id', 'expense');
    });

    // Both expense categories remain — filter found nothing to remove
    expect(result.current.customCategories.expense).toHaveLength(2);
  });
});
