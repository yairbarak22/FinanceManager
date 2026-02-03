# אפיון מפורט: עריכה בשכבה אחת (Inline-to-Modal Edit Flow)

## סקירה כללית

פיצ'ר זה משדרג את חוויית המשתמש (UX) במערכת על ידי הפיכת כל הרשימות (נכסים, התחייבויות, עסקאות, עסקאות קבועות) לאינטראקטיביות ונוחות לעריכה. במקום לחפש כפתורי עריכה קטנים, המשתמש יכול פשוט לעבור עם העכבר על שורה וללחוץ עליה כדי לפתוח את מסך העריכה.

## מטרות

1. **שיפור UX**: הפיכת עריכה לאינטואיטיבית וזמינה יותר
2. **עקביות**: חוויה אחידה בכל הרשימות במערכת
3. **מינימליזם**: הסרת כפתורי עריכה מיותרים תוך שמירה על פונקציונליות מלאה
4. **נגישות**: תמיכה מלאה במקלדת ובטכנולוגיות מסייעות

## רכיבים נדרשים לעדכון

### 1. AssetsSection (`src/components/AssetsSection.tsx`)
- **מצב נוכחי**: כפתור עריכה (Pencil) בשורה 179-184
- **שינוי נדרש**: הוספת onClick על השורה כולה + hover states

### 2. LiabilitiesSection (`src/components/LiabilitiesSection.tsx`)
- **מצב נוכחי**: כפתור עריכה (Pencil) בשורה 211-217
- **שינוי נדרש**: הוספת onClick על השורה כולה + hover states

### 3. RecentTransactions (`src/components/RecentTransactions.tsx`)
- **מצב נוכחי**: כפתור עריכה (Pencil) בשורה 470-478 + modal פנימי
- **שינוי נדרש**: הוספת onClick על השורה כולה + hover states (למניעת התנגשות עם מצב בחירה)

### 4. RecurringTransactions (`src/components/RecurringTransactions.tsx`)
- **מצב נוכחי**: כפתור עריכה (Pencil) בשורה 205-211
- **שינוי נדרש**: הוספת onClick על השורה כולה + hover states

## מפרט טכני מפורט

### 1. חיווי ויזואלי במעבר עכבר (Hover State)

#### 1.1 שינוי רקע
- **צבע**: Ice Cream (#F7F7F8) - רקע עדין ולא דרסטי
- **מעבר**: `transition-all duration-200` - אנימציה חלקה של 200ms
- **יישום**: `hover:bg-[#F7F7F8]` על ה-div הראשי של השורה

#### 1.2 אפקט ה-"Lift"
- **צל**: `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04)` - צל רך מאוד
- **יישום**: `hover:shadow-sm` או style inline
- **מטרה**: יצירת תחושת עומק עדינה

#### 1.3 שינוי הסמן
- **סמן**: `cursor-pointer` - ברירת מחדל על כל השורה
- **יישום**: הוספת `cursor-pointer` ל-className של השורה

#### 1.4 חיווי קצה (Edge Indicator)
- **מיקום**: בצד ימין של השורה (RTL)
- **סגנון**: פס אנכי דק מאוד (2px) בצבע Dodger Blue (#69ADFF)
- **אנימציה**: `opacity-0` → `group-hover:opacity-100` עם `transition-opacity`
- **יישום**: 
  ```tsx
  <div className="absolute right-0 top-2 bottom-2 w-0.5 bg-[#69ADFF] opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
  ```
- **מטרה**: חיווי ויזואלי ברור שהשורה פעילה וניתנת ללחיצה

### 2. לוגיקת לחיצה ופתיחת עריכה

#### 2.1 מבנה האירוע
- **onClick על השורה**: קורא ל-`onEdit(item)` הקיים
- **מניעת התנגשויות**: שימוש ב-`e.stopPropagation()` על כפתורי פעולה ספציפיים
- **כפתורים שצריכים stopPropagation**:
  - כפתור מחיקה (Trash2)
  - כפתור מסמכים (FolderOpen)
  - כפתור לוח סילוקין (Table) - רק ב-LiabilitiesSection
  - כפתור סינכרון (Link) - רק ב-AssetsSection

#### 2.2 זיהוי הקשר
- **AssetsSection**: `onClick={() => onEdit(asset)}`
- **LiabilitiesSection**: `onClick={() => onEdit(liability)}`
- **RecentTransactions**: `onClick={() => openEditDialog(transaction)}` (רק במצב רגיל, לא במצב בחירה)
- **RecurringTransactions**: `onClick={() => onEdit(transaction)}`

#### 2.3 אנימציית לחיצה (Active State)
- **אפקט**: `active:scale-[0.98]` - כיווץ קל של השורה בעת לחיצה
- **משך**: 100ms - פידבק מיידי של לחיצה פיזית
- **יישום**: `active:scale-[0.98] transition-transform duration-100`

### 3. אפיון UI/UX (Apple Philosophy)

#### 3.1 אנימציית מעבר
- **שורה**: כיווץ קל (`scale: 0.98`) לשבריר שנייה (100ms)
- **Modal**: פתיחה ב-Fade-in חלק עם `backdrop-filter: blur(4px)`
- **משך כולל**: 200-300ms לכל התהליך

#### 3.2 נגישות
- **ניווט מקלדת**: תמיכה ב-Tab לניווט בין שורות
- **Focus state**: שורה ממוקדת תקבל את אותו חיווי ויזואלי של Hover
- **ARIA**: הוספת `role="button"`, `tabIndex={0}`, `aria-label` מתאים
- **יישום Focus**:
  ```tsx
  focus:outline-none focus:ring-2 focus:ring-[#69ADFF] focus:ring-offset-1
  ```

#### 3.3 מינימליזם
- **הסרת כפתורי עריכה**: כפתורי ה-Pencil יוסרו מהממשק
- **שמירה על כפתורי פעולה**: כפתורי מחיקה ומסמכים יישארו (עם stopPropagation)
- **טקסט מיותר**: אין צורך בטקסט "עריכה" - הפעולה הופכת לחלק מהזרימה הטבעית

### 4. עדכונים נדרשים ברכיבים

#### 4.1 AssetsSection

**שינויים נדרשים:**
1. הוספת `group` class ל-div הראשי של השורה
2. הוספת `onClick={() => onEdit(asset)}` על ה-div הראשי
3. הוספת classes: `hover:bg-[#F7F7F8] hover:shadow-sm cursor-pointer active:scale-[0.98] transition-all duration-200`
4. הוספת פס כחול בצד ימין (Edge Indicator)
5. הוספת `e.stopPropagation()` על כפתורי:
   - FolderOpen (מסמכים)
   - Trash2 (מחיקה)
6. הסרת כפתור ה-Pencil (שורה 179-184)
7. הוספת `relative` ל-div הראשי כדי לאפשר positioning של ה-Edge Indicator

**קוד לדוגמה:**
```tsx
<div
  key={asset.id}
  onClick={() => onEdit(asset)}
  className={cn(
    "group relative p-3 bg-white transition-all duration-200 hover:bg-[#F7F7F8] hover:shadow-sm cursor-pointer active:scale-[0.98]",
    index < assets.length - 1 && "border-b"
  )}
  style={{ borderColor: '#F7F7F8' }}
  role="button"
  tabIndex={0}
  aria-label={`ערוך נכס: ${asset.name}`}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onEdit(asset);
    }
  }}
>
  {/* Edge Indicator */}
  <div className="absolute right-0 top-2 bottom-2 w-0.5 bg-[#69ADFF] opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
  
  {/* Rest of the content */}
  {/* ... */}
  
  {/* Actions - with stopPropagation */}
  <div className="flex gap-1">
    <button
      onClick={(e) => {
        e.stopPropagation();
        onViewDocuments(asset);
      }}
      className="p-1.5 rounded hover:bg-slate-100 transition-colors"
      style={{ color: '#7E7F90' }}
      title="מסמכים"
    >
      <FolderOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
    </button>
    <button
      onClick={(e) => {
        e.stopPropagation();
        setDeleteConfirm({ isOpen: true, id: asset.id, name: asset.name });
      }}
      className="p-1.5 rounded hover:bg-red-50 transition-colors"
      style={{ color: '#7E7F90' }}
    >
      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
    </button>
  </div>
</div>
```

#### 4.2 LiabilitiesSection

**שינויים נדרשים:**
1. זהה ל-AssetsSection עם התאמות:
   - שמירה על כפתור לוח סילוקין (Table) עם stopPropagation
   - שמירה על כפתור מסמכים (FolderOpen) עם stopPropagation
   - הסרת כפתור ה-Pencil

**קוד לדוגמה:**
```tsx
<div
  key={liability.id}
  onClick={() => onEdit(liability)}
  className={cn(
    "group relative p-3 bg-white transition-all duration-200 hover:bg-[#F7F7F8] hover:shadow-sm cursor-pointer active:scale-[0.98]",
    index < liabilities.length - 1 && "border-b"
  )}
  style={{ borderColor: '#F7F7F8' }}
  role="button"
  tabIndex={0}
  aria-label={`ערוך התחייבות: ${liability.name}`}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onEdit(liability);
    }
  }}
>
  {/* Edge Indicator */}
  <div className="absolute right-0 top-2 bottom-2 w-0.5 bg-[#69ADFF] opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
  
  {/* Actions - with stopPropagation */}
  <div className="flex gap-1">
    <button
      onClick={(e) => {
        e.stopPropagation();
        onViewDocuments(liability);
      }}
      // ... rest of props
    >
      <FolderOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
    </button>
    {hasLoanDetails && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewAmortization(liability);
        }}
        // ... rest of props
      >
        <Table className="w-3.5 h-3.5" strokeWidth={1.5} />
      </button>
    )}
    <button
      onClick={(e) => {
        e.stopPropagation();
        setDeleteConfirm({ isOpen: true, id: liability.id, name: liability.name });
      }}
      // ... rest of props
    >
      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
    </button>
  </div>
</div>
```

#### 4.3 RecentTransactions

**שינויים נדרשים:**
1. **תשומת לב מיוחדת**: יש מצב בחירה (Select Mode) שצריך להישמר
2. במצב רגיל: הוספת onClick על השורה
3. במצב בחירה: השארת הלוגיקה הקיימת (לחיצה על השורה בוחרת אותה)
4. הסרת כפתור ה-Pencil במצב רגיל
5. הוספת stopPropagation על כפתור המחיקה

**קוד לדוגמה:**
```tsx
<motion.div
  key={transaction.id}
  layout
  onClick={isSelectMode 
    ? () => toggleSelection(transaction.id) 
    : () => openEditDialog(transaction)
  }
  className={cn(
    'group relative p-3 transition-all duration-200',
    isSelectMode 
      ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500'
      : 'hover:bg-[#F7F7F8] hover:shadow-sm cursor-pointer active:scale-[0.98]',
    isSelected ? 'bg-indigo-50' : 'bg-white',
    index < transactions.length - 1 && 'border-b'
  )}
  style={{ borderColor: '#F7F7F8' }}
  role={isSelectMode ? 'button' : 'button'}
  tabIndex={0}
  aria-label={isSelectMode 
    ? `${isSelected ? 'בטל בחירה' : 'בחר'} עסקה: ${transaction.description}`
    : `ערוך עסקה: ${transaction.description}`
  }
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isSelectMode) {
        toggleSelection(transaction.id);
      } else {
        openEditDialog(transaction);
      }
    }
  }}
>
  {/* Edge Indicator - only in normal mode */}
  {!isSelectMode && (
    <div className="absolute right-0 top-2 bottom-2 w-0.5 bg-[#69ADFF] opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
  )}
  
  {/* Actions - only in normal mode */}
  {!isSelectMode && (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setDeleteConfirm({ isOpen: true, id: transaction.id, description: transaction.description });
        }}
        className="p-1.5 rounded hover:bg-red-50 transition-colors"
        style={{ color: '#7E7F90' }}
        aria-label={`מחק עסקה: ${transaction.description}`}
      >
        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  )}
</motion.div>
```

#### 4.4 RecurringTransactions

**שינויים נדרשים:**
1. זהה ל-AssetsSection
2. הסרת כפתור ה-Pencil
3. הוספת stopPropagation על כפתור המחיקה

**קוד לדוגמה:**
```tsx
<div
  key={transaction.id}
  onClick={() => onEdit(transaction)}
  className={cn(
    'group relative p-3 bg-white transition-all duration-200 hover:bg-[#F7F7F8] hover:shadow-sm cursor-pointer active:scale-[0.98]',
    index < transactions.length - 1 && 'border-b'
  )}
  style={{ borderColor: '#F7F7F8' }}
  role="button"
  tabIndex={0}
  aria-label={`ערוך עסקה קבועה: ${transaction.name}`}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onEdit(transaction);
    }
  }}
>
  {/* Edge Indicator */}
  <div className="absolute right-0 top-2 bottom-2 w-0.5 bg-[#69ADFF] opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
  
  {/* Actions - with stopPropagation */}
  <div className="flex gap-1">
    <button
      onClick={(e) => {
        e.stopPropagation();
        setDeleteConfirm({ isOpen: true, id: transaction.id, name: transaction.name });
      }}
      className="p-1.5 rounded hover:bg-red-50 transition-colors"
      style={{ color: '#7E7F90' }}
    >
      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
    </button>
  </div>
</div>
```

### 5. סגנון ואנימציות

#### 5.1 Classes נדרשים
```css
/* Hover State */
hover:bg-[#F7F7F8]           /* רקע עדין */
hover:shadow-sm              /* צל רך */
cursor-pointer               /* סמן לחיצה */

/* Active State */
active:scale-[0.98]          /* כיווץ קל בעת לחיצה */

/* Transitions */
transition-all duration-200  /* מעבר חלק */

/* Edge Indicator */
group-hover:opacity-100      /* הופעת פס כחול */
transition-opacity           /* אנימציה חלקה */

/* Focus State */
focus:outline-none
focus:ring-2
focus:ring-[#69ADFF]
focus:ring-offset-1
```

#### 5.2 אנימציות Modal
- **Modal Overlay**: `backdrop-filter: blur(4px)` - כבר קיים ב-`.modal-overlay`
- **Modal Content**: Fade-in עם `animate-fade-in` או Framer Motion
- **משך**: 200-300ms לכל התהליך

### 6. נגישות (Accessibility)

#### 6.1 תמיכה במקלדת
- **Tab**: ניווט בין שורות
- **Enter/Space**: פתיחת מסך עריכה
- **Escape**: סגירת modal (כבר קיים)

#### 6.2 ARIA Labels
- כל שורה תקבל `aria-label` מתאים
- `role="button"` על השורה
- `tabIndex={0}` לניווט מקלדת

#### 6.3 Screen Readers
- טקסט חלופי מתאים לכל פעולה
- הודעות ברורות על שינוי מצב

### 7. Edge Cases

#### 7.1 RecentTransactions - מצב בחירה
- **בעיה**: יש מצב בחירה שצריך להישמר
- **פתרון**: בדיקת `isSelectMode` לפני הוספת onClick
- **יישום**: Conditional onClick based on mode

#### 7.2 AssetsSection - נכס מסונכרן
- **בעיה**: נכס מסונכרן לא צריך כפתור עריכה
- **פתרון**: בדיקת `isPortfolioSyncAsset` - לא להוסיף onClick על נכסים מסונכרנים
- **יישום**: Conditional onClick

#### 7.3 Mobile/Touch Devices
- **בעיה**: אין hover state במובייל
- **פתרון**: שמירה על לחיצה ישירה (click) גם במובייל
- **יישום**: onClick יעבוד גם במובייל

### 8. בדיקות נדרשות

#### 8.1 בדיקות פונקציונליות
- [ ] לחיצה על שורה פותחת modal עריכה
- [ ] לחיצה על כפתור מחיקה לא פותחת modal
- [ ] לחיצה על כפתור מסמכים לא פותחת modal
- [ ] לחיצה על כפתור לוח סילוקין לא פותחת modal
- [ ] נגישות מקלדת עובדת (Tab, Enter, Space)
- [ ] RecentTransactions במצב בחירה עובד כרגיל

#### 8.2 בדיקות ויזואליות
- [ ] Hover state נראה טוב על כל השורות
- [ ] Edge Indicator מופיע בצד ימין
- [ ] אנימציות חלקות ולא דרסטיות
- [ ] Active state נותן פידבק טוב

#### 8.3 בדיקות נגישות
- [ ] Screen reader קורא נכון את ה-aria-label
- [ ] ניווט מקלדת עובד
- [ ] Focus state נראה טוב

## סיכום

פיצ'ר זה משדרג משמעותית את חוויית המשתמש על ידי הפיכת עריכה לאינטואיטיבית וזמינה יותר. הפתרון מינימליסטי, עקבי עם Design System הקיים, ותומך במלואו בנגישות.

## קבצים לעדכון

1. `src/components/AssetsSection.tsx`
2. `src/components/LiabilitiesSection.tsx`
3. `src/components/RecentTransactions.tsx`
4. `src/components/RecurringTransactions.tsx`

## הערות נוספות

- כל השינויים צריכים להיות backward compatible
- אין צורך לשנות את ה-Modals עצמם - הם כבר עובדים כראוי
- הפיצ'ר צריך לעבוד גם במובייל (ללא hover, אבל עם click)
- חשוב לבדוק את כל ה-Edge Cases לפני שחרור

