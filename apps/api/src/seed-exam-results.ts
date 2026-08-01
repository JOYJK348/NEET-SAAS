import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedExamResultsForJayKumar() {
  const studentEmail = 'joyjk3348@gmail.com';

  const studentUser = await prisma.users.findFirst({
    where: { email: studentEmail, deletedAt: null },
  });

  if (!studentUser) return;

  const admission = await prisma.studentAdmissions.findFirst({
    where: { studentProfileId: studentUser.id, deletedAt: null },
  });

  if (!admission) return;

  const tenantId = studentUser.tenantId;

  // Get all exams in tenant
  const exams = await prisma.exams.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { scheduledStartAt: 'asc' },
  });

  console.log(`Found ${exams.length} exams in tenant.`);

  if (exams.length === 0) return;

  // Seed / Upsert ExamResult for 1st exam (e.g. 580/720 marks)
  const exam1 = exams[0];
  const attemptId1 = `att-${exam1.id}-${admission.id}`;

  const res1 = await prisma.examResults.upsert({
    where: {
      examId_studentAdmissionId: {
        examId: exam1.id,
        studentAdmissionId: admission.id,
      },
    },
    create: {
      tenantId,
      examId: exam1.id,
      attemptId: attemptId1,
      studentAdmissionId: admission.id,
      resultStatus: 'PUBLISHED',
      totalMarks: 720,
      obtainedMarks: 580,
      correct: 150,
      wrong: 20,
      skipped: 10,
      percentage: 80.5,
      percentile: 94.2,
      rank: 5,
      passingMarks: 360,
      passFail: true,
      grade: 'A',
      isFinal: true,
      reEvaluationRequested: false,
      reEvaluatedAt: new Date(),
      reEvaluatedBy: studentUser.id,
      aiEvaluationMetadata: {},
      resultHash: 'hash-123',
      publishedAt: new Date(),
      publishedBy: studentUser.id,
      createdBy: studentUser.id,
      updatedBy: studentUser.id,
    },
    update: {
      totalMarks: 720,
      obtainedMarks: 580,
      percentage: 80.5,
      rank: 5,
    },
  });

  console.log('Seeded ExamResult 1:', res1);

  // If 2nd exam exists, seed result for 2nd exam as well (e.g. 620/720)
  if (exams.length > 1) {
    const exam2 = exams[1];
    const attemptId2 = `att-${exam2.id}-${admission.id}`;

    const res2 = await prisma.examResults.upsert({
      where: {
        examId_studentAdmissionId: {
          examId: exam2.id,
          studentAdmissionId: admission.id,
        },
      },
      create: {
        tenantId,
        examId: exam2.id,
        attemptId: attemptId2,
        studentAdmissionId: admission.id,
        resultStatus: 'PUBLISHED',
        totalMarks: 720,
        obtainedMarks: 620,
        correct: 160,
        wrong: 15,
        skipped: 5,
        percentage: 86.1,
        percentile: 97.5,
        rank: 2,
        passingMarks: 360,
        passFail: true,
        grade: 'A+',
        isFinal: true,
        reEvaluationRequested: false,
        reEvaluatedAt: new Date(),
        reEvaluatedBy: studentUser.id,
        aiEvaluationMetadata: {},
        resultHash: 'hash-456',
        publishedAt: new Date(),
        publishedBy: studentUser.id,
        createdBy: studentUser.id,
        updatedBy: studentUser.id,
      },
      update: {
        totalMarks: 720,
        obtainedMarks: 620,
        percentage: 86.1,
        rank: 2,
      },
    });

    console.log('Seeded ExamResult 2:', res2);
  }
}

seedExamResultsForJayKumar()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
