const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const classes = await prisma.liveClasses.findMany({
    where: { status: 'LIVE', deletedAt: null },
    select: { id: true, title: true, scheduledStart: true, scheduledEnd: true },
  });

  console.log('Current LIVE classes:');
  console.log(JSON.stringify(classes, null, 2));

  // Fix each LIVE class that has scheduledEnd within 90 minutes of scheduledStart
  // (meaning it was set by startClass as startMs + 60m)
  for (const cls of classes) {
    if (!cls.scheduledStart) continue;

    const startMs = new Date(cls.scheduledStart).getTime();
    const endMs = cls.scheduledEnd
      ? new Date(cls.scheduledEnd).getTime()
      : null;

    if (!endMs) {
      console.log(`No scheduledEnd for ${cls.id}, setting to start+1hr`);
      await prisma.liveClasses.update({
        where: { id: cls.id },
        data: { scheduledEnd: new Date(startMs + 60 * 60 * 1000) },
      });
    } else {
      const diffMins = (endMs - startMs) / 60000;
      console.log(
        `Class ${cls.id}: start=${new Date(startMs).toISOString()}, end=${new Date(endMs).toISOString()}, diff=${diffMins.toFixed(1)}m`,
      );

      if (diffMins > 55 && diffMins < 65) {
        // This looks like startMs + 60m (the bug) — restore it to start + 60m from scheduledStart
        // Actually this IS correct 1hr from scheduled start, leave it
        console.log(`  -> Looks like 1hr from scheduledStart, keeping as-is`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
