import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma, DEMO_TENANT_ID, DEMO_BRANCH_ID, DEMO_PLATFORM_ADMIN_USER_ID, DEMO_TENANT_ADMIN_USER_ID, ROLE_CODES } from './helpers';
import { seedTenant, seedBranch, seedUsers } from './users';
import { seedRoles, ROLE_DEFINITIONS } from './roles';
import { seedPermissionGroups, seedPermissions, PERMISSION_GROUPS, PERMISSION_DEFINITIONS } from './permissions';
import { seedRolePermissions, ROLE_PERMISSION_MAPS } from './role-permissions';

async function runFullSeed(): Promise<void> {
  await seedTenant();
  await seedBranch();
  await seedRoles();
  const groupIdMap = await seedPermissionGroups();
  await seedPermissions(groupIdMap);

  const roles = await prisma.roles.findMany({ where: { tenantId: DEMO_TENANT_ID } });
  const roleIds = new Map<string, string>();
  for (const r of roles) {
    roleIds.set(r.code, r.id);
  }

  const perms = await prisma.permissions.findMany({ where: { tenantId: DEMO_TENANT_ID } });
  const permIds = new Map<string, string>();
  for (const p of perms) {
    permIds.set(p.permissionKey, p.id);
  }

  await seedRolePermissions(roleIds, permIds);
  await seedUsers(roleIds);
}

describe('S1-007 RBAC Seeder & Demo Data', () => {
  beforeAll(async () => {
    await runFullSeed();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('seed runs successfully and creates tenant', async () => {
    const tenant = await prisma.institutes.findUnique({ where: { id: DEMO_TENANT_ID } });
    expect(tenant).not.toBeNull();
    expect(tenant?.code).toBe('DEMO');
  });

  it('creates demo branch', async () => {
    const branch = await prisma.branches.findUnique({ where: { id: DEMO_BRANCH_ID } });
    expect(branch).not.toBeNull();
    expect(branch?.code).toBe('DEMO-HQ');
  });

  it('creates all 7 roles', async () => {
    const roles = await prisma.roles.findMany({ where: { tenantId: DEMO_TENANT_ID } });
    const roleCodes = roles.map((r) => r.code);
    expect(roleCodes).toContain(ROLE_CODES.PLATFORM_ADMIN);
    expect(roleCodes).toContain(ROLE_CODES.TENANT_ADMIN);
    expect(roleCodes).toContain(ROLE_CODES.BRANCH_ADMIN);
    expect(roleCodes).toContain(ROLE_CODES.FACULTY);
    expect(roleCodes).toContain(ROLE_CODES.STUDENT);
    expect(roleCodes).toContain(ROLE_CODES.PARENT);
    expect(roleCodes).toContain(ROLE_CODES.STAFF);
    expect(roles.length).toBe(ROLE_DEFINITIONS.length);
  });

  it('creates all 11 permission groups', async () => {
    const groups = await prisma.permissionGroups.findMany({ where: { tenantId: DEMO_TENANT_ID } });
    const groupCodes = groups.map((g) => g.code);
    for (const group of PERMISSION_GROUPS) {
      expect(groupCodes).toContain(group.code);
    }
    expect(groups.length).toBe(PERMISSION_GROUPS.length);
  });

  it('creates all permissions', async () => {
    const permissions = await prisma.permissions.findMany({ where: { tenantId: DEMO_TENANT_ID } });
    const permKeys = permissions.map((p) => p.permissionKey);
    for (const perm of PERMISSION_DEFINITIONS) {
      expect(permKeys).toContain(perm.key);
    }
    expect(permissions.length).toBe(PERMISSION_DEFINITIONS.length);
  });

  it('creates role-permission mappings', async () => {
    const mappings = await prisma.rolePermissions.findMany({ where: { tenantId: DEMO_TENANT_ID } });
    expect(mappings.length).toBeGreaterThan(0);
  });

  it('creates demo Platform Admin user', async () => {
    const user = await prisma.users.findUnique({ where: { id: DEMO_PLATFORM_ADMIN_USER_ID } });
    expect(user).not.toBeNull();
    expect(user?.isSuperAdmin).toBe(true);
    expect(user?.status).toBe('ACTIVE');
  });

  it('creates demo Tenant Admin user', async () => {
    const user = await prisma.users.findUnique({ where: { id: DEMO_TENANT_ADMIN_USER_ID } });
    expect(user).not.toBeNull();
    expect(user?.isSuperAdmin).toBe(false);
    expect(user?.status).toBe('ACTIVE');
  });

  it('assigns roles to demo users', async () => {
    const platformAdminRoles = await prisma.userRoles.findMany({
      where: { userId: DEMO_PLATFORM_ADMIN_USER_ID, tenantId: DEMO_TENANT_ID },
    });
    const tenantAdminRoles = await prisma.userRoles.findMany({
      where: { userId: DEMO_TENANT_ADMIN_USER_ID, tenantId: DEMO_TENANT_ID },
    });
    expect(platformAdminRoles.length).toBeGreaterThan(0);
    expect(tenantAdminRoles.length).toBeGreaterThan(0);
  });

  it('seed is idempotent (running twice does not duplicate data)', async () => {
    await runFullSeed();

    const tenants = await prisma.institutes.count({ where: { id: DEMO_TENANT_ID } });
    const branches = await prisma.branches.count({ where: { id: DEMO_BRANCH_ID } });
    const roles = await prisma.roles.count({ where: { tenantId: DEMO_TENANT_ID } });
    const groups = await prisma.permissionGroups.count({ where: { tenantId: DEMO_TENANT_ID } });
    const perms = await prisma.permissions.count({ where: { tenantId: DEMO_TENANT_ID } });
    const users = await prisma.users.count({ where: { tenantId: DEMO_TENANT_ID } });
    const userRoles = await prisma.userRoles.count({ where: { tenantId: DEMO_TENANT_ID } });

    expect(tenants).toBe(1);
    expect(branches).toBe(1);
    expect(roles).toBe(ROLE_DEFINITIONS.length);
    expect(groups).toBe(PERMISSION_GROUPS.length);
    expect(perms).toBe(PERMISSION_DEFINITIONS.length);
    expect(users).toBe(2);
    expect(userRoles).toBeGreaterThan(0);
  });
});
