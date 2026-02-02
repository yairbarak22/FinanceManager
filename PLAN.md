# תכנית שדרוג MyNeto לסקייל של 10,000 משתמשים

> **תאריך:** 2026-02-02
> **ענף:** `codereview`
> **מצב נוכחי:** 200 משתמשים
> **יעד:** 10,000 משתמשים

---

## 📊 סיכום ממצאי Code Review

| קטגוריה | קריטי | גבוה | בינוני | נמוך | סה"כ |
|---------|-------|------|--------|------|------|
| אבטחה | 0 | 2 | 9 | 4 | 15 |
| ביצועים/DB | 4 | 3 | 3 | 0 | 10 |
| סקיילביליות | 3 | 4 | 5 | 1 | 13 |
| קוד כפול | - | 2 | 4 | 3 | 9 |

---

## פאזה 1: תשתית קריטית (P0)

### 1.1 מעבר ל-gpt-4o-mini
**עדיפות:** 🔴 קריטי
**השפעה:** חיסכון של ~$95K/חודש ב-10K משתמשים
**קבצים:**
- [ ] `src/app/api/transactions/import/route.ts:853-861`
- [ ] `src/lib/ai/columnMapper.ts` (אם קיים)

**משימות:**
```
- [ ] החלפת gpt-4-turbo ב-gpt-4o-mini
- [ ] הוספת fallback לסיווג היוריסטי אם AI נכשל
- [ ] הוספת retry עם exponential backoff (1s, 2s, 4s)
- [ ] טסטים לוודא שהדיוק נשמר
```

---

### 1.2 תיקון N+1 Queries קריטיים
**עדיפות:** 🔴 קריטי
**השפעה:** הפחתת 60K+ queries רצפיות

#### 1.2.1 Net Worth Backfill Loop
**קובץ:** `src/lib/netWorthHistory.ts:199-228`
```typescript
// בעיה: לולאת for עם await בודד לכל חודש
for (const monthKey of monthsToBackfill) {
  await prisma.netWorthHistory.upsert({...}) // ❌ N queries
}

// פתרון: batch upsert
await prisma.$transaction(
  monthsToBackfill.map(monthKey =>
    prisma.netWorthHistory.upsert({...})
  )
)
```
- [ ] המרה ל-batch transaction
- [ ] טסט ביצועים

#### 1.2.2 Merchant Mapping Loop
**קובץ:** `src/app/api/transactions/import/confirm/route.ts:89-105`
```typescript
// בעיה: לולאה עם upsert בודד
for (const [name, mapping] of manualMappings) {
  await prisma.merchantCategoryMap.upsert({...}) // ❌
}

// פתרון: createMany או transaction
await prisma.$transaction([...upserts])
```
- [ ] המרה ל-batch
- [ ] הגבלת מספר mappings ליצירה (מניעת DoS)

---

### 1.3 הוספת Indexes חסרים
**עדיפות:** 🔴 קריטי
**קובץ:** `prisma/schema.prisma`

```prisma
// להוסיף:
model SharedAccountMember {
  @@index([sharedAccountId, userId])  // composite index - קריטי!
}

model Transaction {
  @@index([userId, category, date])   // לסיכומי קטגוריות
}

model Asset {
  @@index([userId, liquidity])        // לסינון סוג נכס
}

model Holding {
  @@index([symbol])                   // ל-market data lookups
}
```

**משימות:**
- [ ] הוספת indexes ל-schema.prisma
- [ ] הרצת `npx prisma db push`
- [ ] בדיקת query plans לפני/אחרי

---

### 1.4 הוספת Redis Caching
**עדיפות:** 🔴 קריטי
**השפעה:** הפחתת 80%+ מ-DB queries

**קבצים חדשים:**
- [ ] `src/lib/cache.ts` - wrapper לקריאות cache

**דפוסי caching להוסיף:**
```typescript
// 1. Auth caching (TTL: 1 hour)
// קובץ: src/lib/authHelpers.ts:35-49
const cachedUser = await cache.get(`auth:${session.user.id}`);
if (!cachedUser) {
  const user = await prisma.user.findUnique({...});
  await cache.set(`auth:${userId}`, user, 3600);
}

// 2. Transaction list caching (TTL: 60 seconds)
// קובץ: src/app/api/transactions/route.ts
const cacheKey = `transactions:${userId}:${month}`;

// 3. Market data caching (TTL: 5 minutes for US, 24h for TASE)
// קובץ: src/lib/finance/providers/eod.ts
```

**משימות:**
- [ ] יצירת `src/lib/cache.ts` עם Upstash Redis
- [ ] הוספת caching ל-auth validation
- [ ] הוספת caching לרשימת עסקאות
- [ ] העברת market data cache מ-memory ל-Redis
- [ ] invalidation logic בעת POST/DELETE

---

## פאזה 2: שיפורי ביצועים (P1)

### 2.1 העברת ייבוא Excel לתור רקע
**עדיפות:** 🟠 גבוה
**קובץ:** `src/app/api/transactions/import/route.ts`

**מצב נוכחי:**
```
POST /api/import → validateFile → XLSX.read → AI calls → DB write → Response
(עד 30 שניות blocking!)
```

**מצב רצוי:**
```
POST /api/import → validateFile → Queue job → Return { jobId, status: 'processing' }
Background: Process file → AI calls → DB write → Update status
GET /api/import/status/:jobId → Return progress
```

**משימות:**
- [ ] יצירת טבלת ImportJob ב-schema
- [ ] יצירת endpoint `POST /api/import/queue`
- [ ] יצירת endpoint `GET /api/import/status/[jobId]`
- [ ] יישום background processing (Vercel Functions / Bull)
- [ ] עדכון frontend לתמיכה ב-polling

---

### 2.2 Batch EOD API Calls
**עדיפות:** 🟠 גבוה
**קובץ:** `src/lib/finance/marketService.ts:165-176`

**בעיה:**
```typescript
for (const holding of holdings) {
  await enrichHolding(holding, exchangeRate); // Sequential!
  await delay(150); // 100 holdings = 15 seconds!
}
```

**פתרון:**
```typescript
// Batch fetch - max 50 symbols per request
const batches = chunk(holdings, 50);
const results = await Promise.all(
  batches.map(batch => eodProvider.getBatchQuotes(batch.map(h => h.symbol)))
);
```

**משימות:**
- [ ] יישום `getBatchQuotes` ב-EOD provider
- [ ] הפחתת delay או ביטולו
- [ ] הוספת concurrency limit (max 5 concurrent batches)

---

### 2.3 אופטימיזציה של Aggregations
**עדיפות:** 🟡 בינוני

#### 2.3.1 Asset Totals
**קובץ:** `src/lib/netWorthHistory.ts:24-46`
```typescript
// בעיה: JS reduce
const allAssets = await prisma.asset.findMany({...});
return allAssets.reduce((sum, asset) => sum + asset.value, 0);

// פתרון: DB aggregation
const result = await prisma.asset.aggregate({
  where: { userId: { in: userIds } },
  _sum: { value: true }
});
return result._sum.value || 0;
```

#### 2.3.2 Net Worth History Dedup
**קובץ:** `src/app/api/networth/history/route.ts:49-60`
```typescript
// בעיה: מביא הכל ועושה dedup ב-JS
// פתרון: distinct בשאילתה
const history = await prisma.netWorthHistory.findMany({
  where: { userId: { in: userIds } },
  distinct: ['date'],
  orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
});
```

**משימות:**
- [ ] החלפת reduce ב-Prisma aggregate
- [ ] הוספת distinct לשאילתות history
- [ ] החלפת חישובי liabilities ב-DB aggregation

---

### 2.4 הוספת Pagination Enforcement
**עדיפות:** 🟡 בינוני
**קובץ:** `src/app/api/transactions/route.ts:71-74`

```typescript
// בעיה: backwards compatible mode מביא הכל
// פתרון: הכרח pagination
const limit = Math.min(parseInt(limitParam || '50'), 100);
const page = parseInt(pageParam || '1');
```

**משימות:**
- [ ] הגבלת limit ל-100 מקסימום
- [ ] החזרת שגיאה אם אין pagination params
- [ ] עדכון frontend להשתמש ב-pagination

---

## פאזה 3: אבטחה (P1)

### 3.1 תיקוני אבטחה ברמה גבוהה

#### 3.1.1 Race Condition בקטגוריות
**קובץ:** `src/app/api/categories/route.ts:102-108`
```typescript
// בעיה: check-then-create לא atomic
const existing = await prisma.customCategory.findFirst({...});
if (existing) return error;
await prisma.customCategory.create({...});

// פתרון: unique constraint + try/catch
try {
  await prisma.customCategory.create({...});
} catch (e) {
  if (e.code === 'P2002') return error; // Unique violation
  throw e;
}
```
- [ ] הוספת @@unique([userId, name]) ל-schema
- [ ] עדכון הלוגיקה ל-try/catch

#### 3.1.2 Shared Account Validation
**קובץ:** `src/app/api/account/members/route.ts:81-86`
- [ ] וידוא memberToRemove.sharedAccountId === sharedAccountId
- [ ] החלפת 404 ב-403 למניעת enumeration

#### 3.1.3 Date Validation
**קבצים:**
- `src/app/api/transactions/route.ts:121-123`
- `src/app/api/liabilities/[id]/route.ts:97-99`

```typescript
// בעיה: new Date("invalid") לא זורק שגיאה
// פתרון:
function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}
```
- [ ] יצירת פונקציית validation לתאריכים
- [ ] שימוש בכל ה-routes

---

### 3.2 Rate Limiting לנקודות Admin
**קבצים:**
- `src/app/api/admin/stats/route.ts`
- `src/app/api/admin/users/route.ts`

- [ ] הוספת rate limit נפרד ל-admin endpoints
- [ ] logging של כל פעולת admin

---

### 3.3 הגבלת Merchant Mappings
**קובץ:** `src/app/api/transactions/import/confirm/route.ts:88-105`
- [ ] הגבלת מספר mappings ל-1000 per user
- [ ] בדיקת count לפני יצירה

---

## פאזה 4: Refactoring קוד כפול (P2)

### 4.1 יצירת API Handlers גנריים
**קובץ חדש:** `src/lib/api/handlers.ts`

```typescript
export function createGetListHandler<T>(
  modelName: string,
  getPrismaQuery: (sharedWhere: any) => Promise<T[]>
) {
  return async function GET() {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const rateLimitResult = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'יותר מדי בקשות' }, { status: 429 });
    }

    try {
      const sharedWhere = await withSharedAccount(userId);
      const data = await getPrismaQuery(sharedWhere);
      return NextResponse.json(data);
    } catch (error) {
      console.error(`Error fetching ${modelName}:`, error);
      return NextResponse.json({ error: `Failed to fetch ${modelName}` }, { status: 500 });
    }
  };
}
```

**Routes להחלפה:**
- [ ] `src/app/api/assets/route.ts`
- [ ] `src/app/api/liabilities/route.ts`
- [ ] `src/app/api/holdings/route.ts`
- [ ] `src/app/api/recurring/route.ts`
- [ ] `src/app/api/transactions/route.ts`

---

### 4.2 יצירת Validation Utilities
**קובץ חדש:** `src/lib/validation.ts`

```typescript
export const validators = {
  string: (value: unknown, field: string, opts?: { required?: boolean; max?: number }) => {...},
  number: (value: unknown, field: string, opts?: { min?: number; max?: number }) => {...},
  enum: <T extends string[]>(value: unknown, field: string, allowed: T) => {...},
  date: (value: unknown, field: string) => {...},
};

export function validate(body: unknown, schema: ValidationSchema): ValidationResult {
  // ...
}
```

**Routes להחלפה:**
- [ ] כל ה-POST routes עם validation כפול

---

### 4.3 Custom Hook למודלים
**קובץ חדש:** `src/hooks/useModalAutoScroll.ts`

```typescript
export function useModalAutoScroll(fieldOrder: string[]) {
  const fieldRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const modalBodyRef = useRef<HTMLDivElement>(null);

  const scrollToNextField = useCallback((currentField: string) => {
    // ...shared logic
  }, [fieldOrder]);

  return { fieldRefs, modalBodyRef, scrollToNextField };
}
```

**Components להחלפה:**
- [ ] `src/components/modals/AssetModal.tsx`
- [ ] `src/components/modals/LiabilityModal.tsx`

---

### 4.4 Generic API Client
**קובץ:** `src/lib/api/client.ts`

```typescript
export async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { ...options?.headers, 'x-csrf-token': getCSRFToken() },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(response.status, error.message || 'Unknown error');
  }

  return response.json();
}
```

**Files להחלפה:**
- [ ] `src/lib/api/assets.ts`
- [ ] `src/lib/api/liabilities.ts`
- [ ] `src/lib/api/transactions.ts`
- [ ] `src/lib/api/recurring.ts`

---

## 📈 מעקב התקדמות

### פאזה 1 - תשתית קריטית
- [ ] 1.1 מעבר ל-gpt-4o-mini
- [ ] 1.2 תיקון N+1 Queries
- [ ] 1.3 הוספת Indexes
- [ ] 1.4 הוספת Redis Caching

### פאזה 2 - שיפורי ביצועים
- [ ] 2.1 העברת ייבוא לתור רקע
- [ ] 2.2 Batch EOD API Calls
- [ ] 2.3 אופטימיזציה של Aggregations
- [ ] 2.4 הוספת Pagination Enforcement

### פאזה 3 - אבטחה
- [ ] 3.1 תיקוני אבטחה גבוהים
- [ ] 3.2 Rate Limiting ל-Admin
- [ ] 3.3 הגבלת Merchant Mappings

### פאזה 4 - Refactoring
- [ ] 4.1 API Handlers גנריים
- [ ] 4.2 Validation Utilities
- [ ] 4.3 Custom Hook למודלים
- [ ] 4.4 Generic API Client

---

## 📊 מדדי הצלחה

| מדד | מצב נוכחי | יעד |
|-----|----------|-----|
| עלות AI לייבוא | ~$0.01/import | ~$0.0005/import |
| זמן תגובה לdashboard | 2-5 שניות | <500ms |
| זמן ייבוא Excel | עד 30 שניות (blocking) | <2 שניות (async) |
| DB queries לבקשה | 5-15 | 1-3 (עם cache) |
| זמן ניתוח תיק | 15+ שניות | <3 שניות |

---

## 🔗 קבצים מרכזיים לשינוי

```
prisma/schema.prisma                           # Indexes
src/lib/cache.ts                               # NEW - Redis wrapper
src/lib/validation.ts                          # NEW - Shared validators
src/lib/api/handlers.ts                        # NEW - Generic handlers
src/lib/api/client.ts                          # NEW - Fetch wrapper
src/lib/netWorthHistory.ts                     # N+1 fixes, aggregations
src/lib/finance/marketService.ts               # Batch EOD calls
src/lib/finance/providers/eod.ts               # Redis cache
src/app/api/transactions/import/route.ts       # AI model, queue
src/app/api/transactions/import/confirm/route.ts # Batch upserts
src/app/api/transactions/route.ts              # Pagination, caching
src/app/api/categories/route.ts                # Race condition fix
src/lib/authHelpers.ts                         # Auth caching
```
