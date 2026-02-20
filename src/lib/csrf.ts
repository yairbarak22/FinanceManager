/**
 * CSRF Protection Utilities — Double Submit Cookie Pattern
 *
 * Flow:
 *  1. Middleware sets a non-httpOnly cookie "csrf-token" for authenticated users
 *  2. Client JS reads the cookie and sends it as X-CSRF-Token header
 *  3. Middleware compares cookie ↔ header with timingSafeEqual
 *
 * Why httpOnly=false: We NEED JS to read it (that's the pattern).
 * Why SameSite=Strict: cross-site browser won't send the cookie → attacker
 *   can't forge the header → attack fails.
 *
 * NOTE: This file is imported by middleware.ts which runs in Edge Runtime.
 *       We use the global Web Crypto API (not Node.js 'crypto' module).
 */

// No Node.js imports — use global Web Crypto API (Edge Runtime compatible)

export const CSRF_COOKIE_NAME    = 'csrf-token';
export const CSRF_HEADER_NAME    = 'X-CSRF-Token';
export const CSRF_LEGACY_HEADER  = 'X-CSRF-Protection'; // kept for backward compat
export const CSRF_TOKEN_BYTES    = 32;                   // → 64 hex chars
export const CSRF_TOKEN_MAX_AGE  = 60 * 60 * 24;        // 24 h in seconds

/**
 * Generate a cryptographically random CSRF token (64-char hex string).
 * Uses Web Crypto API (crypto.getRandomValues) for Edge Runtime compatibility.
 */
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(CSRF_TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Timing-safe comparison of two Uint8Arrays.
 * Constant-time: always iterates through ALL bytes regardless of mismatch.
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

/**
 * Timing-safe comparison of header token vs cookie token.
 * Returns true only when both are identical non-empty strings.
 * Uses Web Crypto compatible TextEncoder instead of Node.js Buffer.
 */
export function isValidCsrfToken(
  headerToken: string | null | undefined,
  cookieToken: string | null | undefined,
): boolean {
  if (!headerToken || !cookieToken) return false;
  if (headerToken.length !== cookieToken.length) return false;
  try {
    const encoder = new TextEncoder();
    return timingSafeEqual(
      encoder.encode(headerToken),
      encoder.encode(cookieToken),
    );
  } catch {
    return false;
  }
}

/**
 * Normalize a hostname by stripping the "www." prefix.
 * Only removes the leading "www." — other subdomains are NOT normalized.
 * This ensures that www.myneto.co.il and myneto.co.il are treated as equivalent
 * while evil.myneto.co.il is still rejected.
 */
export function normalizeDomain(hostname: string): string {
  return hostname.startsWith('www.') ? hostname.slice(4) : hostname;
}

/**
 * Validate the request Origin (with Referer fallback) against the app URL.
 * Handles production, localhost (dev), Vercel preview deployments,
 * and www vs non-www domain variants.
 *
 * If neither Origin nor Referer is present we allow the request —
 * same-origin browser navigations may omit both headers, and the
 * SameSite cookie already prevents cross-site attacks.
 */
export function isValidOrigin(
  origin: string | null,
  referer: string | null,
  appUrl: string,
): boolean {
  const allowedUrl = new URL(appUrl);

  function matches(candidate: string): boolean {
    try {
      const candidateUrl = new URL(candidate);

      // Protocol must always match (https vs http)
      if (candidateUrl.protocol !== allowedUrl.protocol) {
        // Development: allow http://localhost and http://127.0.0.1
        if (
          process.env.NODE_ENV !== 'production' &&
          (candidateUrl.hostname === 'localhost' ||
            candidateUrl.hostname === '127.0.0.1')
        ) {
          return true;
        }
        return false;
      }

      // Normalize domains: treat www.myneto.co.il === myneto.co.il
      const candidateDomain = normalizeDomain(candidateUrl.hostname);
      const allowedDomain = normalizeDomain(allowedUrl.hostname);

      if (candidateDomain === allowedDomain) return true;

      // Development: allow localhost / 127.0.0.1
      if (
        process.env.NODE_ENV !== 'production' &&
        (candidateUrl.hostname === 'localhost' ||
          candidateUrl.hostname === '127.0.0.1')
      ) {
        return true;
      }

      // Vercel preview deployments (same Vercel account)
      if (candidateUrl.hostname.endsWith('.vercel.app')) return true;

      return false;
    } catch {
      return false;
    }
  }

  if (origin) return matches(origin);

  if (referer) {
    try {
      return matches(new URL(referer).origin);
    } catch {
      return false;
    }
  }

  // No Origin / Referer → allow (SameSite cookie is the real guard)
  return true;
}
