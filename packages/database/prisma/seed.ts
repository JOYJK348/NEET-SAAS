import { prisma, disconnect, DEMO_TENANT_ID } from './seed/helpers';
import { seedRoles } from './seed/roles';
import { seedPermissionGroups, seedPermissions } from './seed/permissions';
import { seedRolePermissions } from './seed/role-permissions';
import { seedTenant, seedBranch, seedUsers } from './seed/users';

async function getRoleIdMap(): Promise<Map<string, string>> {
  const roles = await prisma.roles.findMany({ where: { tenantId: DEMO_TENANT_ID } });
  const map = new Map<string, string>();
  for (const role of roles) {
    map.set(role.code, role.id);
  }
  return map;
}

async function getPermissionIdMap(): Promise<Map<string, string>> {
  const permissions = await prisma.permissions.findMany({ where: { tenantId: DEMO_TENANT_ID } });
  const map = new Map<string, string>();
  for (const perm of permissions) {
    map.set(perm.permissionKey, perm.id);
  }
  return map;
}

async function main(): Promise<void> {
  await seedTenant();
  await seedBranch();
  await seedRoles();

  const groupIdMap = await seedPermissionGroups();
  await seedPermissions(groupIdMap);

  const roleIds = await getRoleIdMap();
  const permissionIds = await getPermissionIdMap();
  await seedRolePermissions(roleIds, permissionIds);
  await seedUsers(roleIds);
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await disconnect();
  });
