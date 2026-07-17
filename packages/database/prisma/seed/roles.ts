import { prisma, DEMO_TENANT_ID, SYSTEM_USER_ID, ROLE_CODES, DEFAULT_DELETED_AT } from './helpers';

const ROLE_DEFINITIONS = [
  {
    code: ROLE_CODES.PLATFORM_ADMIN,
    name: 'Platform Admin',
    roleType: 'SYSTEM',
    isDefault: false,
    isEditable: false,
    isDeletable: false,
    priority: 1,
    metadata: { description: 'Full system-wide access to all platform features' },
  },
  {
    code: ROLE_CODES.TENANT_ADMIN,
    name: 'Tenant Admin',
    roleType: 'SYSTEM',
    isDefault: false,
    isEditable: false,
    isDeletable: false,
    priority: 10,
    metadata: { description: 'Full access within their institute' },
  },
  {
    code: ROLE_CODES.BRANCH_ADMIN,
    name: 'Branch Admin',
    roleType: 'SYSTEM',
    isDefault: false,
    isEditable: true,
    isDeletable: false,
    priority: 20,
    metadata: { description: 'Branch-level administrative access' },
  },
  {
    code: ROLE_CODES.FACULTY,
    name: 'Faculty',
    roleType: 'SYSTEM',
    isDefault: false,
    isEditable: true,
    isDeletable: false,
    priority: 30,
    metadata: { description: 'Teaching staff with access to learning and exam modules' },
  },
  {
    code: ROLE_CODES.STUDENT,
    name: 'Student',
    roleType: 'SYSTEM',
    isDefault: true,
    isEditable: false,
    isDeletable: false,
    priority: 50,
    metadata: { description: 'Standard student with self-learning access' },
  },
  {
    code: ROLE_CODES.PARENT,
    name: 'Parent',
    roleType: 'SYSTEM',
    isDefault: false,
    isEditable: false,
    isDeletable: false,
    priority: 60,
    metadata: { description: 'Parent with child-related read access' },
  },
  {
    code: ROLE_CODES.STAFF,
    name: 'Staff',
    roleType: 'SYSTEM',
    isDefault: false,
    isEditable: true,
    isDeletable: false,
    priority: 40,
    metadata: { description: 'Non-teaching operational staff' },
  },
];

export async function seedRoles(): Promise<void> {
  for (const role of ROLE_DEFINITIONS) {
    await prisma.roles.upsert({
      where: { code: role.code },
      update: role,
      create: {
        ...role,
        tenantId: DEMO_TENANT_ID,
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
        deletedAt: null,
        deletedBy: null,
      },
    });
  }
}

export { ROLE_DEFINITIONS };
