import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function checkFutureRecords() {
  try {
    const records = await p.attendanceRecords.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        attendanceSessionId: true,
        attendanceStatus: true,
        markedAt: true,
        createdAt: true,
        studentAdmissionId: true,
      }
    });

    console.log('Total attendance records in DB:', records.length);
    for (const r of records) {
      const session = await p.attendanceSessions.findFirst({
        where: { id: r.attendanceSessionId }
      });
      console.log(`Record id=${r.id} status=${r.attendanceStatus} markedAt=${r.markedAt} sessionDate=${session?.attendanceDate} sessionStatus=${session?.sessionStatus}`);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
}

checkFutureRecords();
