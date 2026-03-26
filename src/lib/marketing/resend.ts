/**
 * Resend Integration for Marketing Emails
 * Handles sending campaign emails via Resend API
 */

import { Resend } from 'resend';
import { config } from '@/lib/config';
import { getSenderDisplay } from '@/lib/inbox/constants';
import { buildUnsubscribeUrl } from '@/lib/marketing/unsubscribeToken';

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

export interface SendWorkflowEmailParams {
  to: string;
  subject: string;
  html: string;
  userId: string;
  workflowId: string;
  nodeId: string;
  from?: string;
}

export interface SendTestEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

function getUnsubscribeUrl(userId: string | null, email?: string): string {
  if (userId && !userId.startsWith('external-')) {
    return buildUnsubscribeUrl(userId);
  }
  const baseUrl = config.nextAuthUrl;
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
      from: 'MyNeto <admin@myneto.co.il>',
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
 * Send a workflow automation email via Resend.
 * Tags include workflow_id / node_id so webhooks can route events back.
 */
export async function sendWorkflowEmail(
  params: SendWorkflowEmailParams,
): Promise<{ id: string } | { error: string }> {
  const resend = getResend();
  if (!resend) {
    return { error: 'Resend API key not configured' };
  }

  try {
    const htmlWithUnsubscribe = addUnsubscribeLink(params.html, params.userId, params.to);

    const result = await resend.emails.send({
      from: params.from || DEFAULT_FROM,
      to: params.to,
      subject: params.subject,
      html: htmlWithUnsubscribe,
      tags: [
        { name: 'workflow_id', value: params.workflowId },
        { name: 'node_id', value: params.nodeId },
        { name: 'user_id', value: params.userId },
        { name: 'type', value: 'workflow' },
      ],
    });

    if (result.error) {
      console.error('[Workflow] Resend error:', result.error);
      return { error: result.error.message || 'Failed to send email' };
    }

    if (!result.data?.id) {
      return { error: 'No email ID returned from Resend' };
    }

    return { id: result.data.id };
  } catch (error) {
    console.error('[Workflow] Send email error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export interface SendBatchOptions {
  /** Spread sending over X minutes to improve deliverability */
  spreadDurationMinutes?: number;
  /** Emails sent in parallel per chunk (default 2; gradual mode defaults to 1) */
  concurrency?: number;
  /** Resend "from" display string, e.g. "MyNeto <support@myneto.co.il>" */
  from?: string;
}

const DEFAULT_CONCURRENCY = 2;
const DEFAULT_DELAY_MS = 600;
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;

/**
 * Send a single email with retry on 429 (rate limit)
 */
const DEFAULT_FROM = 'MyNeto <admin@myneto.co.il>';

async function sendSingleWithRetry(
  resend: Resend,
  email: { to: string; subject: string; html: string; campaignId: string; userId: string | null; variantId?: string },
  from?: string,
): Promise<{ email: string; id?: string; error?: string }> {
  const htmlWithUnsubscribe = addUnsubscribeLink(email.html, email.userId, email.to);

  const tags: Array<{ name: string; value: string }> = [
    { name: 'campaign_id', value: email.campaignId },
    { name: 'user_id', value: email.userId || 'external' },
    { name: 'type', value: 'marketing' },
  ];
  if (email.variantId) {
    tags.push({ name: 'variant_id', value: email.variantId });
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await resend.emails.send({
        from: from || DEFAULT_FROM,
        to: email.to,
        subject: email.subject,
        html: htmlWithUnsubscribe,
        tags,
      });

      if (result.error) {
        const msg = result.error.message || '';
        const isRateLimit = msg.toLowerCase().includes('rate') || msg.includes('429') || msg.includes('Too many');
        if (isRateLimit && attempt < MAX_RETRIES) {
          const backoff = RETRY_DELAY_MS * (attempt + 1);
          console.warn(`[Marketing] Rate limited on ${email.to}, retrying in ${backoff}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
        return { email: email.to, error: msg || 'Failed to send' };
      }

      return { email: email.to, id: result.data?.id };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      const isRateLimit = msg.toLowerCase().includes('rate') || msg.includes('429');
      if (isRateLimit && attempt < MAX_RETRIES) {
        const backoff = RETRY_DELAY_MS * (attempt + 1);
        console.warn(`[Marketing] Rate limited on ${email.to}, retrying in ${backoff}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      return { email: email.to, error: msg };
    }
  }

  return { email: email.to, error: 'Max retries exceeded' };
}

/**
 * Send batch emails with rate limiting.
 * When `spreadDurationMinutes` is set the delay between chunks is calculated
 * so that sending is evenly distributed over the requested window, reducing
 * the chance of being flagged as spam by mail providers.
 */
export async function sendBatchEmails(
  emails: Array<{ to: string; subject: string; html: string; campaignId: string; userId: string | null; variantId?: string }>,
  options?: SendBatchOptions,
): Promise<Array<{ email: string; id?: string; error?: string }>> {
  const resend = getResend();
  if (!resend) {
    return emails.map((e) => ({ email: e.to, error: 'Resend API key not configured' }));
  }

  const concurrency = options?.concurrency
    ?? (options?.spreadDurationMinutes ? 1 : DEFAULT_CONCURRENCY);

  let delayMs = DEFAULT_DELAY_MS;
  if (options?.spreadDurationMinutes && options.spreadDurationMinutes > 0) {
    const totalMs = options.spreadDurationMinutes * 60 * 1000;
    const totalChunks = Math.ceil(emails.length / concurrency);
    delayMs = totalChunks > 1 ? Math.floor(totalMs / totalChunks) : 0;
  }

  console.log(`[Marketing] sendBatchEmails: ${emails.length} emails, concurrency=${concurrency}, delay=${delayMs}ms${options?.spreadDurationMinutes ? ` (spread over ${options.spreadDurationMinutes}min)` : ''}`);

  const results: Array<{ email: string; id?: string; error?: string }> = [];

  for (let i = 0; i < emails.length; i += concurrency) {
    const chunk = emails.slice(i, i + concurrency);

    const chunkResults = await Promise.allSettled(
      chunk.map((email) => sendSingleWithRetry(resend, email, options?.from))
    );

    for (let j = 0; j < chunkResults.length; j++) {
      const r = chunkResults[j];
      if (r.status === 'fulfilled') {
        results.push(r.value);
      } else {
        results.push({ email: chunk[j].to, error: r.reason?.message || 'Unknown error' });
      }
    }

    if (i + concurrency < emails.length && delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
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
      from: params.from || DEFAULT_FROM,
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

