import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function test() {
  try {
    const submission = await p.examSubmissions.findFirst({
      where: { exam: { mode: 'ONLINE' }, deletedAt: null },
      include: {
        studentAdmission: {
          include: {
            studentProfileIstudent_profile: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' },
    });

    if (!submission) {
      console.log('No online submission found');
      return;
    }

    console.log(`Testing submission: ${submission.id} for exam ${submission.examId}`);

    const studentProfile = submission.studentAdmission?.studentProfileIstudent_profile;

    const candidateStudentIds = [
      submission.studentAdmissionId,
      studentProfile?.userId,
      studentProfile?.id,
      submission.studentAdmission?.id,
    ].filter(Boolean);

    const attempt = await p.examAttempts.findFirst({
      where: {
        examId: submission.examId,
        deletedAt: null,
        OR: [
          { studentAdmissionId: { in: candidateStudentIds } },
          { createdBy: { in: candidateStudentIds } },
        ],
      },
      orderBy: { startedAt: 'desc' },
    });

    console.log('Attempt found:', attempt?.id);

    let examQuestions = await p.examQuestions.findMany({
      where: { examId: submission.examId, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
    });

    console.log('Exam questions count:', examQuestions.length);

    if (examQuestions.length > 0) {
      const questionIds = examQuestions.map((eq) => eq.questionBankId);

      const [questions, questionOptions] = await Promise.all([
        p.questions.findMany({
          where: { id: { in: questionIds } },
        }),
        p.questionOptions.findMany({
          where: { questionId: { in: questionIds } },
        }),
      ]);

      console.log('Questions found:', questions.length);
      console.log('Options found:', questionOptions.length);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await p.$disconnect();
  }
}

test();
