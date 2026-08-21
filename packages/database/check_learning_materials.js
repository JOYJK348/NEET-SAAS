const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const targetTenantId = 'fa3a02b9-d8d5-4429-b43d-91522878246d';
  
  const materials = await prisma.learningMaterials.findMany({
    where: { tenantId: targetTenantId }
  });

  const attachments = await prisma.materialAttachments.findMany({
    where: { tenantId: targetTenantId }
  });

  console.log(`Learning Materials Count for tenant@review.com: ${materials.length}`);
  console.log(`Material Attachments Count for tenant@review.com: ${attachments.length}`);

  await prisma.$disconnect();
}

main().catch(console.error);
