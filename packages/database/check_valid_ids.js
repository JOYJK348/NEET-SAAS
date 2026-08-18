const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const course = await prisma.courses.findFirst();
  const subject = await prisma.subjects.findFirst();
  const chapter = await prisma.chapters.findFirst();
  const topic = await prisma.topics.findFirst();
  const batch = await prisma.batches.findFirst();

  console.log('VALID IDS:');
  console.log('courseId:', course?.id);
  console.log('subjectId:', subject?.id);
  console.log('chapterId:', chapter?.id);
  console.log('topicId:', topic?.id);
  console.log('batchId:', batch?.id);

  await prisma.$disconnect();
}

main().catch(console.error);
