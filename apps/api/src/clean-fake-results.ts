import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanFakeExamResults() {
  const studentEmail = 'joyjk3348@gmail.com';

  const user = await prisma.users.findFirst({
    where: { email: studentEmail, deletedAt: null },
  });

  if (!user) return;

  const admission = await prisma.studentAdmissions.findFirst({
    where: { studentProfileId: user.id, deletedAt: null },
  });

  if (!admission) return;

  console.log('Cleaning fake examResults for admission:', admission.id);
  const deleted = await prisma.examResults.deleteMany({
    where: { studentAdmissionId: admission.id },
  });

  console.log(`Deleted ${deleted.count} fake examResults records.`);

  const realSubmissions = await prisma.examSubmissions.findMany({
    where: { studentAdmissionId: admission.id, deletedAt: null },
  });

  console.log('Real Submissions in DB for student:', realSubmissions.map(s => ({
    id: s.id,
    examId: s.examId,
    obtainedMarks: s.obtainedMarks,
    status: s.status,
    evaluationStatus: s.evaluationStatus,
    isResultsPublished: s.isResultsPublished,
    tutorNotes: s.tutorNotes,
    rank: s.rank,
  })));
}

cleanFakeExamResults()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
