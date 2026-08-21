const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- FINDING USER & TENANT ---');

  // Search user by email tenant@review.com
  const user = await prisma.users.findFirst({
    where: { email: { equals: 'tenant@review.com', mode: 'insensitive' } },
  });

  console.log('User found:', user ? { id: user.id, email: user.email, tenantId: user.tenantId, role: user.role } : 'No user found with email tenant@review.com');

  let tenantId = user?.tenantId;

  if (!tenantId) {
    const tenant = await prisma.institutes.findFirst({
      where: {
        OR: [
          { email: { equals: 'tenant@review.com', mode: 'insensitive' } },
          { slug: 'review' }
        ]
      }
    });
    tenantId = tenant?.id;
    console.log('Institute found:', tenant);
  }

  // Fallback to default tenant if needed
  const targetTenantId = tenantId || 'fa3a02b9-d8d5-4429-b43d-91522878246d';
  console.log(`Target Tenant ID: ${targetTenantId}`);

  // Count LiveClassRecordings for this tenant
  const recordingsForTenant = await prisma.liveClassRecordings.findMany({
    where: { tenantId: targetTenantId, deletedAt: null },
  });

  // Count total LiveClassRecordings overall in DB
  const totalRecordingsGlobal = await prisma.liveClassRecordings.findMany({
    where: { deletedAt: null },
  });

  // Count LiveClasses for this tenant
  const liveClassesForTenant = await prisma.liveClasses.findMany({
    where: { tenantId: targetTenantId },
  });

  console.log('\n=============================================');
  console.log(`TENANT RECORDINGS SUMMARY for tenant@review.com`);
  console.log('=============================================');
  console.log(`Tenant ID: ${targetTenantId}`);
  console.log(`Total Recordings for this tenant: ${recordingsForTenant.length}`);
  console.log(`Total Live Classes for this tenant: ${liveClassesForTenant.length}`);
  console.log(`Global Total Recordings across ALL tenants: ${totalRecordingsGlobal.length}`);
  console.log('---------------------------------------------');

  if (recordingsForTenant.length > 0) {
    console.log('\n--- RECORDINGS LIST FOR THIS TENANT ---');
    const classMap = new Map(liveClassesForTenant.map(c => [c.id, c]));
    recordingsForTenant.forEach((r, i) => {
      const lc = classMap.get(r.liveClassId);
      console.log(`${i + 1}. ID: ${r.id} | TITLE: ${lc?.title || 'Live Recording'} | SUBTITLE: ${lc?.subtitle || ''} | STATUS: ${r.status}`);
    });
  }

  await prisma.$disconnect();
}

main().catch(console.error);
