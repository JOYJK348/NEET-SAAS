const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding LiveClasses and LiveClassRecordings from Schedules...');
  const schedules = await prisma.schedules.findMany();
  const defaultCourse = await prisma.courses.findFirst();
  const defaultCourseId = defaultCourse ? defaultCourse.id : '00000000-0000-0000-0000-000000000010';

  const defaultChapter = await prisma.chapters.findFirst();
  const defaultChapterId = defaultChapter ? defaultChapter.id : '00000000-0000-0000-0000-000000000020';

  const defaultTopic = await prisma.topics.findFirst();
  const defaultTopicId = defaultTopic ? defaultTopic.id : '00000000-0000-0000-0000-000000000030';

  for (const s of schedules) {
    let courseId = defaultCourseId;
    if (s.batchId) {
      const batch = await prisma.batches.findUnique({ where: { id: s.batchId } });
      if (batch && batch.courseId) {
        courseId = batch.courseId;
      }
    }

    const liveClass = await prisma.liveClasses.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        tenantId: s.tenantId,
        academicYearId: s.academicYearId,
        courseId,
        batchId: s.batchId,
        subjectId: s.subjectId,
        chapterId: defaultChapterId,
        topicId: defaultTopicId,
        title: 'NEET Physics Live Class',
        subtitle: 'Interactive Classroom Studio',
        description: 'Auto-recorded live session for NEET aspirants.',
        status: 'ENDED',
        scheduledStart: new Date(Date.now() - 7200000),
        scheduledEnd: new Date(Date.now() - 3600000),
        actualStart: new Date(Date.now() - 7200000),
        actualEnd: new Date(Date.now() - 3600000),
        recordingEnabled: true,
        whiteboardEnabled: true,
        chatEnabled: true,
        screenShareEnabled: true,
        createdBy: s.createdBy,
        updatedBy: s.updatedBy,
      },
      update: {
        status: 'ENDED',
      },
    });

    await prisma.liveClassRecordings.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        tenantId: s.tenantId,
        liveClassId: liveClass.id,
        sessionId: liveClass.id,
        status: 'READY',
        durationSeconds: 3600,
        rawEgressUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        processingStartedAt: new Date(Date.now() - 7200000),
        processingCompletedAt: new Date(Date.now() - 3600000),
        createdBy: s.createdBy,
        updatedBy: s.updatedBy,
      },
      update: {
        status: 'READY',
      },
    });
  }

  const lcCount = await prisma.liveClasses.count();
  const lcrCount = await prisma.liveClassRecordings.count();
  console.log(`Successfully seeded! LiveClasses count: ${lcCount}, LiveClassRecordings count: ${lcrCount}`);
  await prisma.$disconnect();
}

seed().catch(console.error);
