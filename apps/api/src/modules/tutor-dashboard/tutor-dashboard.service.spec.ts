/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TutorDashboardService } from './tutor-dashboard.service';

// ─── Factory helpers ─────────────────────────────────────────────────────────

function makeStaffProfile(overrides = {}) {
  return { userId: 'tutor-1', employeeCode: 'TUT-001', ...overrides };
}

function makeBatch(overrides = {}) {
  return {
    id: 'batch-1',
    tenantId: 'tenant-1',
    name: 'NEET 2027 Batch A',
    code: 'NEET27-A',
    description: null,
    maxStudents: 60,
    startDate: new Date('2026-06-01'),
    endDate: new Date('2027-03-31'),
    status: 'ACTIVE',
    branchId: 'branch-1',
    academicYearId: 'ay-1',
    courseId: 'course-1',
    deliveryTypeId: 'dt-1',
    ...overrides,
  };
}

function makeSession(overrides = {}) {
  return {
    id: 'session-1',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    academicYearId: 'ay-1',
    batchId: 'batch-1',
    subjectId: 'subj-1',
    staffProfileId: 'tutor-1',
    scheduleId: 'sched-1',
    attendanceDate: new Date('2026-07-20'),
    startsAt: new Date('2026-07-20T08:00:00Z'),
    endsAt: new Date('2026-07-20T10:00:00Z'),
    sessionStatus: 'SCHEDULED',
    sessionSource: 'AUTO_GENERATED',
    overrideType: null,
    cancelledReason: null,
    remarks: '',
    createdBy: 'system',
    updatedBy: 'system',
    deletedAt: null,
    ...overrides,
  };
}

describe('TutorDashboardService — Authorization & Business Logic', () => {
  let prisma: any;
  let service: TutorDashboardService;

  beforeEach(() => {
    prisma = {
      staffProfiles: { findFirst: jest.fn() },
      attendanceSessions: { count: jest.fn(), findMany: jest.fn() },
      staffBatchAssignments: {
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      studentBatchEnrollments: {
        count: jest.fn(),
        findMany: jest.fn(),
        groupBy: jest.fn(),
      },
      batches: { findMany: jest.fn(), findFirst: jest.fn() },
      subjects: { findMany: jest.fn(), findFirst: jest.fn() },
      branches: { findMany: jest.fn(), findFirst: jest.fn() },
      schedules: { findMany: jest.fn(), findFirst: jest.fn() },
      rooms: { findMany: jest.fn(), findFirst: jest.fn() },
      attendanceRecords: { findMany: jest.fn() },
      studentAdmissions: { findMany: jest.fn() },
      studentProfiles: { findMany: jest.fn() },
      users: { findMany: jest.fn() },
      courses: { findMany: jest.fn(), findFirst: jest.fn() },
      academicYears: { findMany: jest.fn(), findFirst: jest.fn() },
      batchDeliveryTypes: { findMany: jest.fn(), findFirst: jest.fn() },
    };

    service = new TutorDashboardService(prisma);
  });

  // ─── RESOLVE TUTOR FAILS ───────────────────────────────────────────────────

  it('throws NotFoundException when staff profile does not exist', async () => {
    prisma.staffProfiles.findFirst.mockResolvedValue(null);

    await expect(
      service.getOverview('tenant-1', 'nonexistent-user'),
    ).rejects.toBeInstanceOf(NotFoundException);

    await expect(
      service.getTimetable('tenant-1', 'nonexistent-user'),
    ).rejects.toBeInstanceOf(NotFoundException);

    await expect(
      service.getBatches('tenant-1', 'nonexistent-user'),
    ).rejects.toBeInstanceOf(NotFoundException);

    await expect(
      service.getBatchStudents('tenant-1', 'nonexistent-user', 'batch-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // ─── TENANT ISOLATION ──────────────────────────────────────────────────────

  it('Tenant A tutor cannot access Tenant B data — staff profile not found', async () => {
    // Tutor exists in Tenant A but not in Tenant B
    prisma.staffProfiles.findFirst
      .mockResolvedValueOnce(makeStaffProfile()) // tenant-1
      .mockResolvedValueOnce(null); // tenant-2

    // This should succeed for tenant-1
    prisma.attendanceSessions.count.mockResolvedValue(2);
    prisma.attendanceSessions.findMany.mockResolvedValue([]);
    prisma.staffBatchAssignments.count.mockResolvedValue(3);
    prisma.staffBatchAssignments.findMany.mockResolvedValue([]);

    await expect(
      service.getOverview('tenant-1', 'tutor-1'),
    ).resolves.toBeDefined();

    // This should fail for tenant-2 (different tenant, same user)
    await expect(
      service.getOverview('tenant-2', 'tutor-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // ─── TUTOR A CANNOT ACCESS TUTOR B TIMETABLE ──────────────────────────────

  it('Tutor A sessions are filtered to staffProfileId — Tutor B data not accessible', async () => {
    prisma.staffProfiles.findFirst.mockResolvedValue(makeStaffProfile());

    // Mock that sessions exist for another tutor but not this one
    prisma.attendanceSessions.findMany.mockResolvedValue([
      makeSession({ id: 'session-tutorA', staffProfileId: 'tutor-1' }),
    ]);

    const result = await service.getTimetable('tenant-1', 'tutor-1');

    // Verify the query filtered by staffProfileId = 'tutor-1'
    const queryWhere =
      prisma.attendanceSessions.findMany.mock.calls[0][0].where;
    expect(queryWhere.staffProfileId).toBe('tutor-1');
    expect(queryWhere.tenantId).toBe('tenant-1');

    expect(result.timetable.some((d: any) => d.sessions.length > 0)).toBe(true);
  });

  // ─── TUTOR CANNOT ACCESS UNASSIGNED BATCH ─────────────────────────────────

  it('throws ForbiddenException when tutor accesses batch they are not assigned to', async () => {
    prisma.staffProfiles.findFirst.mockResolvedValue(makeStaffProfile());

    // No active assignment for this tutor+tenant+batch
    prisma.staffBatchAssignments.findFirst.mockResolvedValue(null);

    await expect(
      service.getBatchStudents('tenant-1', 'tutor-1', 'unassigned-batch'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns batch students when tutor IS assigned to batch', async () => {
    prisma.staffProfiles.findFirst.mockResolvedValue(makeStaffProfile());
    prisma.staffBatchAssignments.findFirst.mockResolvedValue({
      id: 'assign-1',
      staffProfileId: 'tutor-1',
      batchId: 'batch-1',
      tenantId: 'tenant-1',
      isActive: true,
    });
    prisma.batches.findFirst.mockResolvedValue(makeBatch());
    prisma.courses.findFirst.mockResolvedValue({
      id: 'course-1',
      name: 'NEET',
      code: 'NEET',
    });
    prisma.branches.findFirst.mockResolvedValue({
      id: 'branch-1',
      name: 'Chennai',
    });
    prisma.academicYears.findFirst.mockResolvedValue({
      id: 'ay-1',
      name: '2026-27',
    });
    prisma.batchDeliveryTypes.findFirst.mockResolvedValue({
      id: 'dt-1',
      name: 'Regular',
      code: 'REG',
    });
    prisma.studentBatchEnrollments.findMany.mockResolvedValue([]);

    const result = await service.getBatchStudents(
      'tenant-1',
      'tutor-1',
      'batch-1',
    );

    expect(result).toBeDefined();
    expect(result.batch).toBeDefined();
    expect(result.batch.name).toBe('NEET 2027 Batch A');
  });

  // ─── TUTOR CANNOT ACCESS ANOTHER TUTOR'S SESSION ──────────────────────────

  it('throws NotFoundException when tutor accesses another tutors session', async () => {
    prisma.staffProfiles.findFirst.mockResolvedValue(makeStaffProfile());

    // Session 2 exists but belongs to tutor-2
    prisma.attendanceSessions.findFirst.mockResolvedValue(null);

    await expect(
      service.getSessionDetails('tenant-1', 'tutor-1', 'session-tutor2'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns session details when tutor accesses their own session', async () => {
    prisma.staffProfiles.findFirst.mockResolvedValue(makeStaffProfile());
    const sessionData = makeSession({ staffProfileId: 'tutor-1' });
    prisma.attendanceSessions.findFirst.mockResolvedValue(sessionData);
    prisma.batches.findFirst.mockResolvedValue(makeBatch());
    prisma.subjects.findFirst.mockResolvedValue({
      id: 'subj-1',
      name: 'Physics',
      code: 'PHY',
    });
    prisma.branches.findFirst.mockResolvedValue({
      id: 'branch-1',
      name: 'Chennai',
    });
    prisma.schedules.findFirst.mockResolvedValue({
      id: 'sched-1',
      dayOfWeek: 'MONDAY',
      startTime: '08:00',
      endTime: '10:00',
      roomId: null,
    });
    prisma.attendanceRecords.findMany.mockResolvedValue([]);
    prisma.studentAdmissions.findMany.mockResolvedValue([]);
    prisma.studentProfiles.findMany.mockResolvedValue([]);
    prisma.users.findMany.mockResolvedValue([]);
    prisma.studentBatchEnrollments.count.mockResolvedValue(0);

    const result = await service.getSessionDetails(
      'tenant-1',
      'tutor-1',
      'session-1',
    );

    expect(result).toBeDefined();
    expect(result.session.id).toBe('session-1');
    // Verify query was scoped
    const queryWhere =
      prisma.attendanceSessions.findFirst.mock.calls[0][0].where;
    expect(queryWhere.staffProfileId).toBe('tutor-1');
    expect(queryWhere.tenantId).toBe('tenant-1');
  });

  // ─── CANCELLED SESSIONS EXCLUDED FROM OVERVIEW ────────────────────────────

  it('excludes CANCELLED sessions from today and upcoming counts', async () => {
    prisma.staffProfiles.findFirst.mockResolvedValue(makeStaffProfile());

    // Only count non-cancelled sessions
    prisma.attendanceSessions.count.mockResolvedValue(3);
    prisma.staffBatchAssignments.count.mockResolvedValue(4);
    prisma.staffBatchAssignments.findMany.mockResolvedValue([]);
    prisma.attendanceSessions.findMany.mockResolvedValue([]);

    const result = await service.getOverview('tenant-1', 'tutor-1');

    expect(result.stats.todaysClasses).toBe(3);
    expect(result.stats.upcomingClasses).toBe(3);

    // Verify the query excluded CANCELLED
    const countCalls = prisma.attendanceSessions.count.mock.calls;
    for (const call of countCalls) {
      expect(call[0].where.sessionStatus.not).toBe('CANCELLED');
    }
  });

  // ─── RESCHEDULED SESSION SHOWS ACTUAL TIME ────────────────────────────────

  it('returns overridden startsAt/endsAt for rescheduled sessions', async () => {
    prisma.staffProfiles.findFirst.mockResolvedValue(makeStaffProfile());
    const originalStartsAt = new Date('2026-07-20T10:00:00Z');
    const originalEndsAt = new Date('2026-07-20T12:00:00Z');

    prisma.attendanceSessions.findMany.mockResolvedValue([
      makeSession({
        id: 'session-rescheduled',
        staffProfileId: 'tutor-1',
        overrideType: 'TIME_CHANGED',
        startsAt: originalStartsAt,
        endsAt: originalEndsAt,
      }),
    ]);

    // Mock enrich queries
    prisma.batches.findMany.mockResolvedValue([makeBatch()]);
    prisma.subjects.findMany.mockResolvedValue([
      { id: 'subj-1', name: 'Physics', code: 'PHY' },
    ]);
    prisma.branches.findMany.mockResolvedValue([
      { id: 'branch-1', name: 'Chennai' },
    ]);

    const result = await service.getTimetable('tenant-1', 'tutor-1');

    // Flatten sessions to find the rescheduled one
    const allSessions = result.timetable.flatMap((d: any) => d.sessions);
    const rescheduledSession = allSessions.find(
      (s: any) => s.id === 'session-rescheduled',
    );

    expect(rescheduledSession).toBeDefined();
    expect(rescheduledSession.overrideType).toBe('TIME_CHANGED');
    // The actual overridden time is what's stored in the session
    expect(rescheduledSession.startsAt).toEqual(originalStartsAt);
    expect(rescheduledSession.endsAt).toEqual(originalEndsAt);
  });

  // ─── OVERVIEW RETURNS CORRECT STATS ──────────────────────────────────────

  it('returns accurate overview stats', async () => {
    prisma.staffProfiles.findFirst.mockResolvedValue(makeStaffProfile());
    prisma.attendanceSessions.count.mockResolvedValue(2); // today
    prisma.attendanceSessions.count.mockResolvedValue(5); // upcoming (second call)
    prisma.staffBatchAssignments.count.mockResolvedValue(3); // batches
    prisma.staffBatchAssignments.findMany.mockResolvedValue([
      { batchId: 'batch-1' },
      { batchId: 'batch-2' },
    ]);
    prisma.studentBatchEnrollments.count.mockResolvedValue(75); // students
    prisma.attendanceSessions.findMany.mockResolvedValue([]);

    const result = await service.getOverview('tenant-1', 'tutor-1');

    expect(result.stats).toEqual({
      todaysClasses: 2,
      upcomingClasses: 5,
      myBatches: 3,
      totalStudents: 75,
    });
  });

  // ─── BATCH LIST RETURNS CORRECT DATA ──────────────────────────────────────

  it('returns batch assignments with enriched details', async () => {
    prisma.staffProfiles.findFirst.mockResolvedValue(makeStaffProfile());
    prisma.staffBatchAssignments.findMany.mockResolvedValue([
      {
        id: 'assign-1',
        batchId: 'batch-1',
        subjectId: 'subj-1',
        effectiveFrom: new Date(),
        effectiveTo: new Date('2099-12-31'),
      },
    ]);
    prisma.batches.findMany.mockResolvedValue([makeBatch()]);
    prisma.subjects.findMany.mockResolvedValue([
      { id: 'subj-1', name: 'Physics', code: 'PHY' },
    ]);
    prisma.studentBatchEnrollments.groupBy.mockResolvedValue([
      { batchId: 'batch-1', _count: { id: 30 } },
    ]);
    prisma.branches.findMany.mockResolvedValue([
      { id: 'branch-1', name: 'Chennai' },
    ]);
    prisma.academicYears.findMany.mockResolvedValue([
      { id: 'ay-1', name: '2026-27', code: '2026' },
    ]);
    prisma.courses.findMany.mockResolvedValue([
      { id: 'course-1', name: 'NEET', code: 'NEET' },
    ]);
    prisma.batchDeliveryTypes.findMany.mockResolvedValue([
      { id: 'dt-1', name: 'Regular', code: 'REG' },
    ]);

    const result = await service.getBatches('tenant-1', 'tutor-1');

    expect(result).toHaveLength(1);
    expect(result[0].assignmentId).toBe('assign-1');
    expect(result[0]?.batch?.studentCount).toBe(30);
    expect(result[0].subject?.name).toBe('Physics');
  });

  // ─── SESSION NOT FOUND (WRONG TENANT / TUTOR) ────────────────────────────

  it('returns NotFoundException when session does not exist', async () => {
    prisma.staffProfiles.findFirst.mockResolvedValue(makeStaffProfile());
    prisma.attendanceSessions.findFirst.mockResolvedValue(null);

    await expect(
      service.getSessionDetails('tenant-1', 'tutor-1', 'nonexistent-session'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // ─── BATCH NOT FOUND ──────────────────────────────────────────────────────

  it('returns NotFoundException when batch does not exist', async () => {
    prisma.staffProfiles.findFirst.mockResolvedValue(
      makeStaffProfile({ userId: 'tutor-1' }),
    );
    prisma.staffBatchAssignments.findFirst.mockResolvedValue({
      id: 'assign-1',
      batchId: 'nonexistent-batch',
    });
    prisma.batches.findFirst.mockResolvedValue(null);

    await expect(
      service.getBatchStudents('tenant-1', 'tutor-1', 'nonexistent-batch'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
