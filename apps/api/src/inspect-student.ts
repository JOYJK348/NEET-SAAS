import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectStudentData() {
  const studentEmail = 'joyjk3348@gmail.com';
  console.log(`Inspecting data for ${studentEmail}...`);

  const studentUser = await prisma.users.findFirst({
    where: { email: studentEmail, deletedAt: null },
  });

  if (!studentUser) {
    console.error('Student user not found');
    return;
  }

  console.log('Student User:', {
    id: studentUser.id,
    email: studentUser.email,
    tenantId: studentUser.tenantId,
  });

  const studentProfile = await prisma.studentProfiles.findFirst({
    where: { userId: studentUser.id },
  });

  console.log('Student Profile:', studentProfile);

  const admissions = await prisma.studentAdmissions.findMany({
    where: {
      studentProfileId: studentUser.id,
      deletedAt: null,
    },
  });

  console.log('Student Admissions:', admissions);

  const admissionIds = admissions.map((a) => a.id);

  const examResults = await prisma.examResults.findMany({
    where: {
      studentAdmissionId: { in: admissionIds },
      deletedAt: null,
    },
  });

  console.log('Exam Results:', examResults);

  const allExams = await prisma.exams.findMany({
    where: { tenantId: studentUser.tenantId, deletedAt: null },
    take: 10,
  });

  console.log('All Exams in Tenant:', allExams.map(e => ({ id: e.id, title: e.title, status: e.scheduledStartAt })));

  const attendance = await prisma.attendanceRecords.findMany({
    where: {
      studentAdmissionId: { in: admissionIds },
      deletedAt: null,
    },
  });

  console.log('Attendance Records Count:', attendance.length);
}

inspectStudentData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
