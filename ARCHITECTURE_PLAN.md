# Architecture Plan: קביעת פגישות ליווי לפתיחת תיק מסחר

**Date:** 2026-04-03
**Branch:** `calendar`
**Status:** Draft — ממתין לאישור לפני מימוש

---

## סיכום

פיצ'ר חדש שמאפשר ללקוחות לקבוע שיחת ליווי טלפונית (10 דקות) לפתיחת תיק מסחר.
שני צדדים:
1. **עמוד ציבורי** (`/book`) — בחירת יום/שעה, הזנת טלפון + מייל, קביעת פגישה. counter של פגישות שנותרו מתוך 50.
2. **עמוד ניהול** (`/admin/appointments`) — סטטיסטיקות, הגדרת זמינות (חלונות זמן פתוחים).

העמוד הציבורי עצמאי לחלוטין (אין צורך ב-auth), הפנייה אליו דרך מייל ייעודי.

---

## 1. Architecture & State Management

### מבנה קבצים

#### קבצים חדשים

| קובץ | תיאור |
|-------|-------|
| `prisma/schema.prisma` | הוספת מודלים `Appointment` ו-`AppointmentSlot` |
| **עמוד ציבורי** | |
| `src/app/book/page.tsx` | Server component — SSR עם counter ראשוני |
| `src/app/book/layout.tsx` | Layout עם metadata + noindex |
| `src/app/book/BookingClient.tsx` | Client component — הטופס המלא |
| `src/app/book/BookingSuccess.tsx` | Client component — מסך אישור אחרי קביעה |
| **API routes** | |
| `src/app/api/book/slots/route.ts` | `GET` — מחזיר slots פתוחים (ציבורי) |
| `src/app/api/book/reserve/route.ts` | `POST` — שריין פגישה (ציבורי, rate-limited) |
| `src/app/api/admin/appointments/route.ts` | `GET` — סטטיסטיקות (admin only) |
| `src/app/api/admin/appointments/slots/route.ts` | `GET/POST/DELETE` — ניהול slots (admin only) |
| **עמוד ניהול** | |
| `src/app/admin/appointments/page.tsx` | דף ניהול ראשי — סטטיסטיקות + ניהול זמנים |
| `src/app/admin/appointments/AppointmentsAdmin.tsx` | Client component — כל הממשק |
| **Shared** | |
| `src/lib/appointments.ts` | Shared types, validation schemas, helpers |

#### קבצים קיימים שצריך לשנות

| קובץ | שינוי |
|-------|-------|
| `prisma/schema.prisma` | הוספת 2 מודלים חדשים |
| `src/middleware.ts` | הוספת `/book` ו-`/api/book/*` לרשימת routes ציבוריים |
| `src/components/admin/AdminSidebar.tsx` | הוספת לינק "קביעת פגישות" בסיידבר |

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│  עמוד ציבורי /book                                      │
│                                                         │
│  1. SSR: fetch counter (פגישות שנותרו מתוך 50)          │
│  2. Client: בחירת יום → fetch slots פתוחים ליום         │
│  3. Client: בחירת שעה → הזנת טלפון + מייל              │
│  4. Client: POST /api/book/reserve → אישור              │
│                                                         │
│  State (local useState, אין צורך ב-Zustand):            │
│  - selectedDate: Date | null                             │
│  - selectedSlot: string | null                           │
│  - formData: { phone, email, name }                      │
│  - step: 'date' | 'time' | 'details' | 'success'        │
│  - remainingSlots: number (SSR initial + client update)  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  עמוד ניהול /admin/appointments                         │
│                                                         │
│  1. Fetch סטטיסטיקות (total booked, remaining, today)   │
│  2. Fetch כל ה-slots שהוגדרו                            │
│  3. הוספה/מחיקה של slots                                │
│  4. צפייה ברשימת פגישות שנקבעו                          │
│                                                         │
│  State (local useState):                                 │
│  - slots: AppointmentSlot[]                              │
│  - appointments: Appointment[]                           │
│  - stats: { total, booked, remaining, todayCount }       │
└─────────────────────────────────────────────────────────┘
```

### Component Hierarchy

**עמוד ציבורי:**
```
book/page.tsx (Server)
└── BookingClient.tsx (Client)
    ├── Counter badge (פגישות שנותרו)
    ├── DatePicker (לוח שנה עברי + לועזי)
    │   └── DayCell (תא יום עם availability indicator)
    ├── TimeSlotGrid (רשת שעות פנויות)
    │   └── TimeSlotButton (כפתור שעה)
    ├── BookingForm (פרטי יצירת קשר)
    │   ├── PhoneInput
    │   ├── EmailInput
    │   └── NameInput
    └── BookingSuccess.tsx (מסך אישור)
```

**עמוד ניהול:**
```
admin/appointments/page.tsx (Server)
└── AppointmentsAdmin.tsx (Client)
    ├── StatsCards (סטטיסטיקות)
    ├── SlotManager (הגדרת זמנים פתוחים)
    │   ├── DatePicker (בחירת יום)
    │   ├── TimeRangeInput (טווח שעות)
    │   └── SlotList (רשימת slots קיימים)
    └── AppointmentsList (פגישות שנקבעו)
        └── AppointmentCard (פרטי פגישה)
```

---

## 2. Database (Prisma) & Performance

### Schema Changes

```prisma
model AppointmentSlot {
  id        String   @id @default(cuid())
  date      DateTime // UTC date of the slot
  startTime String   // "09:00" format (Israel time)
  endTime   String   // "09:10" format (Israel time)
  isBooked  Boolean  @default(false)
  createdAt DateTime @default(now())

  appointment Appointment?

  @@index([date, isBooked])
  @@index([date])
}

model Appointment {
  id        String   @id @default(cuid())
  slotId    String   @unique
  slot      AppointmentSlot @relation(fields: [slotId], references: [id], onDelete: Cascade)

  name      String
  email     String
  phone     String
  notes     String?

  status    AppointmentStatus @default(CONFIRMED)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@index([status])
  @@index([createdAt])
}

enum AppointmentStatus {
  CONFIRMED
  CANCELLED
  COMPLETED
}
```

### Query Optimization

| שאילתה | אסטרטגיה |
|---------|----------|
| Counter (פגישות שנותרו) | `count` query עם `where: { isBooked: false }` — O(1), index on `isBooked` |
| Slots ליום מסוים | `findMany` עם `where: { date, isBooked: false }` — composite index |
| Reserve slot | Transaction: `update` slot to booked + `create` appointment — atomic |
| סטטיסטיקות admin | Single `groupBy` query on `Appointment.status` + `count` |
| רשימת פגישות admin | `findMany` with `include: { slot }`, paginated (take: 20) |

### Race Condition Prevention
שריון פגישה ישתמש ב-Prisma transaction עם `update` ש-WHERE כולל `isBooked: false`:

```typescript
const result = await prisma.$transaction(async (tx) => {
  const slot = await tx.appointmentSlot.update({
    where: { id: slotId, isBooked: false },
    data: { isBooked: true },
  });
  const appointment = await tx.appointment.create({
    data: { slotId: slot.id, name, email, phone },
  });
  return appointment;
});
```

אם שני אנשים ינסו לתפוס אותו slot באותו רגע — אחד יקבל שגיאה (record not found) ונטפל ב-UI.

### Performance Notes
- **אין N+1** — כל ה-queries מוגדרות מראש עם `include`
- **אין pagination בצד הציבורי** — מקסימום ~50 slots בכל query
- **Admin pagination** — `take: 20, skip: offset` לרשימת פגישות

---

## 3. Security (Fail-Closed Standard)

### Authentication & Authorization

| Route | Auth | Rate Limit |
|-------|------|------------|
| `GET /api/book/slots` | ציבורי (ללא auth) | 30 req/min per IP |
| `POST /api/book/reserve` | ציבורי (ללא auth) | 5 req/min per IP |
| `GET /api/admin/appointments` | `requireAdmin()` | Standard |
| `GET/POST/DELETE /api/admin/appointments/slots` | `requireAdmin()` | Standard |
| `/book` (page) | ציבורי | — |
| `/admin/appointments` (page) | Admin (middleware) | — |

### Validation (Zod Schemas)

```typescript
// Reserve appointment
const reserveSchema = z.object({
  slotId: z.string().cuid(),
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().max(255).toLowerCase().trim(),
  phone: z.string().regex(/^0[2-9]\d{7,8}$/, 'מספר טלפון ישראלי לא תקין'),
});

// Create slot (admin)
const createSlotSchema = z.object({
  date: z.string().datetime(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

// Delete slot (admin)
const deleteSlotSchema = z.object({
  slotId: z.string().cuid(),
});
```

### Vulnerability Checklist

- **CSRF:** API routes ציבוריות (`/api/book/*`) — לא דורשות CSRF token כי אין session, אבל rate-limited בחוזקה. Admin routes מוגנים ע"י middleware CSRF.
- **IDOR:** Slot IDs הם CUIDs (לא ניתנים לניחוש). Reserve עובד רק על slots עם `isBooked: false`.
- **XSS:** כל הקלט מנוקה דרך Zod. אין rendering של HTML מ-user input.
- **Email/Phone exposure:** ה-API הציבורי לא מחזיר מידע על פגישות שנקבעו — רק slots פנויים.
- **Brute force:** Rate limiting חזק ב-reserve (5/min) מונע spam bookings.
- **50 slots limit:** Enforced at DB level — `POST reserve` checks total count before allowing.

### Middleware Updates

הוספה ל-public routes:
```typescript
// בתוך middleware.ts — רשימת routes ציבוריים
'/book',
'/api/book/slots',
'/api/book/reserve',
```

---

## 4. UI/UX (The "Monday.com" Standard)

### עמוד ציבורי — `/book`

#### Layout
עמוד עצמאי, **לא** בתוך ה-app shell. עיצוב נקי ופשוט — לוגו למעלה, תוכן במרכז.

```
┌────────────────────────────────────────────────────┐
│  🔶 MyNeto                                         │
│                                                    │
│  ╭──────────────────────────────────────────────╮  │
│  │  📞 שיחת ליווי אישית לפתיחת תיק מסחר       │  │
│  │                                              │  │
│  │  10 דקות · ללא עלות · ליווי מלא             │  │
│  │                                              │  │
│  │  ┌──────────────────────────────────────┐    │  │
│  │  │  ⚡ נותרו 34 מתוך 50 מקומות         │    │  │
│  │  │  ████████████████░░░░░░░░  68%       │    │  │
│  │  └──────────────────────────────────────┘    │  │
│  │                                              │  │
│  │  ← אפריל 2026 →                             │  │
│  │  ┌──┬──┬──┬──┬──┬──┬──┐                     │  │
│  │  │א │ב │ג │ד │ה │ו │ש │                     │  │
│  │  ├──┼──┼──┼──┼──┼──┼──┤                     │  │
│  │  │  │  │  │ 1│ 2│ 3│ 4│  ← ימים עם slots   │  │
│  │  │ 5│●6│●7│ 8│ 9│10│11│     מודגשים בנקודה  │  │
│  │  │12│13│●14│15│..│..│..│                     │  │
│  │  └──┴──┴──┴──┴──┴──┴──┘                     │  │
│  │  ו׳ ניסן תשפ״ו · 3 באפריל 2026             │  │
│  │                                              │  │
│  │  שעות פנויות:                                │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐           │  │
│  │  │ 09:00  │ │ 09:30  │ │ 10:00  │           │  │
│  │  └────────┘ └────────┘ └────────┘           │  │
│  │  ┌────────┐ ┌────────┐                      │  │
│  │  │ 14:00  │ │ 14:30  │                      │  │
│  │  └────────┘ └────────┘                      │  │
│  │                                              │  │
│  │  ── פרטים ──                                 │  │
│  │  שם מלא:    [_____________________]         │  │
│  │  טלפון:     [_____________________]         │  │
│  │  מייל:      [_____________________]         │  │
│  │                                              │  │
│  │  ┌──────────────────────────────────────┐    │  │
│  │  │       קביעת שיחת ליווי  →            │    │  │
│  │  └──────────────────────────────────────┘    │  │
│  ╰──────────────────────────────────────────────╯  │
│                                                    │
│  © MyNeto 2026                                     │
└────────────────────────────────────────────────────┘
```

#### UX Flow (Single Page, Step-based)

1. **שלב 1 — בחירת יום:** לוח שנה חודשי. ימים עם slots פנויים מודגשים. תאריך עברי מוצג מתחת.
2. **שלב 2 — בחירת שעה:** Grid של כפתורי שעות פנויות (animate in). הכפתור הנבחר מודגש.
3. **שלב 3 — פרטים:** טופס קצר (שם, טלפון, מייל). כפתור "קביעת שיחת ליווי".
4. **שלב 4 — אישור:** מסך הצלחה עם פרטי הפגישה, אנימציית confetti/check, כפתור "הוספה ליומן".

כל השלבים **באותו דף** — scroll smooth או transition בין שלבים. אין מעבר דף.

#### Counter — "נותרו X מקומות"

- **תמיד מוצג** בראש העמוד
- Progress bar ויזואלי (ירוק → כתום → אדום ככל שנגמרים)
- כשנותרו < 10: הודעת "כמעט אזלו!" עם pulse animation
- כשנותרו 0: העמוד כולו עובר למצב "כל המקומות תפוסים" עם אפשרות להשאיר מייל לעדכון

#### תאריך עברי
- שימוש ב-`Intl.DateTimeFormat` עם `calendar: 'hebrew'` (built-in, no library needed)
- תצוגה: "ו׳ ניסן תשפ״ו" מתחת לתאריך הלועזי

#### Responsive Design
- **Mobile-first:** הכל בעמודה אחת, כפתורי שעות full-width
- **Desktop:** max-width 640px, מרכוז

### עמוד ניהול — `/admin/appointments`

```
┌─────────────────────────────────────────────────────────┐
│  Admin Sidebar │  קביעת פגישות                          │
│                │                                        │
│  ...           │  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│                │  │ 50      │ │ 16      │ │ 34      │  │
│                │  │ סה"כ    │ │ נקבעו   │ │ נותרו   │  │
│                │  └─────────┘ └─────────┘ └─────────┘  │
│                │                                        │
│                │  ── הגדרת זמנים ──                     │
│                │  תאריך: [____] משעה: [__] עד: [__]     │
│                │  כל [10] דקות   [+ הוסף slots]        │
│                │                                        │
│                │  Slots קיימים:                         │
│                │  ┌────────────────────────────────┐    │
│                │  │ 6/4 · 09:00-09:10 · ✅ נקבע   │    │
│                │  │ 6/4 · 09:10-09:20 · ⬜ פנוי  🗑│    │
│                │  │ 6/4 · 09:20-09:30 · ⬜ פנוי  🗑│    │
│                │  │ 7/4 · 10:00-10:10 · ⬜ פנוי  🗑│    │
│                │  └────────────────────────────────┘    │
│                │                                        │
│                │  ── פגישות שנקבעו ──                   │
│                │  ┌────────────────────────────────┐    │
│                │  │ ישראל ישראלי · 050-1234567     │    │
│                │  │ 6/4 · 09:00 · israel@mail.com  │    │
│                │  │ סטטוס: ✅ מאושר                 │    │
│                │  └────────────────────────────────┘    │
│                │                                        │
└─────────────────────────────────────────────────────────┘
```

#### Admin Features
- **Stats cards:** סה"כ, נקבעו, נותרו — real-time
- **Bulk slot creation:** בחירת תאריך + טווח שעות + אינטרוול (10 דק') → יצירת כל ה-slots אוטומטית
- **Slot management:** רשימת כל ה-slots, מחיקה של slots פנויים בלבד
- **Appointments list:** רשימת כל הפגישות שנקבעו עם פרטי הלקוח

### Loading & Error States

| State | Behavior |
|-------|----------|
| **טעינת slots** | Skeleton placeholder בגריד השעות |
| **שליחת טופס** | כפתור disabled + spinner, optimistic counter update |
| **Slot נתפס** | Toast: "השעה כבר נתפסה, בחר שעה אחרת" + refresh slots |
| **Rate limit** | Toast: "יותר מדי ניסיונות, נסה שוב בעוד דקה" |
| **שגיאת שרת** | Toast: "שגיאה, נסה שוב" |
| **0 slots remaining** | UI מצב "אזלו" — טופס מוסתר, הודעה + אפשרות waiting list |

### RTL Compliance
כל ה-CSS ישתמש **אך ורק** בתכונות לוגיות:
- `ps-`, `pe-` (לא `pl-`, `pr-`)
- `ms-`, `me-` (לא `ml-`, `mr-`)
- `start-0`, `end-0` (לא `left-0`, `right-0`)
- `text-start`, `text-end` (לא `text-left`, `text-right`)

---

## 5. Pre-Implementation Code Review

### Edge Cases

| Edge Case | טיפול |
|-----------|-------|
| **שני אנשים בוחרים אותו slot** | Prisma transaction + `where: { isBooked: false }` — הראשון מצליח, השני מקבל "Slot taken" |
| **Timezone** | כל התאריכים מאוחסנים ב-UTC. שעות מוצגות ב-Israel time (`Asia/Jerusalem`). Conversion בצד ה-client. |
| **Slot שעבר** | API filter: `date >= today` — לא מציגים slots שעברו |
| **Admin מוחק slot תפוס** | UI מונע — כפתור מחיקה רק ל-slots פנויים |
| **50 limit reached** | Check at `POST reserve`: `count({ isBooked: true }) >= 50` → 409 Conflict |
| **Duplicate booking** | Unique constraint on email? לא — מאפשר לאותו אדם לקבוע כמה פגישות (business decision). Rate limit מונע spam. |
| **Invalid phone format** | Zod regex: `^0[2-9]\d{7,8}$` — Israeli phones only |
| **Hebrew date edge cases** | `Intl.DateTimeFormat` עם `he-IL-u-ca-hebrew` — built-in, no edge cases |
| **Calendar navigation** | מאפשר ניווט רק קדימה (עד 2 חודשים). לא ניתן לבחור תאריך עבר. |

### סדר ביצוע מומלץ

1. **Schema** — הוספת מודלים ל-`schema.prisma` + `npx prisma db push`
2. **Shared types** — `src/lib/appointments.ts` (Zod schemas, types, helpers)
3. **API routes** — `GET slots`, `POST reserve`, admin CRUD
4. **Middleware** — הוספת public routes
5. **Admin sidebar** — הוספת לינק
6. **Admin page** — סטטיסטיקות + ניהול slots
7. **Public page** — BookingClient עם counter, calendar, time grid, form
8. **Hebrew dates** — integration ב-calendar component
9. **Polish** — animations, responsive, edge cases

### Dependencies
- **אין ספריות חדשות** — הכל עם built-in APIs:
  - Hebrew dates: `Intl.DateTimeFormat`
  - Calendar UI: Custom component (פשוט מספיק שלא צריך ספרייה)
  - Validation: Zod (כבר בפרויקט)
  - Rate limiting: Upstash Redis (כבר בפרויקט)

---

## סיכום שינויים

| Category | Count |
|----------|-------|
| קבצים חדשים | 11 |
| קבצים שנערכים | 3 |
| מודלי DB חדשים | 2 + 1 enum |
| API routes חדשים | 4 |
| ספריות חדשות | 0 |
