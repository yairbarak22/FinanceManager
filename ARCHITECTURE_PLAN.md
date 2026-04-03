# Architecture Plan: CFO Dashboard — Month Filter + P&L Report

**Date:** 2026-04-03
**Status:** Draft — ממתין לאישור לפני מימוש

---

## סיכום

שתי תוספות לדף `/admin/cfo`:

1. **פילטר חודש** — בחירת חודש ספציפי לצפייה בכרטיסי ה-KPI ובגרפים (טרנזקציות חד-פעמיות מסוננות לחודש; מנויים קבועים מוצגים תמיד כ"עלויות קבועות").
2. **דוח P&L** — תצוגה חדשה (tab) שמציגה רווח והפסד חודש-אחר-חודש בטבלה ובגרף trend, עם סיכום כולל של כל הזמן.

**אין שינויים ב-DB ואין API routes חדשים** — כל החישובים נעשים client-side מהנתונים הקיימים.

---

## 1. Architecture & State Management

### Component Hierarchy (לפני ואחרי)

**לפני:**
```
CfoBoard
├── CfoSummaryCards(data)        ← hardcoded "current month"
├── CfoAnalytics(subs, txns)     ← hardcoded "current month"
├── CfoToolbar(...)
├── CfoSubscriptionsTable(...)
└── CfoTransactionsTable(...)
```

**אחרי:**
```
CfoBoard
├── CfoViewToggle               ← NEW: "תצוגת חודש" | "דוח P&L"
│
│ [when view === 'month']
├── CfoMonthPicker              ← NEW: ← אפריל 2026 → + "כל הזמן"
├── CfoSummaryCards(data, selectedMonth)   ← UPDATED: month-aware
├── CfoAnalytics(subs, txns, selectedMonth) ← UPDATED: month-aware
├── CfoToolbar(...)
├── CfoSubscriptionsTable(...)
└── CfoTransactionsTable(txns filtered by month)
│
│ [when view === 'pnl']
└── CfoPnlReport(data)          ← NEW: P&L table + trend chart
```

### State Changes in `CfoBoard.tsx`

```typescript
// NEW state:
const [view, setView] = useState<'month' | 'pnl'>('month');
const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
// null = "כל הזמן", "YYYY-MM" = חודש ספציפי
```

### קבצים חדשים

| קובץ | תיאור |
|-------|-------|
| `src/components/admin/cfo/CfoViewToggle.tsx` | Toggle tabs: "תצוגת חודש" / "דוח P&L" |
| `src/components/admin/cfo/CfoMonthPicker.tsx` | ← [חודש שנה] → + כפתור "כל הזמן" |
| `src/components/admin/cfo/CfoPnlReport.tsx` | טבלת P&L חודשית + גרף trend |

### קבצים שמשתנים

| קובץ | שינוי |
|-------|-------|
| `CfoBoard.tsx` | הוספת `view`, `selectedMonth` state; העברתם לילדים |
| `CfoSummaryCards.tsx` | קבלת `selectedMonth` prop, חישוב KPIs לחודש |
| `CfoAnalytics.tsx` | קבלת `selectedMonth` prop, פילטור גרפים לחודש |
| `CfoTransactionsTable.tsx` | קבלת `selectedMonth`, הצגת "ב[חודש]" בכותרת |

### Data Flow

```
AdminTransaction[] (all, in memory in CfoBoard)
         │
         ├─ [view=month, selectedMonth=null]  → show all
         ├─ [view=month, selectedMonth=YYYY-MM] → filter by month
         └─ [view=pnl]  → group by month → P&L table
```

**הערה קריטית על מנויים:**
`AdminSubscription` אין לו `startDate` — רק `nextBillingDate` ו-`status`. לכן:
- **בפילטר חודש**: מנויים תמיד מוצגים כ"עלויות/הכנסות קבועות" בלי קשר לחודש שנבחר (אין לנו היסטוריה)
- **בדוח P&L**: P&L מבוסס **אך ורק על `AdminTransaction`** (יש תאריך מדויק). מנויים מוצגים בסטריפ נפרד כ"burn rate חודשי נוכחי"

---

## 2. Database (Prisma) & Performance

**אין שינויים ב-schema.**

### Query Analysis

`getCfoData()` כבר טוענת **את כל** ה-transactions ו-subscriptions פעם אחת עם SSR. כל הפילטור קורה client-side ב-`useMemo` — ללא query נוסף לשרת.

**Bottleneck?** `AdminTransaction` — כמה רשומות צפוי שיהיו? כ-10-50 חודשים × עשרות transactions לחודש = מאות רשומות. זה טריוויאלי לפילטור בזיכרון, **אין צורך ב-pagination**.

### P&L Aggregation (client-side)

```typescript
// group transactions by YYYY-MM
const byMonth = Map<string, { income: number; expense: number; net: number }>

transactions.forEach(t => {
  const key = t.date.toISOString().slice(0, 7); // "2026-03"
  const entry = byMonth.get(key) ?? { income: 0, expense: 0, net: 0 };
  if (t.type === 'INCOME' && t.status === 'COMPLETED') entry.income += t.amount;
  if (t.type === 'EXPENSE') entry.expense += t.amount;
  entry.net = entry.income - entry.expense;
  byMonth.set(key, entry);
});
```

O(n) — מושלם.

---

## 3. Security (Fail-Closed Standard)

- **אין API routes חדשים** → אין attack surface חדש
- כל הנתונים כבר עוברים דרך `requireAdmin()` ב-`getCfoData()` ו-Server Action
- חישוב P&L הוא pure client-side מ-props — אין DB calls נוספים
- **אין קלט משתמש שנשלח לשרת** — `selectedMonth` הוא state local בלבד
- **XSS**: אין rendering של HTML מ-user input
- **CSRF**: לא רלוונטי — לא מוסיפים write operations

---

## 4. UI/UX (The "Monday.com" Standard)

### View Toggle (tabs)

```
┌────────────────────────────────────────────┐
│  [📅 תצוגת חודש]  [📊 דוח רווח והפסד]    │
└────────────────────────────────────────────┘
```
Pill-style toggle, active tab מודגש בסגול.

### Month Picker

```
┌──────────────────────────────────────────────────────────┐
│  [כל הזמן]  ←  אפריל 2026  →                            │
└──────────────────────────────────────────────────────────┘
```
- כפתור "כל הזמן" מימין — מאפס ל-`selectedMonth = null`
- חצים ← → מנווטים חודש קדימה/אחורה
- כפתור [חודש שנה] באמצע — ניתן ללחיצה לפתוח dropdown חודשים (optionally)
- לא ניתן לנווט אחרי החודש הנוכחי

### KPI Cards (month mode)

כשנבחר חודש ספציפי:
- **"מאזן כולל"** → "מאזן [חודש]" = הכנסות − הוצאות של החודש
- **"קצב שריפה חודשי"** → נשאר — זה תמיד ה-burn rate הנוכחי
- **"מנויים פעילים"** → נשאר
- **"הכנסות מחזוריות"** → נשאר
- **"הכנסות חד-פעמיות"** → מציג "בחודש שנבחר" במקום "החודש"

כש-`selectedMonth = null` — הכל כמו היום.

### P&L Report View

```
┌──────────────────────────────────────────────────────────┐
│ 📊 דוח רווח והפסד                                        │
│                                                          │
│ ┌────────┬──────────┬──────────┬──────────┐             │
│ │ סה"כ   │ הכנסות   │ הוצאות   │  רווח   │             │
│ │        │ ₪45,200  │ ₪32,100  │ ₪13,100 │             │
│ └────────┴──────────┴──────────┴──────────┘             │
│                                                          │
│ [גרף קו — net P&L per month, 12 חודשים אחרונים]        │
│                                                          │
│ חודש    │ הכנסות  │ הוצאות  │ רווח/הפסד │ מגמה        │
│ ─────────┼─────────┼─────────┼───────────┼─────────    │
│ אפריל 26│ ₪4,200  │ ₪2,100  │ +₪2,100  │ ↑           │
│ מרץ 26  │ ₪3,800  │ ₪2,800  │ +₪1,000  │ ↑           │
│ פבר 26  │ ₪2,100  │ ₪3,200  │ -₪1,100  │ ↓ (אדום)   │
│ ...      │         │         │           │              │
└──────────────────────────────────────────────────────────┘
```

**Sparkline בכל שורה** — מחושב כ-running total.

**Trend chart** — `LineChart` עם `recharts`:
- X axis: חודשים (מסודרים chronologically)
- 3 lines: הכנסות (ירוק), הוצאות (אדום), נטו (סגול)
- Tooltip מפורט

### Loading & Error States

| מצב | Behavior |
|-----|----------|
| שינוי חודש | **מיידי** — חישוב local, אין loading |
| P&L view | **מיידי** — חישוב local |
| אין נתונים לחודש | "אין תנועות בחודש זה" placeholder |
| אין נתונים בכלל | Empty state בדוח P&L |

### RTL Compliance

כל ה-CSS חייב להשתמש ב-logical properties בלבד:
- `ps-`, `pe-` (לא `pl-`, `pr-`)
- `ms-`, `me-` (לא `ml-`, `mr-`)
- `start-0`, `end-0`
- `text-start`, `text-end`

---

## 5. Pre-Implementation Code Review

### Edge Cases

| Edge Case | טיפול |
|-----------|-------|
| **חודש ריק** | P&L row מוצג עם 0s; month filter מראה "אין תנועות" |
| **מטבע מעורב** | הנתונים כבר מכילים `currency` field — לפשטות, מחשבים הכל ב-ILS (כמו שה-code הנוכחי עושה). נוסיף הערה ב-UI: "כל הסכומים ב-ILS" |
| **תאריך ב-UTC vs Israel time** | `AdminTransaction.date` מאוחסן ב-UTC. פילטור לפי חודש: `date.toISOString().slice(0,7)` — יתן "YYYY-MM" ב-UTC. לעקביות, שמור כך. אם transaction נרשם ב-31/3 23:30 ישראל → 1/4 00:30 UTC → יופיע באפריל, לא במרץ. זה acceptable ל-admin internal tool. |
| **חודש עתידי** | Month picker מונע ניווט אחרי החודש הנוכחי |
| **שנה חדשה** | חישוב month group ע"י `YYYY-MM` string — עובד נכון across years |
| **P&L חיובי/שלילי** | ערכים שליליים מוצגים באדום עם prefix `-`, חיוביים בירוק עם `+` |

### סדר ביצוע מומלץ

1. **`CfoViewToggle.tsx`** — tabs פשוטים, state ב-CfoBoard
2. **`CfoMonthPicker.tsx`** — prev/next + "כל הזמן"
3. **`CfoBoard.tsx`** — הוספת state, העברה לילדים
4. **`CfoSummaryCards.tsx`** — month-aware props
5. **`CfoAnalytics.tsx`** — month-aware props
6. **`CfoTransactionsTable.tsx`** — כותרת עם חודש נבחר
7. **`CfoPnlReport.tsx`** — הרכיב הגדול: טבלה + גרף

---

## סיכום שינויים

| Category | Count |
|----------|-------|
| קבצים חדשים | 3 |
| קבצים שנערכים | 4 |
| API routes חדשים | 0 |
| DB schema changes | 0 |
| ספריות חדשות | 0 (recharts כבר בפרויקט) |
