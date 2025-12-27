/**
 * AES-256-GCM Encryption for PII
 * Used to encrypt sensitive user profile data at rest
 */

import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { config } from './config';

// AES-256 requires a 32-byte key
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from centralized config
 * SECURITY: No default fallback - key must be explicitly set in all environments
 */
function getEncryptionKey(): Buffer {
  const key = config.encryptionKey;

  // Key validation - must be 32 bytes in hex, base64, or raw format
  if (key.length === 64) {
    // Hex encoded (recommended)
    return Buffer.from(key, 'hex');
  } else if (key.length === 44) {
    // Base64 encoded
    return Buffer.from(key, 'base64');
  } else if (key.length === 32) {
    // Raw string (not recommended but supported)
    return Buffer.from(key);
  }

  throw new Error(
    'ENCRYPTION_KEY must be 32 bytes (64 hex chars or 44 base64 chars). ' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}

/**
 * Encrypt a string value
 * Returns base64 encoded string: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;
  
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:ciphertext (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt a string value
 * Expects format: iv:authTag:ciphertext (all base64)
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return ciphertext;
  
  // Check if this looks like encrypted data
  if (!ciphertext.includes(':')) {
    // Not encrypted, return as-is (for migration)
    return ciphertext;
  }
  
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    // Invalid format, return as-is
    return ciphertext;
  }
  
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = parts[2];
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    // Return original value if decryption fails
    return ciphertext;
  }
}

/**
 * Encrypt specific fields in an object
 */
export function encryptFields<T extends Record<string, unknown>>(
  obj: T,
  fieldsToEncrypt: (keyof T)[]
): T {
  const result = { ...obj };
  
  for (const field of fieldsToEncrypt) {
    const value = result[field];
    if (typeof value === 'string' && value) {
      (result[field] as string) = encrypt(value);
    }
  }
  
  return result;
}

/**
 * Decrypt specific fields in an object
 */
export function decryptFields<T extends Record<string, unknown>>(
  obj: T,
  fieldsToDecrypt: (keyof T)[]
): T {
  const result = { ...obj };
  
  for (const field of fieldsToDecrypt) {
    const value = result[field];
    if (typeof value === 'string' && value) {
      (result[field] as string) = decrypt(value);
    }
  }
  
  return result;
}

// Fields in UserProfile that should be encrypted
export const ENCRYPTED_PROFILE_FIELDS = [
  'militaryStatus',
  'maritalStatus',
  'employmentType',
  'ageRange',
  'monthlyIncome',
  'riskTolerance',
] as const;

