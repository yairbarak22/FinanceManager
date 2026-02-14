/**
 * Resend Integration for Marketing Emails
 * Handles sending campaign emails via Resend API
 */

import { Resend } from 'resend';
import { config } from '@/lib/config';

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!resendClient && config.resendApiKey) {
    resendClient = new Resend(config.resendApiKey);
  }
  return resendClient;
}

export interface SendCampaignEmailParams {
  to: string;
  subject: string;
  html: string;
  campaignId: string;
  userId: string | null; // null for external emails from CSV
}

export interface SendTestEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Generate unsubscribe URL for a user
 */
function getUnsubscribeUrl(userId: string | null, email?: string): string {
  const baseUrl = config.nextAuthUrl;
  if (userId && !userId.startsWith('external-')) {
    return `${baseUrl}/api/marketing/unsubscribe?userId=${userId}`;
  }
  // For external emails (from CSV), use email-based unsubscribe
  if (email) {
    return `${baseUrl}/api/marketing/unsubscribe-email?email=${encodeURIComponent(email)}`;
  }
  return `${baseUrl}/api/marketing/unsubscribe`;
}

/**
 * Add unsubscribe link to email HTML
 */
function addUnsubscribeLink(html: string, userId: string | null, email?: string): string {
  const unsubscribeUrl = getUnsubscribeUrl(userId, email);
  const unsubscribeLink = `
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #F7F7F8; text-align: center;">
      <p style="color: #BDBDCB; font-size: 12px; margin: 0 0 8px 0;">
        לא מעוניין לקבל עוד מיילים שיווקיים?
      </p>
      <a href="${unsubscribeUrl}" style="color: #69ADFF; font-size: 12px; text-decoration: none;">
        ביטול מנוי
      </a>
    </div>
  `;
  
  // Insert before closing body tag, or append if no body tag
  if (html.includes('</body>')) {
    return html.replace('</body>', `${unsubscribeLink}</body>`);
  }
  return html + unsubscribeLink;
}

/**
 * Send a single campaign email
 * Returns Resend email ID on success
 */
export async function sendCampaignEmail(
  params: SendCampaignEmailParams
): Promise<{ id: string } | { error: string }> {
  const resend = getResend();
  if (!resend) {
    return { error: 'Resend API key not configured' };
  }

  try {
    // Add unsubscribe link
    const htmlWithUnsubscribe = addUnsubscribeLink(params.html, params.userId, params.to);

    const result = await resend.emails.send({
      from: 'myneto <admin@myneto.co.il>',
      to: params.to,
      subject: params.subject,
      html: htmlWithUnsubscribe,
      tags: [
        { name: 'campaign_id', value: params.campaignId },
        { name: 'user_id', value: params.userId || 'external' },
        { name: 'type', value: 'marketing' },
      ],
    });

    if (result.error) {
      console.error('[Marketing] Resend error:', result.error);
      return { error: result.error.message || 'Failed to send email' };
    }

    if (!result.data?.id) {
      return { error: 'No email ID returned from Resend' };
    }

    return { id: result.data.id };
  } catch (error) {
    console.error('[Marketing] Send email error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send batch emails (up to 100 per batch)
 * Resend supports up to 100 recipients per batch
 */
export async function sendBatchEmails(
  emails: Array<{ to: string; subject: string; html: string; campaignId: string; userId: string | null }>
): Promise<Array<{ email: string; id?: string; error?: string }>> {
  const resend = getResend();
  if (!resend) {
    return emails.map((e) => ({ email: e.to, error: 'Resend API key not configured' }));
  }

  // Resend batch API allows up to 100 emails
  const BATCH_SIZE = 100;
  const results: Array<{ email: string; id?: string; error?: string }> = [];

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    
    try {
      // Send each email individually (Resend doesn't have a true batch API)
      // But we can parallelize for better performance
      const batchResults = await Promise.allSettled(
        batch.map(async (email) => {
          const htmlWithUnsubscribe = addUnsubscribeLink(email.html, email.userId, email.to);
          const result = await resend.emails.send({
            from: 'myneto <admin@myneto.co.il>',
            to: email.to,
            subject: email.subject,
            html: htmlWithUnsubscribe,
            tags: [
              { name: 'campaign_id', value: email.campaignId },
              { name: 'user_id', value: email.userId || 'external' },
              { name: 'type', value: 'marketing' },
            ],
          });

          if (result.error) {
            return { email: email.to, error: result.error.message || 'Failed to send' };
          }
          return { email: email.to, id: result.data?.id };
        })
      );

      // Process results
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({ email: batch[index].to, error: result.reason?.message || 'Unknown error' });
        }
      });

      // Rate limiting: wait a bit between batches to avoid hitting limits
      if (i + BATCH_SIZE < emails.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
      }
    } catch (error) {
      // If batch fails, mark all as failed
      batch.forEach((email) => {
        results.push({
          email: email.to,
          error: error instanceof Error ? error.message : 'Batch send failed',
        });
      });
    }
  }

  return results;
}

/**
 * Send a test email (to admin)
 * Does not include unsubscribe link
 */
export async function sendTestEmail(params: SendTestEmailParams): Promise<{ id: string } | { error: string }> {
  const resend = getResend();
  if (!resend) {
    return { error: 'Resend API key not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: 'myneto <admin@myneto.co.il>',
      to: params.to,
      subject: `[בדיקה] ${params.subject}`,
      html: params.html,
      tags: [
        { name: 'type', value: 'test' },
      ],
    });

    if (result.error) {
      return { error: result.error.message || 'Failed to send test email' };
    }

    if (!result.data?.id) {
      return { error: 'No email ID returned from Resend' };
    }

    return { id: result.data.id };
  } catch (error) {
    console.error('[Marketing] Send test email error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

