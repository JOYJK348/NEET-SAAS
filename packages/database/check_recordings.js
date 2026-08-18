const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lcCount = await prisma.liveClasses.count();
  const lcrCount = await prisma.liveClassRecordings.count();
  const schedCount = await prisma.schedules.count();
  console.log('--- DATABASE CHECK ---');
  console.log('LiveClasses count:', lcCount);
  console.log('LiveClassRecordings count:', lcrCount);
  console.log('Schedules count:', schedCount);

  const lcAll = await prisma.liveClasses.findMany({ take: 5 });
  console.log('\nLiveClasses sample:', JSON.stringify(lcAll, null, 2));

  const lcrAll = await prisma.liveClassRecordings.findMany({ take: 5 });
  console.log('\nLiveClassRecordings sample:', JSON.stringify(lcrAll, null, 2));

  const schedAll = await prisma.schedules.findMany({ take: 5 });
  console.log('\nSchedules sample:', JSON.stringify(schedAll, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
