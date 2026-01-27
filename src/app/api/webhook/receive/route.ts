/**
 * Resend Webhook Receiver
 * Handles incoming email webhooks and forwards them
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

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
    attachments?: Array<{
      id: string;
      filename: string;
      content_type: string;
      content_disposition: string;
      content_id?: string;
    }>;
  };
}

async function verifyWebhookSignature(
  request: NextRequest
): Promise<{ valid: boolean; payload?: EmailReceivedEvent; rawBody?: string }> {
  try {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[Webhook] RESEND_WEBHOOK_SECRET not configured');
      return { valid: false };
    }

    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.warn('[Webhook] Missing Svix headers');
      return { valid: false };
    }

    const rawBody = await request.text();

    const resend = getResend();
    if (!resend) {
      console.error('[Webhook] Resend client not initialized - RESEND_API_KEY missing');
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

      return { valid: true, payload, rawBody };
    } catch (verifyError) {
      console.error('[Webhook] Signature verification failed:', verifyError);
      return { valid: false };
    }
  } catch (error) {
    console.error('[Webhook] Verification error:', error);
    return { valid: false };
  }
}

function extractEmailAddress(fromString: string): string {
  const match = fromString.match(/<([^>]+)>/);
  return match ? match[1] : fromString;
}

async function getEmailContent(emailId: string) {
  try {
    const response = await fetch(
      `https://api.resend.com/emails/${emailId}/received`,
      {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Webhook] Email content fetch failed:', response.status, errorText);
      throw new Error(`Failed to fetch email: ${response.status}`);
    }

    const emailContent = await response.json();
    console.log('[Webhook] Email content fetched:', { 
      hasHtml: !!emailContent.html, 
      hasText: !!emailContent.text,
      keys: Object.keys(emailContent)
    });
    return emailContent;
  } catch (error) {
    console.error('[Webhook] Failed to get email content:', error);
    throw error;
  }
}

async function downloadAttachment(emailId: string, attachmentId: string): Promise<Buffer> {
  const response = await fetch(
    `https://api.resend.com/emails/${emailId}/attachments/${attachmentId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to download attachment: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function forwardEmail(event: EmailReceivedEvent) {
  const resend = getResend();
  if (!resend) {
    throw new Error('Resend client not initialized');
  }

  const forwardTo = getForwardToEmail();
  const { email_id, from, to, subject, attachments } = event.data;
  const senderEmail = extractEmailAddress(from);

  console.log('[Webhook] Starting email forward:', {
    emailId: email_id,
    from: senderEmail,
    to: to.join(', '),
    subject,
    forwardTo,
    attachmentsCount: attachments?.length || 0,
  });

  // Fetch full email content
  let emailContent: { html?: string; text?: string } = {};
  try {
    emailContent = await getEmailContent(email_id);
  } catch (error) {
    console.error('[Webhook] Failed to fetch email content:', error);
  }

  // Prepare attachments
  const forwardAttachments: Array<{ filename: string; content: Buffer }> = [];

  if (attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      try {
        const content = await downloadAttachment(email_id, attachment.id);
        forwardAttachments.push({
          filename: attachment.filename,
          content,
        });
        console.log(`[Webhook] Downloaded attachment: ${attachment.filename}`);
      } catch (error) {
        console.error(`[Webhook] Failed to download attachment ${attachment.filename}:`, error);
      }
    }
  }

  // Build HTML body
  const htmlBody = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif;">
  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 16px; border-right: 4px solid #3b82f6;">
    <h3 style="margin: 0 0 8px 0; color: #1e40af;">📧 הודעה מועברת</h3>
    <table style="font-size: 14px; color: #374151;">
      <tr><td style="padding: 4px 8px 4px 0; font-weight: bold;">מאת:</td><td>${from}</td></tr>
      <tr><td style="padding: 4px 8px 4px 0; font-weight: bold;">תאריך:</td><td>${new Date(event.created_at).toLocaleString('he-IL')}</td></tr>
      <tr><td style="padding: 4px 8px 4px 0; font-weight: bold;">נושא:</td><td>${subject}</td></tr>
      <tr><td style="padding: 4px 8px 4px 0; font-weight: bold;">נשלח אל:</td><td>${to.join(', ')}</td></tr>
      ${forwardAttachments.length > 0 ? `<tr><td style="padding: 4px 8px 4px 0; font-weight: bold;">קבצים מצורפים:</td><td>${forwardAttachments.map(a => a.filename).join(', ')}</td></tr>` : ''}
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
  console.log('[Webhook] Sending forward email...');
  
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
    console.error('[Webhook] Email send failed:', result.error);
    throw new Error(`Email send failed: ${result.error.message}`);
  }

  console.log('[Webhook] Email forwarded successfully:', {
    emailId: email_id,
    forwardedId: result.data?.id,
  });

  return result;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check required env vars
    if (!process.env.RESEND_API_KEY) {
      console.error('[Webhook] RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    if (!process.env.EMAIL_FORWARD_TO) {
      console.error('[Webhook] EMAIL_FORWARD_TO not configured');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    // Verify webhook signature
    const verification = await verifyWebhookSignature(request);

    if (!verification.valid || !verification.payload) {
      console.warn('[Webhook] Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = verification.payload;

    if (event.type !== 'email.received') {
      console.log('[Webhook] Ignoring event:', event.type);
      return NextResponse.json({ received: true });
    }

    console.log('[Webhook] Received email:', {
      emailId: event.data.email_id,
      from: event.data.from,
      to: event.data.to,
      subject: event.data.subject,
    });

    // Forward email and wait for result
    try {
      await forwardEmail(event);
    } catch (forwardError) {
      console.error('[Webhook] Forward failed:', forwardError);
      // Still return 200 so Resend doesn't retry (we logged the error)
    }

    const duration = Date.now() - startTime;
    console.log(`[Webhook] Completed in ${duration}ms`);

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  const hasApiKey = !!process.env.RESEND_API_KEY;
  const hasWebhookSecret = !!process.env.RESEND_WEBHOOK_SECRET;
  const hasForwardTo = !!process.env.EMAIL_FORWARD_TO;

  return NextResponse.json({
    status: 'ok',
    config: {
      apiKey: hasApiKey ? 'configured' : 'missing',
      webhookSecret: hasWebhookSecret ? 'configured' : 'missing',
      forwardTo: hasForwardTo ? 'configured' : 'missing',
    },
  });
}
