/**
 * Resend Webhook Receiver
 * Handles incoming email webhooks: saves to DB and forwards them
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { isValidEmail, escapeHtml } from '@/lib/contactValidation';
import { prisma } from '@/lib/prisma';
import { generateThreadId, extractEmailAddress as extractEmail } from '@/lib/inbox/constants';

// Lazy initialization of Resend client
let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

function getForwardToEmail(): string {
  const email = process.env.EMAIL_FORWARD_TO;
  if (!email) {
    throw new Error('EMAIL_FORWARD_TO not configured');
  }
  return email;
}

interface EmailReceivedEvent {
  type: 'email.received';
  created_at: string;
  data: {
    email_id: string;
    created_at: string;
    from: string;
    to: string[];
    bcc: string[];
    cc: string[];
    message_id: string;
    subject: string;
  };
}

async function verifyWebhookSignature(
  request: NextRequest
): Promise<{ valid: boolean; payload?: EmailReceivedEvent }> {
  try {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return { valid: false };
    }

    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      return { valid: false };
    }

    const rawBody = await request.text();
    const resend = getResend();
    if (!resend) {
      return { valid: false };
    }

    try {
      const payload = resend.webhooks.verify({
        payload: rawBody,
        headers: {
          id: svixId,
          timestamp: svixTimestamp,
          signature: svixSignature,
        },
        webhookSecret,
      }) as EmailReceivedEvent;

      return { valid: true, payload };
    } catch {
      return { valid: false };
    }
  } catch {
    return { valid: false };
  }
}

function extractEmailAddress(fromString: string): string {
  const match = fromString.match(/<([^>]+)>/);
  const email = match ? match[1] : fromString.trim();
  
  // SECURITY: Validate email format to prevent injection attacks
  if (!isValidEmail(email)) {
    throw new Error(`Invalid email format: ${email}`);
  }
  
  return email;
}

async function getEmailContent(emailId: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const response = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

async function downloadAttachmentFromUrl(downloadUrl: string): Promise<Buffer> {
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error(`Failed to download attachment: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function getAttachments(emailId: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch(`https://api.resend.com/emails/receiving/${emailId}/attachments`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data?.data || [];
  } catch {
    return [];
  }
}

/**
 * Save incoming email to database for inbox feature
 */
async function saveToInbox(
  event: EmailReceivedEvent,
  emailContent: { html?: string; text?: string }
): Promise<void> {
  const { email_id, from, to, cc, bcc, subject } = event.data;
  const senderEmail = extractEmail(from);
  const threadId = generateThreadId(subject, senderEmail);

  try {
    await prisma.inboxMessage.create({
      data: {
        resendEmailId: email_id,
        from,
        fromEmail: senderEmail,
        to,
        cc: cc || [],
        bcc: bcc || [],
        subject,
        htmlBody: emailContent.html || null,
        textBody: emailContent.text || null,
        direction: 'inbound',
        threadId,
        isRead: false,
        isStarred: false,
        isArchived: false,
      },
    });
    console.log(`[Webhook] Saved email ${email_id} to inbox`);
  } catch (error: unknown) {
    // Handle duplicate (resendEmailId unique constraint)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      console.log(`[Webhook] Duplicate email ${email_id}, skipping inbox save`);
    } else {
      console.error('[Webhook] Failed to save to inbox:', error);
    }
  }
}

async function forwardEmail(event: EmailReceivedEvent, emailContent: { html?: string; text?: string }) {
  const resend = getResend();
  if (!resend) {
    throw new Error('Resend client not initialized');
  }

  const forwardTo = getForwardToEmail();
  const { from, to, subject } = event.data;
  const senderEmail = extractEmailAddress(from);

  // Prepare attachments
  const forwardAttachments: Array<{ filename: string; content: Buffer }> = [];
  try {
    const attachmentsList = await getAttachments(event.data.email_id);
    for (const attachment of attachmentsList) {
      if (attachment.download_url) {
        try {
          const content = await downloadAttachmentFromUrl(attachment.download_url);
          forwardAttachments.push({ filename: escapeHtml(attachment.filename), content });
        } catch {
          // Skip failed attachments
        }
      }
    }
  } catch {
    // Continue without attachments
  }

  // SECURITY: Escape all user-provided data for HTML template
  const safeFrom = escapeHtml(from);
  const safeSubject = escapeHtml(subject);
  const safeTo = to.map(t => escapeHtml(t)).join(', ');
  const safeDate = escapeHtml(new Date(event.created_at).toLocaleString('he-IL'));
  const safeAttachmentNames = forwardAttachments.map(a => a.filename).join(', ');

  // Build HTML body
  const htmlBody = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif;">
  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 16px; border-right: 4px solid #3b82f6;">
    <h3 style="margin: 0 0 8px 0; color: #1e40af;">📧 הודעה מועברת</h3>
    <table style="font-size: 14px; color: #374151;">
      <tr><td style="padding: 4px 8px 4px 0; font-weight: bold;">מאת:</td><td>${safeFrom}</td></tr>
      <tr><td style="padding: 4px 8px 4px 0; font-weight: bold;">תאריך:</td><td>${safeDate}</td></tr>
      <tr><td style="padding: 4px 8px 4px 0; font-weight: bold;">נושא:</td><td>${safeSubject}</td></tr>
      <tr><td style="padding: 4px 8px 4px 0; font-weight: bold;">נשלח אל:</td><td>${safeTo}</td></tr>
      ${forwardAttachments.length > 0 ? `<tr><td style="padding: 4px 8px 4px 0; font-weight: bold;">קבצים מצורפים:</td><td>${safeAttachmentNames}</td></tr>` : ''}
    </table>
  </div>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">
  <div>
    ${emailContent.html || emailContent.text?.replace(/\n/g, '<br>') || '<p style="color: #9ca3af;">(לא ניתן לטעון את תוכן ההודעה)</p>'}
  </div>
</body>
</html>
`;

  const textBody = `
---------- הודעה מועברת ----------
מאת: ${from}
תאריך: ${new Date(event.created_at).toLocaleString('he-IL')}
נושא: ${subject}
נשלח אל: ${to.join(', ')}
----------------------------------

${emailContent.text || emailContent.html?.replace(/<[^>]*>/g, '') || '(לא ניתן לטעון את תוכן ההודעה)'}
`;

  // Send forwarded email
  const result = await resend.emails.send({
    from: 'NETO <onboarding@resend.dev>',
    to: forwardTo,
    replyTo: senderEmail,
    subject: `[myneto.co.il] ${subject}`,
    html: htmlBody,
    text: textBody,
    attachments: forwardAttachments.map(a => ({
      filename: a.filename,
      content: a.content,
    })),
  });

  if (result.error) {
    throw new Error(`Email send failed: ${result.error.message}`);
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FORWARD_TO) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const verification = await verifyWebhookSignature(request);
    if (!verification.valid || !verification.payload) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = verification.payload;
    if (event.type !== 'email.received') {
      return NextResponse.json({ received: true });
    }

    // Fetch email content once (used for both DB save and forwarding)
    let emailContent: { html?: string; text?: string } = {};
    try {
      emailContent = await getEmailContent(event.data.email_id) || {};
    } catch (error) {
      console.error('[Webhook] Failed to fetch email content:', error);
    }

    // Save to inbox database (async, don't block on failure)
    try {
      await saveToInbox(event, emailContent);
    } catch (error) {
      console.error('[Webhook] Inbox save failed:', error);
    }

    // Forward email (existing behavior)
    try {
      await forwardEmail(event, emailContent);
    } catch (error) {
      console.error('[Webhook] Forward failed:', error);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
