/* eslint-disable no-console */
/**
 * One-time migration: Assign TUTOR role to all existing tutors missing userRoles.
 * Usage: npx ts-node src/scripts/fix-tutor-roles.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ensureTutorRole(): Promise<string> {
  let role = await prisma.roles.findFirst({
    where: { code: 'TUTOR' },
  });

  if (!role) {
    role = await prisma.roles.create({
      data: {
        tenantId: '00000000-0000-0000-0000-000000000000',
        code: 'TUTOR',
        name: 'Tutor',
        roleType: 'CUSTOM',
        isDefault: false,
        isEditable: true,
        isDeletable: true,
        priority: 5,
        createdBy: 'system',
        updatedBy: 'system',
        metadata: {},
      },
    });
    console.log('  🆕 Created TUTOR role (global)');
  }

  return role.id;
}

async function main() {
  console.log('🔍 Finding tutors without roles...');

  const tutors = await prisma.users.findMany({
    where: { userType: 'TUTOR', deletedAt: null },
    select: {
      id: true,
      email: true,
      tenantId: true,
      firstName: true,
      lastName: true,
    },
  });

  console.log(`📊 Total tutors found: ${tutors.length}`);

  const tutorRoleId = await ensureTutorRole();

  let assigned = 0;
  let skipped = 0;

  for (const tutor of tutors) {
    const existingRole = await prisma.userRoles.findFirst({
      where: {
        userId: tutor.id,
        tenantId: tutor.tenantId,
        effectiveFrom: { lte: new Date() },
        effectiveTo: { gte: new Date() },
      },
    });

    if (existingRole) {
      console.log(`  ⏭ ${tutor.email} — already has role`);
      skipped++;
      continue;
    }

    await prisma.userRoles.create({
      data: {
        tenantId: tutor.tenantId,
        userId: tutor.id,
        roleId: tutorRoleId,
        effectiveFrom: new Date(),
        effectiveTo: new Date('2099-12-31'),
        assignedBy: tutor.id,
        assignmentReason: 'Backfill — existing tutor role assignment',
        revokedBy: '',
        revokedReason: '',
        metadata: {},
        createdBy: tutor.id,
        updatedBy: tutor.id,
      },
    });

    console.log(`  ✅ ${tutor.email} — TUTOR role assigned`);
    assigned++;
  }

  console.log(`\n✅ Done! Assigned: ${assigned}, Skipped: ${skipped}`);
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
