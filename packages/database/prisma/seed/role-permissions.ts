import { prisma, DEMO_TENANT_ID, SYSTEM_USER_ID, ROLE_CODES, DEFAULT_DELETED_AT } from './helpers';

interface RolePermissionMap {
  roleCode: string;
  permissionKeys: string[];
}

const ROLE_PERMISSION_MAPS: RolePermissionMap[] = [
  {
    roleCode: ROLE_CODES.PLATFORM_ADMIN,
    permissionKeys: ['*'],
  },
  {
    roleCode: ROLE_CODES.TENANT_ADMIN,
    permissionKeys: [
      'users.read', 'users.create', 'users.update', 'users.delete',
      'roles.read', 'roles.create', 'roles.update', 'roles.delete', 'roles.assign',
      'students.read', 'students.create', 'students.update', 'students.delete',
      'students.transfer', 'students.export',
      'attendance.read', 'attendance.mark', 'attendance.manage', 'attendance.export', 'attendance.adjust',
      'learning.read', 'learning.create', 'learning.update', 'learning.delete', 'learning.publish', 'learning.progress',
      'exams.read', 'exams.create', 'exams.update', 'exams.delete', 'exams.conduct', 'exams.evaluate', 'exams.publish',
      'fees.read', 'fees.create', 'fees.update', 'fees.collect', 'fees.discount', 'fees.refund', 'fees.report', 'fees.reconcile',
      'communication.send', 'communication.templates', 'communication.campaigns', 'communication.read',
      'analytics.read', 'analytics.create', 'analytics.export', 'analytics.manage',
      'ai.read', 'ai.use', 'ai.manage',
      'branches.read', 'branches.create', 'branches.update', 'branches.delete',
    ],
  },
  {
    roleCode: ROLE_CODES.BRANCH_ADMIN,
    permissionKeys: [
      'users.read', 'users.create', 'users.update',
      'students.read', 'students.create', 'students.update',
      'students.transfer',
      'attendance.read', 'attendance.mark', 'attendance.manage',
      'learning.read', 'learning.create', 'learning.update', 'learning.progress',
      'exams.read', 'exams.conduct',
      'fees.read', 'fees.collect',
      'communication.send',
      'analytics.read',
      'ai.read', 'ai.use',
      'branches.read', 'branches.update',
    ],
  },
  {
    roleCode: ROLE_CODES.FACULTY,
    permissionKeys: [
      'students.read',
      'attendance.read', 'attendance.mark',
      'learning.read', 'learning.create', 'learning.update', 'learning.progress',
      'exams.read', 'exams.conduct', 'exams.evaluate',
      'analytics.read',
      'ai.read', 'ai.use',
    ],
  },
  {
    roleCode: ROLE_CODES.STUDENT,
    permissionKeys: [
      'learning.read', 'learning.self', 'learning.progress',
      'exams.read', 'exams.attempt',
      'attendance.read',
      'fees.read',
      'communication.read',
      'ai.read', 'ai.use',
    ],
  },
  {
    roleCode: ROLE_CODES.PARENT,
    permissionKeys: [
      'students.read',
      'attendance.read',
      'learning.progress',
      'exams.read',
      'fees.read',
      'communication.read',
    ],
  },
  {
    roleCode: ROLE_CODES.STAFF,
    permissionKeys: [
      'users.read',
      'students.read',
      'attendance.read',
      'fees.read', 'fees.collect',
      'communication.send',
      'analytics.read',
    ],
  },
];

export async function seedRolePermissions(roleIds: Map<string, string>, permissionIds: Map<string, string>): Promise<void> {
  for (const mapping of ROLE_PERMISSION_MAPS) {
    const roleId = roleIds.get(mapping.roleCode);
    if (!roleId) {
      throw new Error(`Role not found: ${mapping.roleCode}`);
    }

    for (const permissionKey of mapping.permissionKeys) {
      if (permissionKey === '*') {
        for (const [, permId] of permissionIds) {
          await upsertRolePermission(roleId, permId);
        }
      } else {
        const permId = permissionIds.get(permissionKey);
        if (permId) {
          await upsertRolePermission(roleId, permId);
        }
      }
    }
  }
}

async function upsertRolePermission(roleId: string, permissionId: string): Promise<void> {
  try {
    await prisma.rolePermissions.create({
      data: {
        tenantId: DEMO_TENANT_ID,
        roleId,
        permissionId,
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
        metadata: {},
        deletedAt: null,
        deletedBy: null,
      },
    });
  } catch (err: unknown) {
    const prismaErr = err as { code?: string; meta?: { target?: string[] } };
    if (prismaErr.code === 'P2002') {
      return;
    }
    throw err;
  }
}

export { ROLE_PERMISSION_MAPS };
