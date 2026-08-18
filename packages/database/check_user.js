const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.users.findMany({
    where: {
      email: {
        contains: 'joy'
      }
    }
  });
  console.log('USERS WITH JOY:', JSON.stringify(users, null, 2));

  const allUsers = await prisma.users.findMany({
    take: 10,
    select: {
      id: true,
      email: true,
      userType: true,
      status: true,
      tenantId: true
    }
  });
  console.log('ALL USERS SAMPLE:', JSON.stringify(allUsers, null, 2));

  await prisma.$disconnect();
}

run().catch(console.error);
