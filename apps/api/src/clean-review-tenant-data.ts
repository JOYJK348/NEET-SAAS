import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanReviewTenantData() {
  const tenantEmail = 'tenant@review.com';
  console.log(`Locating tenant with admin email: ${tenantEmail}...`);

  const institute = await prisma.institutes.findFirst({
    where: { email: tenantEmail },
  });

  if (!institute) {
    console.error(`Tenant with email ${tenantEmail} not found!`);
    process.exit(1);
  }

  const tenantId = institute.id;
  console.log(`Found tenant ID: ${tenantId} (${institute.name})`);

  // Find the tenant admin user ID so we DO NOT delete the admin user!
  const adminUser = await prisma.users.findFirst({
    where: { tenantId, email: tenantEmail },
  });

  const adminUserId = adminUser?.id;
  console.log(`Tenant Admin User ID: ${adminUserId}`);

  console.log('Cleaning all sub-entity data for this tenant ONLY...');

  // 1. Delete Exam & Learning data
  await prisma.examResults.deleteMany({ where: { tenantId } });
  await prisma.examAttempts.deleteMany({ where: { tenantId } });
  await prisma.examAnswers.deleteMany({ where: { tenantId } });
  await prisma.examQuestions.deleteMany({ where: { tenantId } });
  await prisma.examSections.deleteMany({ where: { tenantId } });
  await prisma.examRegistrations.deleteMany({ where: { tenantId } });
  await prisma.examDocuments.deleteMany({ where: { tenantId } });
  await prisma.exams.deleteMany({ where: { tenantId } });
  await prisma.questions.deleteMany({ where: { tenantId } });
  await prisma.questionPapers.deleteMany({ where: { tenantId } });

  // 2. Delete Attendance & Schedule Data
  await prisma.attendanceRecords.deleteMany({ where: { tenantId } });
  await prisma.attendanceSessions.deleteMany({ where: { tenantId } });
  await prisma.schedules.deleteMany({ where: { tenantId } });

  // 3. Delete Student & Parent Profiles & Relations
  await prisma.studentParents.deleteMany({ where: { tenantId } });
  await prisma.studentBatchEnrollments.deleteMany({ where: { tenantId } });
  await prisma.studentAdmissions.deleteMany({ where: { tenantId } });
  await prisma.studentProfiles.deleteMany({ where: { tenantId } });
  await prisma.parentProfiles.deleteMany({ where: { tenantId } });

  // 4. Delete Staff & Tutor Profiles & Relations
  await prisma.staffBatchAssignments.deleteMany({ where: { tenantId } });
  await prisma.staffSubjects.deleteMany({ where: { tenantId } });
  await prisma.staffDepartments.deleteMany({ where: { tenantId } });
  await prisma.staffEmploymentHistory.deleteMany({ where: { tenantId } });
  await prisma.staffQualifications.deleteMany({ where: { tenantId } });
  await prisma.staffProfiles.deleteMany({ where: { tenantId } });

  // 5. Delete Users except the Tenant Admin user
  await prisma.userRoles.deleteMany({
    where: {
      tenantId,
      ...(adminUserId ? { NOT: { userId: adminUserId } } : {}),
    },
  });

  await prisma.users.deleteMany({
    where: {
      tenantId,
      ...(adminUserId ? { NOT: { id: adminUserId } } : {}),
    },
  });

  // 6. Delete Academics Data (Batches, CourseSubjects, Chapters, Topics, Courses, Subjects, BatchDeliveryTypes)
  await prisma.batches.deleteMany({ where: { tenantId } });
  await prisma.branchCourses.deleteMany({ where: { tenantId } });
  await prisma.topicItems.deleteMany({ where: { tenantId } });
  await prisma.topics.deleteMany({ where: { tenantId } });
  await prisma.chapters.deleteMany({ where: { tenantId } });
  await prisma.courseSubjects.deleteMany({ where: { tenantId } });
  await prisma.courses.deleteMany({ where: { tenantId } });
  await prisma.subjects.deleteMany({ where: { tenantId } });
  await prisma.batchDeliveryTypes.deleteMany({ where: { tenantId } });

  // 7. Delete Branches & Academic Years
  await prisma.branchDepartments.deleteMany({ where: { tenantId } });
  await prisma.branches.deleteMany({ where: { tenantId } });
  await prisma.academicYears.deleteMany({ where: { tenantId } });
  await prisma.departments.deleteMany({ where: { tenantId } });
  await prisma.designations.deleteMany({ where: { tenantId } });

  console.log('\n==========================================');
  console.log(`SUCCESSFULLY WIPED ALL DATA FOR TENANT: ${institute.name}`);
  console.log(`Tenant Admin Account preserved: ${tenantEmail}`);
  console.log('The tenant is now 100% fresh and clean!');
  console.log('==========================================\n');
}

cleanReviewTenantData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
