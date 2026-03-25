/**
 * One-time backfill: enroll recent users into the active USER_REGISTERED
 * workflow and align their marketing groups (remove from "פעילים", add to
 * "onboarding") — replicating what auth.ts does for new signups.
 *
 * Usage:
 *   npx tsx scripts/backfill-registration-workflow.ts --hours 48
 *   npx tsx scripts/backfill-registration-workflow.ts --since 2026-03-23T00:00:00Z
 *   npx tsx scripts/backfill-registration-workflow.ts --hours 48 --dry-run
 *   npx tsx scripts/backfill-registration-workflow.ts --hours 48 --workflowId <id>
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const ONBOARDING_GROUP_NAME = 'onboarding';
const ACTIVE_GROUP_NAME = 'פעילים';

// ── CLI args ──────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let hours: number | undefined;
  let since: string | undefined;
  let workflowId: string | undefined;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--hours' && args[i + 1]) {
      hours = parseInt(args[++i], 10);
    } else if (arg === '--since' && args[i + 1]) {
      since = args[++i];
    } else if (arg === '--workflowId' && args[i + 1]) {
      workflowId = args[++i];
    }
  }

  if (!hours && !since) {
    console.error('Provide --hours <N> or --since <ISO date>');
    process.exit(1);
  }

  const cutoff = since
    ? new Date(since)
    : new Date(Date.now() - hours! * 60 * 60 * 1000);

  if (isNaN(cutoff.getTime())) {
    console.error('Invalid date');
    process.exit(1);
  }

  return { cutoff, workflowId, dryRun };
}

// ── Group helpers (mirror marketingGroups.ts without path aliases) ─

async function getOrCreateGroup(name: string, description: string, creatorUserId: string) {
  let group = await prisma.userGroup.findFirst({
    where: { name },
    select: { id: true },
  });
  if (!group) {
    group = await prisma.userGroup.create({
      data: { name, description, createdBy: creatorUserId },
      select: { id: true },
    });
    console.log(`  Created group "${name}"`);
  }
  return group.id;
}

async function removeFromGroup(groupName: string, userId: string) {
  const group = await prisma.userGroup.findFirst({
    where: { name: groupName },
    select: { id: true },
  });
  if (group) {
    await prisma.userGroupMember.deleteMany({
      where: { groupId: group.id, userId },
    });
  }
}

async function addToGroup(groupId: string, userId: string) {
  await prisma.userGroupMember.upsert({
    where: { groupId_userId: { groupId, userId } },
    create: { groupId, userId },
    update: {},
  });
}

// ── Main ──────────────────────────────────────────────────

async function main() {
  const { cutoff, workflowId: explicitWorkflowId, dryRun } = parseArgs();

  console.log(`Cutoff: ${cutoff.toISOString()}`);
  console.log(`Mode:   ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  // 1. Resolve workflow
  let wfId = explicitWorkflowId;
  if (!wfId) {
    const workflows = await prisma.automationWorkflow.findMany({
      where: { status: 'ACTIVE', triggerType: 'USER_REGISTERED' },
      select: { id: true, name: true },
    });
    if (workflows.length === 0) {
      console.error('No ACTIVE workflow with triggerType USER_REGISTERED found.');
      process.exit(1);
    }
    if (workflows.length > 1) {
      console.error(
        'Multiple ACTIVE USER_REGISTERED workflows found — pass --workflowId explicitly:',
      );
      for (const w of workflows) console.error(`  ${w.id}  ${w.name}`);
      process.exit(1);
    }
    wfId = workflows[0].id;
    console.log(`Workflow: ${workflows[0].name} (${wfId})`);
  } else {
    const wf = await prisma.automationWorkflow.findUnique({
      where: { id: wfId },
      select: { id: true, name: true, status: true, triggerType: true },
    });
    if (!wf) {
      console.error(`Workflow ${wfId} not found.`);
      process.exit(1);
    }
    if (wf.status !== 'ACTIVE') {
      console.error(`Workflow "${wf.name}" is ${wf.status}, not ACTIVE.`);
      process.exit(1);
    }
    console.log(`Workflow: ${wf.name} (${wfId})`);
  }

  // 2. Find eligible users
  const users = await prisma.user.findMany({
    where: {
      createdAt: { gte: cutoff },
      isMarketingSubscribed: true,
    },
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`\nEligible users (registered since ${cutoff.toISOString()}, marketing subscribed): ${users.length}`);

  if (users.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  // 3. Check who is already enrolled
  const existingEnrollments = await prisma.workflowEnrollment.findMany({
    where: {
      workflowId: wfId,
      userId: { in: users.map((u) => u.id) },
    },
    select: { userId: true },
  });
  const alreadyEnrolled = new Set(existingEnrollments.map((e) => e.userId));
  const toEnroll = users.filter((u) => !alreadyEnrolled.has(u.id));

  console.log(`Already enrolled (will skip): ${alreadyEnrolled.size}`);
  console.log(`Will enroll: ${toEnroll.length}\n`);

  if (toEnroll.length === 0) {
    console.log('All eligible users are already enrolled. Nothing to do.');
    return;
  }

  // Print preview
  for (const u of toEnroll) {
    console.log(`  ${u.email}  (${u.name ?? '—'})  registered ${u.createdAt.toISOString()}`);
  }

  if (dryRun) {
    console.log('\n[DRY RUN] No changes written.');
    return;
  }

  // 4. Execute: groups + enrollment
  let enrolled = 0;
  let skipped = 0;

  for (const user of toEnroll) {
    // Remove from "פעילים" (if present)
    await removeFromGroup(ACTIVE_GROUP_NAME, user.id);

    // Add to "onboarding"
    const onboardingGroupId = await getOrCreateGroup(
      ONBOARDING_GROUP_NAME,
      'משתמשים חדשים בתהליך אונבורדינג',
      user.id,
    );
    await addToGroup(onboardingGroupId, user.id);

    // Create enrollment
    try {
      await prisma.workflowEnrollment.create({
        data: {
          workflowId: wfId,
          userId: user.id,
          status: 'ACTIVE',
          currentNodeId: null,
          nextWakeupAt: null,
        },
      });
      enrolled++;
      console.log(`  ✓ ${user.email}`);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        skipped++;
        console.log(`  – ${user.email} (already enrolled)`);
      } else {
        throw err;
      }
    }
  }

  console.log(`\nDone. Enrolled: ${enrolled}, Skipped: ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
