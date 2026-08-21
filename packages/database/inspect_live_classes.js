const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const targetTenantId = 'fa3a02b9-d8d5-4429-b43d-91522878246d';
  console.log('--- INSPECTING LIVE CLASSES AND RECORDINGS ---');

  const classes = await prisma.liveClasses.findMany({
    where: { tenantId: targetTenantId }
  });

  const recordings = await prisma.liveClassRecordings.findMany({
    where: { tenantId: targetTenantId }
  });

  console.log(`LiveClasses count: ${classes.length}`);
  console.log(`LiveClassRecordings count: ${recordings.length}`);

  console.log('\nLiveClasses status breakdown:');
  classes.forEach((c, i) => {
    console.log(`${i+1}. ID: ${c.id} | TITLE: ${c.title} | SUBTITLE: ${c.subtitle} | STATUS: ${c.status} | DELETED_AT: ${c.deletedAt}`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
