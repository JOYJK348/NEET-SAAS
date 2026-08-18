const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const validVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  const updated = await prisma.liveClassRecordings.updateMany({
    data: {
      rawEgressUrl: validVideoUrl,
      status: 'READY',
    },
  });
  console.log(`Successfully updated ${updated.count} recordings in DB to valid video stream: ${validVideoUrl}`);
  await prisma.$disconnect();
}

main().catch(console.error);
