import type { ReactNode } from 'react';
import { Lightbulb, AlertCircle } from 'lucide-react';

export const pensionInsuranceContent: Record<string, ReactNode> = {
  /* ─── 1. pension-basics ─── */
  'pension-basics': (
    <div dir="rtl">
      <p>
        פנסיה היא הכסף שיחכה לכם כשתפסיקו לעבוד. בישראל, כל עובד
        שכיר חייב לקבל הפרשה לפנסיה מהמעסיק. אבל האם אתם באמת
        יודעים מה קורה עם הכסף שם?
      </p>

      <h2 id="how-it-works">איך זה עובד?</h2>
      <p>כל חודש מופרשים אחוזים מהמשכורת:</p>
      <table className="data-table">
        <tbody>
          <tr><td>הפרשת עובד (לתגמולים)</td><td>6%</td></tr>
          <tr><td>הפרשת מעסיק (לתגמולים)</td><td>6.5%</td></tr>
          <tr><td>הפרשת מעסיק (לפיצויים)</td><td>6%</td></tr>
          <tr><td>סך הכל</td><td><strong>18.5%</strong></td></tr>
        </tbody>
      </table>

      <h2 id="types">סוגי פנסיה</h2>
      <ul>
        <li><strong>קרן פנסיה מקיפה</strong> – הנפוצה ביותר. כוללת חיסכון, ביטוח נכות וביטוח שאירים</li>
        <li><strong>ביטוח מנהלים</strong> – פוליסת חיסכון דרך חברת ביטוח. גמישות יותר, אבל בדרך כלל דמי ניהול גבוהים יותר</li>
        <li><strong>קופת גמל</strong> – חיסכון בלבד, ללא כיסוי ביטוחי</li>
      </ul>

      <h2 id="management-fees">דמי ניהול</h2>
      <p>שני סוגים:</p>
      <ul>
        <li><strong>מהפקדה</strong> – אחוז מכל סכום שנכנס (עד 4%)</li>
        <li><strong>מצבירה</strong> – אחוז שנתי מהסכום שנצבר (עד 0.5%)</li>
      </ul>

      <div className="callout">
        <Lightbulb className="callout-icon" />
        <p>
          <strong>טיפ:</strong> תתקשרו לחברת הפנסיה ובקשו הנחה בדמי
          ניהול. רוב החברות ייתנו. הפרש של 0.2% בדמי ניהול מצבירה
          יכול לחסוך עשרות אלפי שקלים עד הפרישה.
        </p>
      </div>
    </div>
  ),

  /* ─── 2. keren-hishtalmut ─── */
  'keren-hishtalmut': (
    <div dir="rtl">
      <p>
        קרן השתלמות היא אחד הכלים הפיננסיים הטובים ביותר שיש
        בישראל. למה? כי היא משלבת <strong>הטבת מס</strong> עם
        <strong> חיסכון שצומח</strong>.
      </p>

      <h2 id="how-it-works">איך זה עובד?</h2>
      <table className="data-table">
        <tbody>
          <tr><td>הפרשת עובד</td><td>2.5% מהמשכורת</td></tr>
          <tr><td>הפרשת מעסיק</td><td>7.5% מהמשכורת</td></tr>
          <tr><td>סך הכל</td><td><strong>10%</strong></td></tr>
        </tbody>
      </table>
      <p>
        המעסיק מפריש <strong>פי 3</strong> ממה שאתם מפרישים.
        זה בעצם תוספת שכר של 7.5%.
      </p>

      <h2 id="tax-benefit">הטבת המס</h2>
      <p>
        אחרי <strong>6 שנים</strong> (או 3 שנים למשיכה למטרת
        השתלמות), אפשר למשוך את הכסף <strong>פטור ממס רווח
        הון</strong> עד תקרה של ~15,700 ש&quot;ח הפקדה לשנה.
      </p>
      <div className="info-box">
        <p>
          <strong>למה זה מיוחד?</strong> בכל השקעה אחרת משלמים
          25% מס על הרווחים. בקרן השתלמות – <strong>0%</strong>.
          זו אחת מהטבות המס הטובות ביותר שיש.
        </p>
      </div>

      <h2 id="what-to-do">מה לעשות עם הכסף?</h2>
      <ul>
        <li><strong>אופציה 1:</strong> למשוך אחרי 6 שנים ולהשתמש</li>
        <li><strong>אופציה 2 (מומלצת):</strong> להשאיר ולתת לריבית דריבית לעבוד. הכסף ממשיך לצמוח בפטור ממס</li>
      </ul>

      <div className="callout">
        <Lightbulb className="callout-icon" />
        <p>
          <strong>טיפ:</strong> בדקו באיזה מסלול השקעה הקרן שלכם.
          אם אתם צעירים, מסלול מנייתי (אגרסיבי) צפוי להניב תשואה
          גבוהה יותר לטווח ארוך.
        </p>
      </div>
    </div>
  ),

  /* ─── 3. insurance-essentials ─── */
  'insurance-essentials': (
    <div dir="rtl">
      <p>
        ביטוח הוא לא דבר מרגש, אבל הוא קריטי. הביטוחים הנכונים
        מגנים עליכם מפני אירועים שיכולים להרוס את המצב הכלכלי.
      </p>

      <h2 id="must-have">ביטוחים שחייבים</h2>
      <ul>
        <li><strong>ביטוח בריאות</strong> – השלמה לסל הבריאות. מכסה ניתוחים פרטיים, תרופות יקרות, ודעה שנייה</li>
        <li><strong>ביטוח חיים / ריסק</strong> – חובה אם יש לכם ילדים או משכנתא. מגן על המשפחה אם קורה משהו</li>
        <li><strong>ביטוח אובדן כושר עבודה</strong> – אם לא תוכלו לעבוד, מי ישלם את החשבונות? ביטוח זה נותן הכנסה חודשית</li>
      </ul>

      <h2 id="nice-to-have">ביטוחים שכדאי לשקול</h2>
      <ul>
        <li><strong>ביטוח דירה</strong> – חובה עם משכנתא, מומלץ גם בלי</li>
        <li><strong>ביטוח רכב מקיף</strong> – אם הרכב חדש או יקר</li>
        <li><strong>ביטוח נסיעות לחו&quot;ל</strong> – חובה לכל טיסה</li>
      </ul>

      <h2 id="check-coverage">איך לבדוק מה יש לכם?</h2>
      <ol>
        <li>בדקו את <strong>תלוש השכר</strong> – רוב הביטוחים מופרשים דרך העבודה</li>
        <li>בדקו ב<strong>פנסיה</strong> – לרוב כוללת ביטוח נכות ושאירים</li>
        <li>בדקו <strong>ביטוחים פרטיים</strong> – ודאו שאין כפילויות</li>
      </ol>

      <div className="warning-box">
        <p>
          <strong>שימו לב לכפילויות!</strong> הרבה אנשים משלמים על
          ביטוח בריאות גם דרך העבודה וגם פרטית. בדקו ובטלו כפילויות.
        </p>
      </div>

      <div className="callout">
        <Lightbulb className="callout-icon" />
        <p>
          <strong>טיפ:</strong> פעם בשנה, שבו ותעברו על כל הביטוחים.
          המצב משתנה (ילדים, משכנתא, שינוי עבודה) והביטוחים צריכים
          להתעדכן בהתאם.
        </p>
      </div>
    </div>
  ),
};
