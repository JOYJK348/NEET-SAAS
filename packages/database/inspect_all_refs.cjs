const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const branches = await prisma.branches.findMany();
  console.log(
    'BRANCHES:',
    branches.map((b) => ({ id: b.id, name: b.name, status: b.status, deletedAt: b.deletedAt })),
  );

  const courses = await prisma.courses.findMany();
  console.log(
    'COURSES:',
    courses.map((c) => ({
      id: c.id,
      name: c.name,
      isActive: c.isActive,
      deletedAt: c.deletedAt,
      startDate: c.startDate,
      endDate: c.endDate,
      durationMonths: c.durationMonths,
    })),
  );

  const years = await prisma.academicYears.findMany();
  console.log(
    'YEARS:',
    years.map((y) => ({
      id: y.id,
      name: y.name,
      isActive: y.isActive,
      deletedAt: y.deletedAt,
      startDate: y.startDate,
      endDate: y.endDate,
    })),
  );

  const dts = await prisma.batchDeliveryTypes.findMany();
  console.log(
    'DELIVERY TYPES:',
    dts.map((d) => ({ id: d.id, name: d.name, isActive: d.isActive, deletedAt: d.deletedAt })),
  );

  const bcs = await prisma.branchCourses.findMany();
  console.log(
    'BRANCH COURSES MAPPINGS:',
    bcs.map((bc) => ({
      branchId: bc.branchId,
      courseId: bc.courseId,
      academicYearId: bc.academicYearId,
      isActive: bc.isActive,
      deletedAt: bc.deletedAt,
    })),
  );
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
