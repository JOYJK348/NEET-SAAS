const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const tenantId = '00000000-0000-0000-0000-000000000001';

  // Simulated form inputs - replace with what was submitted
  const dto = {
    code: 'NEET_348_B',
    name: 'NEET_svks_B',
    branchId: '00000000-0000-0000-0000-000000000006', // Sivakasi
    courseId: '00000000-0000-0000-0000-000000000020',
    academicYearId: '00000000-0000-0000-0000-000000000005', // Academic Year 2026-27 (2026-04-01 to 2027-03-31)
    deliveryTypeId: 'e918fe18-c51f-40ed-abb5-4a0fed9274e2', // Online
    maxStudents: 40,
    startDate: '2026-07-23',
    endDate: '2027-01-23',
  };

  try {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (start >= end) {
      throw new Error('Batch start date must be before end date');
    }

    // validateReferences emulation
    const branch = await prisma.branches.findFirst({
      where: { id: dto.branchId, tenantId, deletedAt: null, status: 'ACTIVE' },
    });
    if (!branch) throw new Error('Active Branch not found');

    const course = await prisma.courses.findFirst({
      where: { id: dto.courseId, tenantId, deletedAt: null, isActive: true },
    });
    if (!course) throw new Error('Active Course not found');

    const academicYear = await prisma.academicYears.findFirst({
      where: { id: dto.academicYearId, tenantId, deletedAt: null, isActive: true },
    });
    if (!academicYear) throw new Error('Active Academic Year not found');

    const dt = await prisma.batchDeliveryTypes.findFirst({
      where: { id: dto.deliveryTypeId, tenantId, deletedAt: null, isActive: true },
    });
    if (!dt) throw new Error('Active Batch Delivery Type not found');

    // 1. Verify batch dates fall within course start and end dates (if configured)
    if (course.startDate || course.endDate) {
      const cStart = course.startDate ? new Date(course.startDate) : null;
      const cEnd = course.endDate ? new Date(course.endDate) : null;

      const batchStart = new Date(start);
      batchStart.setHours(0, 0, 0, 0);
      const batchEnd = new Date(end);
      batchEnd.setHours(0, 0, 0, 0);

      if (cStart) {
        cStart.setHours(0, 0, 0, 0);
        if (batchStart < cStart) {
          throw new Error(
            `Batch start date (${batchStart.toISOString().split('T')[0]}) cannot be before course start date (${cStart.toISOString().split('T')[0]})`,
          );
        }
      }

      if (cEnd) {
        cEnd.setHours(23, 59, 59, 999);
        if (batchEnd > cEnd) {
          throw new Error(
            `Batch end date (${batchEnd.toISOString().split('T')[0]}) cannot be after course end date (${cEnd.toISOString().split('T')[0]})`,
          );
        }
      }
    }

    // 2. Verify batch duration (in months) does not exceed course duration limit
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = diffDays / 30.4375; // average days in a month

    // Allow a small grace window of 3 days to account for calendar alignments
    if (diffMonths > course.durationMonths + 0.1) {
      throw new Error(
        `Batch duration (${Math.round(diffMonths * 10) / 10} months) exceeds the course duration limit of ${course.durationMonths} months`,
      );
    }

    if (academicYear) {
      const ayStart = new Date(academicYear.startDate);
      ayStart.setHours(0, 0, 0, 0);
      const ayEnd = new Date(academicYear.endDate);
      ayEnd.setHours(23, 59, 59, 999);

      const batchStart = new Date(start);
      batchStart.setHours(0, 0, 0, 0);
      const batchEnd = new Date(end);
      batchEnd.setHours(0, 0, 0, 0);

      if (batchStart < ayStart || batchEnd > ayEnd) {
        throw new Error(
          `Batch dates (${batchStart.toISOString().split('T')[0]} to ${batchEnd.toISOString().split('T')[0]}) must be fully contained within the selected Academic Year period (${ayStart.toISOString().split('T')[0]} to ${ayEnd.toISOString().split('T')[0]})`,
        );
      }
    }

    console.log('SUCCESS: Batch dates and validation passed!');
  } catch (err) {
    console.error('FAILED WITH VALIDATION ERROR:', err.message);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
