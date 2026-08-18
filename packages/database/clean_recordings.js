const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const deletedRecs = await prisma.liveClassRecordings.deleteMany({});
  console.log(`Deleted ${deletedRecs.count} mock recordings.`);

  // Reset any live classes with dummy title 'NEET Physics Live Class'
  const deletedClasses = await prisma.liveClasses.deleteMany({
    where: {
      OR: [
        { title: 'NEET Physics Live Class' },
        { title: { contains: 'Interactive Classroom Studio' } },
      ],
    },
  });
  console.log(`Deleted ${deletedClasses.count} mock live classes.`);

  await prisma.$disconnect();
}

main().catch(console.error);
