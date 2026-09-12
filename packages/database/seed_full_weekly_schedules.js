const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedWeeklySchedules() {
  const tenantId = 'fa3a02b9-d8d5-4429-b43d-91522878246d';

  const batches = await prisma.batches.findMany({ where: { tenantId, deletedAt: null } });
  const subjects = await prisma.subjects.findMany({ where: { tenantId, deletedAt: null } });
  const staff = await prisma.staffProfiles.findMany({ where: { tenantId, deletedAt: null } });

  const branch = await prisma.branches.findFirst({ where: { tenantId, deletedAt: null } })
    || await prisma.branches.findFirst();
  const ay = await prisma.academicYears.findFirst({ where: { tenantId, deletedAt: null } })
    || await prisma.academicYears.findFirst();

  if (batches.length === 0 || subjects.length === 0 || staff.length === 0) {
    console.error('Missing required master data');
    return;
  }

  const batchId = batches[0].id;
  // Pick Jay Kumar or first tenant staff
  const jayKumar = staff.find(s => s.userId === '467e42dc-f301-452c-b6d1-0f122ef6bd2f') || staff[0];
  const staffId = jayKumar.userId;
  const branchId = branch.id;
  const ayId = ay.id;

  const physics = subjects.find(s => s.name.toLowerCase().includes('physic'))?.id || subjects[0].id;
  const chemistry = subjects.find(s => s.name.toLowerCase().includes('chemist'))?.id || subjects[1]?.id || subjects[0].id;
  const biology = subjects.find(s => s.name.toLowerCase().includes('biol') || s.name.toLowerCase().includes('botan'))?.id || subjects[2]?.id || subjects[0].id;
  const zoology = subjects.find(s => s.name.toLowerCase().includes('zoolo'))?.id || subjects[3]?.id || subjects[0].id;

  const sampleWeeklySchedules = [
    { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:30', subjectId: physics, notes: 'Physics - Kinematics & Laws of Motion' },
    { dayOfWeek: 'MONDAY', startTime: '11:00', endTime: '12:30', subjectId: chemistry, notes: 'Chemistry - Organic Reaction Mechanisms' },
    { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '10:30', subjectId: biology, notes: 'Botany - Plant Physiology & Cell Biology' },
    { dayOfWeek: 'TUESDAY', startTime: '11:00', endTime: '12:30', subjectId: zoology, notes: 'Zoology - Human Physiology & Genetics' },
    { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '10:30', subjectId: physics, notes: 'Physics - Electrostatics & Current Electricity' },
    { dayOfWeek: 'WEDNESDAY', startTime: '14:00', endTime: '15:30', subjectId: chemistry, notes: 'Chemistry - Chemical Equilibrium' },
    { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '10:30', subjectId: biology, notes: 'Botany - Plant Reproduction & Ecology' },
    { dayOfWeek: 'THURSDAY', startTime: '11:00', endTime: '12:30', subjectId: zoology, notes: 'Zoology - Biomolecules & Evolution' },
    { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '10:30', subjectId: physics, notes: 'Physics - Optics & Modern Physics' },
    { dayOfWeek: 'FRIDAY', startTime: '14:00', endTime: '15:30', subjectId: chemistry, notes: 'Chemistry - Coordination Compounds' },
    { dayOfWeek: 'SATURDAY', startTime: '09:30', endTime: '11:00', subjectId: biology, notes: 'Botany & Zoology Grand Revision' },
    { dayOfWeek: 'SUNDAY', startTime: '10:00', endTime: '13:00', subjectId: physics, notes: 'Full NEET Mock Test Discussion & Analysis' },
  ];

  console.log(`Seeding & Updating ${sampleWeeklySchedules.length} weekly schedules for staffId: ${staffId}...`);

  const effectiveFrom = new Date('2026-01-01T00:00:00.000Z');
  const effectiveUntil = new Date('2027-12-31T23:59:59.000Z');

  for (const s of sampleWeeklySchedules) {
    const existing = await prisma.schedules.findFirst({
      where: {
        tenantId,
        batchId,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        deletedAt: null,
      },
    });

    if (!existing) {
      await prisma.schedules.create({
        data: {
          tenantId,
          branchId,
          academicYearId: ayId,
          batchId,
          subjectId: s.subjectId,
          staffProfileId: staffId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          effectiveFrom,
          effectiveUntil,
          deliveryMode: 'CLASSROOM',
          status: 'ACTIVE',
          notes: s.notes,
          createdBy: staffId,
          updatedBy: staffId,
        },
      });
      console.log(`Created schedule: ${s.dayOfWeek} ${s.startTime}-${s.endTime} (${s.notes})`);
    } else {
      await prisma.schedules.update({
        where: { id: existing.id },
        data: {
          staffProfileId: staffId,
          updatedBy: staffId,
        },
      });
      console.log(`Updated schedule tutor for ${s.dayOfWeek} ${s.startTime} -> ${staffId}`);
    }
  }

  // Also update any remaining schedule in tenantId
  await prisma.schedules.updateMany({
    where: { tenantId, deletedAt: null },
    data: { staffProfileId: staffId },
  });

  console.log('Weekly schedules seeded & updated successfully!');
}

seedWeeklySchedules()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
