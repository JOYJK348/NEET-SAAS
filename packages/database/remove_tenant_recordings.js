const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const targetTenantId = 'fa3a02b9-d8d5-4429-b43d-91522878246d';
  console.log(`--- REMOVING ONLY THE 50 RECORDINGS FOR TENANT: ${targetTenantId} ---`);

  // ONLY delete from LiveClassRecordings table
  const deletedRecordings = await prisma.liveClassRecordings.deleteMany({
    where: { tenantId: targetTenantId }
  });

  console.log(`✅ SUCCESS: Deleted ${deletedRecordings.count} recording records from LiveClassRecordings table for tenant@review.com!`);
  
  const remainingCount = await prisma.liveClassRecordings.count({
    where: { tenantId: targetTenantId }
  });
  console.log(`Remaining recordings for tenant@review.com: ${remainingCount}`);

  await prisma.$disconnect();
}

main().catch(console.error);
