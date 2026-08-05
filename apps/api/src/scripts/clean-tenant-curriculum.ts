import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.users.findFirst({
    where: { email: 'tenant@review.com' },
  });

  let tenantId = user?.tenantId;

  if (!tenantId) {
    const institute = await prisma.institutes.findFirst({
      where: {
        OR: [
          { email: 'tenant@review.com' },
          { slug: 'review' },
        ],
      },
    });
    tenantId = institute?.id;
  }

  if (!tenantId) {
    const firstUser = await prisma.users.findFirst({ select: { tenantId: true, email: true } });
    if (firstUser) {
      tenantId = firstUser.tenantId;
    }
  }

  if (!tenantId) {
    console.log('No tenant found.');
    return;
  }

  console.log(`Cleaning master subjects data for tenant ID: ${tenantId}`);

  // Delete all curriculum & master resources for this tenant
  const topicItems = await prisma.topicItems.deleteMany({ where: { tenantId } });
  const topics = await prisma.topics.deleteMany({ where: { tenantId } });
  const chapters = await prisma.chapters.deleteMany({ where: { tenantId } });
  const courseSubjects = await prisma.courseSubjects.deleteMany({ where: { tenantId } });
  const branchCourses = await prisma.branchCourses.deleteMany({ where: { tenantId } });
  const courses = await prisma.courses.deleteMany({ where: { tenantId } });
  
  // Master Subjects
  const subjects = await prisma.subjects.deleteMany({ where: { tenantId } });

  console.log('SUCCESS! Cleaned all tenant curriculum & master subjects:', {
    topicItems: topicItems.count,
    topics: topics.count,
    chapters: chapters.count,
    courseSubjects: courseSubjects.count,
    branchCourses: branchCourses.count,
    courses: courses.count,
    masterSubjects: subjects.count,
  });
}

main()
  .catch((e) => {
    console.error('Error cleaning tenant data:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
