/**
 * Validates that a post-login redirect path is safe (no open-redirect risk).
 * Designed to run in Edge Runtime (no Node.js APIs).
 */

const MAX_PATH_LENGTH = 2048;

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x1f\x7f]/;

export function isSafePostLoginPath(path: string): boolean {
  if (!path || path.length > MAX_PATH_LENGTH) return false;

  // Must start with exactly one slash (reject protocol-relative `//evil.com`)
  if (!path.startsWith('/') || path.startsWith('//')) return false;

  // Reject API routes — no reason to land on an API endpoint after login
  if (path.startsWith('/api/') || path === '/api') return false;

  // Reject control characters and null bytes (including percent-encoded \0)
  if (CONTROL_CHARS.test(path) || path.includes('%00')) return false;

  // Reject the landing page itself (redundant callbackUrl)
  if (path === '/' || path === '/?') return false;

  return true;
}
