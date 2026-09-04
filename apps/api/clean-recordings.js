const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const recs = await prisma.liveClassRecordings.deleteMany({});
  console.log(`Deleted ${recs.count} rows from liveClassRecordings.`);

  const classes = await prisma.liveClasses.deleteMany({});
  console.log(`Deleted ${classes.count} rows from liveClasses.`);
}

main()
  .catch((err) => console.error('Error cleaning recordings:', err))
  .finally(async () => {
    await prisma.$disconnect();
  });
