const { PrismaClient } = require('../../packages/database/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schedules = await prisma.schedules.findMany();
  console.log('Total schedules count:', schedules.length);
  for (const s of schedules) {
    console.log(`Schedule id: ${s.id}, batchId: ${s.batchId}, notes: ${s.notes}`);
  }

  const liveClasses = await prisma.liveClasses.findMany({ take: 10, orderBy: { createdAt: 'desc' } });
  console.log('Recent LiveClasses count:', liveClasses.length);
  for (const lc of liveClasses) {
    console.log(`LiveClass id: ${lc.id}, title: ${lc.title}, notes: ${lc.teacherNotes}, desc: ${lc.description}`);
  }

  const attSessions = await prisma.attendanceSessions.findMany({ take: 10, orderBy: { createdAt: 'desc' } });
  console.log('Recent AttendanceSessions count:', attSessions.length);
  for (const as of attSessions) {
    console.log(`AttendanceSession id: ${as.id}, batchId: ${as.batchId}, remarks: ${as.remarks}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
