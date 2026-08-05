import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const subjects = await prisma.subjects.findMany({
    where: {
      OR: [
        { code: { contains: 'SUB-PHY' } },
        { code: { contains: '624' } },
        { name: { contains: 'Physics', mode: 'insensitive' } },
      ],
    },
  });

  console.log('Matching Physics subjects found:', subjects.map((s) => ({ id: s.id, code: s.code, name: s.name })));

  for (const sub of subjects) {
    await prisma.courseSubjects.deleteMany({ where: { subjectId: sub.id } });
    await prisma.subjects.delete({ where: { id: sub.id } });
    console.log(`Deleted subject: ${sub.code} (${sub.name})`);
  }

  const remaining = await prisma.subjects.findMany({
    select: { id: true, code: true, name: true },
  });
  console.log('REMAINING SUBJECTS IN DATABASE:', remaining);
}

main()
  .catch((e) => console.error('Error:', e))
  .finally(async () => await prisma.$disconnect());
