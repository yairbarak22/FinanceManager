import type { ReactNode } from 'react';
import { Lightbulb, AlertCircle } from 'lucide-react';
import VideoEmbed from '@/components/knowledge/VideoEmbed';

export const basicsContent: Record<string, ReactNode> = {
  'why-invest': (
    <div dir="rtl">
      <p>
        רוב האנשים שומרים כסף בעו&quot;ש או בחיסכון בבנק. אבל האם זה
        באמת שומר על הערך שלו? בואו נבין למה השקעה היא לא מותרות,
        אלא הכרח.
      </p>

      <h2 id="inflation">אינפלציה: האויב השקט</h2>
      <p>
        אינפלציה היא עליית מחירים כללית במשק. בישראל, הממוצע בעשורים
        האחרונים עומד על כ-<strong>2-3% בשנה</strong>. זה אומר שכסף
        שיושב בעו&quot;ש <strong>מפסיד ערך בכל יום שעובר</strong>.
      </p>
      <p>דוגמה: 100,000 ש&quot;ח היום שווים בכוח קנייה:</p>
      <table className="data-table">
        <tbody>
          <tr><td>אחרי 5 שנים</td><td>~86,000 ש&quot;ח</td></tr>
          <tr><td>אחרי 10 שנים</td><td>~74,000 ש&quot;ח</td></tr>
          <tr><td>אחרי 20 שנים</td><td>~55,000 ש&quot;ח</td></tr>
        </tbody>
      </table>
      <p>
        חיסכון שומר על הכסף. אינפלציה אוכלת אותו. השקעה גורמת לכסף
        <strong> לגדול מהר יותר מהאינפלציה</strong>.
      </p>

      <h2 id="compound-interest">ריבית דריבית: כדור השלג</h2>
      <p>
        <strong>ריבית דריבית</strong> זה כשהרווחים שהכסף שלכם מייצר
        גם הם מתחילים להרוויח. ככל שעובר יותר זמן, אפקט כדור השלג
        הזה הופך לעצום.
      </p>
      <p>דוגמה: 1,000 ש&quot;ח בחודש בתשואה של 8%:</p>
      <table className="data-table">
        <tbody>
          <tr><td>אחרי 5 שנים</td><td>~74,000 ש&quot;ח</td></tr>
          <tr><td>אחרי 10 שנים</td><td>~186,000 ש&quot;ח</td></tr>
          <tr><td>אחרי 20 שנים</td><td>~590,000 ש&quot;ח</td></tr>
        </tbody>
      </table>
      <p>
        סך ההפקדות: 240,000 ש&quot;ח. הרווח מריבית דריבית:
        <strong> ~350,000 ש&quot;ח</strong> – כמעט כפול ממה שהפקדתם!
      </p>

      <div className="info-box">
        <p>
          <strong>כלל 72:</strong> חלקו 72 בתשואה השנתית כדי לדעת
          תוך כמה שנים הכסף יוכפל. בתשואה של 8%: 72 / 8 =
          <strong> 9 שנים</strong>.
        </p>
      </div>

      <h2 id="channel-comparison">השוואת אפיקים</h2>
      <p>
        מה קורה ל-<strong>100,000 ש&quot;ח + 1,000 ש&quot;ח לחודש</strong> אחרי 20 שנה?
      </p>
      <table className="data-table">
        <tbody>
          <tr><td>מסחר עצמאי (8%, ללא דמי ניהול)</td><td><strong>~1,050,000 ש&quot;ח</strong></td></tr>
          <tr><td>קופת גמל (8%, 0.7-1% דמי ניהול)</td><td>~960,000 ש&quot;ח</td></tr>
          <tr><td>חיסכון בבנק (2% ריבית)</td><td>~390,000 ש&quot;ח</td></tr>
          <tr><td>גמ&quot;ח (0% תשואה)</td><td>~340,000 ש&quot;ח</td></tr>
        </tbody>
      </table>
      <p>
        <strong>ההפרש: ~700,000 ש&quot;ח</strong> בין מסחר עצמאי לחיסכון בבנק,
        על אותו סכום הפקדה בדיוק.
      </p>

      <div className="warning-box">
        <p>
          <strong>חשוב לזכור:</strong> תשואות עבר אינן מבטיחות תשואות
          עתידיות. השקעה בשוק ההון כרוכה בסיכון. אופק השקעה מינימלי:
          <strong> 5 שנים</strong>, אידיאלי: 10+ שנים.
          הסיכון הגדול ביותר? לא להשקיע בכלל.
        </p>
      </div>

      <blockquote>
        &ldquo;הזמן הכי טוב להתחיל להשקיע היה לפני 20 שנה.
        הזמן השני הכי טוב – היום.&rdquo;
        <br />
        <strong>וורן באפט</strong>
      </blockquote>

      <p className="text-[10px] text-[#BDBDCB] text-center leading-relaxed" style={{ marginTop: '2rem' }}>
        הנתונים להמחשה בלבד, מבוססים על תשואה שנתית ממוצעת היסטורית.
        אינם מהווים הבטחה לתשואה עתידית. האמור אינו מהווה ייעוץ השקעות.
      </p>
    </div>
  ),

  'what-is-investing': (
    <div dir="rtl">
      <p>
        השקעה היא פעולה של שימוש בכסף כדי שיייצר עוד כסף לאורך זמן.
        במקום שהכסף יישב בחשבון ויפסיד ערך בגלל אינפלציה, אתם שמים
        אותו לעבוד.
      </p>

      <h2 id="what-is-it">מה זה אומר בפועל?</h2>
      <p>
        כשאתם קונים <strong>מניה</strong>, אתם קונים חלק קטן מחברה.
        כשהחברה מצליחה, ערך המניה עולה ואתם מרוויחים.
        כשאתם קונים <strong>קרן מחקה מדד</strong> (כמו S&amp;P 500),
        אתם קונים פיסה קטנה מ-500 חברות בבת אחת, וזה נותן פיזור
        אוטומטי.
      </p>

      <h2 id="sp500">מדד S&amp;P 500</h2>
      <p>
        המדד מכיל את <strong>500 החברות הגדולות ביותר בארה&quot;ב</strong>:
        Apple, Microsoft, Amazon, Google ועוד. לאורך 30+ שנה, המדד
        הניב תשואה ממוצעת של כ-<strong>10% בשנה</strong>.
      </p>
      <ul>
        <li>פיזור על פני 500 חברות ממגוון ענפים</li>
        <li>דמי ניהול אפסיים (0.03%-0.2%)</li>
        <li>94% ממנהלי ההשקעות האקטיביים לא מצליחים להכות את המדד</li>
      </ul>

      <h2 id="dca">DCA: ממוצע עלות דולרי</h2>
      <p>
        במקום להשקיע סכום גדול בבת אחת, מפקידים <strong>סכום קבוע כל
        חודש</strong>. כשהשוק יורד קונים יותר יחידות, וכשהוא עולה
        קונים פחות. בממוצע, משלמים מחיר הוגן.
      </p>

      <div className="info-box">
        <p>
          <strong>למה DCA עובד?</strong> כי הוא מסיר את הצורך לתזמן
          את השוק. לא צריך להחליט &ldquo;מתי להיכנס&rdquo; – פשוט
          מפקידים כל חודש ונותנים לזמן לעשות את העבודה.
        </p>
      </div>

      <h2 id="three-steps">3 צעדים להתחלה</h2>
      <ol>
        <li><strong>פותחים חשבון מסחר</strong> – דרך בית השקעות (למשל אלטשולר שחם). לוקח כמה דקות</li>
        <li><strong>בוחרים קרן מחקה S&amp;P 500</strong> – קרן סל פסיבית עם דמי ניהול נמוכים</li>
        <li><strong>מגדירים הוראת קבע חודשית</strong> – סכום קבוע כל חודש, אוטומטית</li>
      </ol>

      <div className="callout">
        <Lightbulb className="callout-icon" />
        <p>
          <strong>טיפ:</strong> ככל שמתחילים מוקדם יותר, אפקט ריבית
          דריבית חזק יותר. גם 500 ש&quot;ח בחודש יכולים להפוך לסכום
          משמעותי אחרי 20 שנה.
        </p>
      </div>

      <p className="text-[10px] text-[#BDBDCB] text-center leading-relaxed" style={{ marginTop: '2rem' }}>
        האמור אינו מהווה ייעוץ השקעות. תשואות עבר אינן מבטיחות תשואות עתידיות.
      </p>
    </div>
  ),
};
