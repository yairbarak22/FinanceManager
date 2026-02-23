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
                ביקשנו ממך להזין את הנתונים שלך למערכת ולראות את המציאות הכלכלית כמו שהיא.
              </p>
              <p style="margin:0 0 16px 0;">
                כולנו רוצים לתת לילדים נקודת פתיחה טובה.
              </p>
              <p style="margin:0 0 16px 0;">
                אבל כשעושים את החשבון הפשוט – חיסכון חודשי רגיל בבנק לא יביא אותנו לשם.<br>
                עד שהילדים יגדלו, הכסף יישחק והמחירים ימשיכו לטפס.
              </p>
              <p style="margin:0 0 16px 0;">
                <strong style="color:#303150;">בשביל זה בדיוק אנחנו כאן.</strong><br>
                אחרי שמיפינו את המצב הקיים, הגיע הזמן לבנות את הפתרון.
              </p>
              <p style="margin:0 0 16px 0;">
                כפי שהבטחנו, פתחנו עבורך את הגישה לקורס <strong style="color:#303150;">"המסלול הבטוח"</strong>.
              </p>
              <p style="margin:0 0 16px 0;">
                בפרק הראשון נדבר על העיקרון היחיד שהופך חיסכון קטן לסכום משמעותי:<br>
                <strong style="color:#303150;">אפקט "כדור השלג" של הכסף.</strong>
              </p>
              <p style="margin:0 0 16px 0;">
                בלי מושגים מסובכים. בלי מניות. רק עיקרון אחד פשוט.
              </p>
            </div>
          </td>
        </tr>
        ${ctaButton('צפייה בפרק 1 (3:24 דק׳)', ctaUrl, '#69ADFF')}
        <tr>
          <td style="padding:20px 32px 0 32px;">
            <p style="font-family:'Heebo',sans-serif;font-size:15px;color:#4A4A5A;line-height:1.8;margin:0;">
              צפייה מועילה,<br>
              <strong style="color:#303150;">צוות myNETO</strong>
            </p>
          </td>
        </tr>`,
        0,
      ),
  },

  // ── Email 2: הפתרון השקול ──
  {
    step: 1,
    subject: 'השקעות זה קזינו? לא בהכרח.',
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
                אחרי הסרטון הראשון, כנראה שהבנת שצריך לעשות מעשה.<br>
                אבל כאן מתעורר החשש הטבעי – <strong style="color:#303150;">שוק ההון נראה כמו הימור.</strong>
              </p>
              <p style="margin:0 0 16px 0;">
                רוב האנשים חושבים שהשקעה דורשת לעקוב אחרי חדשות כלכליות או "לנחש" מתי לקנות ומתי למכור.
              </p>
              <p style="margin:0 0 16px 0;">
                <strong style="color:#303150;">זה לא נכון.</strong>
              </p>
              <p style="margin:0 0 16px 0;">
                בפרק השני אנחנו מסבירים מהו מדד ה-S&amp;P 500, ולמה הדרך הבטוחה ביותר להשקיע לאורך זמן היא פשוט <strong style="color:#303150;">להפסיק לנסות להיות חכמים</strong> – ולתת לסטטיסטיקה לעבוד בשבילנו.
              </p>
              <p style="margin:0 0 24px 0;">
                ההשתדלות הכלכלית שלנו לא צריכה להיות דרמטית.<br>
                היא פשוט צריכה להיות <strong style="color:#303150;">עקבית</strong>.
              </p>
            </div>
          </td>
        </tr>
        ${ctaButton('צפייה בפרק 2 (3:41 דק׳)', ctaUrl, '#0DBACC')}
        <tr>
          <td style="padding:20px 32px 0 32px;">
            <p style="font-family:'Heebo',sans-serif;font-size:15px;color:#4A4A5A;line-height:1.8;margin:0;">
              שלך,<br>
              <strong style="color:#303150;">צוות myNETO</strong>
            </p>
          </td>
        </tr>`,
        1,
      ),
  },

  // ── Email 3: תכל'ס ──
  {
    step: 2,
    subject: 'פותחים חשבון מסחר – צעד אחר צעד',
    preheader: 'מדריך מעשי לפתיחת חשבון. קליק אחר קליק.',
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
                הגענו לשלב שבו רוב האנשים נתקעים:<br>
                <strong style="color:#303150;">המעבר מ"להבין" אל "לעשות".</strong>
              </p>
              <p style="margin:0 0 16px 0;">
                מאיפה מתחילים? איזה טפסים? איפה לוחצים?
              </p>
              <p style="margin:0 0 16px 0;">
                בפרק השלישי בנינו מדריך מעשי לחלוטין.<br>
                אנחנו מראים על המסך, קליק אחר קליק, בדיוק איך לפתוח חשבון מסחר באלטשולר שחם – בלי לצאת מהבית.
              </p>
              <p style="margin:0 0 16px 0;">
                מתחת לסרטון יש גם <strong style="color:#303150;">קובץ PDF</strong> מסודר שמלווה אותך בכל שלב.
              </p>
              <p style="margin:0 0 16px 0;">
                קח 5 דקות שקטות מול המחשב, ובוא נצא לדרך.
              </p>
            </div>
          </td>
        </tr>
        ${ctaButton('צפייה בפרק 3 + המדריך המעשי (4:24 דק׳)', ctaUrl, '#7C6FE0')}
        <tr>
          <td style="padding:20px 32px 0 32px;">
            <p style="font-family:'Heebo',sans-serif;font-size:15px;color:#4A4A5A;line-height:1.8;margin:0;">
              <strong style="color:#303150;">צוות myNETO</strong>
            </p>
          </td>
        </tr>`,
        2,
      ),
  },

  // ── Email 4: תזכורת ──
  {
    step: 3,
    subject: 'החשבון שלך כבר פתוח?',
    preheader: 'כל חודש שדוחים – זה חודש שהכסף מפסיד.',
    buildHtml: (userName, ctaUrl) =>
      baseWrapper(
        `
        <tr>
          <td class="content-cell" style="padding:24px 32px 0 32px;">
            <h1 class="hero-title" style="font-family:'Heebo',sans-serif;font-size:26px;font-weight:800;color:#303150;margin:0 0 20px 0;line-height:1.4;">
              החשבון שלך כבר פתוח?
            </h1>
            <div class="body-text" style="font-family:'Heebo',sans-serif;font-size:16px;color:#4A4A5A;line-height:1.9;">
              <p style="margin:0 0 16px 0;">שלום ${userName},</p>
              <p style="margin:0 0 16px 0;">
                אם כבר פתחת את התיק – <strong style="color:#303150;">מזל טוב.</strong> עשית את הצעד הכי משמעותי.
              </p>
              <p style="margin:0 0 16px 0;">
                אם עדיין לא – שורה אחת חשובה:
              </p>
              <p style="margin:0 0 16px 0;">
                <strong style="color:#303150;">כל חודש שדוחים, זה חודש שהכסף לא עובד בשבילך.</strong>
              </p>
              <p style="margin:0 0 16px 0;">
                פתיחת החשבון לוקחת כמה דקות מהמחשב.<br>
                הכל מוסבר בסרטון ובמדריך ה-PDF שצירפנו.
              </p>
              <p style="margin:0 0 16px 0;">
                בעוד כמה ימים נשלח את הפרק האחרון – אבל כדי שהוא יהיה רלוונטי, <strong style="color:#303150;">החשבון שלך צריך להיות מוכן.</strong>
              </p>
            </div>
          </td>
        </tr>
        ${ctaButton('לפרק 3 + פתיחת החשבון', ctaUrl, '#F59E0B')}
        <tr>
          <td style="padding:20px 32px 0 32px;">
            <p style="font-family:'Heebo',sans-serif;font-size:15px;color:#4A4A5A;line-height:1.8;margin:0;">
              בשורות טובות,<br>
              <strong style="color:#303150;">צוות myNETO</strong>
            </p>
          </td>
        </tr>`,
        3,
      ),
  },

  // ── Email 5: טייס אוטומטי ──
  {
    step: 4,
    subject: 'הפרק האחרון: ההרגל שבונה עתיד',
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
                יש לך תיק מסחר.<br>
                אתה מבין לאן הכסף הולך.<br>
                יש לך מטרה ברורה.
              </p>
              <p style="margin:0 0 16px 0;">
                <strong style="color:#303150;">עכשיו צריך לדאוג שזה יעבוד לבד.</strong>
              </p>
              <p style="margin:0 0 16px 0;">
                אנחנו חיים בשגרה עמוסה. אם נסמוך על הזיכרון שלנו להעביר כסף כל חודש – זה לא יעבוד.
              </p>
              <p style="margin:0 0 16px 0;">
                בפרק האחרון אנחנו מראים איך מגדירים <strong style="color:#303150;">הוראת קבע</strong> ישירות לתיק ההשקעות, ואיך בוחרים את המסלול הנכון.
              </p>
              <p style="margin:0 0 16px 0;">
                אתה חי את חייך, מגדל את הילדים בשלווה – והמערכת שבנית פועלת ברקע כל חודש מחדש.
              </p>
            </div>
          </td>
        </tr>
        ${ctaButton('צפייה בפרק 4: המסלול והוראת הקבע', ctaUrl, '#10B981')}
        <tr>
          <td style="padding:20px 32px 0 32px;">
            <p style="font-family:'Heebo',sans-serif;font-size:15px;color:#4A4A5A;line-height:1.8;margin:0 0 8px 0;">
              שהצעדים האלו יהוו תשתית לרווחה הכלכלית של המשפחה שלך.
            </p>
            <p style="font-family:'Heebo',sans-serif;font-size:15px;color:#4A4A5A;line-height:1.8;margin:0;">
              שלך,<br>
              <strong style="color:#303150;">צוות myNETO</strong>
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
