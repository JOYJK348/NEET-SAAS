import { prisma, DEMO_TENANT_ID, SYSTEM_USER_ID, DEFAULT_DELETED_AT } from './helpers';

const PERMISSION_GROUPS = [
  { code: 'USERS', title: 'Users', displayOrder: 1 },
  { code: 'ROLES', title: 'Roles', displayOrder: 2 },
  { code: 'STUDENTS', title: 'Students', displayOrder: 3 },
  { code: 'ATTENDANCE', title: 'Attendance', displayOrder: 4 },
  { code: 'LEARNING', title: 'Learning', displayOrder: 5 },
  { code: 'EXAMS', title: 'Exams', displayOrder: 6 },
  { code: 'FEES', title: 'Fees & Billing', displayOrder: 7 },
  { code: 'COMMUNICATION', title: 'Communication', displayOrder: 8 },
  { code: 'ANALYTICS', title: 'Analytics & Reports', displayOrder: 9 },
  { code: 'AI', title: 'AI Features', displayOrder: 10 },
  { code: 'PLATFORM', title: 'Platform', displayOrder: 11 },
];

interface PermissionDef {
  groupCode: string;
  key: string;
  resource: string;
  action: string;
  description: string;
  scope?: string;
}

const PERMISSION_DEFINITIONS: PermissionDef[] = [
  { groupCode: 'USERS', key: 'users.read', resource: 'users', action: 'read', description: 'View user details' },
  { groupCode: 'USERS', key: 'users.create', resource: 'users', action: 'create', description: 'Create new users' },
  { groupCode: 'USERS', key: 'users.update', resource: 'users', action: 'update', description: 'Update user details' },
  { groupCode: 'USERS', key: 'users.delete', resource: 'users', action: 'delete', description: 'Delete users' },
  { groupCode: 'USERS', key: 'users.impersonate', resource: 'users', action: 'impersonate', description: 'Impersonate users', scope: 'PLATFORM' },

  { groupCode: 'ROLES', key: 'roles.read', resource: 'roles', action: 'read', description: 'View roles and permissions' },
  { groupCode: 'ROLES', key: 'roles.create', resource: 'roles', action: 'create', description: 'Create new roles' },
  { groupCode: 'ROLES', key: 'roles.update', resource: 'roles', action: 'update', description: 'Update role permissions' },
  { groupCode: 'ROLES', key: 'roles.delete', resource: 'roles', action: 'delete', description: 'Delete custom roles' },
  { groupCode: 'ROLES', key: 'roles.assign', resource: 'roles', action: 'assign', description: 'Assign roles to users' },

  { groupCode: 'STUDENTS', key: 'students.read', resource: 'students', action: 'read', description: 'View student profiles' },
  { groupCode: 'STUDENTS', key: 'students.create', resource: 'students', action: 'create', description: 'Enroll new students' },
  { groupCode: 'STUDENTS', key: 'students.update', resource: 'students', action: 'update', description: 'Update student details' },
  { groupCode: 'STUDENTS', key: 'students.delete', resource: 'students', action: 'delete', description: 'Remove student records' },
  { groupCode: 'STUDENTS', key: 'students.transfer', resource: 'students', action: 'transfer', description: 'Transfer students between batches' },
  { groupCode: 'STUDENTS', key: 'students.export', resource: 'students', action: 'export', description: 'Export student data' },

  { groupCode: 'ATTENDANCE', key: 'attendance.read', resource: 'attendance', action: 'read', description: 'View attendance records' },
  { groupCode: 'ATTENDANCE', key: 'attendance.mark', resource: 'attendance', action: 'mark', description: 'Mark attendance' },
  { groupCode: 'ATTENDANCE', key: 'attendance.manage', resource: 'attendance', action: 'manage', description: 'Manage attendance sessions' },
  { groupCode: 'ATTENDANCE', key: 'attendance.export', resource: 'attendance', action: 'export', description: 'Export attendance reports' },
  { groupCode: 'ATTENDANCE', key: 'attendance.adjust', resource: 'attendance', action: 'adjust', description: 'Adjust attendance records' },

  { groupCode: 'LEARNING', key: 'learning.read', resource: 'learning', action: 'read', description: 'View learning materials' },
  { groupCode: 'LEARNING', key: 'learning.create', resource: 'learning', action: 'create', description: 'Create learning materials' },
  { groupCode: 'LEARNING', key: 'learning.update', resource: 'learning', action: 'update', description: 'Update learning materials' },
  { groupCode: 'LEARNING', key: 'learning.delete', resource: 'learning', action: 'delete', description: 'Delete learning materials' },
  { groupCode: 'LEARNING', key: 'learning.publish', resource: 'learning', action: 'publish', description: 'Publish learning content' },
  { groupCode: 'LEARNING', key: 'learning.progress', resource: 'learning', action: 'progress', description: 'View learning progress' },
  { groupCode: 'LEARNING', key: 'learning.self', resource: 'learning', action: 'self', description: 'Access self-paced learning' },

  { groupCode: 'EXAMS', key: 'exams.read', resource: 'exams', action: 'read', description: 'View exam details' },
  { groupCode: 'EXAMS', key: 'exams.create', resource: 'exams', action: 'create', description: 'Create exams' },
  { groupCode: 'EXAMS', key: 'exams.update', resource: 'exams', action: 'update', description: 'Update exam settings' },
  { groupCode: 'EXAMS', key: 'exams.delete', resource: 'exams', action: 'delete', description: 'Delete exams' },
  { groupCode: 'EXAMS', key: 'exams.conduct', resource: 'exams', action: 'conduct', description: 'Conduct exams' },
  { groupCode: 'EXAMS', key: 'exams.evaluate', resource: 'exams', action: 'evaluate', description: 'Evaluate exam answers' },
  { groupCode: 'EXAMS', key: 'exams.publish', resource: 'exams', action: 'publish', description: 'Publish exam results' },
  { groupCode: 'EXAMS', key: 'exams.attempt', resource: 'exams', action: 'attempt', description: 'Attempt exams' },

  { groupCode: 'FEES', key: 'fees.read', resource: 'fees', action: 'read', description: 'View fee records' },
  { groupCode: 'FEES', key: 'fees.create', resource: 'fees', action: 'create', description: 'Create fee structures' },
  { groupCode: 'FEES', key: 'fees.update', resource: 'fees', action: 'update', description: 'Update fee structures' },
  { groupCode: 'FEES', key: 'fees.collect', resource: 'fees', action: 'collect', description: 'Collect payments' },
  { groupCode: 'FEES', key: 'fees.discount', resource: 'fees', action: 'discount', description: 'Apply discounts' },
  { groupCode: 'FEES', key: 'fees.refund', resource: 'fees', action: 'refund', description: 'Process refunds' },
  { groupCode: 'FEES', key: 'fees.report', resource: 'fees', action: 'report', description: 'View fee reports' },
  { groupCode: 'FEES', key: 'fees.reconcile', resource: 'fees', action: 'reconcile', description: 'Reconcile payments' },

  { groupCode: 'COMMUNICATION', key: 'communication.send', resource: 'communication', action: 'send', description: 'Send notifications' },
  { groupCode: 'COMMUNICATION', key: 'communication.templates', resource: 'communication', action: 'templates', description: 'Manage notification templates' },
  { groupCode: 'COMMUNICATION', key: 'communication.campaigns', resource: 'communication', action: 'campaigns', description: 'Manage campaigns' },
  { groupCode: 'COMMUNICATION', key: 'communication.read', resource: 'communication', action: 'read', description: 'View communication history' },

  { groupCode: 'ANALYTICS', key: 'analytics.read', resource: 'analytics', action: 'read', description: 'View dashboards and reports' },
  { groupCode: 'ANALYTICS', key: 'analytics.create', resource: 'analytics', action: 'create', description: 'Create custom dashboards' },
  { groupCode: 'ANALYTICS', key: 'analytics.export', resource: 'analytics', action: 'export', description: 'Export analytics data' },
  { groupCode: 'ANALYTICS', key: 'analytics.manage', resource: 'analytics', action: 'manage', description: 'Manage report definitions' },

  { groupCode: 'AI', key: 'ai.read', resource: 'ai', action: 'read', description: 'View AI features' },
  { groupCode: 'AI', key: 'ai.use', resource: 'ai', action: 'use', description: 'Use AI tools' },
  { groupCode: 'AI', key: 'ai.manage', resource: 'ai', action: 'manage', description: 'Configure AI providers and models' },

  { groupCode: 'PLATFORM', key: 'platform.settings', resource: 'platform', action: 'settings', description: 'Manage platform settings', scope: 'PLATFORM' },
  { groupCode: 'PLATFORM', key: 'platform.audit', resource: 'platform', action: 'audit', description: 'View audit logs', scope: 'PLATFORM' },
  { groupCode: 'PLATFORM', key: 'platform.maintenance', resource: 'platform', action: 'maintenance', description: 'Platform maintenance mode', scope: 'PLATFORM' },
  { groupCode: 'PLATFORM', key: 'platform.jobs', resource: 'platform', action: 'jobs', description: 'Manage background jobs', scope: 'PLATFORM' },
  { groupCode: 'PLATFORM', key: 'platform.tenants', resource: 'platform', action: 'tenants', description: 'Manage tenants', scope: 'PLATFORM' },
];

export async function seedPermissionGroups(): Promise<Map<string, string>> {
  const groupIdMap = new Map<string, string>();

  for (const group of PERMISSION_GROUPS) {
    const result = await prisma.permissionGroups.upsert({
      where: { code: group.code },
      update: { title: group.title, displayOrder: group.displayOrder },
      create: {
        ...group,
        tenantId: DEMO_TENANT_ID,
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
        metadata: {},
        deletedAt: null,
        deletedBy: null,
      },
    });
    groupIdMap.set(group.code, result.id);
  }

  return groupIdMap;
}

export async function seedPermissions(groupIdMap: Map<string, string>): Promise<void> {
  for (const perm of PERMISSION_DEFINITIONS) {
    const permissionGroupId = groupIdMap.get(perm.groupCode);
    if (!permissionGroupId) {
      throw new Error(`Permission group not found: ${perm.groupCode}`);
    }

    const existing = await prisma.permissions.findFirst({
      where: { tenantId: DEMO_TENANT_ID, permissionKey: perm.key },
    });

    if (existing) {
      await prisma.permissions.update({
        where: { id: existing.id },
        data: {
          description: perm.description,
          resource: perm.resource,
          action: perm.action,
          permissionGroupId,
          scope: perm.scope ?? 'TENANT',
          updatedBy: SYSTEM_USER_ID,
        },
      });
    } else {
      await prisma.permissions.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          permissionGroupId,
          permissionKey: perm.key,
          resource: perm.resource,
          action: perm.action,
          description: perm.description,
          isSystem: true,
          scope: perm.scope ?? 'TENANT',
          createdBy: SYSTEM_USER_ID,
          updatedBy: SYSTEM_USER_ID,
          metadata: {},
          deletedAt: null,
          deletedBy: null,
        },
      });
    }
  }
}

export { PERMISSION_GROUPS, PERMISSION_DEFINITIONS };
