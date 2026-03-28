/**
 * Edge-compatible hash for PII redaction in audit logs.
 * Uses Web Crypto API (available in Edge Runtime).
 */
export async function hashForEdge(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}
