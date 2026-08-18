const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Educational Physics Classroom Lecture Video URL
  const physicsLectureUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
  
  const updated = await prisma.liveClassRecordings.updateMany({
    data: {
      rawEgressUrl: physicsLectureUrl,
      status: 'READY',
    },
  });
  console.log(`Updated ${updated.count} recordings to Physics Lecture stream: ${physicsLectureUrl}`);
  await prisma.$disconnect();
}

main().catch(console.error);
