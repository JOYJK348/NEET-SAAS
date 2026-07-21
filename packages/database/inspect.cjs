const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const mappings = await prisma.branchCourses.findMany();
  console.log('MAPPINGS:', mappings);
  const branches = await prisma.branches.findMany();
  console.log(
    'BRANCHES:',
    branches.map((b) => ({ id: b.id, name: b.name })),
  );
  const courses = await prisma.courses.findMany();
  console.log(
    'COURSES:',
    courses.map((c) => ({ id: c.id, name: c.name })),
  );
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
