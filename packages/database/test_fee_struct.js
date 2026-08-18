const { PrismaClient } = require('d:/FreeLance/NEET_platform/packages/database/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admissions = await prisma.studentAdmissions.findMany({
    take: 5,
    include: {
      studentProfileIstudent_profile: {
        include: { userIdusers: true },
      },
    },
  });

  console.log('=== ADMISSIONS ===');
  for (const a of admissions) {
    const assignments = await prisma.studentFeeAssignments.findMany({
      where: { studentAdmissionId: a.id, deletedAt: null },
    });
    console.log({
      id: a.id,
      admissionNumber: a.admissionNumber,
      studentName: `${a.studentProfileIstudent_profile?.userIdusers?.firstName} ${a.studentProfileIstudent_profile?.userIdusers?.lastName}`,
      tenantId: a.tenantId,
      assignmentsCount: assignments.length,
      assignments,
    });
  }

  const feeStructures = await prisma.feeStructures.findMany({
    where: { deletedAt: null },
  });
  console.log('=== FEE STRUCTURES ===', feeStructures);
}

main().catch(console.error).finally(() => prisma.$disconnect());
