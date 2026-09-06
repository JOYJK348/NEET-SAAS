import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  try {
    console.log('=== DETAILED CBT EXAM BREAKDOWN CHECK ===');

    const submissions = await p.examSubmissions.findMany({
      where: { deletedAt: null },
      include: {
        exam: true,
      },
      orderBy: { submittedAt: 'desc' },
      take: 5
    });

    for (const sub of submissions) {
      console.log(`\n------------------------------------------------`);
      console.log(`Submission ID: ${sub.id}`);
      console.log(`Exam ID: ${sub.examId} | Title: "${sub.exam.title}" | Mode: ${sub.exam.mode}`);
      console.log(`Student Admission ID: ${sub.studentAdmissionId}`);

      // Check examQuestions
      const examQuestions = await p.examQuestions.findMany({
        where: { examId: sub.examId },
      });
      console.log(`ExamQuestions count: ${examQuestions.length}`);
      if (examQuestions.length > 0) {
        console.log('First examQuestion sample:', examQuestions[0]);
      }

      // Check import jobs
      const importJobs = await p.questionImportJobs.findMany({
        where: { examId: sub.examId },
      });
      console.log(`ImportJobs count: ${importJobs.length}`);
      importJobs.forEach(ij => console.log(`  - Job ID: ${ij.id}, Status: ${ij.status}, RawQuestions count: ${Array.isArray(ij.parsedQuestions) ? ij.parsedQuestions.length : 0}`));

      // Check examAttempts
      const attempts = await p.examAttempts.findMany({
        where: { examId: sub.examId },
      });
      console.log(`ExamAttempts count: ${attempts.length}`);
      for (const a of attempts) {
        console.log(`  - Attempt ID: ${a.id}, studentAdmissionId: ${a.studentAdmissionId}, status: ${a.status}`);
        const answers = await p.examAnswers.findMany({
          where: { attemptId: a.id },
        });
        console.log(`    ExamAnswers count for attempt ${a.id}: ${answers.length}`);
        if (answers.length > 0) {
          console.log(`    Answer sample:`, answers[0]);
        }
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await p.$disconnect();
  }
}

main();
