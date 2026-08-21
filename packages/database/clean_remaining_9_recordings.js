const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const targetTenantId = 'fa3a02b9-d8d5-4429-b43d-91522878246d';
  console.log(`--- CLEANING ALL RECORDINGS FOR TENANT: ${targetTenantId} ---`);

  // Delete all rows from LiveClassRecordings table
  const delRecs = await prisma.liveClassRecordings.deleteMany({
    where: { tenantId: targetTenantId }
  });

  console.log(`✅ Deleted ${delRecs.count} rows from LiveClassRecordings table!`);

  const countAfter = await prisma.liveClassRecordings.count({
    where: { tenantId: targetTenantId }
  });

  console.log(`Remaining recordings count for tenant@review.com: ${countAfter}`);
  await prisma.$disconnect();
}

main().catch(console.error);
