/**
 * SEED: Review Academy — Master Orchestrator
 * Multi-tenant NEET/JEE Academy Management SaaS
 * Idempotent, production-quality demo seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// ─── Sub-modules ───────────────────────────────────────────────────────────────
import { seedTenantAndAdmin } from './review-academy/01-tenant.seed';
import { seedAcademicYear } from './review-academy/02-academic-year.seed';
import { seedBranches } from './review-academy/03-branches.seed';
import { seedSubjects } from './review-academy/04-subjects.seed';
import { seedCoursesAndMappings } from './review-academy/05-courses.seed';
import { seedCurriculum } from './review-academy/06-curriculum.seed';
import { seedTutors } from './review-academy/07-tutors.seed';
import { seedStudents } from './review-academy/08-students.seed';
import { seedBatches } from './review-academy/09-batches.seed';
import { seedRooms } from './review-academy/10-rooms.seed';
import { seedEnrollments } from './review-academy/11-enrollments.seed';
import { seedBatchTutorAssignments } from './review-academy/12-assignments.seed';
import { seedSchedules } from './review-academy/13-schedules.seed';
import { seedAttendanceSessions } from './review-academy/14-attendance.seed';
import { seedMockExams } from './review-academy/15-mocks.seed';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;
const SYSTEM_USER_ID = 'system-seed-user';

// ─── Shared context passed across all seed modules ─────────────────────────────
export interface SeedContext {
  prisma: PrismaClient;
  tenantId: string;
  academicYearId: string;
  branchArupId: string;
  branchMaduraiId: string;
  courseIds: Record<string, string>;
  subjectIds: Record<string, string>;
  chapterIds: Record<string, string>;
  topicIds: Record<string, string>;
  tutorUserIds: Record<string, string>;
  tutorProfileIds: Record<string, string>;
  studentUserIds: Record<string, string>;
  studentAdmissionIds: Record<string, string>;
  batchIds: Record<string, string>;
  roomIds: Record<string, string>;
  scheduleIds: string[];
  deliveryTypeIds: Record<string, string>;
  departmentId: string;
  designationId: string;
  systemUserId: string;
  passwordHash: string;
}

async function main() {
  console.log('🚀 Starting Review Academy Seed...');

  // ─── Pre-compute password hash once ────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin@123', SALT_ROUNDS);

  const ctx: SeedContext = {
    prisma,
    tenantId: '',
    academicYearId: '',
    branchArupId: '',
    branchMaduraiId: '',
    courseIds: {},
    subjectIds: {},
    chapterIds: {},
    topicIds: {},
    tutorUserIds: {},
    tutorProfileIds: {},
    studentUserIds: {},
    studentAdmissionIds: {},
    batchIds: {},
    roomIds: {},
    scheduleIds: [],
    deliveryTypeIds: {},
    departmentId: '',
    designationId: '',
    systemUserId: SYSTEM_USER_ID,
    passwordHash,
  };

  // ─── Phase 1: Foundation ───────────────────────────────────────────────────
  console.log('\n📌 Phase 1: Tenant, Admin, Academic Year, Branches');
  ctx.tenantId = await seedTenantAndAdmin(ctx);
  ctx.academicYearId = await seedAcademicYear(ctx);
  const branches = await seedBranches(ctx);
  ctx.branchArupId = branches.aruppukottai;
  ctx.branchMaduraiId = branches.madurai;

  // ─── Phase 2: Academic Structure ───────────────────────────────────────────
  console.log('\n📌 Phase 2: Subjects, Courses, Curriculum');
  ctx.subjectIds = await seedSubjects(ctx);
  const courseResult = await seedCoursesAndMappings(ctx);
  ctx.courseIds = courseResult.courseIds;
  ctx.deliveryTypeIds = courseResult.deliveryTypeIds;

  const curriculum = await seedCurriculum(ctx);
  ctx.chapterIds = curriculum.chapterIds;
  ctx.topicIds = curriculum.topicIds;

  // ─── Phase 3: People ─────────────────────────────────────────────────────────
  console.log('\n📌 Phase 3: Tutors, Students');
  const tutorResult = await seedTutors(ctx);
  ctx.tutorUserIds = tutorResult.userIds;
  ctx.tutorProfileIds = tutorResult.profileIds;
  ctx.departmentId = tutorResult.departmentId;
  ctx.designationId = tutorResult.designationId;

  const studentResult = await seedStudents(ctx);
  ctx.studentUserIds = studentResult.userIds;
  ctx.studentAdmissionIds = studentResult.admissionIds;

  // ─── Phase 4: Operations ─────────────────────────────────────────────────────
  console.log('\n📌 Phase 4: Rooms, Batches, Enrollments, Assignments');
  ctx.roomIds = await seedRooms(ctx);
  ctx.batchIds = await seedBatches(ctx);
  await seedEnrollments(ctx);
  await seedBatchTutorAssignments(ctx);

  // ─── Phase 5: Scheduling ─────────────────────────────────────────────────────
  console.log('\n📌 Phase 5: Schedules, Attendance Sessions');
  ctx.scheduleIds = await seedSchedules(ctx);
  await seedAttendanceSessions(ctx);

  // ─── Phase 6: Assessments ────────────────────────────────────────────────────
  console.log('\n📌 Phase 6: Mock Exams & Questions');
  await seedMockExams(ctx);

  // ─── Final Summary ─────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('✅ REVIEW ACADEMY SEED COMPLETED SUCCESSFULLY');
  console.log('='.repeat(60));

  await printSummary(ctx);
}

async function printSummary(ctx: SeedContext) {
  const counts = await Promise.all([
    ctx.prisma.institutes.count({ where: { id: ctx.tenantId } }),
    ctx.prisma.academicYears.count({ where: { tenantId: ctx.tenantId } }),
    ctx.prisma.branches.count({ where: { tenantId: ctx.tenantId } }),
    ctx.prisma.courses.count({ where: { tenantId: ctx.tenantId } }),
    ctx.prisma.subjects.count({ where: { tenantId: ctx.tenantId } }),
    ctx.prisma.chapters.count({ where: { tenantId: ctx.tenantId } }),
    ctx.prisma.topics.count({ where: { tenantId: ctx.tenantId } }),
    ctx.prisma.topicItems.count({ where: { tenantId: ctx.tenantId } }),
    ctx.prisma.users.count({ where: { tenantId: ctx.tenantId, userType: 'TUTOR' } }),
    ctx.prisma.users.count({ where: { tenantId: ctx.tenantId, userType: 'STUDENT' } }),
    ctx.prisma.batches.count({ where: { tenantId: ctx.tenantId } }),
    ctx.prisma.schedules.count({ where: { tenantId: ctx.tenantId } }),
    ctx.prisma.attendanceSessions.count({ where: { tenantId: ctx.tenantId } }),
    ctx.prisma.exams.count({ where: { tenantId: ctx.tenantId } }),
    ctx.prisma.questions.count({ where: { tenantId: ctx.tenantId } }),
  ]);

  console.log(`
┌─────────────────────────────────────────────────────────────┐
│                    REVIEW ACADEMY SUMMARY                     │
├─────────────────────────────────────────────────────────────┤
│  Tenant:              Review Academy                        │
│  Academic Year:       AY 2026-2027                        │
├─────────────────────────────────────────────────────────────┤
│  Branches:            ${String(counts[2]).padStart(3)}                                    │
│  Courses:             ${String(counts[3]).padStart(3)}                                    │
│  Subjects:            ${String(counts[4]).padStart(3)}                                    │
│  Chapters:            ${String(counts[5]).padStart(3)}                                    │
│  Topics:              ${String(counts[6]).padStart(3)}                                    │
│  TopicItems:          ${String(counts[7]).padStart(3)}                                    │
│  Tutors:              ${String(counts[8]).padStart(3)}                                    │
│  Students:            ${String(counts[9]).padStart(3)}                                    │
│  Batches:             ${String(counts[10]).padStart(3)}                                    │
│  Schedules:           ${String(counts[11]).padStart(3)}                                    │
│  Attendance Sessions: ${String(counts[12]).padStart(3)}                                    │
│  Mock Exams:          ${String(counts[13]).padStart(3)}                                    │
│  Questions:           ${String(counts[14]).padStart(3)}                                    │
└─────────────────────────────────────────────────────────────┘
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
