const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const recs = await p.liveClassRecordings.findMany({
    where: { rawEgressUrl: '/lecture.mp4' }
  });
  console.log('Records with /lecture.mp4 rawEgressUrl:', recs.length);
  for (const r of recs) {
    console.log('  ID:', r.id, 'liveClassId:', r.liveClassId);
    await p.liveClassRecordings.update({
      where: { id: r.id },
      data: { rawEgressUrl: `/v1/live-classes/${r.liveClassId}/video` }
    });
    console.log('  -> Updated rawEgressUrl to API video endpoint');
  }
  await p.$disconnect();
}

main().catch(console.error);
