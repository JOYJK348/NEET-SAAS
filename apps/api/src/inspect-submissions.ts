import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectSubmissions() {
  const studentEmail = 'joyjk3348@gmail.com';

  const user = await prisma.users.findFirst({
    where: { email: studentEmail, deletedAt: null },
  });

  if (!user) return;

  const admission = await prisma.studentAdmissions.findFirst({
    where: { studentProfileId: user.id, deletedAt: null },
  });

  if (!admission) return;

  console.log('Admission ID:', admission.id);

  const submissions = await prisma.examSubmissions.findMany({
    where: {
      studentAdmissionId: admission.id,
      deletedAt: null,
    },
  });

  console.log('Exam Submissions for student:', submissions);

  const allSubmissionsInTenant = await prisma.examSubmissions.findMany({
    where: { tenantId: user.tenantId, deletedAt: null },
    take: 10,
  });

  console.log('All Submissions in Tenant:', allSubmissionsInTenant.map(s => ({
    id: s.id,
    examId: s.examId,
    studentAdmissionId: s.studentAdmissionId,
    obtainedMarks: s.obtainedMarks,
    status: s.status,
    evaluationStatus: s.evaluationStatus,
    isResultsPublished: s.isResultsPublished
  })));
}

inspectSubmissions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
