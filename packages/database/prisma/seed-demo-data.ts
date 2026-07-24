/**
 * SEED: Demo Data for tenant@demo.com
 * Creates: 3 NEET Courses, 20 Tutors, 50 Students, 20 Batches, Mon-Fri Timetable Schedules
 *
 * Run: npx ts-node -P tsconfig.json packages/database/prisma/seed-demo-data.ts
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

// ── Fixed IDs (idempotent) ────────────────────────────────────────────────────
const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const BRANCH_ID = '00000000-0000-0000-0000-000000000006'; // Sivakasi Branch (seeded by courses.ts)
const TENANT_ADMIN_ID = '00000000-0000-0000-0000-000000000004'; // already seeded
const SYS = '00000000-0000-0000-0000-000000000004'; // use tenant admin as createdBy

const AY_ID = '00000000-0000-0000-0000-000000000005'; // AY 2026-27 (already seeded)

// Courses
const COURSE_NEET_FDN_ID = '00000000-0000-0000-0000-000000000020'; // already seeded
const COURSE_NEET_ADV_ID = '10000000-0000-0000-0000-000000000001';
const COURSE_NEET_CRASH_ID = '10000000-0000-0000-0000-000000000002';

// Subjects (already seeded)
const PHYSICS_SID = '00000000-0000-0000-0000-000000000010';
const CHEMISTRY_SID = '00000000-0000-0000-0000-000000000011';
const BIOLOGY_SID = '00000000-0000-0000-0000-000000000012';

// Room IDs
const ROOM_IDS = [
  '20000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000004',
];

// Department & Designation
const DEPT_ID = '30000000-0000-0000-0000-000000000001';
const DESIG_ID = '30000000-0000-0000-0000-000000000002';

// ── Helpers ───────────────────────────────────────────────────────────────────
const startDate = new Date('2026-04-01');
const endDate = new Date('2027-03-31');
const farFuture = new Date('2099-12-31');

const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;
type Weekday = (typeof WEEKDAYS)[number];

function pad(n: number, len = 2): string {
  return n.toString().padStart(len, '0');
}

// ── Tutor names ───────────────────────────────────────────────────────────────
const TUTORS = [
  { first: 'Karthik', last: 'Rajan', subject: 'Physics' },
  { first: 'Sathish', last: 'Kumar', subject: 'Physics' },
  { first: 'Priya', last: 'Selvam', subject: 'Physics' },
  { first: 'Muthukumar', last: 'V', subject: 'Physics' },
  { first: 'Rani', last: 'Devi', subject: 'Chemistry' },
  { first: 'Arun', last: 'Prabhu', subject: 'Chemistry' },
  { first: 'Gomathi', last: 'S', subject: 'Chemistry' },
  { first: 'Selvakumar', last: 'P', subject: 'Chemistry' },
  { first: 'Lavanya', last: 'Nair', subject: 'Biology' },
  { first: 'Divya', last: 'Mohan', subject: 'Biology' },
  { first: 'Senthil', last: 'Nathan', subject: 'Biology' },
  { first: 'Revathi', last: 'M', subject: 'Biology' },
  { first: 'Balamurugan', last: 'K', subject: 'Physics' },
  { first: 'Chandrakala', last: 'R', subject: 'Chemistry' },
  { first: 'Deepak', last: 'Raj', subject: 'Biology' },
  { first: 'Eswari', last: 'G', subject: 'Physics' },
  { first: 'Ganesh', last: 'Babu', subject: 'Chemistry' },
  { first: 'Hema', last: 'Latha', subject: 'Biology' },
  { first: 'Ilango', last: 'S', subject: 'Physics' },
  { first: 'Jayalakshmi', last: 'T', subject: 'Chemistry' },
];

// ── Student names ─────────────────────────────────────────────────────────────
const STUDENT_FIRSTNAMES = [
  'Arjun', 'Aarav', 'Vignesh', 'Sathya', 'Karthick',
  'Praveen', 'Suresh', 'Rajesh', 'Dinesh', 'Manoj',
  'Ananya', 'Priya', 'Kavya', 'Deepika', 'Nithya',
  'Sowmya', 'Ramya', 'Keerthi', 'Meena', 'Padma',
  'Arun', 'Balu', 'Charan', 'Dhanush', 'Elan',
  'Faizal', 'Gowtham', 'Hari', 'Irfan', 'Jeeva',
  'Kiran', 'Logesh', 'Manikandan', 'Naveen', 'Om',
  'Pavan', 'Rahul', 'Saravanan', 'Tamilarasan', 'Uday',
  'Varsha', 'Wini', 'Xavier', 'Yamini', 'Zara',
  'Aditi', 'Bhavana', 'Charulatha', 'Dharshini', 'Elakiya',
];
const STUDENT_LASTNAMES = [
  'Kumar', 'Raja', 'Selvam', 'Rajan', 'Krishnan',
  'Murugan', 'Pandian', 'Arumugam', 'Natarajan', 'Perumal',
];

// ── Batch config: 20 batches across 3 courses ─────────────────────────────────
// NEET Foundation: 9 batches, NEET Advanced: 7 batches, NEET Crash: 4 batches
const BATCH_CONFIGS: Array<{
  courseId: string;
  code: string;
  name: string;
  mode: 'CLASSROOM' | 'ONLINE' | 'HYBRID';
}> = [
  // NEET Foundation (9 batches)
  { courseId: COURSE_NEET_FDN_ID, code: 'NEET-FDN-A1', name: 'NEET Foundation - Batch A1 (Morning Offline)', mode: 'CLASSROOM' },
  { courseId: COURSE_NEET_FDN_ID, code: 'NEET-FDN-A2', name: 'NEET Foundation - Batch A2 (Afternoon Offline)', mode: 'CLASSROOM' },
  { courseId: COURSE_NEET_FDN_ID, code: 'NEET-FDN-B1', name: 'NEET Foundation - Batch B1 (Online Morning)', mode: 'ONLINE' },
  { courseId: COURSE_NEET_FDN_ID, code: 'NEET-FDN-B2', name: 'NEET Foundation - Batch B2 (Online Evening)', mode: 'ONLINE' },
  { courseId: COURSE_NEET_FDN_ID, code: 'NEET-FDN-C1', name: 'NEET Foundation - Batch C1 (Hybrid)', mode: 'HYBRID' },
  { courseId: COURSE_NEET_FDN_ID, code: 'NEET-FDN-C2', name: 'NEET Foundation - Batch C2 (Hybrid)', mode: 'HYBRID' },
  { courseId: COURSE_NEET_FDN_ID, code: 'NEET-FDN-D1', name: 'NEET Foundation - Batch D1 (Weekend)', mode: 'CLASSROOM' },
  { courseId: COURSE_NEET_FDN_ID, code: 'NEET-FDN-D2', name: 'NEET Foundation - Batch D2 (Online Weekend)', mode: 'ONLINE' },
  { courseId: COURSE_NEET_FDN_ID, code: 'NEET-FDN-E1', name: 'NEET Foundation - Batch E1 (Repeaters)', mode: 'CLASSROOM' },
  // NEET Advanced (7 batches)
  { courseId: COURSE_NEET_ADV_ID, code: 'NEET-ADV-A1', name: 'NEET Advanced - Batch A1 (Morning Offline)', mode: 'CLASSROOM' },
  { courseId: COURSE_NEET_ADV_ID, code: 'NEET-ADV-A2', name: 'NEET Advanced - Batch A2 (Afternoon Offline)', mode: 'CLASSROOM' },
  { courseId: COURSE_NEET_ADV_ID, code: 'NEET-ADV-B1', name: 'NEET Advanced - Batch B1 (Online)', mode: 'ONLINE' },
  { courseId: COURSE_NEET_ADV_ID, code: 'NEET-ADV-B2', name: 'NEET Advanced - Batch B2 (Online Evening)', mode: 'ONLINE' },
  { courseId: COURSE_NEET_ADV_ID, code: 'NEET-ADV-C1', name: 'NEET Advanced - Batch C1 (Hybrid)', mode: 'HYBRID' },
  { courseId: COURSE_NEET_ADV_ID, code: 'NEET-ADV-C2', name: 'NEET Advanced - Batch C2 (Hybrid)', mode: 'HYBRID' },
  { courseId: COURSE_NEET_ADV_ID, code: 'NEET-ADV-D1', name: 'NEET Advanced - Batch D1 (Dropper)', mode: 'CLASSROOM' },
  // NEET Crash (4 batches)
  { courseId: COURSE_NEET_CRASH_ID, code: 'NEET-CRASH-A1', name: 'NEET Crash - Batch A1 (Morning)', mode: 'CLASSROOM' },
  { courseId: COURSE_NEET_CRASH_ID, code: 'NEET-CRASH-A2', name: 'NEET Crash - Batch A2 (Evening)', mode: 'CLASSROOM' },
  { courseId: COURSE_NEET_CRASH_ID, code: 'NEET-CRASH-B1', name: 'NEET Crash - Batch B1 (Online)', mode: 'ONLINE' },
  { courseId: COURSE_NEET_CRASH_ID, code: 'NEET-CRASH-B2', name: 'NEET Crash - Batch B2 (Online Evening)', mode: 'ONLINE' },
];

// ── Schedule: Each batch gets 3 subjects × Mon-Fri slots ─────────────────────
// Physics: 08:00-09:00, Chemistry: 09:15-10:15, Biology: 10:30-11:30
// (staggered slightly to allow conflict testing)
const SUBJECT_SLOTS = [
  { subjectId: PHYSICS_SID, start: '08:00', end: '09:00' },
  { subjectId: CHEMISTRY_SID, start: '09:15', end: '10:15' },
  { subjectId: BIOLOGY_SID, start: '10:30', end: '11:30' },
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Starting Demo Data Seed...\n');

  const passwordHash = await hash('Student@123', 10);

  // ── 1. Extra Courses ──────────────────────────────────────────────────────
  console.log('📚 Seeding NEET Advanced & Crash courses...');
  await prisma.courses.upsert({
    where: { id: COURSE_NEET_ADV_ID },
    update: { updatedBy: SYS },
    create: {
      id: COURSE_NEET_ADV_ID,
      tenantId: TENANT_ID,
      code: 'NEET-ADV-2627',
      name: 'NEET Advanced 2026-27',
      displayName: 'NEET Advanced 2026-27',
      description: 'Advanced NEET preparation for serious aspirants. Covers full syllabus with deep-dive sessions on Physics, Chemistry and Biology.',
      courseType: 'REGULAR',
      durationMonths: 12,
      startDate,
      endDate,
      createdBy: SYS,
      updatedBy: SYS,
      deletedAt: null,
      deletedBy: null,
    },
  });

  await prisma.courses.upsert({
    where: { id: COURSE_NEET_CRASH_ID },
    update: { updatedBy: SYS },
    create: {
      id: COURSE_NEET_CRASH_ID,
      tenantId: TENANT_ID,
      code: 'NEET-CRASH-2627',
      name: 'NEET Crash Course 2026-27',
      displayName: 'NEET Crash Course 2026-27',
      description: 'Intensive 3-month crash course for NEET final prep. Focused on high-yield topics, shortcuts and previous year patterns.',
      courseType: 'CRASH',
      durationMonths: 3,
      startDate: new Date('2027-01-01'),
      endDate: new Date('2027-03-31'),
      createdBy: SYS,
      updatedBy: SYS,
      deletedAt: null,
      deletedBy: null,
    },
  });

  // Map courses to branch
  for (const cid of [COURSE_NEET_ADV_ID, COURSE_NEET_CRASH_ID]) {
    await prisma.branchCourses.upsert({
      where: {
        tenantId_branchId_courseId_academicYearId: {
          tenantId: TENANT_ID,
          branchId: BRANCH_ID,
          courseId: cid,
          academicYearId: AY_ID,
        },
      },
      update: {},
      create: {
        tenantId: TENANT_ID,
        branchId: BRANCH_ID,
        courseId: cid,
        academicYearId: AY_ID,
        createdBy: SYS,
        updatedBy: SYS,
        deletedAt: null,
        deletedBy: null,
      },
    });
  }

  // CourseSubjects for new courses (Physics, Chemistry, Biology mapped)
  const newCourseIds = [COURSE_NEET_ADV_ID, COURSE_NEET_CRASH_ID];
  const subjectList = [
    { sid: PHYSICS_SID, marks: 180, order: 1 },
    { sid: CHEMISTRY_SID, marks: 180, order: 2 },
    { sid: BIOLOGY_SID, marks: 360, order: 3 },
  ];
  for (let ci = 0; ci < newCourseIds.length; ci++) {
    for (const s of subjectList) {
      const csId = `10000000-0000-0000-${pad(ci + 3)}-${pad(s.order, 12)}`;
      await prisma.courseSubjects.upsert({
        where: { id: csId },
        update: { updatedBy: SYS },
        create: {
          id: csId,
          tenantId: TENANT_ID,
          courseId: newCourseIds[ci],
          subjectId: s.sid,
          displayOrder: s.order,
          isMandatory: true,
          totalMarks: s.marks,
          passingMarks: Math.round(s.marks * 0.4),
          credits: 4,
          plannedHours: 120,
          createdBy: SYS,
          updatedBy: SYS,
          deletedAt: null,
          deletedBy: null,
        },
      });
    }
  }
  console.log('  ✅ 3 NEET Courses ready (Foundation + Advanced + Crash)\n');

  // ── 2. Department & Designation ───────────────────────────────────────────
  console.log('🏢 Seeding Department & Designation...');
  await prisma.departments.upsert({
    where: { id: DEPT_ID },
    update: { updatedBy: SYS },
    create: {
      id: DEPT_ID,
      tenantId: TENANT_ID,
      code: 'ACADEMICS',
      name: 'Academics Department',
      description: 'Main academic teaching department for NEET preparation',
      displayOrder: 1,
      createdBy: SYS,
      updatedBy: SYS,
      deletedAt: null,
      deletedBy: null,
    },
  });
  await prisma.designations.upsert({
    where: { id: DESIG_ID },
    update: { updatedBy: SYS },
    create: {
      id: DESIG_ID,
      tenantId: TENANT_ID,
      code: 'SR_FACULTY',
      name: 'Senior Faculty',
      description: 'Senior subject expert / NEET faculty',
      displayOrder: 1,
      createdBy: SYS,
      updatedBy: SYS,
      deletedAt: null,
      deletedBy: null,
    },
  });

  // Branch-Department mapping
  const branchDeptId = '30000000-0000-0000-0000-000000000003';
  await prisma.branchDepartments.upsert({
    where: { id: branchDeptId },
    update: {},
    create: {
      id: branchDeptId,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      departmentId: DEPT_ID,
      displayOrder: 1,
      createdBy: SYS,
      updatedBy: SYS,
      deletedAt: null,
      deletedBy: null,
    },
  });
  console.log('  ✅ Department & Designation ready\n');

  // ── 3. Rooms ──────────────────────────────────────────────────────────────
  console.log('🏫 Seeding 4 Rooms...');
  const roomNames = ['Room 101', 'Room 102', 'Room 103', 'Room 104'];
  for (let r = 0; r < ROOM_IDS.length; r++) {
    await prisma.rooms.upsert({
      where: { id: ROOM_IDS[r] },
      update: { updatedBy: SYS },
      create: {
        id: ROOM_IDS[r],
        tenantId: TENANT_ID,
        branchId: BRANCH_ID,
        name: roomNames[r],
        code: `R${pad(r + 1, 3)}`,
        capacity: 40,
        roomType: 'CLASSROOM',
        isActive: true,
        createdBy: SYS,
        updatedBy: SYS,
        deletedAt: null,
        deletedBy: null,
      },
    });
  }
  console.log('  ✅ 4 Rooms ready\n');

  // ── 4. Tutors (20) ────────────────────────────────────────────────────────
  console.log('👩‍🏫 Seeding 20 Tutors...');
  const subjectIdMap: Record<string, string> = {
    Physics: PHYSICS_SID,
    Chemistry: CHEMISTRY_SID,
    Biology: BIOLOGY_SID,
  };
  const tutorUserIds: string[] = [];
  for (let i = 0; i < TUTORS.length; i++) {
    const t = TUTORS[i];
    const userId = `40000000-0000-0000-0000-${pad(i + 1, 12)}`;
    tutorUserIds.push(userId);
    const email = `tutor${pad(i + 1)}.${t.first.toLowerCase()}@demo.com`;

    await prisma.users.upsert({
      where: { id: userId },
      update: { updatedBy: SYS },
      create: {
        id: userId,
        tenantId: TENANT_ID,
        branchId: BRANCH_ID,
        email,
        firstName: t.first,
        lastName: t.last,
        userType: 'TUTOR',
        status: 'ACTIVE',
        isSuperAdmin: false,
        passwordHash,
        forcePasswordChange: false,
        createdBy: SYS,
        updatedBy: SYS,
        deletedAt: null,
        deletedBy: null,
      },
    });

    // StaffProfile
    await prisma.staffProfiles.upsert({
      where: { userId },
      update: { updatedBy: SYS },
      create: {
        userId,
        tenantId: TENANT_ID,
        employeeCode: `EMP-${pad(i + 1, 4)}`,
        designationId: DESIG_ID,
        employmentType: 'FULL_TIME',
        employmentStatus: 'ACTIVE',
        joinedAt: new Date('2025-06-01'),
        resignedAt: farFuture,
        officialEmail: email,
        workPhone: `+91-9${pad(80000000 + i + 1)}`,
        createdBy: SYS,
        updatedBy: SYS,
        deletedAt: null,
        deletedBy: null,
      },
    });

    // StaffDepartment
    try {
      await prisma.staffDepartments.upsert({
        where: { id: { staffProfileId: userId, branchId: BRANCH_ID, departmentId: DEPT_ID } } as any,
        update: {},
        create: {
          staffProfileId: userId,
          branchId: BRANCH_ID,
          departmentId: DEPT_ID,
          tenantId: TENANT_ID,
          isPrimary: true,
          isActive: true,
          createdBy: SYS,
          updatedBy: SYS,
          deletedAt: null,
          deletedBy: null,
        },
      });
    } catch {
      // already exists
    }

    // StaffSubject
    try {
      await prisma.staffSubjects.upsert({
        where: { id: { staffProfileId: userId, subjectId: subjectIdMap[t.subject] } } as any,
        update: {},
        create: {
          staffProfileId: userId,
          subjectId: subjectIdMap[t.subject],
          tenantId: TENANT_ID,
          isActive: true,
          createdBy: SYS,
          updatedBy: SYS,
          deletedAt: null,
          deletedBy: null,
        },
      });
    } catch {
      // already exists
    }
    // Assign FACULTY Role
    const facultyRoleId = '842d9865-5425-414b-b7d2-aa03005ee728';
    try {
      await prisma.userRoles.upsert({
        where: { id: `70000000-0000-0000-0000-${pad(i + 1, 12)}` },
        update: {},
        create: {
          id: `70000000-0000-0000-0000-${pad(i + 1, 12)}`,
          tenantId: TENANT_ID,
          userId,
          roleId: facultyRoleId,
          effectiveFrom: startDate,
          effectiveTo: farFuture,
          assignedBy: SYS,
          assignmentReason: 'Demo Tutor Role',
          revokedBy: '',
          revokedReason: '',
          createdBy: SYS,
          updatedBy: SYS,
          deletedAt: null,
          deletedBy: null,
        },
      });
    } catch (err) {}
  }
  console.log(`  ✅ 20 Tutors created\n`);

  // ── 5. Students (50) ──────────────────────────────────────────────────────
  console.log('🎓 Seeding 50 Students...');
  const studentUserIds: string[] = [];
  const studentAdmissionIds: string[] = [];
  const courseIdForStudent: string[] = [];

  for (let i = 0; i < 50; i++) {
    const userId = `50000000-0000-0000-0000-${pad(i + 1, 12)}`;
    studentUserIds.push(userId);
    const firstName = STUDENT_FIRSTNAMES[i];
    const lastName = STUDENT_LASTNAMES[i % STUDENT_LASTNAMES.length];
    const email = `student${pad(i + 1)}.${firstName.toLowerCase()}@demo.com`;

    // Distribute students across 3 courses: first 17 → FDN, next 17 → ADV, last 16 → CRASH
    const courseId =
      i < 17 ? COURSE_NEET_FDN_ID : i < 34 ? COURSE_NEET_ADV_ID : COURSE_NEET_CRASH_ID;
    courseIdForStudent.push(courseId);

    await prisma.users.upsert({
      where: { id: userId },
      update: { updatedBy: SYS },
      create: {
        id: userId,
        tenantId: TENANT_ID,
        branchId: BRANCH_ID,
        email,
        firstName,
        lastName,
        userType: 'STUDENT',
        status: 'ACTIVE',
        isSuperAdmin: false,
        passwordHash,
        forcePasswordChange: false,
        createdBy: SYS,
        updatedBy: SYS,
        deletedAt: null,
        deletedBy: null,
      },
    });

    // StudentProfile
    const dob = new Date(`200${4 + (i % 4)}-${pad((i % 12) + 1)}-15`);
    await prisma.studentProfiles.upsert({
      where: { userId },
      update: { updatedBy: SYS },
      create: {
        userId,
        tenantId: TENANT_ID,
        studentCode: `STU-${pad(i + 1, 4)}`,
        admittedAt: new Date('2026-04-01'),
        dateOfBirth: dob,
        gender: i % 3 === 0 ? 'FEMALE' : 'MALE',
        bloodGroup: (['A_POS', 'B_POS', 'O_POS', 'AB_POS'] as const)[i % 4],
        academicStatus: 'ACTIVE',
        createdBy: SYS,
        updatedBy: SYS,
        deletedAt: null,
        deletedBy: null,
      },
    });

    // StudentAdmission
    const admissionId = `51000000-0000-0000-0000-${pad(i + 1, 12)}`;
    studentAdmissionIds.push(admissionId);
    await prisma.studentAdmissions.upsert({
      where: { id: admissionId },
      update: { updatedBy: SYS },
      create: {
        id: admissionId,
        tenantId: TENANT_ID,
        studentProfileId: userId,
        admissionNumber: `ADM-2027-${pad(i + 1, 4)}`,
        academicYearId: AY_ID,
        courseId,
        branchId: BRANCH_ID,
        admissionStatus: 'ACTIVE',
        admissionDate: new Date('2026-04-01'),
        createdBy: SYS,
        updatedBy: SYS,
        deletedAt: null,
        deletedBy: null,
      },
    });
    // Assign STUDENT Role
    const studentRoleId = 'd56ed3d3-c4fd-4c84-8457-eff8feb8581c';
    try {
      await prisma.userRoles.upsert({
        where: { id: `71000000-0000-0000-0000-${pad(i + 1, 12)}` },
        update: {},
        create: {
          id: `71000000-0000-0000-0000-${pad(i + 1, 12)}`,
          tenantId: TENANT_ID,
          userId,
          roleId: studentRoleId,
          effectiveFrom: startDate,
          effectiveTo: farFuture,
          assignedBy: SYS,
          assignmentReason: 'Demo Student Role',
          revokedBy: '',
          revokedReason: '',
          createdBy: SYS,
          updatedBy: SYS,
          deletedAt: null,
          deletedBy: null,
        },
      });
    } catch (err) {}
  }
  console.log('  ✅ 50 Students created\n');

  // ── 6. Batches (20) ──────────────────────────────────────────────────────
  console.log('📦 Seeding 20 Batches...');

  // Need deliveryType IDs for each mode — fetch from DB (seeded by delivery-types.ts)
  const deliveryTypes = await prisma.batchDeliveryTypes.findMany({
    where: { tenantId: TENANT_ID },
  });
  const dtMap: Record<string, string> = {};
  for (const dt of deliveryTypes) {
    dtMap[dt.code] = dt.id;
  }
  // Fallback if delivery types not yet seeded — create them
  const modeToCode: Record<string, string> = {
    CLASSROOM: 'OFFLINE',
    ONLINE: 'ONLINE',
    HYBRID: 'HYBRID',
  };
  if (Object.keys(dtMap).length === 0) {
    console.log('  ⚠️ No delivery types found, creating defaults...');
    const deliveryDefaults = [
      { code: 'OFFLINE', name: 'Classroom', mode: 'CLASSROOM', color: '#3B82F6', icon: 'building' },
      { code: 'ONLINE', name: 'Online', mode: 'ONLINE', color: '#10B981', icon: 'monitor' },
      { code: 'HYBRID', name: 'Hybrid', mode: 'HYBRID', color: '#8B5CF6', icon: 'layers' },
    ];
    for (const d of deliveryDefaults) {
      const created = await prisma.batchDeliveryTypes.create({
        data: {
          tenantId: TENANT_ID,
          code: d.code,
          name: d.name,
          description: `${d.name} delivery mode`,
          attendanceMode: d.mode as any,
          defaultMaxStudents: 40,
          defaultStartTime: new Date('2026-04-01T08:00:00'),
          defaultEndTime: new Date('2026-04-01T10:00:00'),
          colorCode: d.color,
          iconName: d.icon,
          displayOrder: 1,
          isDefault: d.code === 'OFFLINE',
          createdBy: SYS,
          updatedBy: SYS,
          deletedAt: null,
          deletedBy: null,
        },
      });
      dtMap[created.code] = created.id;
    }
  }

  const batchIds: string[] = [];
  for (let b = 0; b < BATCH_CONFIGS.length; b++) {
    const cfg = BATCH_CONFIGS[b];
    const batchId = `60000000-0000-0000-0000-${pad(b + 1, 12)}`;
    batchIds.push(batchId);
    const dtCode = modeToCode[cfg.mode] ?? 'OFFLINE';
    const deliveryTypeId = dtMap[dtCode] ?? Object.values(dtMap)[0];

    await prisma.batches.upsert({
      where: { id: batchId },
      update: { updatedBy: SYS },
      create: {
        id: batchId,
        tenantId: TENANT_ID,
        branchId: BRANCH_ID,
        courseId: cfg.courseId,
        academicYearId: AY_ID,
        deliveryTypeId,
        code: cfg.code,
        name: cfg.name,
        description: `${cfg.name} — Academic Year 2026-27`,
        status: 'ACTIVE',
        maxStudents: 40,
        startDate,
        endDate,
        startTime: '08:00',
        endTime: '11:30',
        allowNewAdmissions: true,
        isActive: true,
        createdBy: SYS,
        updatedBy: SYS,
        deletedAt: null,
        deletedBy: null,
      },
    });
  }
  console.log('  ✅ 20 Batches created\n');

  // ── 7. Enroll Students into Batches ──────────────────────────────────────
  console.log('📝 Enrolling Students into Batches...');
  // Students 0-16 → FDN batches, 17-33 → ADV batches, 34-49 → CRASH batches
  const batchRanges = [
    { batchStart: 0, batchEnd: 8, studentStart: 0, studentEnd: 16 },    // FDN (17 students)
    { batchStart: 9, batchEnd: 15, studentStart: 17, studentEnd: 33 },   // ADV (17 students)
    { batchStart: 16, batchEnd: 19, studentStart: 34, studentEnd: 49 },  // CRASH (16 students)
  ];

  for (const range of batchRanges) {
    const studentsInGroup = range.studentEnd - range.studentStart + 1;
    const batchesInGroup = range.batchEnd - range.batchStart + 1;
    const studentsPerBatch = Math.ceil(studentsInGroup / batchesInGroup);

    for (let si = range.studentStart; si <= range.studentEnd; si++) {
      const batchIndex = range.batchStart + Math.floor((si - range.studentStart) / studentsPerBatch);
      const safeBatchIndex = Math.min(batchIndex, range.batchEnd);
      const enrollId = `61000000-0000-0000-${pad(si + 1)}-${pad(safeBatchIndex + 1, 12)}`;

      try {
        await prisma.studentBatchEnrollments.upsert({
          where: { id: enrollId },
          update: {},
          create: {
            id: enrollId,
            tenantId: TENANT_ID,
            studentAdmissionId: studentAdmissionIds[si],
            batchId: batchIds[safeBatchIndex],
            joinedAt: new Date('2026-04-01'),
            leftAt: farFuture,
            status: 'ACTIVE',
            isPrimary: true,
            createdBy: SYS,
            updatedBy: SYS,
            deletedAt: null,
            deletedBy: null,
          },
        });
      } catch {
        // already enrolled
      }
    }
  }
  console.log('  ✅ Students enrolled into batches\n');

  // ── 8. StaffBatchAssignments (Tutor → Batch → Subject) ───────────────────
  console.log('👨‍🏫 Assigning Tutors to Batches...');
  // Assign tutors round-robin per subject per batch
  // Physics tutors: indices 0-3, 12, 15, 18 (7 tutors)
  // Chemistry tutors: indices 4-7, 13, 16, 19 (7 tutors)
  // Biology tutors: indices 8-11, 14, 17 (6 tutors)
  const tutorsBySubject: Record<string, string[]> = {
    [PHYSICS_SID]: [],
    [CHEMISTRY_SID]: [],
    [BIOLOGY_SID]: [],
  };
  for (let i = 0; i < TUTORS.length; i++) {
    const sid = subjectIdMap[TUTORS[i].subject];
    tutorsBySubject[sid].push(tutorUserIds[i]);
  }

  let assignIdx = 0;
  for (let b = 0; b < batchIds.length; b++) {
    for (const slot of SUBJECT_SLOTS) {
      const tutorPool = tutorsBySubject[slot.subjectId];
      const tutorId = tutorPool[b % tutorPool.length];
      const assignId = `62000000-0000-0000-${pad(b + 1)}-${pad(++assignIdx, 12)}`;

      try {
        await prisma.staffBatchAssignments.upsert({
          where: { id: assignId },
          update: {},
          create: {
            id: assignId,
            tenantId: TENANT_ID,
            staffProfileId: tutorId,
            batchId: batchIds[b],
            subjectId: slot.subjectId,
            effectiveFrom: startDate,
            effectiveTo: endDate,
            isActive: true,
            createdBy: SYS,
            updatedBy: SYS,
            deletedAt: null,
            deletedBy: null,
          },
        });
      } catch {
        // skip duplicate
      }
    }
  }
  console.log('  ✅ Tutors assigned to batches\n');

  // ── 9. Schedules — Mon to Fri for every batch × subject ──────────────────
  console.log('🗓️ Seeding Timetable Schedules (Mon-Fri, 3 subjects per batch)...');
  let scheduleCount = 0;

  for (let b = 0; b < batchIds.length; b++) {
    const cfg = BATCH_CONFIGS[b];
    const tutorPool = { ...tutorsBySubject };

    for (let si = 0; si < SUBJECT_SLOTS.length; si++) {
      const slot = SUBJECT_SLOTS[si];
      const tutorId = tutorsBySubject[slot.subjectId][b % tutorsBySubject[slot.subjectId].length];

      // Assign a room for offline/hybrid batches (round-robin)
      const useRoom = cfg.mode !== 'ONLINE';
      const roomId = useRoom ? ROOM_IDS[(b * 3 + si) % ROOM_IDS.length] : undefined;

      for (let d = 0; d < WEEKDAYS.length; d++) {
        const day = WEEKDAYS[d];
        const schedId = `63000000-${pad(b + 1, 4)}-${pad(si + 1, 4)}-${pad(d + 1, 4)}-${pad(1, 12)}`;

        try {
          await prisma.schedules.upsert({
            where: { id: schedId },
            update: { updatedBy: SYS },
            create: {
              id: schedId,
              tenantId: TENANT_ID,
              branchId: BRANCH_ID,
              academicYearId: AY_ID,
              batchId: batchIds[b],
              subjectId: slot.subjectId,
              staffProfileId: tutorId,
              dayOfWeek: day,
              startTime: slot.start,
              endTime: slot.end,
              effectiveFrom: startDate,
              effectiveUntil: endDate,
              deliveryMode: cfg.mode,
              roomId: roomId ?? null,
              meetingProvider: cfg.mode !== 'CLASSROOM' ? 'GOOGLE_MEET' : null,
              meetingLink: cfg.mode !== 'CLASSROOM' ? `https://meet.google.com/demo-batch-${pad(b + 1)}` : null,
              status: 'ACTIVE',
              notes: `${cfg.name} — ${['Physics', 'Chemistry', 'Biology'][si]} — ${day}`,
              createdBy: SYS,
              updatedBy: SYS,
              deletedAt: null,
              deletedBy: null,
            },
          });
          scheduleCount++;
        } catch (e: any) {
          if (!e?.message?.includes('Unique constraint')) {
            console.error(`  ⚠️ Schedule skip (batch ${b}, subject ${si}, day ${day}):`, e?.message);
          }
        }
      }
    }
  }
  console.log(`  ✅ ${scheduleCount} Schedule slots created (20 batches × 3 subjects × 5 days)\n`);

  // ── Final Summary ─────────────────────────────────────────────────────────
  const [courses, tutors, students, batches, schedules] = await Promise.all([
    prisma.courses.count({ where: { tenantId: TENANT_ID } }),
    prisma.users.count({ where: { tenantId: TENANT_ID, userType: 'TUTOR' } }),
    prisma.users.count({ where: { tenantId: TENANT_ID, userType: 'STUDENT' } }),
    prisma.batches.count({ where: { tenantId: TENANT_ID } }),
    prisma.schedules.count({ where: { tenantId: TENANT_ID } }),
  ]);

  console.log(`
╔══════════════════════════════════════════════╗
║          DEMO SEED COMPLETED ✅               ║
╠══════════════════════════════════════════════╣
║  Tenant:    Demo → Sivakasi Branch             ║
║  Courses:   ${String(courses).padEnd(37)}║
║  Tutors:    ${String(tutors).padEnd(37)}║
║  Students:  ${String(students).padEnd(37)}║
║  Batches:   ${String(batches).padEnd(37)}║
║  Schedules: ${String(schedules).padEnd(37)}║
╚══════════════════════════════════════════════╝

Credentials:
  Tenant Admin : tenant@demo.com / Admin@123
  Tutor (ex)   : tutor01.karthik@demo.com / Student@123
  Student (ex) : student01.arjun@demo.com / Student@123
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
