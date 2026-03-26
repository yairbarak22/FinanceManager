/**
 * Inbox Constants
 * Sender addresses and thread helper utilities
 */

// Allowed sender addresses for replying from the admin inbox
export const SENDER_ADDRESSES = [
  { email: 'admin@myneto.co.il', label: 'Admin', display: 'MyNeto <admin@myneto.co.il>' },
  { email: 'support@myneto.co.il', label: 'Support', display: 'MyNeto <support@myneto.co.il>' },
  { email: 'info@myneto.co.il', label: 'Info', display: 'MyNeto <info@myneto.co.il>' },
  { email: 'hello@myneto.co.il', label: 'Hello', display: 'MyNeto <hello@myneto.co.il>' },
] as const;

export const DEFAULT_SENDER = SENDER_ADDRESSES[0];

/**
 * Generate a threadId from subject and sender email.
 * Strips Re:, Fwd:, etc. prefixes and normalizes for grouping.
 */
export function generateThreadId(subject: string, senderEmail: string): string {
  const normalizedSubject = subject
    .replace(/^(re|fwd|fw|השב|הע):\s*/gi, '')
    .trim()
    .toLowerCase();
  
  const normalizedEmail = senderEmail.trim().toLowerCase();
  
  // Simple hash-like string for grouping
  return `thread_${normalizedEmail}_${normalizedSubject}`.replace(/[^a-z0-9_@.]/g, '_');
}

/**
 * Extract a clean email address from a "Name <email>" string
 */
export function extractEmailAddress(fromString: string): string {
  const match = fromString.match(/<([^>]+)>/);
  return match ? match[1].trim().toLowerCase() : fromString.trim().toLowerCase();
}

/**
 * Extract display name from a "Name <email>" string
 */
export function extractDisplayName(fromString: string): string {
  const match = fromString.match(/^(.+?)\s*<[^>]+>/);
  return match ? match[1].trim().replace(/^["']|["']$/g, '') : fromString.trim();
}

/**
 * Validate that a sender address is allowed
 */
export function isValidSenderAddress(email: string): boolean {
  return SENDER_ADDRESSES.some(s => s.email === email);
}

/**
 * Get sender display string for Resend from email
 */
export function getSenderDisplay(email: string): string {
  const sender = SENDER_ADDRESSES.find(s => s.email === email);
  return sender ? sender.display : `MyNeto <${email}>`;
}

