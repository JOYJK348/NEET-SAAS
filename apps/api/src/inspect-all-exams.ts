import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOnlineExams() {
  const now = new Date();

  // 1. Update all ONLINE mode exams with completed submissions or closed status to RESULT_PUBLISHED
  const onlineExams = await prisma.exams.findMany({
    where: { mode: 'ONLINE', deletedAt: null },
  });

  for (const exam of onlineExams) {
    await prisma.exams.update({
      where: { id: exam.id },
      data: {
        publishStatus: 'RESULT_PUBLISHED',
        resultsPublishedAt: exam.resultsPublishedAt || now,
        isClosed: true,
        closedAt: exam.closedAt || now,
      },
    });

    await prisma.examSubmissions.updateMany({
      where: { examId: exam.id, deletedAt: null },
      data: {
        isResultsPublished: true,
        resultsPublishedAt: now,
        evaluationStatus: 'COMPLETED',
      },
    });
  }

  console.log('Successfully updated Online CBT exams and submissions to RESULT_PUBLISHED!');
}

fixOnlineExams()
  .catch(console.error)
  .finally(() => prisma.$disconnect());


