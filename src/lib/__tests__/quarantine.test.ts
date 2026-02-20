/**
 * Quarantine Module Tests
 *
 * Tests for the quarantine logic (quarantining, listing, approving, rejecting).
 * These are unit tests that mock Prisma and Vercel Blob.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted so variables are available when vi.mock factories are hoisted
const { mockPrismaQuarantinedFile } = vi.hoisted(() => ({
  mockPrismaQuarantinedFile: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
}));

vi.mock('../prisma', () => ({
  prisma: {
    quarantinedFile: mockPrismaQuarantinedFile,
  },
}));

// Mock @prisma/client for QuarantineStatus enum
vi.mock('@prisma/client', () => ({
  QuarantineStatus: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    AUTO_CLEAN: 'AUTO_CLEAN',
  },
}));

// Mock Vercel Blob
vi.mock('@vercel/blob', () => ({
  put: vi.fn().mockResolvedValue({ url: 'https://blob.vercel-storage.com/quarantine/test', pathname: 'quarantine/test' }),
  del: vi.fn().mockResolvedValue(undefined),
}));

// Mock uuid
vi.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
}));

// Mock audit log
vi.mock('../auditLog', () => ({
  logAuditEvent: vi.fn(),
  AuditAction: {
    FILE_QUARANTINED: 'FILE_QUARANTINED',
    FILE_QUARANTINE_APPROVED: 'FILE_QUARANTINE_APPROVED',
    FILE_QUARANTINE_REJECTED: 'FILE_QUARANTINE_REJECTED',
  },
}));

// Mock config
vi.mock('../config', () => ({
  config: {
    encryptionKey: 'a'.repeat(64),
  },
}));

import {
  quarantineFile,
  listQuarantinedFiles,
  getQuarantinedFile,
  approveQuarantinedFile,
  rejectQuarantinedFile,
  getQuarantineStats,
} from '../quarantine';
import { logAuditEvent } from '../auditLog';
import { put, del } from '@vercel/blob';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('quarantineFile', () => {
  it('should store file in blob and create DB record', async () => {
    const mockRecord = {
      id: 'q-1',
      filename: 'test.pdf',
      storedName: 'quarantine/test-uuid-1234-test.pdf',
      url: 'https://blob.vercel-storage.com/quarantine/test',
      mimeType: 'application/pdf',
      size: 1024,
      userId: 'user-1',
      reason: 'Contains JavaScript',
      reasonCode: 'PDF_JAVASCRIPT',
    };
    mockPrismaQuarantinedFile.create.mockResolvedValue(mockRecord);

    const buffer = Buffer.from('test pdf content');
    const result = await quarantineFile(
      buffer,
      'test.pdf',
      'application/pdf',
      'user-1',
      'Contains JavaScript',
      'PDF_JAVASCRIPT',
    );

    expect(result.quarantineId).toBe('q-1');
    expect(result.reason).toBe('Contains JavaScript');
    expect(result.reasonCode).toBe('PDF_JAVASCRIPT');

    // Verify blob storage was called (sanitizer keeps . and - characters)
    expect(put).toHaveBeenCalledWith(
      'quarantine/test-uuid-1234-test.pdf',
      buffer,
      {
        access: 'public',
        contentType: 'application/pdf',
      },
    );

    // Verify DB record was created
    expect(mockPrismaQuarantinedFile.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        filename: 'test.pdf',
        mimeType: 'application/pdf',
        size: 16,
        userId: 'user-1',
        reason: 'Contains JavaScript',
        reasonCode: 'PDF_JAVASCRIPT',
      }),
    });

    // Verify audit log
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        action: 'FILE_QUARANTINED',
      }),
    );
  });

  it('should sanitize filename for storage', async () => {
    mockPrismaQuarantinedFile.create.mockResolvedValue({
      id: 'q-2',
      reason: 'test',
      reasonCode: 'TEST',
    });

    await quarantineFile(
      Buffer.from('x'),
      '../../../etc/passwd',
      'text/plain',
      'user-1',
      'test',
      'TEST',
    );

    // Sanitizer: [^a-zA-Z0-9._-] → '_'
    // '../../../etc/passwd' → '.._.._.._etc_passwd' (. and - are kept, / replaced with _)
    expect(mockPrismaQuarantinedFile.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        filename: '.._.._.._etc_passwd',
      }),
    });
  });

  it('should still create DB record if blob storage fails', async () => {
    vi.mocked(put).mockRejectedValueOnce(new Error('Blob error'));
    mockPrismaQuarantinedFile.create.mockResolvedValue({
      id: 'q-3',
      reason: 'test',
      reasonCode: 'TEST',
    });

    const result = await quarantineFile(
      Buffer.from('x'),
      'test.pdf',
      'application/pdf',
      'user-1',
      'test',
      'TEST',
    );

    expect(result.quarantineId).toBe('q-3');
    // URL should be null since blob failed
    expect(mockPrismaQuarantinedFile.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        url: null,
      }),
    });
  });
});

describe('listQuarantinedFiles', () => {
  it('should return paginated list with total count', async () => {
    const items = [
      { id: 'q-1', filename: 'a.pdf', status: 'PENDING' },
      { id: 'q-2', filename: 'b.pdf', status: 'PENDING' },
    ];
    mockPrismaQuarantinedFile.findMany.mockResolvedValue(items);
    mockPrismaQuarantinedFile.count.mockResolvedValue(10);

    const result = await listQuarantinedFiles(undefined, 1, 20);
    expect(result.items).toEqual(items);
    expect(result.total).toBe(10);
  });

  it('should filter by status', async () => {
    mockPrismaQuarantinedFile.findMany.mockResolvedValue([]);
    mockPrismaQuarantinedFile.count.mockResolvedValue(0);

    await listQuarantinedFiles('APPROVED' as any);

    expect(mockPrismaQuarantinedFile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'APPROVED' },
      }),
    );
  });
});

describe('approveQuarantinedFile', () => {
  it('should approve a pending file', async () => {
    mockPrismaQuarantinedFile.findUnique.mockResolvedValue({
      id: 'q-1',
      status: 'PENDING',
      userId: 'user-1',
      filename: 'test.pdf',
      reasonCode: 'TEST',
    });
    mockPrismaQuarantinedFile.update.mockResolvedValue({ id: 'q-1' });

    const success = await approveQuarantinedFile('q-1', 'admin-1', 'looks safe');
    expect(success).toBe(true);

    expect(mockPrismaQuarantinedFile.update).toHaveBeenCalledWith({
      where: { id: 'q-1' },
      data: expect.objectContaining({
        status: 'APPROVED',
        reviewedBy: 'admin-1',
        reviewNotes: 'looks safe',
      }),
    });

    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'FILE_QUARANTINE_APPROVED',
      }),
    );
  });

  it('should return false for non-existent file', async () => {
    mockPrismaQuarantinedFile.findUnique.mockResolvedValue(null);
    const success = await approveQuarantinedFile('q-999', 'admin-1');
    expect(success).toBe(false);
  });

  it('should return false for already reviewed file', async () => {
    mockPrismaQuarantinedFile.findUnique.mockResolvedValue({
      id: 'q-1',
      status: 'APPROVED', // Already approved
    });
    const success = await approveQuarantinedFile('q-1', 'admin-1');
    expect(success).toBe(false);
  });
});

describe('rejectQuarantinedFile', () => {
  it('should reject and delete blob', async () => {
    mockPrismaQuarantinedFile.findUnique.mockResolvedValue({
      id: 'q-1',
      status: 'PENDING',
      url: 'https://blob.vercel-storage.com/quarantine/test',
      userId: 'user-1',
      filename: 'test.pdf',
      reasonCode: 'TEST',
    });
    mockPrismaQuarantinedFile.update.mockResolvedValue({ id: 'q-1' });

    const success = await rejectQuarantinedFile('q-1', 'admin-1', 'dangerous');
    expect(success).toBe(true);

    // Verify blob was deleted
    expect(del).toHaveBeenCalledWith('https://blob.vercel-storage.com/quarantine/test');

    // Verify DB was updated
    expect(mockPrismaQuarantinedFile.update).toHaveBeenCalledWith({
      where: { id: 'q-1' },
      data: expect.objectContaining({
        status: 'REJECTED',
        reviewedBy: 'admin-1',
        url: null,
      }),
    });
  });

  it('should return false for non-existent file', async () => {
    mockPrismaQuarantinedFile.findUnique.mockResolvedValue(null);
    const success = await rejectQuarantinedFile('q-999', 'admin-1');
    expect(success).toBe(false);
  });
});

describe('getQuarantineStats', () => {
  it('should return counts by status', async () => {
    mockPrismaQuarantinedFile.count
      .mockResolvedValueOnce(5) // pending
      .mockResolvedValueOnce(10) // approved
      .mockResolvedValueOnce(3) // rejected
      .mockResolvedValueOnce(18); // total

    const stats = await getQuarantineStats();
    expect(stats).toEqual({
      pending: 5,
      approved: 10,
      rejected: 3,
      total: 18,
    });
  });
});

describe('getQuarantinedFile', () => {
  it('should return file by ID', async () => {
    const mockFile = { id: 'q-1', filename: 'test.pdf' };
    mockPrismaQuarantinedFile.findUnique.mockResolvedValue(mockFile);

    const file = await getQuarantinedFile('q-1');
    expect(file).toEqual(mockFile);
    expect(mockPrismaQuarantinedFile.findUnique).toHaveBeenCalledWith({
      where: { id: 'q-1' },
    });
  });

  it('should return null for non-existent file', async () => {
    mockPrismaQuarantinedFile.findUnique.mockResolvedValue(null);
    const file = await getQuarantinedFile('q-999');
    expect(file).toBeNull();
  });
});

