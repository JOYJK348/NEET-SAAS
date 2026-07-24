/**
 * Cleanup: Remove previously seeded demo data (created under Demo HQ branch)
 * so seed-demo-data.ts can be re-run cleanly under Sivakasi branch.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TENANT_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  console.log('🧹 Cleaning up old demo seed data...\n');

  // Schedules (63000000-...)
  const schedDel = await prisma.schedules.deleteMany({
    where: { tenantId: TENANT_ID, id: { startsWith: '63000000' } },
  });
  console.log(`  🗑️  Deleted ${schedDel.count} schedules`);

  // StaffBatchAssignments (62000000-...)
  const sbaDel = await prisma.staffBatchAssignments.deleteMany({
    where: { tenantId: TENANT_ID, id: { startsWith: '62000000' } },
  });
  console.log(`  🗑️  Deleted ${sbaDel.count} staff batch assignments`);

  // StudentBatchEnrollments (61000000-...)
  const sbeDel = await prisma.studentBatchEnrollments.deleteMany({
    where: { tenantId: TENANT_ID, id: { startsWith: '61000000' } },
  });
  console.log(`  🗑️  Deleted ${sbeDel.count} student batch enrollments`);

  // Batches (60000000-...)
  const batchDel = await prisma.batches.deleteMany({
    where: { tenantId: TENANT_ID, id: { startsWith: '60000000' } },
  });
  console.log(`  🗑️  Deleted ${batchDel.count} batches`);

  // Rooms (20000000-...)
  const roomDel = await prisma.rooms.deleteMany({
    where: { tenantId: TENANT_ID, id: { startsWith: '20000000' } },
  });
  console.log(`  🗑️  Deleted ${roomDel.count} rooms`);

  // StudentAdmissions (51000000-...)
  const admDel = await prisma.studentAdmissions.deleteMany({
    where: { tenantId: TENANT_ID, id: { startsWith: '51000000' } },
  });
  console.log(`  🗑️  Deleted ${admDel.count} student admissions`);

  // StaffSubjects for tutors (40000000-...)
  const tutorIds = Array.from({ length: 20 }, (_, i) =>
    `40000000-0000-0000-0000-${(i + 1).toString().padStart(12, '0')}`,
  );

  await prisma.staffSubjects.deleteMany({
    where: { tenantId: TENANT_ID, staffProfileId: { in: tutorIds } },
  });

  await prisma.staffDepartments.deleteMany({
    where: { tenantId: TENANT_ID, staffProfileId: { in: tutorIds } },
  });

  // StaffProfiles for tutors
  await prisma.staffProfiles.deleteMany({
    where: { tenantId: TENANT_ID, userId: { in: tutorIds } },
  });

  // StudentProfiles (50000000-...)
  const studentIds = Array.from({ length: 50 }, (_, i) =>
    `50000000-0000-0000-0000-${(i + 1).toString().padStart(12, '0')}`,
  );
  await prisma.studentProfiles.deleteMany({
    where: { tenantId: TENANT_ID, userId: { in: studentIds } },
  });

  // Users (tutors 40000000-..., students 50000000-...)
  const allUserIds = [...tutorIds, ...studentIds];

  // UserRoles cleanup
  await prisma.userRoles.deleteMany({
    where: {
      tenantId: TENANT_ID,
      id: {
        in: [
          ...Array.from({ length: 20 }, (_, i) => `70000000-0000-0000-0000-${(i + 1).toString().padStart(12, '0')}`),
          ...Array.from({ length: 50 }, (_, i) => `71000000-0000-0000-0000-${(i + 1).toString().padStart(12, '0')}`),
        ],
      },
    },
  });

  const userDel = await prisma.users.deleteMany({
    where: { tenantId: TENANT_ID, id: { in: allUserIds } },
  });
  console.log(`  🗑️  Deleted ${userDel.count} users (tutors + students)`);

  // CourseSubjects for new courses (10000000-...)
  const csIds = [
    '10000000-0000-0000-03-000000000001',
    '10000000-0000-0000-03-000000000002',
    '10000000-0000-0000-03-000000000003',
    '10000000-0000-0000-04-000000000001',
    '10000000-0000-0000-04-000000000002',
    '10000000-0000-0000-04-000000000003',
  ];
  await prisma.courseSubjects.deleteMany({
    where: { tenantId: TENANT_ID, id: { in: csIds } },
  });

  // BranchCourses for new courses (10000000-...)
  await prisma.branchCourses.deleteMany({
    where: {
      tenantId: TENANT_ID,
      courseId: {
        in: ['10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'],
      },
    },
  });

  // Extra Courses (10000000-...)
  await prisma.courses.deleteMany({
    where: {
      tenantId: TENANT_ID,
      id: {
        in: ['10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'],
      },
    },
  });
  console.log(`  🗑️  Deleted Advanced & Crash courses`);

  // Departments & Designations (30000000-...)
  await prisma.branchDepartments.deleteMany({
    where: { tenantId: TENANT_ID, id: '30000000-0000-0000-0000-000000000003' },
  });
  await prisma.departments.deleteMany({
    where: { tenantId: TENANT_ID, id: '30000000-0000-0000-0000-000000000001' },
  });
  await prisma.designations.deleteMany({
    where: { tenantId: TENANT_ID, id: '30000000-0000-0000-0000-000000000002' },
  });
  console.log(`  🗑️  Deleted department & designation`);

  console.log('\n✅ Cleanup complete! Now run seed-demo-data.ts\n');
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
