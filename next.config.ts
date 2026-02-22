import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
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
          
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://web-sdk.smartlook.com https://www.googletagmanager.com https://cdn.mxpnl.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://fonts.gstatic.com",
              [
                "connect-src 'self'",
                "https://accounts.google.com",
                "https://api.openai.com",
                "https://*.vercel-storage.com",
                "https://*.smartlook.com",
                "https://*.smartlook.cloud",
                "https://*.eu.smartlook.cloud",
                "wss://*.smartlook.com",
                "wss://*.smartlook.cloud",
                "wss://*.eu.smartlook.cloud",
                "https://*.google-analytics.com",
                "https://analytics.google.com",
                "https://*.googletagmanager.com",
                "https://*.mixpanel.com",
                "https://*.mxpnl.com",
                ...(isDev ? ["http://localhost:*", "ws://localhost:*"] : []),
              ].join(' '),
              "worker-src 'self' blob:",
              "frame-src 'self' https://accounts.google.com https://iframe.mediadelivery.net",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
              "object-src 'none'",
            ].join('; ')
          },
        ],
      },
    ];
  },
};

export default nextConfig;
