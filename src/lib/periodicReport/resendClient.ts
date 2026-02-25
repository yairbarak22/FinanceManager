import { Resend } from 'resend';
import { config } from '@/lib/config';

let resendClient: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!resendClient && config.resendApiKey) {
    resendClient = new Resend(config.resendApiKey);
  }
  return resendClient;
}

const SENDER = 'myneto <admin@myneto.co.il>';

export interface SendReportEmailParams {
  to: string;
  subject: string;
  html: string;
  pdfBuffer: Buffer;
  filename: string;
}

export async function sendReportEmail(
  params: SendReportEmailParams,
): Promise<{ id: string } | { error: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { error: 'Resend API key not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: SENDER,
      to: params.to,
      subject: params.subject,
      html: params.html,
      attachments: [
        {
          filename: params.filename,
          content: params.pdfBuffer,
        },
      ],
      tags: [{ name: 'type', value: 'periodic-report' }],
    });

    if (result.error) {
      console.error('[PeriodicReport] Resend error:', result.error);
      return { error: result.error.message || 'Failed to send email' };
    }

    if (!result.data?.id) {
      return { error: 'No email ID returned from Resend' };
    }

    return { id: result.data.id };
  } catch (err) {
    console.error('[PeriodicReport] Send email error:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
