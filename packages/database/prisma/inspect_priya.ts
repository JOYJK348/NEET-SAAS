import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function inspect() {
  console.log('Inspecting student admissions...');

  const admissions = await prisma.studentAdmissions.findMany({
    where: { deletedAt: null },
    include: {
      studentProfileIstudent_profile: {
        include: { userIdusers: true },
      },
    },
  });

  console.log(`Found ${admissions.length} student admissions:`);
  for (const adm of admissions) {
    const user = adm.studentProfileIstudent_profile?.userIdusers;
    const assignments = await prisma.studentFeeAssignments.findMany({
      where: { studentAdmissionId: adm.id, deletedAt: null },
    });

    console.log(`\nStudent: ${user?.firstName} ${user?.lastName} (Admission ID: ${adm.id})`);
    console.log(`  Course: ${adm.courses?.name || 'No course linked'}`);
    console.log(`  Fee Assignments Count: ${assignments.length}`);
    if (assignments.length > 0) {
      for (const a of assignments) {
        console.log(`    Assignment ID: ${a.id}, Outstanding: ₹${a.outstandingAmount}`);
      }
    }
  }

  await prisma.$disconnect();
}

inspect().catch((e) => {
  console.error(e);
  prisma.$disconnect();
});
