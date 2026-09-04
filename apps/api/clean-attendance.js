const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.attendanceRecords.deleteMany({});
  const sessions = await prisma.attendanceSessions.deleteMany({});
  console.log(
    `Successfully deleted ${records.count} attendance records and ${sessions.count} attendance sessions.`,
  );
}

main()
  .catch((err) => console.error('Error cleaning attendance:', err))
  .finally(async () => {
    await prisma.$disconnect();
  });
