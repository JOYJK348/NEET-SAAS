import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';
export const DEMO_BRANCH_ID = '00000000-0000-0000-0000-000000000002';
export const DEMO_PLATFORM_ADMIN_USER_ID = '00000000-0000-0000-0000-000000000003';
export const DEMO_TENANT_ADMIN_USER_ID = '00000000-0000-0000-0000-000000000004';

export const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

export const ROLE_CODES = {
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  BRANCH_ADMIN: 'BRANCH_ADMIN',
  FACULTY: 'FACULTY',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
  STAFF: 'STAFF',
} as const;

export const DEFAULT_DELETED_AT = new Date('2099-12-31T00:00:00.000Z');

export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}
