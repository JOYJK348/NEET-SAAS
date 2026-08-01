import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTestExam() {
  const testExams = await prisma.exams.findMany({
    where: { title: { contains: 'test', mode: 'insensitive' } },
  });

  console.log('Test Exams found:', testExams.map((e) => ({
    id: e.id,
    title: e.title,
    scheduledStartAt: e.scheduledStartAt,
    examWindowEnd: e.examWindowEnd,
    isClosed: e.isClosed,
    publishStatus: e.publishStatus,
  })));

  const examIds = testExams.map((e) => e.id);

  const submissions = await prisma.examSubmissions.findMany({
    where: { examId: { in: examIds } },
  });

  console.log('Submissions for these test exams:', submissions.map((s) => ({
    id: s.id,
    examId: s.examId,
    studentAdmissionId: s.studentAdmissionId,
    status: s.status,
    evaluationStatus: s.evaluationStatus,
    isResultsPublished: s.isResultsPublished,
    obtainedMarks: s.obtainedMarks,
  })));
}

checkTestExam()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
