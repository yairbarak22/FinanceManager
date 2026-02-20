/**
 * CSP (Content Security Policy) utilities.
 *
 * Generates per-request nonces and builds the full CSP header string.
 * All functions are Edge Runtime compatible (no Node.js-only APIs).
 */

/**
 * Generate a cryptographically random nonce for CSP.
 * Uses Web Crypto API (Edge Runtime compatible — no Buffer).
 * Output is base64url-safe (no +, /, =).
 */
export function generateCspNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...Array.from(array)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Build a full Content-Security-Policy header value with the given nonce.
 * In development, `unsafe-eval` is added for HMR/React DevTools.
 */
export function buildCspHeader(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  return [
    "default-src 'self'",
    [
      "script-src 'self'",
      `'nonce-${nonce}'`,
      isDev ? "'unsafe-eval'" : '',
      'https://accounts.google.com',
      'https://apis.google.com',
      'https://web-sdk.smartlook.com',
      'https://www.googletagmanager.com',
      'https://cdn.mxpnl.com',
    ].filter(Boolean).join(' '),
    // unsafe-inline required: Tailwind CSS v4 injects inline styles
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    [
      "connect-src 'self'",
      'https://accounts.google.com',
      'https://api.openai.com',
      'https://*.vercel-storage.com',
      'https://*.smartlook.com', 'https://*.smartlook.cloud', 'https://*.eu.smartlook.cloud',
      'wss://*.smartlook.com', 'wss://*.smartlook.cloud', 'wss://*.eu.smartlook.cloud',
      'https://*.google-analytics.com', 'https://analytics.google.com',
      'https://*.googletagmanager.com',
      'https://*.mixpanel.com', 'https://*.mxpnl.com',
      isDev ? 'http://localhost:* ws://localhost:*' : '',
    ].filter(Boolean).join(' '),
    "worker-src 'self' blob:",
    "frame-src 'self' https://accounts.google.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "report-uri /api/csp-report",
  ].join('; ');
}

