const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const targetTenantId = 'fa3a02b9-d8d5-4429-b43d-91522878246d';
  console.log('--- ALL TABLES CHECK FOR RECORDINGS / PRE-RECORDED VIDEOS ---');

  // Let's inspect model names in prisma
  const keys = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
  console.log('Prisma Models:', keys);

  for (const k of keys) {
    if (k.toLowerCase().includes('video') || k.toLowerCase().includes('rec') || k.toLowerCase().includes('lecture') || k.toLowerCase().includes('media') || k.toLowerCase().includes('content')) {
      try {
        const count = await prisma[k].count({ where: { tenantId: targetTenantId } });
        console.log(`Model [${k}] count for tenant@review.com: ${count}`);
      } catch {
        try {
          const totalCount = await prisma[k].count();
          console.log(`Model [${k}] global count: ${totalCount}`);
        } catch {}
      }
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
