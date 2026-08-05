import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const TENANT_ID = 'fa3a02b9-d8d5-4429-b43d-91522878246d';

try {
  // Find student admissions for live tenant - check actual field names
  const admissions = await p.studentAdmissions.findMany({
    where: { tenantId: TENANT_ID },
    select: { id: true, studentProfileId: true, admissionStatus: true, courseId: true },
    take: 10
  });
  console.log('=== ADMISSIONS ===');
  admissions.forEach(a => console.log(JSON.stringify(a)));

  // Find studentProfileId -> userId mapping
  if (admissions.length > 0) {
    const profileIds = admissions.map(a => a.studentProfileId);
    const profiles = await p.studentProfiles.findMany({
      where: { id: { in: profileIds } },
      select: { id: true, userId: true, studentCode: true }
    });
    console.log('\n=== STUDENT PROFILES ===');
    profiles.forEach(sp => console.log(JSON.stringify(sp)));
  }

  // Check attendance records to see which admissionId is used
  const records = await p.attendanceRecords.findMany({
    where: { tenantId: TENANT_ID, deletedAt: null },
    select: { id: true, studentAdmissionId: true, attendanceSessionId: true, attendanceStatus: true }
  });
  console.log('\n=== ATTENDANCE RECORDS ===');
  records.forEach(r => console.log(JSON.stringify(r)));

  // Check if admission IDs in records match admission IDs above
  const admissionIds = admissions.map(a => a.id);
  const recordAdmissionIds = records.map(r => r.studentAdmissionId);
  console.log('\n=== ADMISSION ID MATCH CHECK ===');
  console.log('Admission IDs in DB:', admissionIds);
  console.log('Admission IDs in records:', recordAdmissionIds);
  const matches = recordAdmissionIds.filter(id => admissionIds.includes(id));
  console.log('Matching:', matches);

} catch(e) {
  console.error(e.message);
} finally {
  await p.$disconnect();
}
