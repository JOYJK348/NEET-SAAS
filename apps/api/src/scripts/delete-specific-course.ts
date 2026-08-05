import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const courses = await prisma.courses.findMany({
    where: {
      OR: [
        { code: { contains: '505' } },
        { name: { contains: 'NEET Foundation', mode: 'insensitive' } },
        { name: { contains: '2028', mode: 'insensitive' } },
      ],
    },
  });

  console.log('Matching courses found:', courses.map((c) => ({ id: c.id, code: c.code, name: c.name })));

  for (const course of courses) {
    await prisma.branchCourses.deleteMany({ where: { courseId: course.id } });
    await prisma.batches.deleteMany({ where: { courseId: course.id } });
    
    const csList = await prisma.courseSubjects.findMany({ where: { courseId: course.id }, select: { id: true } });
    const csIds = csList.map((cs) => cs.id);
    if (csIds.length > 0) {
      const chapters = await prisma.chapters.findMany({ where: { courseSubjectId: { in: csIds } }, select: { id: true } });
      const chIds = chapters.map((ch) => ch.id);
      if (chIds.length > 0) {
        const topics = await prisma.topics.findMany({ where: { chapterId: { in: chIds } }, select: { id: true } });
        const tpIds = topics.map((tp) => tp.id);
        if (tpIds.length > 0) {
          await prisma.topicItems.deleteMany({ where: { topicId: { in: tpIds } } });
          await prisma.topics.deleteMany({ where: { id: { in: tpIds } } });
        }
        await prisma.chapters.deleteMany({ where: { id: { in: chIds } } });
      }
      await prisma.courseSubjects.deleteMany({ where: { id: { in: csIds } } });
    }
    await prisma.courses.delete({ where: { id: course.id } });
    console.log(`Deleted course: ${course.code} (${course.name})`);
  }

  const remaining = await prisma.courses.findMany({
    select: { id: true, code: true, name: true },
  });
  console.log('REMAINING COURSES IN DATABASE:', remaining);
}

main()
  .catch((e) => console.error('Error:', e))
  .finally(async () => await prisma.$disconnect());
