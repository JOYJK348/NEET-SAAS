import { PrismaClient, BranchType, UserTypeEnum } from '@prisma/client';
import { hashSync, genSaltSync } from 'bcrypt';

const prisma = new PrismaClient();

async function createReviewTenant() {
  const tenantEmail = 'tenant@review.com';
  const rawPassword = 'Admin@123';
  const tenantCode = 'REVIEW_TENANT';
  const tenantName = 'Review Institute';

  console.log(`Starting creation of tenant: ${tenantName} (${tenantEmail})...`);

  // 1. Create or find Institute (Tenant)
  let institute = await prisma.institutes.findFirst({
    where: { email: tenantEmail, deletedAt: null },
  });

  if (!institute) {
    console.log('Creating Institutes record...');
    institute = await prisma.institutes.create({
      data: {
        code: tenantCode,
        slug: 'review-institute',
        name: tenantName,
        displayName: tenantName,
        email: tenantEmail,
        phone: '9876543210',
        website: 'https://review.neetplatform.com',
        logoFileId: '',
        status: 'ACTIVE',
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        createdBy: 'system',
        updatedBy: 'system',
      },
    });
  }
  const tenantId = institute.id;
  console.log(`Tenant ID: ${tenantId}`);

  // 2. Create Branch
  let branch = await prisma.branches.findFirst({
    where: { tenantId, code: 'MAIN' },
  });

  if (!branch) {
    console.log('Creating Main Branch...');
    branch = await prisma.branches.create({
      data: {
        tenantId,
        code: 'MAIN',
        slug: 'main-branch',
        name: 'Main Campus',
        displayName: 'Main Campus',
        email: tenantEmail,
        phone: '9876543210',
        branchType: BranchType.HEAD_OFFICE,
        status: 'ACTIVE',
        timezone: 'Asia/Kolkata',
        createdBy: 'system',
        updatedBy: 'system',
      },
    });
  }

  // 3. Ensure TENANT_ADMIN role exists
  let adminRole = await prisma.roles.findFirst({
    where: { tenantId, code: `TENANT_ADMIN_${tenantId.slice(0, 8)}` },
  });

  if (!adminRole) {
    console.log('Creating TENANT_ADMIN role...');
    adminRole = await prisma.roles.create({
      data: {
        tenantId,
        code: `TENANT_ADMIN_${tenantId.slice(0, 8)}`,
        name: 'Tenant Administrator',
        roleType: 'SYSTEM',
        isDefault: false,
        isEditable: false,
        isDeletable: false,
        priority: 10,
        metadata: {},
        createdBy: 'system',
        updatedBy: 'system',
      },
    });
  }

  // 4. Create or Update Tenant Admin User
  const passwordHash = hashSync(rawPassword, genSaltSync(10));

  let adminUser = await prisma.users.findFirst({
    where: { tenantId, email: tenantEmail, deletedAt: null },
  });

  if (!adminUser) {
    console.log(`Creating Admin User: ${tenantEmail}...`);
    adminUser = await prisma.users.create({
      data: {
        tenantId,
        branchId: branch.id,
        email: tenantEmail,
        firstName: 'Review',
        lastName: 'Admin',
        userType: UserTypeEnum.STAFF,
        status: 'ACTIVE',
        isSuperAdmin: false,
        passwordHash,
        forcePasswordChange: false,
        createdBy: 'system',
        updatedBy: 'system',
      },
    });
  } else {
    console.log(`Updating password for existing Admin User: ${tenantEmail}...`);
    await prisma.users.update({
      where: { id: adminUser.id },
      data: {
        passwordHash,
        status: 'ACTIVE',
        updatedBy: 'system',
      },
    });
  }

  // 5. Ensure Role Assignment in userRoles
  const userRole = await prisma.userRoles.findFirst({
    where: { tenantId, userId: adminUser.id, roleId: adminRole.id },
  });

  if (!userRole) {
    console.log('Assigning TENANT_ADMIN role to user...');
    await prisma.userRoles.create({
      data: {
        tenantId,
        userId: adminUser.id,
        roleId: adminRole.id,
        effectiveFrom: new Date(),
        effectiveTo: new Date('2099-12-31'),
        revokedBy: '',
        revokedReason: '',
        metadata: {},
        assignedBy: adminUser.id,
        assignmentReason: 'Review Tenant Initial Setup',
        createdBy: 'system',
        updatedBy: 'system',
      },
    });
  }

  console.log('\n==========================================');
  console.log('NEW TENANT CREATED SUCCESSFULLY! 🎉');
  console.log(`Tenant Name   : ${tenantName}`);
  console.log(`Tenant ID     : ${tenantId}`);
  console.log(`Admin Email   : ${tenantEmail}`);
  console.log(`Admin Password: ${rawPassword}`);
  console.log('==========================================\n');
}

createReviewTenant()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
