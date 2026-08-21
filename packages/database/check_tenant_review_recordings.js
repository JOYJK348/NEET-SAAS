const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- FETCHING TENANT DETAILS ---');
  
  // Find tenant by email or user email
  const user = await prisma.user.findFirst({
    where: { email: { equals: 'tenant@review.com', mode: 'insensitive' } },
  });

  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { email: { equals: 'tenant@review.com', mode: 'insensitive' } },
        { id: user?.tenantId || undefined }
      ]
    }
  });

  const tenantId = tenant?.id || user?.tenantId || 'fa3a02b9-d8d5-4429-b43d-91522878246d';
  console.log('Tenant:', tenant || user || `Using tenantId: ${tenantId}`);

  // 1. Pre-recorded Videos (videoRecordings table)
  const preRecordings = await prisma.videoRecording.findMany({
    where: { tenantId, deletedAt: null },
    include: {
      course: true,
      subject: true,
      chapter: true,
      topic: true,
    }
  });

  // 2. Live Class Recordings (liveClassRecordings table)
  const liveClassRecordings = await prisma.liveClassRecordings.findMany({
    where: { tenantId, deletedAt: null },
  });

  // 3. Live Class Sessions with recordingUrl
  const liveSessions = await prisma.liveClassSessions.findMany({
    where: { tenantId, recordingUrl: { not: null } },
  });

  console.log('\n=============================================');
  console.log(`RESULTS FOR TENANT: tenant@review.com (${tenantId})`);
  console.log('=============================================');
  console.log(`1. Pre-Recorded Videos (VideoRecording table): ${preRecordings.length}`);
  console.log(`2. Live Class Recordings (LiveClassRecordings table): ${liveClassRecordings.length}`);
  console.log(`3. Live Sessions with recordingUrl: ${liveSessions.length}`);
  console.log('---------------------------------------------');
  console.log(`TOTAL ALL RECORDINGS & PRE-RECORDED VIDEOS: ${preRecordings.length + liveClassRecordings.length}`);

  if (preRecordings.length > 0) {
    console.log('\n--- PRE-RECORDED VIDEOS LIST ---');
    preRecordings.forEach((v, i) => {
      console.log(`${i+1}. TITLE: ${v.title} | SUBJECT: ${v.subject?.name || 'N/A'} | STATUS: ${v.status} | URL: ${v.videoUrl}`);
    });
  }

  await prisma.$disconnect();
}

main().catch(console.error);
