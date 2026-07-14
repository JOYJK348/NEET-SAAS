-- AlterTable
ALTER TABLE "Users" ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserSessions" ADD COLUMN "tenantId" TEXT;
