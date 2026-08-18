const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const recordings = await prisma.liveClassRecordings.findMany({
    where: { deletedAt: null },
  });

  const liveClasses = await prisma.liveClasses.findMany();
  const classMap = new Map(liveClasses.map(c => [c.id, c]));

  console.log(`TOTAL RECORDINGS ON DISK: ${recordings.length}`);
  recordings.forEach((r, i) => {
    const lc = classMap.get(r.liveClassId);
    console.log(`${i + 1}. REC_ID: ${r.id} | LIVE_CLASS_ID: ${r.liveClassId} | TITLE: ${lc?.title} | SUBTITLE: ${lc?.subtitle} | STATUS: ${r.status}`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
