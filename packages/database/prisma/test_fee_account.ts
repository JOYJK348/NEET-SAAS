import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  console.log('Testing getStudentFeeAccount...');

  const admissions = await prisma.studentAdmissions.findMany({
    where: { deletedAt: null },
    include: {
      studentProfileIstudent_profile: {
        include: { userIdusers: true },
      },
    },
  });

  for (const adm of admissions) {
    const user = adm.studentProfileIstudent_profile?.userIdusers;
    console.log(`\nTesting for Admission ID: ${adm.id}, User: ${user?.firstName} ${user?.lastName}, Tenant: ${adm.tenantId}`);

    const assignments = await prisma.studentFeeAssignments.findMany({
      where: { studentAdmissionId: adm.id, deletedAt: null },
    });

    console.log(`  Assignments found: ${assignments.length}`);
    for (const a of assignments) {
      const installments = await prisma.studentFeeInstallments.findMany({
        where: { studentFeeAssignmentId: a.id, deletedAt: null },
      });
      console.log(`    Assignment ID: ${a.id}, Tenant: ${a.tenantId}, Installments Count: ${installments.length}`);
    }
  }

  await prisma.$disconnect();
}

test().catch((e) => {
  console.error(e);
  prisma.$disconnect();
});
