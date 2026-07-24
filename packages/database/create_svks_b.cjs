const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const userId = '00000000-0000-0000-0000-000000000003'; // admin user

  const batchData = {
    tenantId,
    branchId: '00000000-0000-0000-0000-000000000006', // Sivakasi
    courseId: '00000000-0000-0000-0000-000000000020', // NEET Foundation 2026-27
    academicYearId: '00000000-0000-0000-0000-000000000005', // Academic Year 2026-27
    deliveryTypeId: 'e918fe18-c51f-40ed-abb5-4a0fed9274e2', // Online
    code: 'NEET_348_B',
    name: 'NEET_svks_B',
    description: 'sivaksi b',
    status: 'PLANNED',
    maxStudents: 40,
    startDate: new Date('2026-07-23T00:00:00.000Z'),
    endDate: new Date('2027-01-23T00:00:00.000Z'),
    startTime: '09:00',
    endTime: '12:00',
    allowNewAdmissions: true,
    isActive: true,
    createdBy: userId,
    updatedBy: userId,
  };

  try {
    const existing = await prisma.batches.findFirst({
      where: {
        tenantId,
        code: batchData.code,
        deletedAt: null,
      },
    });

    if (existing) {
      console.log(`Batch with code ${batchData.code} already exists. Updating it...`);
      const updated = await prisma.batches.update({
        where: { id: existing.id },
        data: batchData,
      });
      console.log('UPDATED BATCH SUCCESS:', updated.id);
    } else {
      const created = await prisma.batches.create({
        data: batchData,
      });
      console.log('CREATED BATCH SUCCESS:', created.id, created.code);
    }
  } catch (err) {
    console.error('DATABASE ERROR:', err);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
