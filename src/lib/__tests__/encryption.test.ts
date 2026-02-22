/**
 * Encryption Tests
 *
 * Tests for AES-256-GCM encryption/decryption of PII.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to mock the config module before importing encryption
vi.mock('../config', () => ({
  config: {
    encryptionKey: 'a'.repeat(64), // 64 hex chars = 32 bytes
  },
}));

import { encrypt, decrypt, encryptFields, decryptFields } from '../encryption';

describe('encrypt/decrypt', () => {
  it('should encrypt and decrypt a string correctly', () => {
    const plaintext = 'Hello, World!';
    const encrypted = encrypt(plaintext);

    // Encrypted should be different from plaintext
    expect(encrypted).not.toBe(plaintext);

    // Should contain the iv:authTag:ciphertext format
    expect(encrypted.split(':').length).toBe(3);

    // Decrypt should return original
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should produce different ciphertext for same plaintext (random IV)', () => {
    const plaintext = 'Same input';
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);

    // Same plaintext should produce different encrypted values (random IV)
    expect(encrypted1).not.toBe(encrypted2);

    // Both should decrypt to the same value
    expect(decrypt(encrypted1)).toBe(plaintext);
    expect(decrypt(encrypted2)).toBe(plaintext);
  });

  it('should handle empty string', () => {
    expect(encrypt('')).toBe('');
    expect(decrypt('')).toBe('');
  });

  it('should handle Hebrew text', () => {
    const plaintext = 'שלום עולם';
    const encrypted = encrypt(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it('should handle special characters', () => {
    const plaintext = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./~`';
    const encrypted = encrypt(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it('should return original value if not encrypted format', () => {
    // No colons – not encrypted
    expect(decrypt('not-encrypted')).toBe('not-encrypted');
  });

  it('should return original value if wrong number of parts', () => {
    expect(decrypt('a:b')).toBe('a:b');
    expect(decrypt('a:b:c:d')).toBe('a:b:c:d');
  });
});

describe('encryptFields', () => {
  it('should encrypt specified fields', () => {
    const obj = { name: 'John', email: 'john@test.com', age: 30 };
    const encrypted = encryptFields(obj, ['name', 'email']);

    expect(encrypted.name).not.toBe('John');
    expect(encrypted.email).not.toBe('john@test.com');
    expect(encrypted.age).toBe(30); // Not encrypted
  });

  it('should skip null/undefined fields', () => {
    const obj = { name: null as string | null, email: 'test@test.com' };
    const encrypted = encryptFields(obj, ['name', 'email']);

    expect(encrypted.name).toBeNull();
    expect(encrypted.email).not.toBe('test@test.com');
  });
});

describe('decryptFields', () => {
  it('should decrypt specified fields', () => {
    const original = { name: 'John', email: 'john@test.com' };
    const encrypted = encryptFields(original, ['name', 'email']);
    const decrypted = decryptFields(encrypted, ['name', 'email']);

    expect(decrypted.name).toBe('John');
    expect(decrypted.email).toBe('john@test.com');
  });
});

