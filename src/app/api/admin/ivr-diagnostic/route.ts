import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminHelpers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import dns from 'dns/promises';

const CALL2ALL_HOST = 'www.call2all.co.il';
const CALL2ALL_TEST_PATH = 'ivr/042.wav';

export async function GET() {
  try {
    const { userId, error } = await requireAdmin();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`admin:${userId}`, RATE_LIMITS.admin);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'יותר מדי בקשות. נסה שוב בעוד דקה.' },
        { status: 429 }
      );
    }

    const results: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL ? 'vercel' : 'local',
      region: process.env.VERCEL_REGION || 'unknown',
    };

    // 1. DNS Resolution
    const dnsStart = Date.now();
    try {
      const addresses = await dns.resolve4(CALL2ALL_HOST);
      results.dns = {
        success: true,
        addresses,
        durationMs: Date.now() - dnsStart,
      };
    } catch (err) {
      results.dns = {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - dnsStart,
      };
    }

    // 2. HTTPS Fetch with timeout
    const token = process.env.YEMOT_TOKEN;
    if (!token) {
      results.fetch = { success: false, error: 'YEMOT_TOKEN not set' };
    } else {
      const url = `https://${CALL2ALL_HOST}/ym/api/DownloadFile?token=${token}&path=${CALL2ALL_TEST_PATH}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      const fetchStart = Date.now();

      try {
        const res = await fetch(url, { signal: controller.signal });
        const contentLength = res.headers.get('content-length');
        const contentType = res.headers.get('content-type');
        // Read body to confirm full download works
        const body = await res.arrayBuffer();
        results.fetch = {
          success: res.ok,
          status: res.status,
          contentType,
          contentLength,
          bodySize: body.byteLength,
          durationMs: Date.now() - fetchStart,
        };
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const cause = err instanceof Error && err.cause
          ? (err.cause instanceof Error ? err.cause.message : String(err.cause))
          : undefined;
        results.fetch = {
          success: false,
          error: errMsg,
          cause,
          durationMs: Date.now() - fetchStart,
          aborted: controller.signal.aborted,
        };
      } finally {
        clearTimeout(timeout);
      }
    }

    // 3. Network info
    results.nodeVersion = process.version;
    results.platform = process.platform;
    results.arch = process.arch;

    return NextResponse.json(results);
  } catch (err) {
    console.error('[IVR-Diagnostic] Error:', err);
    return NextResponse.json(
      { error: 'Diagnostic failed' },
      { status: 500 }
    );
  }
}
