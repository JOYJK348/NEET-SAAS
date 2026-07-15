import { prisma, DEMO_TENANT_ID, DEMO_BRANCH_ID, DEMO_PLATFORM_ADMIN_USER_ID, DEMO_TENANT_ADMIN_USER_ID, SYSTEM_USER_ID, DEFAULT_DELETED_AT } from './helpers';

const DEMO_PLATFORM_ADMIN_EMAIL = process.env['SEED_PLATFORM_ADMIN_EMAIL'] ?? 'admin@neetplatform.com';
const DEMO_TENANT_ADMIN_EMAIL = process.env['SEED_TENANT_ADMIN_EMAIL'] ?? 'tenant@demo.com';
const DEMO_DEFAULT_PASSWORD = process.env['SEED_DEFAULT_PASSWORD'] ?? 'Admin@123';

async function hashPassword(password: string): Promise<string> {
  const { hash } = await import('bcrypt');
  const rounds = Number(process.env['SEED_BCRYPT_ROUNDS']) || 8;
  return hash(password, rounds);
}

export async function seedTenant(): Promise<void> {
  await prisma.institutes.upsert({
    where: { id: DEMO_TENANT_ID },
    update: {
      code: 'DEMO',
      slug: 'demo-institute',
      name: 'Demo Institute',
      displayName: 'Demo NEET Institute',
      email: 'demo@institute.com',
      phone: '+91-9876543210',
      website: 'https://demo.neetplatform.com',
      logoFileId: '',
      status: 'ACTIVE',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      updatedBy: SYSTEM_USER_ID,
    },
    create: {
      id: DEMO_TENANT_ID,
      code: 'DEMO',
      slug: 'demo-institute',
      name: 'Demo Institute',
      displayName: 'Demo NEET Institute',
      email: 'demo@institute.com',
      phone: '+91-9876543210',
      website: 'https://demo.neetplatform.com',
      logoFileId: '',
      status: 'ACTIVE',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
      deletedAt: null,
      deletedBy: null,
    },
  });
}

export async function seedBranch(): Promise<void> {
  await prisma.branches.upsert({
    where: { id: DEMO_BRANCH_ID },
    update: {
      code: 'DEMO-HQ',
      slug: 'demo-hq',
      name: 'Demo Head Office',
      displayName: 'Demo Head Office',
      email: 'hq@demo.com',
      phone: '+91-9876543210',
      branchType: 'HEAD_OFFICE',
      status: 'ACTIVE',
      updatedBy: SYSTEM_USER_ID,
    },
    create: {
      id: DEMO_BRANCH_ID,
      tenantId: DEMO_TENANT_ID,
      code: 'DEMO-HQ',
      slug: 'demo-hq',
      name: 'Demo Head Office',
      displayName: 'Demo Head Office',
      email: 'hq@demo.com',
      phone: '+91-9876543210',
      branchType: 'HEAD_OFFICE',
      status: 'ACTIVE',
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
      deletedAt: null,
      deletedBy: null,
    },
  });
}

export async function seedUsers(roleIds: Map<string, string>): Promise<void> {
  const passwordHash = await hashPassword(DEMO_DEFAULT_PASSWORD);

  const platformAdminUser = await prisma.users.upsert({
    where: { id: DEMO_PLATFORM_ADMIN_USER_ID },
    update: {
      email: DEMO_PLATFORM_ADMIN_EMAIL,
      firstName: 'Platform',
      lastName: 'Admin',
      userType: 'STAFF',
      status: 'ACTIVE',
      isSuperAdmin: true,
      forcePasswordChange: false,
      updatedBy: SYSTEM_USER_ID,
    },
    create: {
      id: DEMO_PLATFORM_ADMIN_USER_ID,
      tenantId: DEMO_TENANT_ID,
      branchId: DEMO_BRANCH_ID,
      email: DEMO_PLATFORM_ADMIN_EMAIL,
      firstName: 'Platform',
      lastName: 'Admin',
      userType: 'STAFF',
      status: 'ACTIVE',
      isSuperAdmin: true,
      passwordHash,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
      deletedAt: null,
      deletedBy: null,
    },
  });

  const tenantAdminUser = await prisma.users.upsert({
    where: { id: DEMO_TENANT_ADMIN_USER_ID },
    update: {
      email: DEMO_TENANT_ADMIN_EMAIL,
      firstName: 'Tenant',
      lastName: 'Admin',
      userType: 'STAFF',
      status: 'ACTIVE',
      isSuperAdmin: false,
      updatedBy: SYSTEM_USER_ID,
    },
    create: {
      id: DEMO_TENANT_ADMIN_USER_ID,
      tenantId: DEMO_TENANT_ID,
      branchId: DEMO_BRANCH_ID,
      email: DEMO_TENANT_ADMIN_EMAIL,
      firstName: 'Tenant',
      lastName: 'Admin',
      userType: 'STAFF',
      status: 'ACTIVE',
      isSuperAdmin: false,
      passwordHash,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
      deletedAt: null,
      deletedBy: null,
    },
  });

  const platformAdminRoleId = roleIds.get('PLATFORM_ADMIN');
  const tenantAdminRoleId = roleIds.get('TENANT_ADMIN');

  if (platformAdminRoleId) {
    await assignRole(platformAdminUser.id, platformAdminRoleId);
  }
  if (tenantAdminRoleId) {
    await assignRole(tenantAdminUser.id, tenantAdminRoleId);
  }
}

async function assignRole(userId: string, roleId: string): Promise<void> {
  const existing = await prisma.userRoles.findFirst({
    where: { tenantId: DEMO_TENANT_ID, userId, roleId, revokedBy: '', effectiveTo: DEFAULT_DELETED_AT },
  });

  if (!existing) {
    await prisma.userRoles.create({
      data: {
        tenantId: DEMO_TENANT_ID,
        userId,
        roleId,
        assignedBy: SYSTEM_USER_ID,
        assignmentReason: 'System seed - demo user',
        effectiveTo: DEFAULT_DELETED_AT,
        revokedBy: '',
        revokedReason: '',
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
        metadata: {},
        deletedAt: null,
        deletedBy: null,
      },
    });
  }
}
