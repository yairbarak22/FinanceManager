# Security Best Practices Audit Report

**Project:** MyNeto (FinanceManager)  
**Date:** March 4, 2026  
**Auditor:** Security Best Practices Skill (Next.js, React, Frontend)  
**Next.js Version:** 16.1.1  
**Audit Scope:** Full codebase security review

---

## Executive Summary

This security audit examined the MyNeto personal finance management application across 11 security surfaces using Next.js, React, and general frontend security best practices. The application demonstrates strong security foundations with comprehensive authentication, CSRF protection, rate limiting, and secure coding patterns. However, 12 findings were identified across 4 severity levels that should be addressed to strengthen the security posture.

**Summary by Severity:**
- **High:** 2 findings
- **Medium:** 6 findings  
- **Low:** 4 findings

**Key Strengths:**
- Robust authentication with JWT revocation checks
- Comprehensive CSRF protection via double-submit cookies
- Rate limiting with Upstash Redis
- Secure file upload handling with path traversal protection
- No SQL injection risks (Prisma ORM only)
- Minimal XSS attack surface
- No dynamic code execution vulnerabilities

---

## Critical Findings

*None identified*

---

## High Severity Findings

### Finding 1: NEXT-CSP-001 — CSP includes `unsafe-eval` and `unsafe-inline`

**Rule ID:** NEXT-CSP-001  
**Severity:** High  
**Location:** `next.config.ts`, lines 43-44

**Evidence:**
```typescript
"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://web-sdk.smartlook.com https://www.googletagmanager.com https://cdn.mxpnl.com",
```

**Impact:**
The Content Security Policy includes both `'unsafe-eval'` and `'unsafe-inline'` in the `script-src` directive. This significantly weakens CSP's effectiveness as a defense-in-depth mechanism against XSS attacks. If an XSS vulnerability exists elsewhere in the application, attackers can execute inline scripts and use `eval()`-like APIs without CSP blocking them. The middleware already generates CSP nonces (see `src/middleware.ts`), but `unsafe-inline` overrides the nonce requirement.

**Fix:**
1. Remove `'unsafe-inline'` from `script-src` and rely on the nonce-based approach already implemented in middleware
2. Remove `'unsafe-eval'` unless absolutely required by third-party SDKs (Smartlook, Google Analytics)
3. If third-party scripts require `unsafe-eval`, isolate them to specific routes or use a more restrictive CSP for those routes only
4. Test thoroughly to ensure all inline scripts are properly nonced

**Mitigation:**
- Ensure all user-generated content is properly sanitized before rendering
- Continue using React's default escaping for untrusted data
- Consider implementing Trusted Types as additional defense-in-depth

---

### Finding 2: NEXT-AUTH-001 — `merchant-category` route bypasses `requireAuth()`

**Rule ID:** NEXT-AUTH-001  
**Severity:** High  
**Location:** `src/app/api/merchant-category/route.ts`, lines 9, 56

**Evidence:**
```typescript
// Line 9 (POST handler)
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Line 56 (DELETE handler)
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Impact:**
The route uses `getServerSession(authOptions)` directly instead of the centralized `requireAuth()` helper. This bypasses:
1. **JWT revocation check** — `requireAuth()` verifies the user still exists in the database and caches the result, preventing access with revoked tokens
2. **Rate limiting** — The route has no rate limiting, allowing potential abuse
3. **Consistent error handling** — Other routes use `requireAuth()` which provides standardized error responses

A user whose account has been deleted or whose JWT has been revoked could still access or modify merchant category mappings until the JWT expires naturally (24 hours).

**Fix:**
Replace `getServerSession(authOptions)` with `requireAuth()`:

```typescript
import { requireAuth } from '@/lib/authHelpers';

export async function POST(request: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;
  
  // ... rest of handler
}
```

Also add rate limiting using the `api` preset from `src/lib/rateLimit.ts`.

**Mitigation:**
- Review all API routes to ensure they use `requireAuth()` or `requireAdmin()` consistently
- Consider adding a lint rule or type guard to prevent direct `getServerSession` usage in API routes

---

## Medium Severity Findings

### Finding 3: NEXT-ERROR-001 — API routes leak error details to clients

**Rule ID:** NEXT-ERROR-001  
**Severity:** Medium  
**Locations:**
- `src/app/api/admin/inbox/[id]/reply/route.ts`, line 108
- `src/app/api/admin/marketing/campaigns/[id]/send/route.ts`, lines 245-249
- `src/app/api/periodic-reports/generate/route.ts`, lines 56-57

**Evidence:**

**Location 1 — `src/app/api/admin/inbox/[id]/reply/route.ts`:**
```typescript
if (result.error) {
  console.error('[Inbox Reply] Resend error:', result.error);
  return NextResponse.json(
    { error: result.error.message || 'Failed to send reply' },  // Line 108
    { status: 500 }
  );
}
```

**Location 2 — `src/app/api/admin/marketing/campaigns/[id]/send/route.ts`:**
```typescript
} catch (error) {
  console.error('[Campaign Send] Error:', error);
  return NextResponse.json(
    {
      error: 'Failed to send campaign',
      details: error.message,  // Lines 245-249
    },
    { status: 500 }
  );
}
```

**Location 3 — `src/app/api/periodic-reports/generate/route.ts`:**
```typescript
} catch (err) {
  console.error('Error generating periodic report:', err);
  return NextResponse.json(
    { error: err.message },  // Lines 56-57
    { status: 500 }
  );
}
```

**Impact:**
These routes return internal error messages (`error.message`) directly to clients. This can leak:
- Internal API structure and dependencies (e.g., Resend API error messages)
- Implementation details that could aid attackers
- Stack traces or sensitive information in some error scenarios

**Fix:**
Return generic error messages to clients; log detailed errors server-side only:

```typescript
// Example fix for Location 1
if (result.error) {
  console.error('[Inbox Reply] Resend error:', result.error);
  return NextResponse.json(
    { error: 'Failed to send reply' },
    { status: 500 }
  );
}

// Example fix for Location 2
} catch (error) {
  console.error('[Campaign Send] Error:', error);
  return NextResponse.json(
    { error: 'Failed to send campaign' },
    { status: 500 }
  );
}
```

**Mitigation:**
- Create a centralized error handler utility that sanitizes errors before returning to clients
- Ensure `NODE_ENV=production` in production to prevent Next.js from exposing detailed errors

---

### Finding 4: NEXT-DOS-001 — Inconsistent rate limiting

**Rule ID:** NEXT-DOS-001  
**Severity:** Medium  
**Locations:** Multiple API routes

**Evidence:**
The following routes lack rate limiting:
- `src/app/api/merchant-category/route.ts` (POST, DELETE)
- `src/app/api/track/cta-click/route.ts`
- `src/app/api/portfolio/cash/route.ts`
- `src/app/api/finance/quote/route.ts`
- `src/app/api/finance/search/route.ts`

**Impact:**
Without rate limiting, these endpoints are vulnerable to:
- **Denial of Service (DoS)** — Attackers can flood endpoints with requests
- **Resource exhaustion** — Database queries and external API calls can be abused
- **Cost escalation** — External API calls (e.g., finance quote APIs) could incur unexpected costs

**Fix:**
Add rate limiting using the appropriate preset from `src/lib/rateLimit.ts`:

```typescript
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit('api', request);
  if (rateLimitResult.error) {
    return rateLimitResult.error;
  }
  
  // ... rest of handler
}
```

Choose presets based on endpoint sensitivity:
- `api` (100 req/min) — General API endpoints
- `ai` (lower limit) — Endpoints calling OpenAI/Google AI
- `contact` (5 req/min) — Contact/submission endpoints

**Mitigation:**
- Review all API routes systematically and add rate limiting
- Consider adding rate limiting to the middleware for blanket protection
- Monitor rate limit violations via audit logs

---

### Finding 5: NEXT-INPUT-001 — Inconsistent input validation

**Rule ID:** NEXT-INPUT-001  
**Severity:** Medium  
**Locations:** Multiple API routes

**Evidence:**
Several routes use `request.json()` without Zod schema validation:
- `src/app/api/portfolio/cash/route.ts` — Accepts JSON without validation
- `src/app/api/track/cta-click/route.ts` — Validates `source` but not request body structure
- `src/app/api/merchant-category/route.ts` — Basic checks only (line 14-18)

**Impact:**
Without runtime schema validation:
- **Type confusion attacks** — Malformed input could cause unexpected behavior
- **Injection risks** — Unvalidated strings could be passed to database queries (though Prisma mitigates SQL injection)
- **Application errors** — Invalid data types could cause runtime exceptions

**Fix:**
Add Zod schemas for all request bodies. Example:

```typescript
import { z } from 'zod';

const merchantCategorySchema = z.object({
  merchantName: z.string().min(1).max(255),
  category: z.string().optional(),
  alwaysAsk: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;
  
  const body = await request.json();
  const validationResult = merchantCategorySchema.safeParse(body);
  
  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: validationResult.error.errors },
      { status: 400 }
    );
  }
  
  const { merchantName, category, alwaysAsk } = validationResult.data;
  // ... rest of handler
}
```

**Mitigation:**
- Create shared validation utilities similar to `validateRequest` used in other routes
- Consider using TypeScript types generated from Zod schemas for type safety

---

### Finding 6: NEXT-LOG-001 — Debug logging exposes financial data and PII

**Rule ID:** NEXT-LOG-001  
**Severity:** Medium  
**Locations:**
- `src/app/api/transactions/import/route.ts`, lines 1664-1738
- `src/app/api/investments/send-guide/route.ts`, lines 60, 101, 225-228

**Evidence:**

**Location 1 — Transaction import debug logs:**
```typescript
// Lines 1664-1738 contain multiple console.log statements:
console.log('[IMPORT DEBUG] Column mapping:', columnMapping);
console.log('[IMPORT DEBUG] Header row:', headerRow);
console.log('[IMPORT DEBUG] First data row:', firstDataRow);
console.log('[IMPORT DEBUG] Parsed date:', date);
console.log('[IMPORT DEBUG] Parsed merchant:', merchant);
console.log('[IMPORT DEBUG] Parsed amount:', amount);
// ... more debug logs with raw transaction data
```

**Location 2 — Investment guide logs:**
```typescript
console.log('Guide request:', { ip: clientIp });  // Line 60
console.log('Guide sent:', { userId });  // Line 101
console.log('Guide email sent:', { userEmail, userId, ip });  // Lines 225-228
```

**Impact:**
- **Financial data exposure** — Raw transaction amounts, merchant names, and dates are logged
- **PII exposure** — User emails, user IDs, and IP addresses are logged
- **Compliance risk** — GDPR/CCPA violations if logs are stored or transmitted
- **Security risk** — Logs may be accessible to unauthorized personnel or in log aggregation systems

**Fix:**
1. Gate debug logs behind `NODE_ENV === 'development'`:
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('[IMPORT DEBUG] Column mapping:', columnMapping);
}
```

2. Remove or redact PII from production logs:
```typescript
// Instead of:
console.log('Guide email sent:', { userEmail, userId, ip });

// Use:
console.log('Guide email sent:', { userId: userId.substring(0, 8) + '...' });
// Or use a logging library that automatically redacts PII
```

3. Remove `[IMPORT DEBUG]` logs entirely or move to a structured logging system with log levels

**Mitigation:**
- Implement a logging utility that automatically redacts sensitive fields
- Use structured logging (e.g., Pino, Winston) with log levels
- Ensure log retention policies comply with data protection regulations

---

### Finding 7: NEXT-SESS-001 — Signup source cookie missing `Secure` flag

**Rule ID:** NEXT-SESS-001  
**Severity:** Medium  
**Location:** `src/middleware.ts`, lines 151-156, 166-171, 177-182, 199-204, 292-296

**Evidence:**
```typescript
response.cookies.set(SIGNUP_SOURCE_COOKIE, source, {
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
  sameSite: 'lax',
  // Missing: secure, httpOnly
});
```

**Impact:**
The `SIGNUP_SOURCE_COOKIE` is set without:
- **`Secure` flag** — Cookie can be transmitted over HTTP, making it vulnerable to interception
- **`HttpOnly` flag** — Cookie is accessible to JavaScript, increasing XSS attack surface

While this cookie appears to be non-sensitive (tracking signup source), it should still follow secure cookie practices to prevent tampering and reduce attack surface.

**Fix:**
Add secure cookie attributes:

```typescript
response.cookies.set(SIGNUP_SOURCE_COOKIE, source, {
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
});
```

**Note:** The `Secure` flag should only be set in production (as shown) to allow local development over HTTP.

**Mitigation:**
- Review all cookie-setting code to ensure consistent secure attributes
- Consider creating a cookie utility function that applies secure defaults

---

### Finding 8: Encryption decryption failure returns original ciphertext

**Rule ID:** Custom (Encryption Best Practice)  
**Severity:** Medium  
**Location:** `src/lib/encryption.ts`, lines 92-95

**Evidence:**
```typescript
} catch (error) {
  console.error('Decryption failed:', error);
  // Return original value if decryption fails
  return ciphertext;  // Lines 92-95
}
```

**Impact:**
When decryption fails (e.g., due to tampering, wrong key, or corrupted data), the function returns the original ciphertext string. This:
- **Leaks structure** — Attackers can infer information about encrypted data structure
- **Confuses callers** — Callers may treat corrupted ciphertext as valid plaintext
- **Hides errors** — Failures are silently ignored, making debugging difficult

**Fix:**
Return a safe default or throw an error:

```typescript
} catch (error) {
  console.error('Decryption failed:', error);
  // Option 1: Return empty string
  return '';
  
  // Option 2: Throw error (preferred)
  throw new Error('Failed to decrypt data');
}
```

If the function must not throw (e.g., for backward compatibility), return an empty string and document the behavior. Consider adding a return type that distinguishes success from failure:

```typescript
type DecryptionResult = 
  | { success: true; data: string }
  | { success: false; error: string };

function decrypt(ciphertext: string): DecryptionResult {
  try {
    // ... decryption logic
    return { success: true, data: decrypted };
  } catch (error) {
    return { success: false, error: 'Decryption failed' };
  }
}
```

**Mitigation:**
- Audit all callers of `decrypt()` to ensure they handle failures appropriately
- Add unit tests for decryption failure scenarios

---

## Low Severity Findings

### Finding 9: NEXT-CACHE-001 — Missing explicit `Cache-Control` on sensitive endpoints

**Rule ID:** NEXT-CACHE-001  
**Severity:** Low  
**Locations:** Multiple user-data API routes

**Evidence:**
Most user-specific API routes don't set explicit `Cache-Control` headers:
- `src/app/api/transactions/route.ts` (GET, POST)
- `src/app/api/assets/route.ts`
- `src/app/api/liabilities/route.ts`
- `src/app/api/holdings/route.ts`
- `src/app/api/goals/route.ts`

**Impact:**
In some deployment configurations (CDN, reverse proxy, or browser caching), responses could be cached and served to other users, leading to:
- **Data leakage** — User A's financial data could be served to User B
- **Stale data** — Cached responses may not reflect recent updates

**Fix:**
Add `Cache-Control` headers to all user-specific endpoints:

```typescript
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'private, no-store, must-revalidate',
  },
});
```

**Mitigation:**
- Create a response helper that applies secure cache headers by default
- Review CDN/proxy configuration to ensure it respects `Cache-Control` headers

---

### Finding 10: NEXT-HEADERS-001 — COEP set to `unsafe-none`

**Rule ID:** NEXT-HEADERS-001  
**Severity:** Low  
**Location:** `next.config.ts`, line 76

**Evidence:**
```typescript
'Cross-Origin-Embedder-Policy': 'unsafe-none',
```

**Impact:**
`Cross-Origin-Embedder-Policy: unsafe-none` weakens cross-origin isolation, which is required for certain browser APIs (SharedArrayBuffer, high-resolution timers). However, this appears to be intentional to support third-party SDKs (Smartlook, Google Analytics).

**Fix:**
This is a documented trade-off. Consider:
1. Documenting why `unsafe-none` is required (third-party SDK compatibility)
2. Evaluating whether all third-party scripts are necessary
3. If possible, removing unnecessary scripts to enable stricter COEP

**Mitigation:**
- Monitor third-party scripts for security updates
- Consider self-hosting analytics scripts to enable stricter policies

---

### Finding 11: Cron endpoints may be blocked by middleware

**Rule ID:** NEXT-AUTH-002 (Middleware Coverage)  
**Severity:** Low  
**Location:** `src/middleware.ts`, matcher configuration

**Evidence:**
The middleware matcher excludes many paths but does not explicitly exclude:
- `/api/goals/cron-update`
- `/api/cron/send-sequences`

These endpoints are called by Vercel Cron jobs via HTTP without session cookies. The middleware checks for authentication tokens and redirects unauthenticated requests to `/`.

**Impact:**
If Vercel Cron invokes these endpoints via HTTP requests (rather than direct function invocation), the middleware will redirect them, preventing cron jobs from executing.

**Fix:**
Verify how Vercel Cron invokes these endpoints:
1. If Vercel Cron uses direct function invocation (bypasses middleware), no fix needed
2. If Vercel Cron uses HTTP requests, add these paths to the middleware exclusion list:

```typescript
export const config = {
  matcher: [
    // ... existing matchers
    '/((?!api/goals/cron-update|api/cron/send-sequences|api/admin/quarantine/scan|...).*)',
  ],
};
```

Alternatively, add a special header check in middleware to allow cron requests:

```typescript
// In middleware.ts, before auth check
if (request.headers.get('x-vercel-cron') === '1') {
  return NextResponse.next();
}
```

**Mitigation:**
- Test cron endpoints in staging/production to verify they execute correctly
- Monitor cron job execution logs

---

### Finding 12: NEXT-AUTH-002 — Unsubscribe endpoint IDOR

**Rule ID:** NEXT-AUTH-002  
**Severity:** Low  
**Location:** `src/app/api/marketing/unsubscribe/route.ts`, lines 14-36

**Evidence:**
```typescript
const userId = searchParams.get('userId');
// ... later
await prisma.user.update({
  where: { id: userId },
  data: { marketingEmailsEnabled: false },
});
```

**Impact:**
Anyone who knows a user ID can unsubscribe that user from marketing emails. This is a common pattern for unsubscribe links (usability vs. security trade-off), but it represents an Insecure Direct Object Reference (IDOR).

**Fix:**
Add HMAC signature verification to unsubscribe links:

```typescript
import crypto from 'crypto';

// When generating unsubscribe link:
const signature = crypto
  .createHmac('sha256', process.env.UNSUBSCRIBE_SECRET!)
  .update(userId)
  .digest('hex');
const unsubscribeUrl = `${baseUrl}/api/marketing/unsubscribe?userId=${userId}&sig=${signature}`;

// In unsubscribe endpoint:
const signature = searchParams.get('sig');
const expectedSig = crypto
  .createHmac('sha256', process.env.UNSUBSCRIBE_SECRET!)
  .update(userId)
  .digest('hex');

if (signature !== expectedSig) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
}
```

**Mitigation:**
- Document this as an accepted risk if usability is prioritized
- Monitor unsubscribe rates for anomalies

---

## Strengths (No Action Required)

The following security practices are well-implemented and require no changes:

1. **Authentication** — JWT revocation checks, IDOR prevention helpers, shared account permissions, admin authorization
2. **CSRF Protection** — Double-submit cookie pattern with Origin validation in middleware
3. **Rate Limiting** — Upstash Redis implementation with multiple presets for different endpoint types
4. **Webhook Security** — Svix and Resend signature verification
5. **Configuration Management** — Centralized env validation in `config.ts`; no secrets exposed client-side
6. **CSP Nonces** — Middleware generates nonces (though `unsafe-inline` currently overrides them)
7. **Redirect Security** — All redirects validated; no open redirect vulnerabilities
8. **File Upload Security** — Path traversal checks, MIME type allowlist, size limits, magic-byte validation
9. **SQL Injection Prevention** — Prisma ORM only; no raw SQL queries found
10. **XSS Surface** — Minimal `dangerouslySetInnerHTML` usage, all with static/trusted data
11. **No Dynamic Code Execution** — No `eval()`, `new Function()`, or string-based `setTimeout`/`setInterval`
12. **No SSRF Risks** — All outbound `fetch()` calls use server-controlled URLs
13. **Next.js Version** — 16.1.1 (patched against react2shell CVE-2025-66478)
14. **Secrets Management** — `.env*` files in `.gitignore`; no `NEXT_PUBLIC_` secrets
15. **Audit Logging** — RATE_LIMITED, CSRF_VIOLATION, UNAUTHORIZED_ACCESS events logged

---

## Recommendations Priority

**Immediate (High Priority):**
1. Fix CSP `unsafe-eval` and `unsafe-inline` (Finding 1)
2. Replace `getServerSession` with `requireAuth()` in merchant-category route (Finding 2)

**Short-term (Medium Priority):**
3. Sanitize error messages returned to clients (Finding 3)
4. Add rate limiting to unprotected routes (Finding 4)
5. Add Zod validation to routes missing it (Finding 5)
6. Gate or remove debug logs containing PII/financial data (Finding 6)
7. Add `Secure` and `HttpOnly` flags to signup cookie (Finding 7)
8. Fix encryption decryption failure handling (Finding 8)

**Long-term (Low Priority):**
9. Add `Cache-Control` headers to sensitive endpoints (Finding 9)
10. Document COEP trade-off (Finding 10)
11. Verify cron endpoint middleware interaction (Finding 11)
12. Consider HMAC signatures for unsubscribe links (Finding 12)

---

## Conclusion

MyNeto demonstrates a strong security foundation with comprehensive authentication, CSRF protection, and secure coding practices. The 12 findings identified are primarily related to consistency (rate limiting, input validation) and defense-in-depth improvements (CSP, error handling). Addressing the high-severity findings should be prioritized, followed by the medium-severity items to further harden the application.

---

**Report Generated:** March 4, 2026  
**Next Review:** Recommended in 6 months or after major changes
