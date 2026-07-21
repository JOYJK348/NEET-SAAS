const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  // Query all active batches
  const batches = await prisma.batches.findMany({
    where: { deletedAt: null },
  });
  console.log(`FOUND ${batches.length} BATCHES`);

  let count = 0;
  for (const batch of batches) {
    const existing = await prisma.branchCourses.findFirst({
      where: {
        tenantId: batch.tenantId,
        branchId: batch.branchId,
        courseId: batch.courseId,
        deletedAt: null,
      },
    });

    if (!existing) {
      await prisma.branchCourses.create({
        data: {
          tenantId: batch.tenantId,
          branchId: batch.branchId,
          courseId: batch.courseId,
          isActive: true,
          createdBy: 'system-migration',
          updatedBy: 'system-migration',
        },
      });
      console.log(
        `Mapped Course ${batch.courseId} to Branch ${batch.branchId} from batch ${batch.name}`,
      );
      count++;
    }
  }
  console.log(`MIGRATED ${count} NEW MAPPINGS SUCCESSFULLY`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
