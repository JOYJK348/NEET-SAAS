const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rec = await prisma.liveClassRecordings.findFirst({
    where: { id: '5178f625-f73c-46b4-a77d-52a368452a28' },
  });
  console.log('RECORDING DETAIL:', rec);
  await prisma.$disconnect();
}

main().catch(console.error);
