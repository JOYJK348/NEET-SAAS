const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const batches = await prisma.batches.findMany({
    where: { deletedAt: null },
  });
  console.log(
    'BATCHES:',
    batches.map((b) => ({
      id: b.id,
      name: b.name,
      branchId: b.branchId,
      academicYearId: b.academicYearId,
      courseId: b.courseId,
    })),
  );
  const years = await prisma.academicYears.findMany({
    where: { deletedAt: null },
  });
  console.log(
    'YEARS:',
    years.map((y) => ({ id: y.id, name: y.name })),
  );
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
