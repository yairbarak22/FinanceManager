/**
 * Default email templates for the marketing system.
 * Each template uses inline CSS for maximum email client compatibility,
 * is RTL-friendly, responsive, and uses Neto design system colors.
 * 
 * Template Variables:
 * {{title}}      - Main heading text
 * {{content}}    - Body content (HTML allowed)
 * {{buttonText}} - CTA button text
 * {{buttonUrl}}  - CTA button URL
 * {{preheader}}  - Preview text shown in inbox
 */

export interface DefaultTemplate {
  name: string;
  subject: string;
  description: string;
  category: 'newsletter' | 'promotional' | 'announcement';
  content: string;
}

const baseWrapper = (body: string) => `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>{{title}}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Nunito', 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 16px !important; }
      .content-cell { padding: 24px 16px !important; }
      .hero-title { font-size: 24px !important; }
      .two-col { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F5F7; font-family: 'Nunito', 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl;">
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    {{preheader}}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F5F7;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          ${body}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const logoHeader = `<!-- Logo Header -->
<tr>
  <td align="center" style="padding: 0 0 24px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-family: 'Nunito', sans-serif; font-size: 28px; font-weight: 700; color: #303150; letter-spacing: -0.5px;">
          MyNeto
        </td>
      </tr>
    </table>
  </td>
</tr>`;

const footerBlock = `<!-- Footer -->
<tr>
  <td style="padding: 24px 0 0 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 16px;">
      <tr>
        <td class="content-cell" style="padding: 24px 32px; text-align: center;">
          <p style="font-family: 'Nunito', sans-serif; font-size: 12px; color: #BDBDCB; margin: 0; line-height: 1.8;">
            קיבלת מייל זה כי נרשמת ל-MyNeto<br>
            © ${new Date().getFullYear()} MyNeto. כל הזכויות שמורות.
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>`;

// ─────────────────────────────────────────────────────────────
// Template 1: Newsletter
// ─────────────────────────────────────────────────────────────
const newsletterTemplate: DefaultTemplate = {
  name: 'ניוזלטר - עדכון חודשי',
  subject: '{{title}}',
  description: 'תבנית ניוזלטר מעוצבת עם כותרת, תוכן מרכזי וכפתור CTA. מתאימה לעדכונים חודשיים, חדשות ותוכן.',
  category: 'newsletter',
  content: baseWrapper(`
    ${logoHeader}
    <!-- Main Card -->
    <tr>
      <td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <!-- Hero Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #69ADFF 0%, #0DBACC 100%); padding: 48px 32px; text-align: center;">
              <h1 class="hero-title" style="font-family: 'Nunito', sans-serif; font-size: 32px; font-weight: 700; color: #FFFFFF; margin: 0 0 8px 0;">
                {{title}}
              </h1>
              <p style="font-family: 'Nunito', sans-serif; font-size: 15px; color: rgba(255,255,255,0.85); margin: 0;">
                עדכונים חדשים מ-MyNeto
              </p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td class="content-cell" style="padding: 32px;">
              <div style="font-family: 'Nunito', sans-serif; font-size: 15px; color: #303150; line-height: 1.8;">
                {{content}}
              </div>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 32px 32px 32px; text-align: center;">
              <a href="{{buttonUrl}}" style="display: inline-block; background-color: #69ADFF; color: #FFFFFF; font-family: 'Nunito', sans-serif; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 12px; mso-padding-alt: 0;">
                <!--[if mso]><i style="letter-spacing: 32px; mso-font-width: -100%; mso-text-raise: 21pt;">&nbsp;</i><![endif]-->
                <span style="mso-text-raise: 10pt;">{{buttonText}}</span>
                <!--[if mso]><i style="letter-spacing: 32px; mso-font-width: -100%;">&nbsp;</i><![endif]-->
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${footerBlock}
  `),
};

// ─────────────────────────────────────────────────────────────
// Template 2: Promotional
// ─────────────────────────────────────────────────────────────
const promotionalTemplate: DefaultTemplate = {
  name: 'מבצע שיווקי',
  subject: '{{title}}',
  description: 'תבנית שיווקית עם באנר בולט, הדגשת מבצע וכפתור פעולה. מתאימה למבצעים, הנחות ומוצרים חדשים.',
  category: 'promotional',
  content: baseWrapper(`
    ${logoHeader}
    <!-- Main Card -->
    <tr>
      <td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <!-- Promo Banner -->
          <tr>
            <td style="background-color: #303150; padding: 40px 32px; text-align: center;">
              <p style="font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 600; color: #0DBACC; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 12px 0;">
                מבצע מיוחד
              </p>
              <h1 class="hero-title" style="font-family: 'Nunito', sans-serif; font-size: 36px; font-weight: 700; color: #FFFFFF; margin: 0 0 8px 0;">
                {{title}}
              </h1>
            </td>
          </tr>
          <!-- Highlight Box -->
          <tr>
            <td style="padding: 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F5F7; border-radius: 16px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <div style="font-family: 'Nunito', sans-serif; font-size: 15px; color: #303150; line-height: 1.8;">
                      {{content}}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding: 0 32px 32px 32px; text-align: center;">
              <a href="{{buttonUrl}}" style="display: inline-block; background-color: #0DBACC; color: #FFFFFF; font-family: 'Nunito', sans-serif; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 12px;">
                {{buttonText}}
              </a>
            </td>
          </tr>
          <!-- Urgency Note -->
          <tr>
            <td style="padding: 0 32px 32px 32px; text-align: center;">
              <p style="font-family: 'Nunito', sans-serif; font-size: 13px; color: #7E7F90; margin: 0;">
                ⏰ לזמן מוגבל בלבד
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${footerBlock}
  `),
};

// ─────────────────────────────────────────────────────────────
// Template 3: Announcement
// ─────────────────────────────────────────────────────────────
const announcementTemplate: DefaultTemplate = {
  name: 'הודעה חשובה',
  subject: '{{title}}',
  description: 'תבנית נקייה ומקצועית להודעות חשובות, עדכוני מערכת או הכרזות. עיצוב מינימליסטי ובהיר.',
  category: 'announcement',
  content: baseWrapper(`
    ${logoHeader}
    <!-- Main Card -->
    <tr>
      <td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <!-- Top Accent Line -->
          <tr>
            <td style="background: linear-gradient(90deg, #69ADFF, #0DBACC); height: 4px; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>
          <!-- Content -->
          <tr>
            <td class="content-cell" style="padding: 40px 32px;">
              <!-- Icon -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px auto;">
                <tr>
                  <td style="width: 56px; height: 56px; background-color: #69ADFF; border-radius: 16px; text-align: center; vertical-align: middle;">
                    <span style="font-size: 24px; color: #FFFFFF;">📢</span>
                  </td>
                </tr>
              </table>
              <h1 style="font-family: 'Nunito', sans-serif; font-size: 24px; font-weight: 700; color: #303150; margin: 0 0 16px 0; text-align: center;">
                {{title}}
              </h1>
              <div style="font-family: 'Nunito', sans-serif; font-size: 15px; color: #303150; line-height: 1.8;">
                {{content}}
              </div>
            </td>
          </tr>
          <!-- Optional CTA -->
          <tr>
            <td style="padding: 0 32px 32px 32px; text-align: center;">
              <a href="{{buttonUrl}}" style="display: inline-block; background-color: #69ADFF; color: #FFFFFF; font-family: 'Nunito', sans-serif; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 12px;">
                {{buttonText}}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${footerBlock}
  `),
};

// ─────────────────────────────────────────────────────────────
// Template 4: Product Launch / Feature Update
// ─────────────────────────────────────────────────────────────
const productLaunchTemplate: DefaultTemplate = {
  name: 'השקת מוצר / פיצ׳ר חדש',
  subject: '{{title}}',
  description: 'תבנית להשקת מוצר או פיצ׳ר חדש עם הדגשת תכונות עיקריות. מתאימה לעדכוני מוצר והשקות.',
  category: 'promotional',
  content: baseWrapper(`
    ${logoHeader}
    <!-- Main Card -->
    <tr>
      <td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <!-- Hero -->
          <tr>
            <td style="padding: 48px 32px 24px 32px; text-align: center;">
              <p style="font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 600; color: #0DBACC; margin: 0 0 8px 0;">
                🚀 חדש ב-MyNeto
              </p>
              <h1 class="hero-title" style="font-family: 'Nunito', sans-serif; font-size: 30px; font-weight: 700; color: #303150; margin: 0;">
                {{title}}
              </h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td class="content-cell" style="padding: 16px 32px 24px 32px;">
              <div style="font-family: 'Nunito', sans-serif; font-size: 15px; color: #303150; line-height: 1.8;">
                {{content}}
              </div>
            </td>
          </tr>
          <!-- Feature Cards -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="two-col" width="48%" style="vertical-align: top;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F5F7; border-radius: 12px;">
                      <tr>
                        <td style="padding: 20px;">
                          <p style="font-family: 'Nunito', sans-serif; font-size: 20px; margin: 0 0 8px 0;">✨</p>
                          <p style="font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 600; color: #303150; margin: 0 0 4px 0;">
                            תכונה ראשונה
                          </p>
                          <p style="font-family: 'Nunito', sans-serif; font-size: 13px; color: #7E7F90; margin: 0;">
                            תיאור קצר של התכונה הראשונה
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="4%">&nbsp;</td>
                  <td class="two-col" width="48%" style="vertical-align: top;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F5F7; border-radius: 12px;">
                      <tr>
                        <td style="padding: 20px;">
                          <p style="font-family: 'Nunito', sans-serif; font-size: 20px; margin: 0 0 8px 0;">⚡</p>
                          <p style="font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 600; color: #303150; margin: 0 0 4px 0;">
                            תכונה שנייה
                          </p>
                          <p style="font-family: 'Nunito', sans-serif; font-size: 13px; color: #7E7F90; margin: 0;">
                            תיאור קצר של התכונה השנייה
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding: 0 32px 40px 32px; text-align: center;">
              <a href="{{buttonUrl}}" style="display: inline-block; background: linear-gradient(135deg, #69ADFF 0%, #0DBACC 100%); color: #FFFFFF; font-family: 'Nunito', sans-serif; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 12px;">
                {{buttonText}}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${footerBlock}
  `),
};

// ─────────────────────────────────────────────────────────────
// Template 5: Event Invitation
// ─────────────────────────────────────────────────────────────
const eventInvitationTemplate: DefaultTemplate = {
  name: 'הזמנה לאירוע',
  subject: '{{title}}',
  description: 'תבנית הזמנה לאירוע עם פרטי תאריך, מיקום וכפתור אישור הגעה. מתאימה לוובינרים, כנסים ומפגשים.',
  category: 'announcement',
  content: baseWrapper(`
    ${logoHeader}
    <!-- Main Card -->
    <tr>
      <td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <!-- Hero with Pattern -->
          <tr>
            <td style="background-color: #303150; padding: 48px 32px; text-align: center;">
              <p style="font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 600; color: #0DBACC; letter-spacing: 1px; margin: 0 0 12px 0;">
                🎉 הוזמנת!
              </p>
              <h1 class="hero-title" style="font-family: 'Nunito', sans-serif; font-size: 30px; font-weight: 700; color: #FFFFFF; margin: 0;">
                {{title}}
              </h1>
            </td>
          </tr>
          <!-- Event Details -->
          <tr>
            <td class="content-cell" style="padding: 32px;">
              <div style="font-family: 'Nunito', sans-serif; font-size: 15px; color: #303150; line-height: 1.8; margin-bottom: 24px;">
                {{content}}
              </div>
              <!-- Details Cards -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F5F7; border-radius: 16px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="font-size: 16px;">📅</span>
                          <span style="font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 600; color: #303150; margin-right: 8px;">
                            תאריך:
                          </span>
                          <span style="font-family: 'Nunito', sans-serif; font-size: 14px; color: #7E7F90;">
                            יום ד׳, 15 בינואר 2026, 19:00
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="font-size: 16px;">📍</span>
                          <span style="font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 600; color: #303150; margin-right: 8px;">
                            מיקום:
                          </span>
                          <span style="font-family: 'Nunito', sans-serif; font-size: 14px; color: #7E7F90;">
                            אונליין / זום
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="font-size: 16px;">⏱️</span>
                          <span style="font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 600; color: #303150; margin-right: 8px;">
                            משך:
                          </span>
                          <span style="font-family: 'Nunito', sans-serif; font-size: 14px; color: #7E7F90;">
                            כ-60 דקות
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding: 0 32px 40px 32px; text-align: center;">
              <a href="{{buttonUrl}}" style="display: inline-block; background-color: #0DBACC; color: #FFFFFF; font-family: 'Nunito', sans-serif; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 12px;">
                {{buttonText}}
              </a>
              <p style="font-family: 'Nunito', sans-serif; font-size: 13px; color: #7E7F90; margin: 12px 0 0 0;">
                המקומות מוגבלים - שריינו את מקומכם עכשיו
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${footerBlock}
  `),
};

// ─────────────────────────────────────────────────────────────
// Template 6: Simple Text Email
// ─────────────────────────────────────────────────────────────
const simpleTextTemplate: DefaultTemplate = {
  name: 'מייל פשוט - טקסט בלבד',
  subject: '{{title}}',
  description: 'תבנית פשוטה ונקייה לטקסט בלבד. מתאימה למיילים אישיים, עדכונים קצרים או הודעות פשוטות.',
  category: 'newsletter',
  content: baseWrapper(`
    ${logoHeader}
    <!-- Main Card -->
    <tr>
      <td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <!-- Content -->
          <tr>
            <td class="content-cell" style="padding: 40px 32px;">
              <h1 style="font-family: 'Nunito', sans-serif; font-size: 24px; font-weight: 700; color: #303150; margin: 0 0 20px 0;">
                {{title}}
              </h1>
              <div style="font-family: 'Nunito', sans-serif; font-size: 15px; color: #303150; line-height: 1.8;">
                {{content}}
              </div>
            </td>
          </tr>
          <!-- Optional CTA -->
          <tr>
            <td style="padding: 0 32px 40px 32px;">
              <a href="{{buttonUrl}}" style="display: inline-block; background-color: #69ADFF; color: #FFFFFF; font-family: 'Nunito', sans-serif; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 12px;">
                {{buttonText}}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${footerBlock}
  `),
};

// ─────────────────────────────────────────────────────────────
// Template 7: Course Lesson 1 Promotion
// ─────────────────────────────────────────────────────────────
const courseLesson1Template: DefaultTemplate = {
  name: 'פרסום שיעור 1',
  subject: '{{title}}',
  description: 'תבנית לפרסום פרק 1 בסדרת הסרטונים "המסלול הבטוח". כוללת הודעה אישית עם שם המשתמש, תיאור הפרק וכפתור צפייה.',
  category: 'promotional',
  content: `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>MyNeto</title>
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
          <tr>
            <td align="center" style="padding:0 0 28px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:'Heebo',sans-serif;font-size:26px;font-weight:800;color:#303150;letter-spacing:-0.5px;">
                    My<span style="color:#69ADFF;">Neto</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 2px 24px rgba(0,0,0,0.06);">
                <tr>
                  <td style="background:#69ADFF;height:4px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:28px 32px 0 32px;">
                    
                  </td>
                </tr>
                
        <tr>
          <td class="content-cell" style="padding:24px 32px 0 32px;">
            <h1 class="hero-title" style="font-family:'Heebo',sans-serif;font-size:26px;font-weight:800;color:#303150;margin:0 0 20px 0;line-height:1.4;">
              הצעד הבא בדרך ליעדים שלך
            </h1>
            <div class="body-text" style="font-family:'Heebo',sans-serif;font-size:16px;color:#4A4A5A;line-height:1.9;">
               <p style="margin:0 0 16px 0;">שלום [שם המשתמש],</p>
              
              <p style="margin:0 0 16px 0;">
                הזנת את הנתונים שלך למערכת – וזה צעד ראשון וחשוב בדרך לעשות סדר אמיתי במספרים.
              </p>
              
              <p style="margin:0 0 16px 0;">
                אנחנו עובדים כל הזמן על שדרוג הפלטפורמה, ובעזרת השם, בהמשך השבוע תעלה למערכת אפשרות חדשה: <strong style="color:#303150;">הפקת דוחות סיכום חודשיים.</strong>
              </p>
              
              <p style="margin:0 0 16px 0;">
                הדוחות האלו ינתחו באופן אוטומטי לחלוטין – באמצעות טכנולוגיית AI מתקדמת – את תזרים המזומנים שלך ואת קצב ההתקדמות ליעדים שהגדרת (הכל כמובן נשאר פרטי ומוצפן, רק לעיניך).
              </p>
              
              <p style="margin:0 0 16px 0;">
                <strong style="color:#303150;">ובינתיים?</strong><br>
                עד שהפיצ'ר החדש יעלה והמדריך המלא לפתיחת תיק מסחר יישלח אליך, לא רצינו שתחכה.
              </p>
              
              <p style="margin:0 0 16px 0;">
                פתחנו עבורך גישה מיידית לפרק הראשון בסדרת הסרטונים שלנו – <strong style="color:#303150;">"המסלול הבטוח"</strong>.
              </p>
              
              <p style="margin:0 0 16px 0;">
                כולנו חולמים לחתן את הילדים בכבוד ולחיות במנוחת הנפש. בפרק הראשון נדבר על העיקרון היחיד שהופך גם חיסכון קטן לסכום כסף משמעותי שגדל מעצמו:<br>
                <strong style="color:#303150;">אפקט "כדור השלג" של הכסף.</strong>
              </p>
              
              <p style="margin:0 0 16px 0;">
                בלי מושגים מסובכים, בלי מילים מפוצצות. רק עיקרון אחד פשוט שחובה להכיר.
              </p>
            </div>
          </td>
        </tr>
        
  <tr>
    <td style="padding:8px 32px 0 32px;text-align:center;">
      <a href="https://www.myneto.co.il/courses?lesson=l-1" style="display:inline-block;background:#69ADFF;color:#FFFFFF;font-family:'Heebo',sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;letter-spacing:0.2px;">
        צפייה בפרק 1 (3:24 דק׳)
      </a>
    </td>
  </tr>
        <tr>
          <td style="padding:20px 32px 0 32px;">
            <p style="font-family:'Heebo',sans-serif;font-size:15px;color:#4A4A5A;line-height:1.8;margin:0;">
              צפייה מועילה,<br>
              <strong style="color:#303150;">צוות MyNeto</strong>
            </p>
          </td>
        </tr>
                <tr>
                  <td style="padding:8px 32px 28px 32px;">
                    
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 8px 0;">
    <tr><td style="width:20%;padding:0 2px;"><div style="height:4px;border-radius:2px;background:#69ADFF;"></div></td><td style="width:20%;padding:0 2px;"><div style="height:4px;border-radius:2px;background:#E8E8ED;"></div></td><td style="width:20%;padding:0 2px;"><div style="height:4px;border-radius:2px;background:#E8E8ED;"></div></td><td style="width:20%;padding:0 2px;"><div style="height:4px;border-radius:2px;background:#E8E8ED;"></div></td><td style="width:20%;padding:0 2px;"><div style="height:4px;border-radius:2px;background:#E8E8ED;"></div></td></tr>
  </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 0 0 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;padding:16px;">
                    <p style="font-family:'Heebo',sans-serif;font-size:12px;color:#BDBDCB;margin:0;line-height:1.8;">
                      קיבלת מייל זה כי נרשמת ל-MyNeto<br>
                      &copy; 2026 MyNeto. כל הזכויות שמורות.
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
</html>`,
};

// ─────────────────────────────────────────────────────────────
// Export all templates
// ─────────────────────────────────────────────────────────────
export const defaultTemplates: DefaultTemplate[] = [
  newsletterTemplate,
  promotionalTemplate,
  announcementTemplate,
  productLaunchTemplate,
  eventInvitationTemplate,
  simpleTextTemplate,
  courseLesson1Template,
];

/**
 * Category labels for display in the UI
 */
export const categoryLabels: Record<string, string> = {
  newsletter: 'ניוזלטר',
  promotional: 'שיווקי',
  announcement: 'הודעה',
};

/**
 * Template variable documentation
 */
export const templateVariables = [
  { name: '{{title}}', description: 'כותרת ראשית של המייל' },
  { name: '{{content}}', description: 'תוכן המייל (תומך ב-HTML)' },
  { name: '{{buttonText}}', description: 'טקסט כפתור הפעולה' },
  { name: '{{buttonUrl}}', description: 'קישור כפתור הפעולה' },
  { name: '{{preheader}}', description: 'טקסט תצוגה מקדימה בתיבת הדואר' },
  { name: '[שם המשתמש]', description: 'שם המשתמש - מוחלף אוטומטית בשליחת קמפיין' },
];

/**
 * Replace template variables with actual values
 */
export function replaceTemplateVariables(
  templateContent: string,
  variables: Record<string, string>
): string {
  let result = templateContent;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = key.startsWith('{{') ? key : `{{${key}}}`;
    result = result.replace(new RegExp(escapeRegex(placeholder), 'g'), value);
  }
  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

