/**
 * Generates the HTML email body for periodic report delivery.
 * Uses inline CSS for maximum email client compatibility.
 */
export function generateReportEmailHTML(
  userName: string,
  periodLabel: string,
): string {
  const displayName = userName || 'משתמש/ת יקר/ה';

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, Tahoma, 'Helvetica Neue', sans-serif; direction: rtl;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background-color: #3A5BA0; padding: 28px 32px; text-align: center;">
              <span style="color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 1px;">MyNeto</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #1A1A2E; line-height: 1.7;">
                שלום ${displayName},
              </p>
              <p style="margin: 0 0 20px 0; font-size: 15px; color: #333333; line-height: 1.7;">
                מצורף הדוח הפיננסי התקופתי שלך עבור <strong>${periodLabel}</strong>.
              </p>

              <!-- Security notice -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td style="background-color: #f0f4fa; border-radius: 8px; padding: 20px 24px; border-right: 4px solid #3A5BA0;">
                    <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #1A1A2E;">
                      🔒 הקובץ מוצפן לאבטחתך
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #555555; line-height: 1.6;">
                      כדי לפתוח את הדוח, הזן/י את הסיסמה הזמנית שהגדרת בעת יצירת הדוח.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px 0; font-size: 15px; color: #333333; line-height: 1.7;">
                בברכה,
              </p>
              <p style="margin: 0; font-size: 15px; color: #333333; font-weight: 600;">
                צוות MyNeto
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #888888; line-height: 1.5;">
                הודעה זו נשלחה באופן אוטומטי ממערכת MyNeto.
                <br>
                אין להשיב להודעה זו.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
