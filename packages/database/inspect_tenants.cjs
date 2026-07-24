const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const institutes = await prisma.institutes.findMany();
  console.log(
    'INSTITUTES:',
    institutes.map((i) => ({ id: i.id, name: i.name })),
  );

  const branches = await prisma.branches.findMany();
  console.log(
    'BRANCHES:',
    branches.map((b) => ({ id: b.id, name: b.name, tenantId: b.tenantId })),
  );

  const courses = await prisma.courses.findMany();
  console.log(
    'COURSES:',
    courses.map((c) => ({ id: c.id, name: c.name, tenantId: c.tenantId })),
  );

  const years = await prisma.academicYears.findMany();
  console.log(
    'YEARS:',
    years.map((y) => ({ id: y.id, name: y.name, tenantId: y.tenantId })),
  );

  const dts = await prisma.batchDeliveryTypes.findMany();
  console.log(
    'DELIVERY TYPES:',
    dts.map((d) => ({ id: d.id, name: d.name, tenantId: d.tenantId })),
  );

  const users = await prisma.users.findMany();
  console.log(
    'USERS:',
    users.map((u) => ({ id: u.id, email: u.email, tenantId: u.tenantId })),
  );
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
