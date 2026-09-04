// Fix the current LIVE class's scheduledEnd to the correct time based on scheduledStart + 1hr
// The class was started at 10:28 AM IST (04:58 UTC), so scheduledStart is 10:28 IST.
// But the ACTUAL class schedule says 11:00 AM end time.
// Let's check what is stored and align scheduledEnd to be exactly 1hr from scheduledStart.
// NOTE: If you want a different end time (e.g. 11:00 AM), run this with the desired IST hour/minute.

const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

const DESIRED_END_HOUR_IST = 11; // Change this to the desired end hour in IST (e.g. 11 = 11:00 AM)
const DESIRED_END_MINUTE_IST = 0; // Change this to the desired end minute in IST

async function main() {
  const classes = await prisma.liveClasses.findMany({
    where: { status: 'LIVE', deletedAt: null },
    select: { id: true, title: true, scheduledStart: true, scheduledEnd: true },
  });

  console.log('Current LIVE classes (UTC times):');
  for (const cls of classes) {
    const startIST = new Date(cls.scheduledStart);
    const endIST = cls.scheduledEnd ? new Date(cls.scheduledEnd) : null;
    console.log(
      `  ${cls.id}: start=${startIST.toISOString()} (IST: ${new Date(startIST.getTime() + 5.5 * 3600000).toISOString()})`,
    );
    console.log(
      `          end=${endIST ? endIST.toISOString() : 'null'} (IST: ${endIST ? new Date(endIST.getTime() + 5.5 * 3600000).toISOString() : 'null'})`,
    );

    // Set new scheduledEnd = today at DESIRED_END_HOUR_IST:DESIRED_END_MINUTE_IST IST (= IST - 5:30 = UTC)
    const nowUtc = new Date();
    const newEnd = new Date(
      Date.UTC(
        nowUtc.getUTCFullYear(),
        nowUtc.getUTCMonth(),
        nowUtc.getUTCDate(),
        DESIRED_END_HOUR_IST - 5, // IST to UTC: subtract 5hr
        DESIRED_END_MINUTE_IST - 30, // IST to UTC: subtract 30min
        0,
        0,
      ),
    );
    // Handle minute underflow
    if (DESIRED_END_MINUTE_IST < 30) {
      newEnd.setUTCHours(
        DESIRED_END_HOUR_IST - 6,
        DESIRED_END_MINUTE_IST + 30,
        0,
        0,
      );
    }

    console.log(
      `  Setting scheduledEnd to: ${newEnd.toISOString()} (IST: ${DESIRED_END_HOUR_IST}:${String(DESIRED_END_MINUTE_IST).padStart(2, '0')} AM)`,
    );

    await prisma.liveClasses.update({
      where: { id: cls.id },
      data: { scheduledEnd: newEnd },
    });
    console.log(`  Updated!`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
