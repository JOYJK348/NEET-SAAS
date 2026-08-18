const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const updated = await prisma.users.updateMany({
    where: {
      email: 'joyjk348@gmail.com'
    },
    data: {
      failedAttempts: 0,
      lockedUntil: null
    }
  });
  console.log('UNLOCKED USER:', updated);
  await prisma.$disconnect();
}

run().catch(console.error);
