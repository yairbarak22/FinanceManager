/**
 * Stateless HMAC token for marketing unsubscribe links.
 *
 * Signs userId with NEXTAUTH_SECRET so unauthenticated unsubscribe
 * endpoints can verify the link came from a legitimate email.
 *
 * Server-only — do NOT import from client components.
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { config } from '@/lib/config';

const HMAC_ALGO = 'sha256';

export function signUnsubscribeToken(userId: string): string {
  return createHmac(HMAC_ALGO, config.nextAuthSecret)
    .update(userId)
    .digest('hex');
}

export function verifyUnsubscribeToken(
  userId: string,
  providedToken: string,
): boolean {
  const expected = signUnsubscribeToken(userId);
  if (expected.length !== providedToken.length) return false;
  return timingSafeEqual(
    Buffer.from(expected, 'utf8'),
    Buffer.from(providedToken, 'utf8'),
  );
}

export function buildUnsubscribeUrl(userId: string): string {
  const token = signUnsubscribeToken(userId);
  return `${config.nextAuthUrl}/api/marketing/unsubscribe?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`;
}
