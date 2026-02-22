/**
 * Course Video Sequence Email Templates
 *
 * 5 drip emails sent 3 days apart after admin triggers the sequence.
 * Uses Heebo font (distinct from Nunito in marketing templates).
 * Table-based layout for maximum email client compatibility.
 */

const TOTAL_STEPS = 5;

const stepMeta: Array<{
  icon: string;
  label: string;
  accent: string;
}> = [
  { icon: '📊', label: 'המציאות', accent: '#69ADFF' },
  { icon: '🔑', label: 'הפתרון השקול', accent: '#0DBACC' },
  { icon: '🛠️', label: "תכל'ס", accent: '#7C6FE0' },
  { icon: '⏳', label: 'תזכורת', accent: '#F59E0B' },
  { icon: '⚡', label: 'טייס אוטומטי', accent: '#10B981' },
];

function progressBar(currentStep: number): string {
  const cells = Array.from({ length: TOTAL_STEPS }, (_, i) => {
    const filled = i <= currentStep;
    const bg = filled ? '#69ADFF' : '#E8E8ED';
    return `<td style="width:20%;padding:0 2px;"><div style="height:4px;border-radius:2px;background:${bg};"></div></td>`;
  }).join('');

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 8px 0;">
    <tr>${cells}</tr>
  </table>
  <p style="font-family:'Heebo',sans-serif;font-size:11px;color:#BDBDCB;margin:0;text-align:center;">
    ${currentStep + 1} מתוך ${TOTAL_STEPS}
  </p>`;
}

function baseWrapper(body: string, step: number): string {
  const meta = stepMeta[step];
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>myneto</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Heebo','Segoe UI',Tahoma,Arial,sans-serif; direction:rtl; }
    @media only screen and (max-width:600px) {
      .container { width:100% !important; padding:16px !important; }
      .content-cell { padding:28px 20px !important; }
      .hero-title { font-size:22px !important; }
      .body-text { font-size:15px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F0F0F3;font-family:'Heebo','Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F0F3;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding:0 0 28px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:'Heebo',sans-serif;font-size:26px;font-weight:800;color:#303150;letter-spacing:-0.5px;">
                    my<span style="color:${meta.accent};">NETO</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 2px 24px rgba(0,0,0,0.06);">
                <!-- Accent top bar -->
                <tr>
                  <td style="background:${meta.accent};height:4px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <!-- Step badge -->
                <tr>
                  <td style="padding:28px 32px 0 32px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:${meta.accent}10;border-radius:20px;padding:6px 16px;">
                          <span style="font-family:'Heebo',sans-serif;font-size:13px;font-weight:500;color:${meta.accent};">
                            ${meta.icon}&nbsp; ${meta.label}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${body}
                <!-- Progress -->
                <tr>
                  <td style="padding:8px 32px 28px 32px;">
                    ${progressBar(step)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;padding:16px;">
                    <p style="font-family:'Heebo',sans-serif;font-size:12px;color:#BDBDCB;margin:0;line-height:1.8;">
                      קיבלת מייל זה כי נרשמת ל-myNETO<br>
                      &copy; ${new Date().getFullYear()} myNETO. כל הזכויות שמורות.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, url: string, color: string): string {
  return `
  <tr>
    <td style="padding:8px 32px 0 32px;text-align:center;">
      <a href="${url}" style="display:inline-block;background:${color};color:#FFFFFF;font-family:'Heebo',sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;letter-spacing:0.2px;">
        ${text}
      </a>
    </td>
  </tr>`;
}

// ────────────────────────────────────────────────
// Email definitions
// ────────────────────────────────────────────────

export interface SequenceEmail {
  step: number;
  subject: string;
  preheader: string;
  buildHtml: (userName: string, ctaUrl: string) => string;
}

export const courseSequenceEmails: SequenceEmail[] = [
  // ── Email 1: המציאות ──
  {
    step: 0,
    subject: 'המספרים לא משקרים. הנה המדריך שהבטחנו.',
    preheader: 'הגיע הזמן להתחיל לבנות את הפתרון.',
    buildHtml: (userName, ctaUrl) =>
      baseWrapper(
        `
        <tr>
          <td class="content-cell" style="padding:24px 32px 0 32px;">
            <h1 class="hero-title" style="font-family:'Heebo',sans-serif;font-size:26px;font-weight:800;color:#303150;margin:0 0 20px 0;line-height:1.4;">
              המספרים לא משקרים
            </h1>
            <div class="body-text" style="font-family:'Heebo',sans-serif;font-size:16px;color:#4A4A5A;line-height:1.9;">
              <p style="margin:0 0 16px 0;">שלום ${userName},</p>
              <p style="margin:0 0 16px 0;">
                לפני שבוע ביקשנו ממך לעשות משהו שהרבה אנשים בורחים ממנו: להזין את הנתונים שלך למערכת ולראות את המציאות הכלכלית בעיניים.
              </p>
              <p style="margin:0 0 16px 0;">
                כשרואים את המספרים השחורים על גבי המסך, נופלת ההבנה הכואבת. הרי כולנו רוצים לחתן את הילדים בכבוד ולתת להם נקודת פתיחה טובה. אבל כשעושים את החשבון הפשוט, מבינים שחיסכון חודשי רגיל בבנק פשוט לא יביא אותנו לשם. עד שהילדים יגדלו, הכסף הזה יישחק והמחירים ימשיכו לטפס.
              </p>
              <p style="margin:0 0 16px 0;">
                אבל בשביל זה בדיוק אנחנו כאן. עכשיו, אחרי שמיפינו את המצב הקיים, הגיע הזמן להתחיל לבנות את הפתרון.
              </p>
              <p style="margin:0 0 16px 0;">
                כפי שהבטחנו, פתחנו עבורך את הגישה לקורס <strong style="color:#303150;">"המסלול הבטוח"</strong>.
                בפרק הראשון לא נדבר על מניות ולא על מושגים מפוצצים, אלא על העיקרון היחיד שיכול להפוך חיסכון קטן לסכום משמעותי: אפקט "כדור השלג" של הכסף.
              </p>
            </div>
          </td>
        </tr>
        ${ctaButton('לצפייה בפרק 1: למה חיסכון בבנק כבר לא מספיק? (8:45 דקות)', ctaUrl, '#69ADFF')}
        <tr>
          <td style="padding:20px 32px 0 32px;">
            <p style="font-family:'Heebo',sans-serif;font-size:15px;color:#4A4A5A;line-height:1.8;margin:0;">
              צפייה מועילה,<br>
              <strong style="color:#303150;">צוות myNETO.</strong>
            </p>
          </td>
        </tr>`,
        0,
      ),
  },

  // ── Email 2: הפתרון השקול ──
  {
    step: 1,
    subject: 'השקעות זה קזינו? לא אם עובדים נכון.',
    preheader: 'למה הסטטיסטיקה מנצחת את המומחים.',
    buildHtml: (userName, ctaUrl) =>
      baseWrapper(
        `
        <tr>
          <td class="content-cell" style="padding:24px 32px 0 32px;">
            <h1 class="hero-title" style="font-family:'Heebo',sans-serif;font-size:26px;font-weight:800;color:#303150;margin:0 0 20px 0;line-height:1.4;">
              השקעות זה קזינו?
            </h1>
            <div class="body-text" style="font-family:'Heebo',sans-serif;font-size:16px;color:#4A4A5A;line-height:1.9;">
              <p style="margin:0 0 16px 0;">שלום ${userName},</p>
              <p style="margin:0 0 16px 0;">
                אחרי הסרטון הראשון, סביר להניח שהבנת שחייבים לעשות מעשה כדי לא לתת לכסף להעלות אבק בבנק. אבל כאן בדיוק מתעורר החשש הטבעי – מי אמר ששוק ההון הוא מקום בטוח? הרי זה נראה כמו הימור.
              </p>
              <p style="margin:0 0 16px 0;">
                זו בדיוק הסיבה שרוב האנשים נשארים מאחור. הם חושבים שהשקעה דורשת לעקוב אחרי חדשות כלכליות או "לנחש" מתי לקנות ומתי למכור.
              </p>
              <p style="margin:0 0 16px 0;">
                בפרק השני של המדריך אנחנו מנפצים את המיתוס הזה. אנחנו מסבירים מהו מדד ה-S&amp;P 500, ולמה הדרך האחראית, המיושבת והבטוחה ביותר להשקיע לאורך זמן, היא פשוט להפסיק לנסות "להיות חכמים" ולתת לסטטיסטיקה הכלכלית העולמית לעבוד בשבילנו.
              </p>
              <p style="margin:0 0 16px 0;">
                ההשתדלות הכלכלית שלנו לא צריכה להיות דרמטית, היא פשוט צריכה להיות <strong style="color:#303150;">עקבית</strong>.
              </p>
            </div>
          </td>
        </tr>
        ${ctaButton('לצפייה בפרק 2: סוד ה-S&P 500 (12:30 דקות)', ctaUrl, '#0DBACC')}
        <tr>
          <td style="padding:20px 32px 0 32px;">
            <p style="font-family:'Heebo',sans-serif;font-size:15px;color:#4A4A5A;line-height:1.8;margin:0;">
              שלך,<br>
              <strong style="color:#303150;">צוות myNETO.</strong>
            </p>
          </td>
        </tr>`,
        1,
      ),
  },

  // ── Email 3: תכל'ס ──
  {
    step: 2,
    subject: 'פותחים חשבון מסחר (צעד-אחר-צעד)',
    preheader: 'מדריך מעשי לפתיחת חשבון – קליק אחר קליק.',
    buildHtml: (userName, ctaUrl) =>
      baseWrapper(
        `
        <tr>
          <td class="content-cell" style="padding:24px 32px 0 32px;">
            <h1 class="hero-title" style="font-family:'Heebo',sans-serif;font-size:26px;font-weight:800;color:#303150;margin:0 0 20px 0;line-height:1.4;">
              פותחים חשבון מסחר
            </h1>
            <div class="body-text" style="font-family:'Heebo',sans-serif;font-size:16px;color:#4A4A5A;line-height:1.9;">
              <p style="margin:0 0 16px 0;">שלום ${userName},</p>
              <p style="margin:0 0 16px 0;">
                החלק הכי קשה בתהליכים פיננסיים הוא המעבר מ"להבין מה נכון לעשות" אל הביצוע בפועל. הרבה פעמים, מה שעוצר אותנו זו הביורוקרטיה. מאיפה מתחילים? איזה טפסים צריך?
              </p>
              <p style="margin:0 0 16px 0;">
                אנחנו ב-myNETO לא משאירים אותך עם תיאוריות. ברגע שהגדרנו במערכת את היעדים למשפחה, צריך לפתוח את הכלים שיביאו אותנו אליהם.
              </p>
              <p style="margin:0 0 16px 0;">
                בפרק השלישי, בנינו עבורך מדריך מעשי לחלוטין. קליק אחר קליק. אנחנו מראים לך על המסך בדיוק איך לפתוח חשבון מסחר עצמאי באלטשולר שחם, בלי לצאת מהבית. כדי שזה יהיה אפילו פשוט יותר, צירפנו מתחת לסרטון קובץ PDF מסודר שמלווה אותך בכל שלב בדרך.
              </p>
              <p style="margin:0 0 16px 0;">
                קח לעצמך 15 דקות שקטות מול המחשב, ובוא נצא לדרך.
              </p>
            </div>
          </td>
        </tr>
        ${ctaButton('לצפייה בפרק 3 ופתיחת החשבון המעשי (15:20 דקות)', ctaUrl, '#7C6FE0')}
        <tr>
          <td style="padding:20px 32px 0 32px;">
            <p style="font-family:'Heebo',sans-serif;font-size:15px;color:#4A4A5A;line-height:1.8;margin:0;">
              <strong style="color:#303150;">צוות myNETO.</strong>
            </p>
          </td>
        </tr>`,
        2,
      ),
  },

  // ── Email 4: טיפול בהתנגדות ──
  {
    step: 3,
    subject: 'האם החשבון שלך כבר פתוח?',
    preheader: 'כל חודש שאנחנו דוחים – זה חודש שהכסף מפסיד.',
    buildHtml: (userName, ctaUrl) =>
      baseWrapper(
        `
        <tr>
          <td class="content-cell" style="padding:24px 32px 0 32px;">
            <h1 class="hero-title" style="font-family:'Heebo',sans-serif;font-size:26px;font-weight:800;color:#303150;margin:0 0 20px 0;line-height:1.4;">
              האם החשבון שלך כבר פתוח?
            </h1>
            <div class="body-text" style="font-family:'Heebo',sans-serif;font-size:16px;color:#4A4A5A;line-height:1.9;">
              <p style="margin:0 0 16px 0;">שלום ${userName},</p>
              <p style="margin:0 0 16px 0;">
                אם צפית בפרק השלישי וכבר פתחת את תיק המסחר שלך – מזל טוב. עשית עכשיו את הצעד המשמעותי ביותר בדרך לביטחון הכלכלי של המשפחה שלך.
              </p>
              <p style="margin:0 0 16px 0;">
                אם עדיין לא עשית את זה, אני כותב לך כדי להזכיר שהזמן שעובר הוא המחיר הכי יקר שאנחנו משלמים. כל חודש שאנחנו דוחים את פתיחת התיק, זה חודש שהכסף שלנו יושב בחוץ ומפסיד את הזמן שיכול היה לעבוד בו עבורנו ולייצר את "כדור השלג" שדיברנו עליו בפרק הראשון.
              </p>
              <p style="margin:0 0 16px 0;">
                הטכנולוגיה של היום הפכה את פתיחת החשבון לתהליך פשוט שלא דורש התרוצצויות. הכל מוסבר בצורה ברורה במדריך המצורף לסרטון השלישי. אין טעם לחכות ל"זמן המושלם", כי אין זמן כזה.
              </p>
              <p style="margin:0 0 16px 0;">
                בעוד כמה ימים אשלח לך את הפרק האחרון שיסגור את המעגל, אבל כדי שהוא יהיה רלוונטי עבורך, החשבון שלך חייב להיות מוכן.
              </p>
            </div>
          </td>
        </tr>
        ${ctaButton('לחזרה לפרק 3 והשלמת פתיחת החשבון', ctaUrl, '#F59E0B')}
        <tr>
          <td style="padding:20px 32px 0 32px;">
            <p style="font-family:'Heebo',sans-serif;font-size:15px;color:#4A4A5A;line-height:1.8;margin:0;">
              בשורות טובות,<br>
              <strong style="color:#303150;">צוות myNETO.</strong>
            </p>
          </td>
        </tr>`,
        3,
      ),
  },

  // ── Email 5: טייס אוטומטי ──
  {
    step: 4,
    subject: 'ההרגל שבונה עתיד (הפרק האחרון בסדרה)',
    preheader: 'איך מכניסים הכל לטייס אוטומטי.',
    buildHtml: (userName, ctaUrl) =>
      baseWrapper(
        `
        <tr>
          <td class="content-cell" style="padding:24px 32px 0 32px;">
            <h1 class="hero-title" style="font-family:'Heebo',sans-serif;font-size:26px;font-weight:800;color:#303150;margin:0 0 20px 0;line-height:1.4;">
              ההרגל שבונה עתיד
            </h1>
            <div class="body-text" style="font-family:'Heebo',sans-serif;font-size:16px;color:#4A4A5A;line-height:1.9;">
              <p style="margin:0 0 16px 0;">שלום ${userName},</p>
              <p style="margin:0 0 16px 0;">
                הגענו לישורת האחרונה. יש לך תיק מסחר, אתה מבין לאן הכסף הולך, ויש לך מטרה ברורה מול העיניים שניסחנו יחד במערכת.
              </p>
              <p style="margin:0 0 16px 0;">
                השלב האחרון הוא לדאוג שלא נצטרך לחשוב על זה יותר מדי. אנחנו חיים בשגרה עמוסה, ואם נסמוך על הזיכרון שלנו שניכנס כל חודש למערכת ונעביר כסף, אנחנו ניפול.
              </p>
              <p style="margin:0 0 16px 0;">
                בפרק הרביעי והאחרון אנחנו מסבירים איך מכניסים את הכל ל"טייס אוטומטי". איך מגדירים הוראת קבע ישירות לתיק ההשקעות ובוחרים את המסלול הנכון. זוהי הפעולה המנצחת שיוצרת יישוב הדעת אמיתי. אתה חי את חייך, מגדל את הילדים בשלווה, והמערכת שבנית פועלת עבורך ברקע בכל חודש מחדש.
              </p>
            </div>
          </td>
        </tr>
        ${ctaButton('לצפייה בפרק 4: בחירת המסלול והוראת הקבע', ctaUrl, '#10B981')}
        <tr>
          <td style="padding:20px 32px 0 32px;">
            <p style="font-family:'Heebo',sans-serif;font-size:16px;color:#4A4A5A;line-height:1.9;margin:0 0 8px 0;">
              מאחלים לך שהצעדים האלו יהוו את התשתית לרווחה הכלכלית של המשפחה שלך לשנים רבות.
            </p>
            <p style="font-family:'Heebo',sans-serif;font-size:15px;color:#4A4A5A;line-height:1.8;margin:0;">
              שלך,<br>
              <strong style="color:#303150;">צוות myNETO.</strong>
            </p>
          </td>
        </tr>`,
        4,
      ),
  },
];

/**
 * CTA URL paths per step (relative to base URL).
 * Step 3 links back to lesson l-3 (reminder).
 */
export const stepCtaPaths: string[] = [
  '/courses?lesson=l-1',
  '/courses?lesson=l-2',
  '/courses?lesson=l-3',
  '/courses?lesson=l-3',
  '/courses?lesson=l-4',
];
