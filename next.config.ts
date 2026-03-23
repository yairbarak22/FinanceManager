import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['muhammara', '@react-pdf/renderer'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking attacks
          { key: 'X-Frame-Options', value: 'DENY' },
          
          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          
          // Control referrer information
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          
          // Disable unnecessary browser features
          { 
            key: 'Permissions-Policy', 
            value: 'camera=(), microphone=(), geolocation=(), payment=()' 
          },
          
          // Force HTTPS (HSTS) - 1 year with subdomains
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },

          // Cross-Origin headers
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          },
          
          // CSP is set dynamically in middleware with per-request nonce (src/lib/csp.ts).
          // Do NOT add a static Content-Security-Policy here — duplicate CSP headers
          // cause browsers to enforce both, and the static one (without nonce) blocks
          // all inline scripts.
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none' // Required: Smartlook/Google SDKs don't send CORP headers
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin'
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none'
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'off'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
