const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const staff = await prisma.staffProfiles.findFirst({
    where: { userId: '26a0238e-92cb-4780-b7f3-15450a4bfa32' },
  });
  const physics = await prisma.subjects.findFirst({
    where: { name: { equals: 'Physics', mode: 'insensitive' } },
  });
  const batchA = await prisma.batches.findFirst({
    where: {
      name: { contains: 'Crash Course 2027', mode: 'insensitive' },
      NOT: { name: { contains: 'Batch B', mode: 'insensitive' } },
    },
  });
  const batchB = await prisma.batches.findFirst({
    where: { name: { contains: 'Batch B', mode: 'insensitive' } },
  });
  const branch = await prisma.branches.findFirst();
  const ay = await prisma.academicYears.findFirst();

  if (!staff || !physics || !batchA || !branch || !ay) {
    console.log('Missing basic data');
    return;
  }

  // 1. Delete all old schedules and liveClasses to clear weird 11 test items
  await prisma.schedules.deleteMany({});
  await prisma.liveClasses.deleteMany({});
  console.log('Deleted all old schedules and liveClasses.');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekdays = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ];
  const todayDayStr = weekdays[today.getDay()];

  // 2. Create Schedule 1 for Batch A (Physics, 14:00 - 16:00)
  await prisma.schedules.create({
    data: {
      tenantId: batchA.tenantId,
      branchId: branch.id,
      academicYearId: ay.id,
      batchId: batchA.id,
      subjectId: physics.id,
      staffProfileId: staff.userId,
      dayOfWeek: todayDayStr,
      startTime: '14:00',
      endTime: '16:00',
      deliveryMode: 'ONLINE',
      effectiveFrom: new Date('2026-01-01'),
      effectiveUntil: new Date('2028-12-31'),
      createdBy: staff.userId,
      updatedBy: staff.userId,
    },
  });
  console.log('Created Physics Schedule for Batch A (14:00 - 16:00)');

  // 3. Create Schedule 2 for Batch B (Physics, 16:30 - 18:30) if Batch B exists
  if (batchB) {
    await prisma.schedules.create({
      data: {
        tenantId: batchB.tenantId,
        branchId: branch.id,
        academicYearId: ay.id,
        batchId: batchB.id,
        subjectId: physics.id,
        staffProfileId: staff.userId,
        dayOfWeek: todayDayStr,
        startTime: '16:30',
        endTime: '18:30',
        deliveryMode: 'CLASSROOM',
        effectiveFrom: new Date('2026-01-01'),
        effectiveUntil: new Date('2028-12-31'),
        createdBy: staff.userId,
        updatedBy: staff.userId,
      },
    });
    console.log('Created Physics Schedule for Batch B (16:30 - 18:30)');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
