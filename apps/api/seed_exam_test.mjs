import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function run() {
  const examId = '56ff3c8f-7054-4d8a-a86f-f63b58c3af00';
  const tenantId = 'fa3a02b9-d8d5-4429-b43d-91522878246d';
  const userId = '7a0acc74-50a5-4ac7-962d-dda85488a5cd';

  const questionsToSeed = [
    {
      subject: 'Physics',
      questionText: '1. [Physics] A body is moving along a circular path of radius R. What is the displacement after completing half a circle?',
      options: [
        { label: 'A', text: 'Zero' },
        { label: 'B', text: 'πR' },
        { label: 'C', text: '2R' },
        { label: 'D', text: '2πR' },
      ],
      correctAnswer: 'C',
      marks: 4,
      negativeMarks: 1,
    },
    {
      subject: 'Chemistry',
      questionText: '2. [Chemistry] Which of the following has the maximum number of molecules?',
      options: [
        { label: 'A', text: '7g N2' },
        { label: 'B', text: '2g H2' },
        { label: 'C', text: '16g NO2' },
        { label: 'D', text: '16g O2' },
      ],
      correctAnswer: 'B',
      marks: 4,
      negativeMarks: 1,
    },
    {
      subject: 'Botany',
      questionText: '3. [Botany] The powerhouse of the cell is:',
      options: [
        { label: 'A', text: 'Nucleus' },
        { label: 'B', text: 'Mitochondria' },
        { label: 'C', text: 'Golgi Complex' },
        { label: 'D', text: 'Endoplasmic Reticulum' },
      ],
      correctAnswer: 'B',
      marks: 4,
      negativeMarks: 1,
    },
  ];

  let order = 1;
  for (const qData of questionsToSeed) {
    const createdQuestion = await p.questions.create({
      data: {
        tenantId,
        questionCode: `NEET-${examId.slice(-6)}-Q${order}-${Date.now()}`,
        subjectId: 'general-subject',
        chapterId: 'general-chapter',
        topicId: 'general-topic',
        questionType: 'MCQ',
        questionText: qData.questionText,
        difficulty: 'MEDIUM',
        bloomsLevel: 'APPLY',
        language: 'EN',
        source: 'IMPORT',
        questionStatus: 'APPROVED',
        publishedVersion: 1,
        isLocked: false,
        lockedAt: new Date(),
        lockedBy: userId,
        approvedBy: userId,
        approvedAt: new Date(),
        aiMetadata: {},
        embeddingMetadata: {},
        difficultyPrediction: {},
        taxonomyMetadata: {},
        createdBy: userId,
        updatedBy: userId,
      },
    });

    for (let j = 0; j < qData.options.length; j++) {
      const opt = qData.options[j];
      await p.questionOptions.create({
        data: {
          tenantId,
          questionId: createdQuestion.id,
          optionOrder: j + 1,
          optionLabel: opt.label,
          optionText: opt.text || '',
          attachmentId: '',
          isCorrect: opt.label === qData.correctAnswer,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }

    await p.examQuestions.create({
      data: {
        tenantId,
        examId,
        sectionId: '',
        questionBankId: createdQuestion.id,
        displayOrder: order++,
        marks: qData.marks,
        negativeMarks: qData.negativeMarks,
        questionType: 'MCQ',
        difficulty: 'MEDIUM',
        topicTag: qData.subject,
        chapterId: 'general-chapter',
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  console.log('SUCCESSFULLY_SEEDED_QUESTIONS_FOR_EXAM', examId);
}

run().catch(console.error).finally(() => p.$disconnect());
