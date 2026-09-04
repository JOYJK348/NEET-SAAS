const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.attendanceRecords.findMany({
    where: { deletedAt: null },
  });
  const sessions = await prisma.attendanceSessions.findMany({
    where: { deletedAt: null },
  });

  console.log('--- ALL ATTENDANCE SESSIONS IN DB ---');
  console.log(JSON.stringify(sessions, null, 2));

  console.log('--- ALL ATTENDANCE RECORDS IN DB ---');
  console.log(JSON.stringify(records, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
