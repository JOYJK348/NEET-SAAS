import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectExams() {
  const exams = await prisma.exams.findMany({
    where: { deletedAt: null },
  });

  console.log('All Exams in DB:', exams.map(e => ({
    id: e.id,
    title: e.title,
    scheduledStartAt: e.scheduledStartAt,
    examWindowEnd: e.examWindowEnd,
    isClosed: e.isClosed,
    publishStatus: e.publishStatus
  })));
}

inspectExams()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
