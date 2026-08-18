const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const recs = await p.liveClassRecordings.findMany({
    select: { id: true, liveClassId: true, rawEgressUrl: true, status: true, storageObjectId: true }
  });
  console.log(JSON.stringify(recs, null, 2));
  await p.$disconnect();
}

main().catch(console.error);
