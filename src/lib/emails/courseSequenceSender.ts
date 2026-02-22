/**
 * Course Sequence Email Sender
 *
 * Handles building and sending individual sequence step emails via Resend.
 * Respects marketing unsubscribe preferences.
 */

import { Resend } from 'resend';
import { config } from '@/lib/config';
import { courseSequenceEmails, stepCtaPaths } from './courseSequenceTemplates';

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!resendClient && config.resendApiKey) {
    resendClient = new Resend(config.resendApiKey);
  }
  return resendClient;
}

function getUnsubscribeUrl(userId: string): string {
  return `${config.nextAuthUrl}/api/marketing/unsubscribe?userId=${userId}`;
}

function addUnsubscribeLink(html: string, userId: string): string {
  const unsubscribeUrl = getUnsubscribeUrl(userId);
  const link = `
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #F7F7F8;text-align:center;">
      <p style="color:#BDBDCB;font-size:12px;margin:0 0 8px 0;">
        לא מעוניין לקבל עוד מיילים שיווקיים?
      </p>
      <a href="${unsubscribeUrl}" style="color:#69ADFF;font-size:12px;text-decoration:none;">
        ביטול מנוי
      </a>
    </div>`;

  if (html.includes('</body>')) {
    return html.replace('</body>', `${link}</body>`);
  }
  return html + link;
}

export function getSequenceEmail(step: number) {
  return courseSequenceEmails[step] ?? null;
}

export function buildSequenceEmailHtml(
  step: number,
  userName: string,
  baseUrl: string,
): string | null {
  const template = getSequenceEmail(step);
  if (!template) return null;

  const ctaPath = stepCtaPaths[step] ?? '/courses';
  const ctaUrl = `${baseUrl}${ctaPath}`;

  return template.buildHtml(userName, ctaUrl);
}

export interface SendSequenceStepParams {
  to: string;
  userId: string;
  step: number;
  userName: string;
}

export async function sendSequenceStepEmail(
  params: SendSequenceStepParams,
): Promise<{ id: string } | { error: string }> {
  const resend = getResend();
  if (!resend) {
    return { error: 'Resend API key not configured' };
  }

  const template = getSequenceEmail(params.step);
  if (!template) {
    return { error: `Invalid sequence step: ${params.step}` };
  }

  const html = buildSequenceEmailHtml(
    params.step,
    params.userName,
    config.nextAuthUrl,
  );
  if (!html) {
    return { error: 'Failed to build email HTML' };
  }

  const htmlWithUnsubscribe = addUnsubscribeLink(html, params.userId);

  try {
    const result = await resend.emails.send({
      from: 'myneto <admin@myneto.co.il>',
      to: params.to,
      subject: template.subject,
      html: htmlWithUnsubscribe,
      tags: [
        { name: 'sequence_type', value: 'course-intro' },
        { name: 'sequence_step', value: String(params.step) },
        { name: 'user_id', value: params.userId },
        { name: 'type', value: 'sequence' },
      ],
    });

    if (result.error) {
      console.error('[Sequence] Resend error:', result.error);
      return { error: result.error.message || 'Failed to send email' };
    }

    if (!result.data?.id) {
      return { error: 'No email ID returned from Resend' };
    }

    return { id: result.data.id };
  } catch (error) {
    console.error('[Sequence] Send error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
