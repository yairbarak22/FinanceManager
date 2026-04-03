import type { ReactNode } from 'react';
import { Lightbulb, AlertCircle } from 'lucide-react';

export const actionContent: Record<string, ReactNode> = {
  'open-account': (
    <div dir="rtl">
      <p>
        חשבון מסחר עצמאי מאפשר לכם להשקיע ישירות בבורסה, בלי
        שמישהו אחר יגבה מכם דמי ניהול על הנכסים. הכסף רשום על שמכם.
      </p>

      <h2 id="benefits">הטבות דרך MyNeto</h2>
      <p>שני ברוקרים עם הטבות בלעדיות:</p>
      <ul>
        <li><strong>אלטשולר שחם</strong> – 0₪ דמי ניהול לכל החיים, 200₪ מתנה, מינימום 5,000₪</li>
        <li><strong>IBI</strong> – 300₪ מתנה, פטור מדמי ניהול ל-2 שנים, מינימום 15,000₪, <strong>פתיחה ללא מצלמה</strong></li>
      </ul>

      <h2 id="what-is-trading-account">מה זה חשבון מסחר עצמאי?</h2>
      <p>
        חשבון שמאפשר לכם לקנות ולמכור ניירות ערך (מניות, קרנות סל,
        אג&quot;ח) ישירות בבורסה.
      </p>
      <p>
        <strong>ההבדל מקופת גמל או בנק:</strong> אתם שולטים בבחירות
        ולא משלמים דמי ניהול על הנכסים עצמם. הכסף רשום על שמכם
        בטאבו – גם אם בית ההשקעות נסגר, הכסף נשאר שלכם.
      </p>

      <h2 id="cost-comparison">השוואת עלויות</h2>
      <table className="data-table">
        <tbody>
          <tr><td>מסחר עצמאי</td><td>0% דמי ניהול, עמלת קנייה בלבד</td></tr>
          <tr><td>קופת גמל</td><td>0.5-1.5% דמי ניהול שנתיים</td></tr>
          <tr><td>ביטוח מנהלים</td><td>0.5-2% דמי ניהול שנתיים</td></tr>
        </tbody>
      </table>

      <h2 id="opening-process">תהליך הפתיחה</h2>
      <ol>
        <li><strong>כניסה לאתר בית ההשקעות</strong> – דרך הקישור ב-MyNeto כדי לקבל את ההטבות</li>
        <li><strong>מילוי פרטים אישיים</strong> – תעודת זהות, כתובת, פרטי בנק</li>
        <li><strong>אימות זהות</strong> – באלטשולר: צילום ת&quot;ז + סלפי. ב-IBI: ללא מצלמה</li>
        <li><strong>הפקדה ראשונה</strong> – העברה בנקאית או הוראת קבע</li>
      </ol>
      <p>התהליך כולו לוקח <strong>כמה דקות</strong> והחשבון נפתח תוך 1-2 ימי עסקים.</p>

      <div className="callout">
        <Lightbulb className="callout-icon" />
        <p>
          <strong>טיפ:</strong> לאחר פתיחת החשבון, הגדירו הוראת קבע
          חודשית לקרן מחקה S&amp;P 500. פעם אחת, ושוכחים.
        </p>
      </div>

      <p className="text-[10px] text-[#BDBDCB] text-center leading-relaxed" style={{ marginTop: '2rem' }}>
        האמור אינו מהווה ייעוץ השקעות. פתיחת חשבון מסחר כרוכה בסיכון.
      </p>
    </div>
  ),

  'transfer-portfolio': (
    <div dir="rtl">
      <p>
        כבר יש לכם חשבון מסחר במקום אחר? אפשר להעביר את התיק
        בלי למכור את הנכסים, ולהתחיל ליהנות מעמלות נמוכות יותר.
      </p>

      <h2 id="why-transfer">למה להעביר?</h2>
      <ol>
        <li><strong>חיסכון בעמלות</strong> – דמי ניהול נמוכים יותר חוסכים אלפי שקלים לאורך שנים</li>
        <li><strong>ללא מכירה</strong> – ההעברה נעשית בלי למכור ולקנות מחדש, כך שאין אירוע מס</li>
        <li><strong>הטבות הצטרפות</strong> – בונוס כספי כשמעבירים דרך MyNeto</li>
      </ol>

      <h2 id="transfer-process">תהליך ההעברה</h2>
      <ol>
        <li><strong>פותחים חשבון חדש</strong> – בבית ההשקעות החדש (דרך הקישור ב-MyNeto)</li>
        <li><strong>ממלאים טופס העברה</strong> – מציינים את פרטי החשבון הישן ומה להעביר</li>
        <li><strong>חותמים דיגיטלית</strong> – אישור ההעברה נעשה אונליין</li>
        <li><strong>בית ההשקעות החדש מטפל בהכל</strong> – הם מתאמים מול הבית ישן</li>
        <li><strong>ההעברה מושלמת</strong> – לוקח בדרך כלל 2-4 שבועות</li>
      </ol>

      <div className="warning-box">
        <p>
          <AlertCircle className="callout-icon" style={{ display: 'inline', width: '1rem', height: '1rem', verticalAlign: 'middle', marginInlineEnd: '0.25rem' }} />
          <strong>שימו לב:</strong> במהלך ההעברה אי אפשר לסחור
          בנכסים שבתהליך. תכננו בהתאם.
        </p>
      </div>

      <h2 id="faq">שאלות נפוצות</h2>

      <h3 id="faq-cost">כמה זה עולה?</h3>
      <p>
        ההעברה עצמה <strong>בדרך כלל חינמית</strong> מצד בית ההשקעות
        הקולט. חלק מבתי ההשקעות הישנים גובים עמלת יציאה קטנה.
      </p>

      <h3 id="faq-tax">יש אירוע מס?</h3>
      <p>
        <strong>לא.</strong> העברת נכסים (ללא מכירה) אינה אירוע מס.
        אתם פשוט מעבירים את הבעלות מחשבון לחשבון.
      </p>

      <h3 id="faq-partial">אפשר להעביר רק חלק מהתיק?</h3>
      <p>
        כן. אפשר לבחור אילו נכסים להעביר ואילו להשאיר.
      </p>

      <div className="callout">
        <Lightbulb className="callout-icon" />
        <p>
          <strong>טיפ:</strong> בדקו מה העמלות שאתם משלמים היום.
          הפרש קטן בדמי ניהול יכול לחסוך מאות אלפי שקלים
          לאורך עשרות שנים.
        </p>
      </div>
    </div>
  ),
};
