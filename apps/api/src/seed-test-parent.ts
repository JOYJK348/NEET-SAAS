import { PrismaClient } from '@prisma/client';
import { hashSync, genSaltSync } from 'bcrypt';

const prisma = new PrismaClient();

async function seedTestParent() {
  const studentEmail = 'joyjk3348@gmail.com';
  const parentEmail = 'parent.joyjk3348@gmail.com';
  const rawParentPassword = 'Parent@123456';

  console.log(`Searching for student with email: ${studentEmail}...`);

  const studentUser = await prisma.users.findFirst({
    where: { email: studentEmail, deletedAt: null },
  });

  if (!studentUser) {
    console.error(`Student with email ${studentEmail} not found!`);
    const allStudents = await prisma.users.findMany({
      where: { userType: 'STUDENT', deletedAt: null },
      take: 10,
    });
    console.log(
      'Available students in DB:',
      allStudents.map((s: any) => ({
        id: s.id,
        email: s.email,
        name: `${s.firstName} ${s.lastName}`,
      })),
    );
    process.exit(1);
  }

  console.log(
    `Found student user: ${studentUser.firstName} ${studentUser.lastName} (ID: ${studentUser.id}, Tenant: ${studentUser.tenantId})`,
  );

  const studentProfile = await prisma.studentProfiles.findFirst({
    where: { userId: studentUser.id, tenantId: studentUser.tenantId },
  });

  if (!studentProfile) {
    console.error(`Student profile not found for user ID: ${studentUser.id}`);
    process.exit(1);
  }

  // 1. Ensure PARENT role exists
  let parentRole = await prisma.roles.findFirst({
    where: { tenantId: studentUser.tenantId, code: 'PARENT' },
  });

  if (!parentRole) {
    console.log('Creating PARENT role in tenant...');
    parentRole = await prisma.roles.create({
      data: {
        tenantId: studentUser.tenantId,
        code: 'PARENT',
        name: 'Parent',
        roleType: 'SYSTEM',
        isDefault: false,
        isEditable: false,
        isDeletable: false,
        priority: 1,
        metadata: {},
        createdBy: studentUser.id,
        updatedBy: studentUser.id,
      },
    });
  }

  // 2. Find or create Parent user
  let parentUser = await prisma.users.findFirst({
    where: { email: parentEmail, tenantId: studentUser.tenantId, deletedAt: null },
  });

  const parentHash = hashSync(rawParentPassword, genSaltSync(10));

  if (!parentUser) {
    console.log(`Creating new Parent user: ${parentEmail}...`);
    parentUser = await prisma.users.create({
      data: {
        tenantId: studentUser.tenantId,
        branchId: studentUser.branchId || '',
        email: parentEmail,
        firstName: 'Parent',
        lastName: studentUser.lastName || 'Guardian',
        userType: 'PARENT',
        status: 'ACTIVE',
        passwordHash: parentHash,
        forcePasswordChange: false,
        createdBy: studentUser.id,
        updatedBy: studentUser.id,
      },
    });
  } else {
    console.log(`Updating existing Parent user password for ${parentEmail}...`);
    await prisma.users.update({
      where: { id: parentUser.id },
      data: {
        passwordHash: parentHash,
        status: 'ACTIVE',
        updatedBy: studentUser.id,
      },
    });
  }

  // 3. Ensure ParentProfile
  let parentProfile = await prisma.parentProfiles.findFirst({
    where: { userId: parentUser.id, tenantId: studentUser.tenantId },
  });

  if (!parentProfile) {
    console.log('Creating ParentProfile record...');
    parentProfile = await prisma.parentProfiles.create({
      data: {
        userId: parentUser.id,
        tenantId: studentUser.tenantId,
        occupation: 'Business',
        educationLevel: 'Graduate',
        createdBy: studentUser.id,
        updatedBy: studentUser.id,
      },
    });
  }

  // 4. Ensure PARENT role assignment in userRoles
  const userRole = await prisma.userRoles.findFirst({
    where: { tenantId: studentUser.tenantId, userId: parentUser.id, roleId: parentRole.id },
  });

  if (!userRole) {
    console.log('Assigning PARENT role to user...');
    await prisma.userRoles.create({
      data: {
        tenantId: studentUser.tenantId,
        userId: parentUser.id,
        roleId: parentRole.id,
        effectiveFrom: new Date(),
        effectiveTo: new Date('2099-12-31'),
        revokedBy: '',
        revokedReason: '',
        metadata: {},
        assignedBy: studentUser.id,
        assignmentReason: 'Test Parent Creation',
        createdBy: studentUser.id,
        updatedBy: studentUser.id,
      },
    });
  }

  // 5. Create/upsert StudentParents link
  console.log('Creating StudentParents link...');
  await prisma.studentParents.upsert({
    where: {
      studentProfileId_parentProfileId: {
        studentProfileId: studentProfile.userId,
        parentProfileId: parentUser.id,
      },
    },
    create: {
      tenantId: studentUser.tenantId,
      studentProfileId: studentProfile.userId,
      parentProfileId: parentUser.id,
      relationshipType: 'FATHER',
      isPrimaryGuardian: true,
      createdBy: studentUser.id,
      updatedBy: studentUser.id,
    },
    update: {
      relationshipType: 'FATHER',
      isPrimaryGuardian: true,
      updatedBy: studentUser.id,
    },
  });

  console.log('\n==========================================');
  console.log('SUCCESS! TEST PARENT ACCOUNT READY:');
  console.log(`Student Name  : ${studentUser.firstName} ${studentUser.lastName}`);
  console.log(`Student Email : ${studentEmail}`);
  console.log(`Parent Email  : ${parentEmail}`);
  console.log(`Parent Password: ${rawParentPassword}`);
  console.log('==========================================\n');
}

seedTestParent()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
