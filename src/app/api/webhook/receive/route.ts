/**
 * Resend Webhook Receiver - Email Forwarding
 * 
 * Receives emails sent to @myneto.co.il domain via Resend webhook
 * and forwards them to yairbarak22@gmail.com with full content and attachments.
 * 
 * Webhook URL: https://www.myneto.co.il/api/webhook/receive
 * Event: email.received
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Destination email for forwarding
const FORWARD_TO_EMAIL = 'yairbarak22@gmail.com';

// Lazy initialization of Resend client
let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
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

/**
 * Verify webhook signature from Resend
 * Uses Svix headers for verification
 */
async function verifyWebhookSignature(
  request: NextRequest
): Promise<{ valid: boolean; payload?: EmailReceivedEvent; rawBody?: string }> {
  try {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[Webhook] RESEND_WEBHOOK_SECRET not configured');
      return { valid: false };
    }

    // Get Svix headers
    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.warn('[Webhook] Missing Svix headers');
      return { valid: false };
    }

    // Get raw body
    const rawBody = await request.text();

    // Verify using Resend SDK
    const resend = getResend();
    if (!resend) {
      console.error('[Webhook] Resend client not initialized');
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

/**
 * Extract email address from "Name <email>" format
 */
function extractEmailAddress(fromString: string): string {
  const match = fromString.match(/<([^>]+)>/);
  return match ? match[1] : fromString;
}

/**
 * Extract sender name from "Name <email>" format
 */
function extractSenderName(fromString: string): string {
  const match = fromString.match(/^([^<]+)</);
  return match ? match[1].trim() : fromString;
}

/**
 * Fetch full email content from Resend API
 */
async function getEmailContent(emailId: string) {
  const resend = getResend();
  if (!resend) {
    throw new Error('Resend client not initialized');
  }

  try {
    // Fetch email content using the correct API method
    const response = await fetch(
      `https://api.resend.com/emails/${emailId}/received`,
      {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch email: ${response.status}`);
    }

    const emailContent = await response.json();
    return emailContent;
  } catch (error) {
    console.error('[Webhook] Failed to get email content:', error);
    throw error;
  }
}

/**
 * Download attachment content
 */
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

/**
 * Forward email to destination
 */
async function forwardEmail(event: EmailReceivedEvent) {
  const resend = getResend();
  if (!resend) {
    throw new Error('Resend client not initialized');
  }

  const { email_id, from, to, subject, attachments } = event.data;
  const senderEmail = extractEmailAddress(from);
  const senderName = extractSenderName(from);

  console.log('[Webhook] Forwarding email:', {
    emailId: email_id,
    from: senderEmail,
    to: to.join(', '),
    subject,
    attachmentsCount: attachments?.length || 0,
  });

  // Fetch full email content (body)
  let emailContent: { html?: string; text?: string } = {};
  try {
    emailContent = await getEmailContent(email_id);
  } catch (error) {
    console.error('[Webhook] Failed to fetch email content, forwarding without body:', error);
  }

  // Prepare attachments
  const forwardAttachments: Array<{
    filename: string;
    content: Buffer;
  }> = [];

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

  // Build forwarding header
  const forwardingHeader = `
---------- הודעה מועברת ----------
מאת: ${from}
תאריך: ${new Date(event.created_at).toLocaleString('he-IL')}
נושא: ${subject}
נשלח אל: ${to.join(', ')}
----------------------------------

`;

  // Build HTML body with forwarding header
  const htmlBody = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif;">
  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 16px; border-right: 4px solid #3b82f6;">
    <h3 style="margin: 0 0 8px 0; color: #1e40af;">📧 הודעה מועברת מ-myneto.co.il</h3>
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

  // Build text body
  const textBody = forwardingHeader + (emailContent.text || emailContent.html?.replace(/<[^>]*>/g, '') || '(לא ניתן לטעון את תוכן ההודעה)');

  // Send forwarded email
  const result = await resend.emails.send({
    from: 'NETO Forwarding <onboarding@resend.dev>',
    to: FORWARD_TO_EMAIL,
    replyTo: senderEmail,
    subject: `[myneto.co.il] ${subject}`,
    html: htmlBody,
    text: textBody,
    attachments: forwardAttachments.map(a => ({
      filename: a.filename,
      content: a.content,
    })),
  });

  console.log('[Webhook] Email forwarded successfully:', {
    emailId: email_id,
    forwardedId: result.data?.id,
    to: FORWARD_TO_EMAIL,
  });

  return result;
}

/**
 * POST /api/webhook/receive
 * Handles incoming email webhooks from Resend
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify webhook signature
    const verification = await verifyWebhookSignature(request);

    if (!verification.valid || !verification.payload) {
      console.warn('[Webhook] Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = verification.payload;

    // Only process email.received events
    if (event.type !== 'email.received') {
      console.log('[Webhook] Ignoring non-email.received event:', event.type);
      return NextResponse.json({ received: true });
    }

    console.log('[Webhook] Received email event:', {
      emailId: event.data.email_id,
      from: event.data.from,
      to: event.data.to,
      subject: event.data.subject,
      timestamp: event.created_at,
    });

    // Forward email (fire-and-forget for quick webhook response)
    forwardEmail(event).catch(error => {
      console.error('[Webhook] Error forwarding email:', error);
    });

    // Return success immediately
    const duration = Date.now() - startTime;
    console.log(`[Webhook] Processed in ${duration}ms`);

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhook/receive
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'email-webhook-receiver',
    forwardTo: FORWARD_TO_EMAIL,
  });
}

