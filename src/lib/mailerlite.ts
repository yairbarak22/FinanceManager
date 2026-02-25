import { config } from './config';

const MAILERLITE_API_BASE = 'https://connect.mailerlite.com/api';

/**
 * Add a new subscriber to MailerLite.
 * If the subscriber already exists, MailerLite updates it (non-destructive upsert).
 * Fails silently — never blocks user creation.
 */
export async function addSubscriberToMailerLite(
  email: string,
  name?: string | null
): Promise<void> {
  if (!config.mailerliteApiToken) {
    return;
  }

  const body: Record<string, unknown> = {
    email,
    status: 'active',
  };

  if (name) {
    body.fields = { name };
  }

  const res = await fetch(`${MAILERLITE_API_BASE}/subscribers`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.mailerliteApiToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`[MailerLite] Failed to add subscriber ${email}: ${res.status} ${text}`);
    return;
  }

  console.log(`[MailerLite] Subscriber added: ${email}`);
}
