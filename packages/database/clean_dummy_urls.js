const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.liveClassRecordings.updateMany({
    where: {
      OR: [
        { rawEgressUrl: '/lecture.mp4' },
        { rawEgressUrl: { contains: 'oceans.mp4' } },
        { rawEgressUrl: { contains: 'BigBuckBunny' } },
      ],
    },
    data: {
      rawEgressUrl: null,
    },
  });
  console.log(`Cleaned ${updated.count} dummy video URLs in DB.`);
  await prisma.$disconnect();
}

main().catch(console.error);
