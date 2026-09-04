const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const staff = await prisma.staffProfiles.findMany({
    select: { userId: true, employeeCode: true },
  });
  console.log('Staff Profiles:', staff);

  const subjects = await prisma.subjects.findMany({
    select: { id: true, name: true, code: true },
  });
  console.log('Subjects:', subjects);

  const staffSubjects = await prisma.staffSubjects.findMany({
    select: { staffProfileId: true, subjectId: true, isPrimary: true },
  });
  console.log('Staff Subjects Mapping:', staffSubjects);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
