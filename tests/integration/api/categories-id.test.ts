/**
 * Integration Tests — /api/categories/[id] (PUT & DELETE)
 *
 * Covers:
 *   1. Authentication  — requireAuth() blocks unauthenticated requests
 *   2. Validation      — PUT rejects non-boolean / missing isMaaserEligible
 *   3. Type guard      — PUT rejects asset/liability categories
 *   4. Authorization   — withSharedAccountId used (not withIdAndUserId)
 *   5. DB writes       — update / deleteMany called with correct args
 *   6. Audit log       — logAuditEvent called on success, skipped on error
 *   7. Shared account  — member can edit/delete another member's category
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PUT, DELETE } from '@/app/api/categories/[id]/route';
import { createMockRequest } from '../../helpers/api';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/authHelpers', () => ({
  requireAuth: vi.fn(),
  withSharedAccountId: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    customCategory: {
      findFirst: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auditLog', () => ({
  logAuditEvent: vi.fn(),
  AuditAction: { UPDATE: 'UPDATE', DELETE: 'DELETE' },
  getRequestInfo: vi.fn().mockReturnValue({ ipAddress: '127.0.0.1', userAgent: 'vitest' }),
}));

import { requireAuth, withSharedAccountId } from '@/lib/authHelpers';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auditLog';

const mockRequireAuth = vi.mocked(requireAuth);
const mockWithSharedAccountId = vi.mocked(withSharedAccountId);
const mockFindFirst = vi.mocked(prisma.customCategory.findFirst);
const mockUpdate = vi.mocked(prisma.customCategory.update);
const mockDeleteMany = vi.mocked(prisma.customCategory.deleteMany);
const mockLogAuditEvent = vi.mocked(logAuditEvent);

// ---------------------------------------------------------------------------
// Constants & shared fixtures
// ---------------------------------------------------------------------------

const USER_ID = 'user-abc';
const CAT_ID = 'cat-123';
const SHARED_WHERE = { id: CAT_ID, userId: { in: [USER_ID] } };

const EXPENSE_CATEGORY = {
  id: CAT_ID,
  userId: USER_ID,
  name: 'אינטרנט',
  type: 'expense',
  icon: null,
  color: null,
  isMaaserEligible: false,
  createdAt: new Date(),
};

const INCOME_CATEGORY = { ...EXPENSE_CATEGORY, type: 'income' };
const ASSET_CATEGORY = { ...EXPENSE_CATEGORY, type: 'asset' };
const LIABILITY_CATEGORY = { ...EXPENSE_CATEGORY, type: 'liability' };

function routeParams(id = CAT_ID) {
  return { params: Promise.resolve({ id }) };
}

// ---------------------------------------------------------------------------
// Shared setup
// ---------------------------------------------------------------------------

function allowAuth() {
  mockRequireAuth.mockResolvedValue({ userId: USER_ID, error: null });
}

function denyAuth() {
  const { NextResponse } = require('next/server');
  mockRequireAuth.mockResolvedValue({
    userId: null,
    error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  allowAuth();
  mockWithSharedAccountId.mockResolvedValue(SHARED_WHERE as never);
  mockFindFirst.mockResolvedValue(EXPENSE_CATEGORY as never);
  mockUpdate.mockResolvedValue({ ...EXPENSE_CATEGORY, isMaaserEligible: true } as never);
  mockDeleteMany.mockResolvedValue({ count: 1 });
});

// ===========================================================================
// PUT /api/categories/[id]
// ===========================================================================

describe('PUT /api/categories/[id] — authentication', () => {
  it('returns 401 when unauthenticated', async () => {
    denyAuth();
    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: { isMaaserEligible: true },
    });

    const res = await PUT(req, routeParams());

    expect(res.status).toBe(401);
  });

  it('calls requireAuth()', async () => {
    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: { isMaaserEligible: true },
    });

    await PUT(req, routeParams());

    expect(mockRequireAuth).toHaveBeenCalledOnce();
  });
});

describe('PUT /api/categories/[id] — validation', () => {
  it('returns 400 when isMaaserEligible is missing from body', async () => {
    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: {},
    });

    const res = await PUT(req, routeParams());

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('returns 400 when isMaaserEligible is a string', async () => {
    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: { isMaaserEligible: 'true' },
    });

    const res = await PUT(req, routeParams());

    expect(res.status).toBe(400);
  });

  it('returns 400 when isMaaserEligible is a number', async () => {
    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: { isMaaserEligible: 1 },
    });

    const res = await PUT(req, routeParams());

    expect(res.status).toBe(400);
  });

  it('returns 400 when isMaaserEligible is null', async () => {
    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: { isMaaserEligible: null },
    });

    const res = await PUT(req, routeParams());

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/categories/[id] — authorization / shared account', () => {
  it('calls withSharedAccountId with the category id and userId', async () => {
    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: { isMaaserEligible: true },
    });

    await PUT(req, routeParams());

    expect(mockWithSharedAccountId).toHaveBeenCalledWith(CAT_ID, USER_ID);
  });

  it('returns 404 when category not found in shared account', async () => {
    mockFindFirst.mockResolvedValue(null as never);

    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: { isMaaserEligible: true },
    });

    const res = await PUT(req, routeParams());

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/not found/i);
  });

  it('shared account member can edit another member\'s category', async () => {
    const OTHER_USER_ID = 'other-user-456';
    mockWithSharedAccountId.mockResolvedValue({
      id: CAT_ID,
      userId: { in: [USER_ID, OTHER_USER_ID] },
    } as never);
    mockFindFirst.mockResolvedValue({ ...EXPENSE_CATEGORY, userId: OTHER_USER_ID } as never);

    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: { isMaaserEligible: true },
    });

    const res = await PUT(req, routeParams());

    expect(res.status).toBe(200);
  });
});

describe('PUT /api/categories/[id] — type guard', () => {
  it('returns 400 when category type is asset', async () => {
    mockFindFirst.mockResolvedValue(ASSET_CATEGORY as never);

    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: { isMaaserEligible: true },
    });

    const res = await PUT(req, routeParams());

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/income.*expense|expense.*income/i);
  });

  it('returns 400 when category type is liability', async () => {
    mockFindFirst.mockResolvedValue(LIABILITY_CATEGORY as never);

    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: { isMaaserEligible: true },
    });

    const res = await PUT(req, routeParams());

    expect(res.status).toBe(400);
  });

  it('accepts expense category', async () => {
    mockFindFirst.mockResolvedValue(EXPENSE_CATEGORY as never);

    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: { isMaaserEligible: true },
    });

    const res = await PUT(req, routeParams());

    expect(res.status).toBe(200);
  });

  it('accepts income category', async () => {
    mockFindFirst.mockResolvedValue(INCOME_CATEGORY as never);
    mockUpdate.mockResolvedValue({ ...INCOME_CATEGORY, isMaaserEligible: false } as never);

    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: { isMaaserEligible: false },
    });

    const res = await PUT(req, routeParams());

    expect(res.status).toBe(200);
  });
});

describe('PUT /api/categories/[id] — DB writes', () => {
  it('calls prisma.customCategory.update with correct id and isMaaserEligible', async () => {
    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: { isMaaserEligible: true },
    });

    await PUT(req, routeParams());

    expect(mockUpdate).toHaveBeenCalledOnce();
    const [args] = mockUpdate.mock.calls[0];
    expect(args.where.id).toBe(CAT_ID);
    expect(args.data.isMaaserEligible).toBe(true);
  });

  it('returns the updated category in response body with isCustom: true', async () => {
    mockUpdate.mockResolvedValue({
      ...EXPENSE_CATEGORY,
      isMaaserEligible: true,
    } as never);

    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: { isMaaserEligible: true },
    });

    const res = await PUT(req, routeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe(CAT_ID);
    expect(body.isMaaserEligible).toBe(true);
    expect(body.isCustom).toBe(true);
  });

  it('does NOT call update when validation fails (non-boolean)', async () => {
    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: { isMaaserEligible: 'yes' },
    });

    await PUT(req, routeParams());

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('does NOT call update when category not found', async () => {
    mockFindFirst.mockResolvedValue(null as never);

    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: { isMaaserEligible: true },
    });

    await PUT(req, routeParams());

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe('PUT /api/categories/[id] — audit log', () => {
  it('calls logAuditEvent with UPDATE action on success', async () => {
    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: { isMaaserEligible: true },
    });

    await PUT(req, routeParams());

    expect(mockLogAuditEvent).toHaveBeenCalledOnce();
    const [args] = mockLogAuditEvent.mock.calls[0];
    expect(args.action).toBe('UPDATE');
    expect(args.entityId).toBe(CAT_ID);
    expect(args.metadata?.isMaaserEligible).toBe(true);
  });

  it('does NOT call logAuditEvent when category not found', async () => {
    mockFindFirst.mockResolvedValue(null as never);

    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: { isMaaserEligible: true },
    });

    await PUT(req, routeParams());

    expect(mockLogAuditEvent).not.toHaveBeenCalled();
  });

  it('does NOT call logAuditEvent when validation fails', async () => {
    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'PUT',
      body: { isMaaserEligible: 'not-a-boolean' },
    });

    await PUT(req, routeParams());

    expect(mockLogAuditEvent).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// DELETE /api/categories/[id]
// ===========================================================================

describe('DELETE /api/categories/[id] — authentication', () => {
  it('returns 401 when unauthenticated', async () => {
    denyAuth();
    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'DELETE',
    });

    const res = await DELETE(req, routeParams());

    expect(res.status).toBe(401);
  });

  it('calls requireAuth()', async () => {
    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'DELETE',
    });

    await DELETE(req, routeParams());

    expect(mockRequireAuth).toHaveBeenCalledOnce();
  });
});

describe('DELETE /api/categories/[id] — authorization / shared account', () => {
  it('calls withSharedAccountId with category id and userId', async () => {
    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'DELETE',
    });

    await DELETE(req, routeParams());

    expect(mockWithSharedAccountId).toHaveBeenCalledWith(CAT_ID, USER_ID);
  });

  it('passes withSharedAccountId result directly to deleteMany', async () => {
    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'DELETE',
    });

    await DELETE(req, routeParams());

    expect(mockDeleteMany).toHaveBeenCalledOnce();
    const [args] = mockDeleteMany.mock.calls[0];
    expect(args.where).toEqual(SHARED_WHERE);
  });

  it('shared account member can delete another member\'s category', async () => {
    const OTHER_USER_ID = 'other-user-456';
    mockWithSharedAccountId.mockResolvedValue({
      id: CAT_ID,
      userId: { in: [USER_ID, OTHER_USER_ID] },
    } as never);
    mockDeleteMany.mockResolvedValue({ count: 1 });

    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'DELETE',
    });

    const res = await DELETE(req, routeParams());

    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/categories/[id] — business logic', () => {
  it('returns 200 { success: true } when category is deleted', async () => {
    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'DELETE',
    });

    const res = await DELETE(req, routeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 404 when deleteMany returns count: 0', async () => {
    mockDeleteMany.mockResolvedValue({ count: 0 });

    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'DELETE',
    });

    const res = await DELETE(req, routeParams());

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/not found/i);
  });
});

describe('DELETE /api/categories/[id] — audit log', () => {
  it('calls logAuditEvent with DELETE action on success', async () => {
    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'DELETE',
    });

    await DELETE(req, routeParams());

    expect(mockLogAuditEvent).toHaveBeenCalledOnce();
    const [args] = mockLogAuditEvent.mock.calls[0];
    expect(args.action).toBe('DELETE');
    expect(args.entityId).toBe(CAT_ID);
    expect(args.entityType).toBe('CustomCategory');
  });

  it('does NOT call logAuditEvent when category not found (count: 0)', async () => {
    mockDeleteMany.mockResolvedValue({ count: 0 });

    const req = createMockRequest(`/api/categories/${CAT_ID}`, {
      method: 'DELETE',
    });

    await DELETE(req, routeParams());

    expect(mockLogAuditEvent).not.toHaveBeenCalled();
  });
});
