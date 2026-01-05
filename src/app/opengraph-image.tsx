import { ImageResponse } from 'next/og';

/**
 * Dynamic Open Graph Image for NETO
 *
 * This generates a 1200x630 image for social media sharing.
 * Uses the default Next.js OG image generation.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
 */

export const runtime = 'edge';

export const alt = 'NETO - ניהול הון חכם';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #4c1d95 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: 'radial-gradient(circle at 25px 25px, white 2px, transparent 0)',
            backgroundSize: '50px 50px',
          }}
        />

        {/* Logo Circle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 120,
            height: 120,
            borderRadius: 30,
            background: 'rgba(255, 255, 255, 0.15)',
            marginBottom: 30,
          }}
        >
          {/* Pie Chart Icon */}
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
            <path d="M22 12A10 10 0 0 0 12 2v10z" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: 'white',
              letterSpacing: '-2px',
            }}
          >
            NETO
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: 40,
            direction: 'rtl',
          }}
        >
          ניהול הון חכם
        </div>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: 40,
            marginTop: 20,
          }}
        >
          {['מעקב הוצאות', 'תיק השקעות', 'תכנון פיננסי'].map((feature) => (
            <div
              key={feature}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 50,
                direction: 'rtl',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#22c55e',
                }}
              />
              <span
                style={{
                  fontSize: 20,
                  color: 'rgba(255, 255, 255, 0.9)',
                }}
              >
                {feature}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom Branding */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 18,
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            neto.co.il
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
