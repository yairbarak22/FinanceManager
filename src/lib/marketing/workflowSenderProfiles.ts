/**
 * Workflow sender profiles — allowed "from" identities for workflow emails.
 * Each address must be verified in Resend (same domain or explicit sender).
 */

export const WORKFLOW_SENDER_PROFILES = [
  {
    id: 'admin',
    labelHe: 'MyNeto',
    from: 'MyNeto <admin@myneto.co.il>',
  },
  {
    id: 'yair',
    labelHe: 'יאיר',
    from: 'יאיר <yair@myneto.co.il>',
  },
] as const;

export type WorkflowSenderProfileId = (typeof WORKFLOW_SENDER_PROFILES)[number]['id'];

export const WORKFLOW_SENDER_PROFILE_IDS = WORKFLOW_SENDER_PROFILES.map(
  (p) => p.id,
) as unknown as [string, ...string[]];

export const DEFAULT_SENDER_PROFILE_ID: WorkflowSenderProfileId = 'admin';

/**
 * Resolve the Resend `from` header for a given profile ID.
 * Returns the default profile when the ID is missing or unrecognised.
 */
export function getWorkflowSenderFromHeader(
  profileId: string | undefined,
): string {
  const profile = WORKFLOW_SENDER_PROFILES.find((p) => p.id === profileId);
  return (
    profile?.from ??
    WORKFLOW_SENDER_PROFILES.find((p) => p.id === DEFAULT_SENDER_PROFILE_ID)!
      .from
  );
}
