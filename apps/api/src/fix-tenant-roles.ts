import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTenantRoles() {
  const rolesToFix = await prisma.roles.findMany({
    where: { code: { startsWith: 'TENANT_ADMIN_' } },
  });

  for (const role of rolesToFix) {
    await prisma.roles.update({
      where: { id: role.id },
      data: { code: 'TENANT_ADMIN' },
    });
  }
  console.log(`Updated ${rolesToFix.length} tenant admin role codes to 'TENANT_ADMIN'`);
}

fixTenantRoles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
