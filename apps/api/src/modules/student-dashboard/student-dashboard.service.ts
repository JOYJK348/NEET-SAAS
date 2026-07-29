import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// ─── Shared context resolved from JWT ──────────────────────────────────────
export interface StudentContext {
  userId: string;
  tenantId: string;
  studentAdmissionId: string;
  classType: 'CLASSROOM' | 'ONLINE' | 'HYBRID';
  activeEnrollments: Array<{
    id: string;
    batchId: string;
    studentAdmissionId: string;
    isPrimary: boolean;
  }>;
}

@Injectable()
export class StudentDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  private formatTime(dt: Date): string {
    const h = dt.getHours().toString().padStart(2, '0');
    const m = dt.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  private toLocalDateKey(d: Date): string {
    const y = d.getFullYear();
    const mo = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${mo}-${day}`;
  }

  private weekdayFromDateKey(dateKey: string): string {
    const [y, mo, d] = dateKey.split('-').map(Number);
    return new Date(y, mo - 1, d).toLocaleDateString('en-US', {
      weekday: 'long',
    });
  }

  // ─── SHARED STUDENT RESOLVER ────────────────────────────────────────────
  // Every endpoint calls this first. No mismatched identity keys.

  async resolveStudentContext(
    tenantId: string,
    userId: string,
  ): Promise<StudentContext> {
    // Step 1: Resolve StudentProfile (userId is PK)
    let profile = await this.prisma.studentProfiles.findFirst({
      where: { userId, deletedAt: null },
      select: { userId: true, classType: true },
    });

    if (!profile) {
      profile = await this.prisma.studentProfiles.findFirst({
        where: { userId },
        select: { userId: true, classType: true },
      });
    }

    if (!profile) {
      return {
        userId,
        tenantId,
        studentAdmissionId: '',
        classType: 'CLASSROOM',
        activeEnrollments: [],
      };
    }

    // Step 2: Resolve most recent admission for this student
    let admission = await this.prisma.studentAdmissions.findFirst({
      where: {
        studentProfileId: profile.userId,
        deletedAt: null,
      },
      orderBy: [{ admissionStatus: 'asc' }, { admissionDate: 'desc' }],
      select: { id: true },
    });

    if (!admission) {
      admission = await this.prisma.studentAdmissions.findFirst({
        where: {
          OR: [{ studentProfileId: profile.userId }, { createdBy: userId }],
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
    }

    if (!admission) {
      return {
        userId,
        tenantId,
        studentAdmissionId: '',
        classType: profile.classType || 'CLASSROOM',
        activeEnrollments: [],
      };
    }

    // Step 3: Find active batch enrollments for this admission
    const activeEnrollments =
      await this.prisma.studentBatchEnrollments.findMany({
        where: {
          studentAdmissionId: admission.id,
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: {
          id: true,
          batchId: true,
          studentAdmissionId: true,
          isPrimary: true,
        },
      });

    return {
      userId,
      tenantId,
      studentAdmissionId: admission.id,
      classType: profile.classType,
      activeEnrollments,
    };
  }

  // ─── PHASE 2: OVERVIEW ──────────────────────────────────────────────────

  async getOverview(tenantId: string, userId: string) {
    const ctx = await this.resolveStudentContext(tenantId, userId);
    const batchIds = ctx.activeEnrollments.map((e) => e.batchId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 8);

    if (batchIds.length === 0) {
      return {
        greeting: `Welcome!`,
        stats: {
          todaysClasses: 0,
          upcomingClasses: 0,
          activeBatches: 0,
          attendanceRate: null,
        },
        todaysSchedule: [],
        liveNow: [],
      };
    }

    // Today's sessions across all enrolled batches
    const [todaysSessions, upcomingSessions] = await Promise.all([
      this.prisma.attendanceSessions.findMany({
        where: {
          tenantId,
          batchId: { in: batchIds },
          deletedAt: null,
          attendanceDate: { gte: today, lt: tomorrow },
          sessionStatus: { not: 'CANCELLED' as const },
        },
        orderBy: { startsAt: 'asc' },
      }),
      this.prisma.attendanceSessions.findMany({
        where: {
          tenantId,
          batchId: { in: batchIds },
          deletedAt: null,
          attendanceDate: { gte: tomorrow, lt: nextWeek },
          sessionStatus: { not: 'CANCELLED' as const },
        },
      }),
    ]);

    // Real attendance rate from AttendanceRecords
    // Sessions that have been PUBLISHED or LOCKED are considered completed
    const [totalSessions, presentCount] = await Promise.all([
      this.prisma.attendanceSessions.count({
        where: {
          tenantId,
          batchId: { in: batchIds },
          deletedAt: null,
          sessionStatus: { in: ['PUBLISHED', 'LOCKED'] },
        },
      }),
      this.prisma.attendanceRecords.count({
        where: {
          tenantId,
          studentAdmissionId: ctx.studentAdmissionId,
          attendanceStatus: 'PRESENT',
          deletedAt: null,
        },
      }),
    ]);

    const attendanceRate =
      totalSessions > 0
        ? Math.round((presentCount / totalSessions) * 100)
        : null;

    // Enrich sessions
    const enriched = await this.enrichStudentSessions(
      tenantId,
      todaysSessions,
      ctx.classType,
    );

    // Enrich upcoming sessions (will also filter for CLASSROOM students)
    const enrichedUpcoming = await this.enrichStudentSessions(
      tenantId,
      upcomingSessions,
      ctx.classType,
    );

    // Live-now detection
    const now = new Date();
    const liveNow = enriched.filter(
      (s) =>
        s.sessionStatus !== 'CANCELLED' &&
        new Date(`${s.date}T${s.startsAt}`) <= now &&
        new Date(`${s.date}T${s.endsAt}`) >= now,
    );

    return {
      stats: {
        todaysClasses: enriched.length,
        upcomingClasses: enrichedUpcoming.length,
        activeBatches: batchIds.length,
        attendanceRate, // real percentage or null if no sessions
      },
      todaysSchedule: enriched,
      liveNow,
    };
  }

  // ─── HELPER: Enrich session list with batch/subject/branch/deliveryMode ──

  private async enrichStudentSessions(
    tenantId: string,
    sessions: Array<{
      id: string;
      batchId: string;
      subjectId: string;
      scheduleId: string | null;
      startsAt: Date;
      endsAt: Date;
      attendanceDate: Date;
      sessionStatus: string;
      sessionSource: string | null;
    }>,
    studentClassType: 'CLASSROOM' | 'ONLINE' | 'HYBRID',
  ) {
    if (sessions.length === 0) return [];

    const batchIds = [...new Set(sessions.map((s) => s.batchId))];
    const subjectIds = [...new Set(sessions.map((s) => s.subjectId))];
    const scheduleIds = sessions
      .map((s) => s.scheduleId)
      .filter((id): id is string => id !== null);

    const [batches, subjects, scheduleRows] = await Promise.all([
      this.prisma.batches.findMany({
        where: { tenantId, id: { in: batchIds } },
        select: { id: true, name: true, code: true, deliveryTypeId: true },
      }),
      this.prisma.subjects.findMany({
        where: { tenantId, id: { in: subjectIds } },
        select: { id: true, name: true, code: true },
      }),
      scheduleIds.length > 0
        ? this.prisma.schedules.findMany({
            where: { tenantId, id: { in: scheduleIds } },
            select: {
              id: true,
              deliveryMode: true,
              roomId: true,
              meetingLink: true,
              meetingProvider: true,
            },
          })
        : Promise.resolve(
            [] as Array<{
              id: string;
              deliveryMode: string;
              roomId: string | null;
              meetingLink: string | null;
              meetingProvider: string | null;
            }>,
          ),
    ]);

    const batchMap = new Map(batches.map((b) => [b.id, b]));
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));
    const scheduleMap = new Map(scheduleRows.map((s) => [s.id, s]));

    const enriched = sessions
      .map((s) => {
        const sched = s.scheduleId
          ? (scheduleMap.get(s.scheduleId) ?? null)
          : null;
        const now = new Date();
        const sessionStart = new Date(s.startsAt);
        const sessionEnd = new Date(s.endsAt);
        const isFinished = ['PUBLISHED', 'LOCKED'].includes(s.sessionStatus);
        let liveStatus: 'UPCOMING' | 'LIVE_NOW' | 'COMPLETED' = 'UPCOMING';
        if (isFinished || sessionEnd < now) {
          liveStatus = 'COMPLETED';
        } else if (sessionStart <= now && sessionEnd >= now) {
          liveStatus = 'LIVE_NOW';
        }

        return {
          id: s.id,
          date: this.toLocalDateKey(s.attendanceDate),
          startsAt: this.formatTime(s.startsAt),
          endsAt: this.formatTime(s.endsAt),
          dayOfWeek: this.weekdayFromDateKey(
            this.toLocalDateKey(s.attendanceDate),
          ),
          subject: subjectMap.get(s.subjectId) ?? null,
          batch: batchMap.get(s.batchId) ?? null,
          sessionStatus:
            s.sessionStatus === 'DRAFT' && s.scheduleId
              ? 'SCHEDULED'
              : s.sessionStatus,
          sessionSource: s.sessionSource,
          deliveryMode: sched?.deliveryMode ?? null,
          liveStatus,
          // canJoin: NEVER return meetingLink here; only via /join endpoint
          canJoin:
            liveStatus === 'LIVE_NOW' &&
            studentClassType !== 'CLASSROOM' &&
            (sched?.deliveryMode === 'ONLINE' ||
              sched?.deliveryMode === 'HYBRID'),
        };
      });

    return enriched;
  }

  // ─── PHASE 3: TIMETABLE ─────────────────────────────────────────────────

  async getTimetable(
    tenantId: string,
    userId: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const ctx = await this.resolveStudentContext(tenantId, userId);
    const batchIds = ctx.activeEnrollments.map((e) => e.batchId);

    if (batchIds.length === 0) {
      return { fromDate: '', toDate: '', timetable: [] };
    }

    // Default: current week (Mon–Sun)
    const today = new Date();
    const fromDate = dateFrom
      ? new Date(`${dateFrom}T00:00:00`)
      : (() => {
          const d = new Date(today);
          const dow = d.getDay();
          d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
          d.setHours(0, 0, 0, 0);
          return d;
        })();

    const toDate = dateTo
      ? new Date(`${dateTo}T23:59:59.999`)
      : (() => {
          const d = new Date(fromDate);
          d.setDate(d.getDate() + 6);
          d.setHours(23, 59, 59, 999);
          return d;
        })();

    const sessions = await this.prisma.attendanceSessions.findMany({
      where: {
        tenantId,
        batchId: { in: batchIds },
        deletedAt: null,
        attendanceDate: { gte: fromDate, lte: toDate },
      },
      orderBy: [{ attendanceDate: 'asc' }, { startsAt: 'asc' }],
    });

    // Deduplicate by session id (authoritative dedup key)
    const uniqueSessions = Array.from(
      new Map(sessions.map((s) => [s.id, s])).values(),
    );
    const enriched = await this.enrichStudentSessions(
      tenantId,
      uniqueSessions,
      ctx.classType,
    );

    // Group by date
    const timetableMap = new Map<string, typeof enriched>();
    for (const session of enriched) {
      if (!timetableMap.has(session.date)) {
        timetableMap.set(session.date, []);
      }
      timetableMap.get(session.date)!.push(session);
    }

    return {
      fromDate: this.toLocalDateKey(fromDate),
      toDate: this.toLocalDateKey(toDate),
      timetable: Array.from(timetableMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dateKey, daySessions]) => ({
          date: dateKey,
          dayOfWeek: this.weekdayFromDateKey(dateKey),
          sessions: daySessions,
        })),
    };
  }

  // ─── PHASE 3: SESSION JOIN (6-point validation) ──────────────────────────

  async joinSession(tenantId: string, userId: string, sessionId: string) {
    // Gate 1: JWT student context
    const ctx = await this.resolveStudentContext(tenantId, userId);
    if (!ctx.studentAdmissionId) {
      throw new NotFoundException('Student profile or active admission not found');
    }
    const batchIds = ctx.activeEnrollments.map((e) => e.batchId);

    // Gate 2: Session exists
    const session = await this.prisma.attendanceSessions.findFirst({
      where: { tenantId, id: sessionId, deletedAt: null },
    });
    if (!session) throw new NotFoundException('Session not found');

    // Gate 3: Student has active enrollment in this session's batch
    if (!batchIds.includes(session.batchId)) {
      throw new ForbiddenException('You are not enrolled in this batch');
    }

    // Gate 4: Session is not cancelled
    if ((session.sessionStatus as string) === 'CANCELLED') {
      throw new BadRequestException('This class has been cancelled');
    }

    // Gate 5: Session is currently joinable (within ±15 min window)
    const now = new Date();
    const startTime = new Date(session.startsAt);
    const endTime = new Date(session.endsAt);
    const earlyAllowanceMs = 15 * 60 * 1000;
    if (now < new Date(startTime.getTime() - earlyAllowanceMs)) {
      throw new BadRequestException(
        'Class has not started yet (join opens 15 minutes early)',
      );
    }
    if (now > endTime) {
      throw new BadRequestException('This class has already ended');
    }

    // Gate 6: Student's classType must allow online joining
    if (ctx.classType === 'CLASSROOM') {
      throw new BadRequestException(
        'Your profile is set to Classroom mode — you cannot join online sessions',
      );
    }

    // Gate 7: Schedule has deliveryMode ONLINE or HYBRID and a meetingLink
    if (!session.scheduleId) {
      throw new BadRequestException('No schedule linked to this session');
    }

    const schedule = await this.prisma.schedules.findFirst({
      where: { tenantId, id: session.scheduleId },
      select: { deliveryMode: true, meetingLink: true, meetingProvider: true },
    });

    if (!schedule) throw new NotFoundException('Schedule not found');
    if (schedule.deliveryMode === 'CLASSROOM') {
      throw new BadRequestException(
        'This is a classroom session — no online join link',
      );
    }
    if (!schedule.meetingLink) {
      throw new BadRequestException(
        'Meeting link has not been configured for this session',
      );
    }

    // All gates passed — return join URL with short expiry
    const expiresAt = new Date(
      now.getTime() + 2 * 60 * 60 * 1000,
    ).toISOString(); // 2h window
    return {
      sessionId,
      joinUrl: schedule.meetingLink,
      provider: schedule.meetingProvider ?? 'UNKNOWN',
      expiresAt,
    };
  }

  // ─── PHASE 4: MY BATCHES ────────────────────────────────────────────────

  async getBatches(tenantId: string, userId: string) {
    const ctx = await this.resolveStudentContext(tenantId, userId);

    if (ctx.activeEnrollments.length === 0) {
      return { batches: [] };
    }

    // Deduplicate active enrollments by batchId
    const uniqueEnrollmentMap = new Map<string, (typeof ctx.activeEnrollments)[0]>();
    for (const enrollment of ctx.activeEnrollments) {
      if (!uniqueEnrollmentMap.has(enrollment.batchId)) {
        uniqueEnrollmentMap.set(enrollment.batchId, enrollment);
      } else if (enrollment.isPrimary) {
        uniqueEnrollmentMap.set(enrollment.batchId, enrollment);
      }
    }
    const uniqueEnrollments = Array.from(uniqueEnrollmentMap.values());

    const batchIds = uniqueEnrollments.map((e) => e.batchId);

    const batches = await this.prisma.batches.findMany({
      where: { tenantId, id: { in: batchIds } },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        maxStudents: true,
        startDate: true,
        endDate: true,
        status: true,
        isActive: true,
        deliveryTypeId: true,
        branchId: true,
        academicYearId: true,
        courseId: true,
      },
    });

    const branchIds = [...new Set(batches.map((b) => b.branchId))];
    const academicYearIds = [...new Set(batches.map((b) => b.academicYearId))];
    const courseIds = [...new Set(batches.map((b) => b.courseId))];
    const deliveryTypeIds = [...new Set(batches.map((b) => b.deliveryTypeId))];

    const [branches, academicYears, courses, deliveryTypes, enrolledCounts] =
      await Promise.all([
        this.prisma.branches.findMany({
          where: { tenantId, id: { in: branchIds } },
          select: { id: true, name: true },
        }),
        this.prisma.academicYears.findMany({
          where: { tenantId, id: { in: academicYearIds } },
          select: { id: true, name: true, code: true },
        }),
        this.prisma.courses.findMany({
          where: { tenantId, id: { in: courseIds } },
          select: { id: true, name: true, code: true, isActive: true },
        }),
        this.prisma.batchDeliveryTypes.findMany({
          where: { tenantId, id: { in: deliveryTypeIds } },
          select: { id: true, name: true, code: true },
        }),
        this.prisma.studentBatchEnrollments.groupBy({
          by: ['batchId'],
          where: {
            tenantId,
            batchId: { in: batchIds },
            status: 'ACTIVE',
            deletedAt: null,
          },
          _count: { id: true },
        }),
      ]);

    const branchMap = new Map(branches.map((b) => [b.id, b]));
    const ayMap = new Map(academicYears.map((a) => [a.id, a]));
    const courseMap = new Map(courses.map((c) => [c.id, c]));
    const dtMap = new Map(deliveryTypes.map((d) => [d.id, d]));
    const countMap = new Map(
      enrolledCounts.map((c) => [c.batchId, c._count.id]),
    );

    return {
      batches: uniqueEnrollments
        .map((enrollment) => {
          const batch = batches.find((b) => b.id === enrollment.batchId);
          if (!batch) return null;
          return {
            enrollmentId: enrollment.id,
            isPrimary: enrollment.isPrimary,
            batch: {
              ...batch,
              branch: branchMap.get(batch.branchId) ?? null,
              academicYear: ayMap.get(batch.academicYearId) ?? null,
              course: courseMap.get(batch.courseId) ?? null,
              deliveryType: dtMap.get(batch.deliveryTypeId) ?? null,
              totalEnrolled: countMap.get(batch.id) ?? 0,
            },
          };
        })
        .filter(Boolean),
    };
  }

  // ─── PHASE 5: ATTENDANCE HISTORY ────────────────────────────────────────

  async getAttendance(tenantId: string, userId: string) {
    const ctx = await this.resolveStudentContext(tenantId, userId);
    const batchIds = ctx.activeEnrollments.map((e) => e.batchId);

    if (batchIds.length === 0) {
      return {
        summary: { total: 0, present: 0, absent: 0, late: 0, rate: null },
        subjectBreakdown: [],
        records: [],
      };
    }

    // Fetch all attendance records for this student
    const records = await this.prisma.attendanceRecords.findMany({
      where: {
        tenantId,
        studentAdmissionId: ctx.studentAdmissionId,
        deletedAt: null,
      },
      orderBy: { markedAt: 'desc' },
      take: 200, // last 200 sessions
      select: {
        id: true,
        attendanceSessionId: true,
        attendanceStatus: true,
        lateMinutes: true,
        markedAt: true,
        remarks: true,
      },
    });

    if (records.length === 0) {
      return {
        summary: { total: 0, present: 0, absent: 0, late: 0, rate: null },
        subjectBreakdown: [],
        records: [],
      };
    }

    // Enrich with session → batch + subject info
    const sessionIds = records.map((r) => r.attendanceSessionId);
    const sessions = await this.prisma.attendanceSessions.findMany({
      where: { tenantId, id: { in: sessionIds }, deletedAt: null },
      select: {
        id: true,
        attendanceDate: true,
        startsAt: true,
        endsAt: true,
        batchId: true,
        subjectId: true,
        sessionStatus: true,
      },
    });

    const sessionMap = new Map(sessions.map((s) => [s.id, s]));
    const subjectIds = [...new Set(sessions.map((s) => s.subjectId))];
    const uniqueBatchIds = [...new Set(sessions.map((s) => s.batchId))];

    const [subjects, batches] = await Promise.all([
      this.prisma.subjects.findMany({
        where: { tenantId, id: { in: subjectIds } },
        select: { id: true, name: true, code: true },
      }),
      this.prisma.batches.findMany({
        where: { tenantId, id: { in: uniqueBatchIds } },
        select: { id: true, name: true, code: true },
      }),
    ]);

    const subjectMap = new Map(subjects.map((s) => [s.id, s]));
    const batchMap = new Map(batches.map((b) => [b.id, b]));

    // Summary stats
    const total = records.length;
    const present = records.filter(
      (r) => r.attendanceStatus === 'PRESENT',
    ).length;
    const absent = records.filter(
      (r) => r.attendanceStatus === 'ABSENT',
    ).length;
    const late = records.filter((r) => r.lateMinutes > 0).length;
    const rate = total > 0 ? Math.round((present / total) * 100) : null;

    // Subject-wise breakdown
    const subjectStats = new Map<
      string,
      { name: string; total: number; present: number }
    >();
    for (const record of records) {
      const session = sessionMap.get(record.attendanceSessionId);
      if (!session) continue;
      const sub = subjectMap.get(session.subjectId);
      if (!sub) continue;
      if (!subjectStats.has(sub.id)) {
        subjectStats.set(sub.id, { name: sub.name, total: 0, present: 0 });
      }
      const stats = subjectStats.get(sub.id)!;
      stats.total += 1;
      if (record.attendanceStatus === 'PRESENT') stats.present += 1;
    }

    const subjectBreakdown = Array.from(subjectStats.entries()).map(
      ([id, s]) => ({
        subjectId: id,
        subjectName: s.name,
        total: s.total,
        present: s.present,
        absent: s.total - s.present,
        rate: s.total > 0 ? Math.round((s.present / s.total) * 100) : null,
      }),
    );

    return {
      summary: { total, present, absent, late, rate },
      subjectBreakdown,
      records: records.map((r) => {
        const session = sessionMap.get(r.attendanceSessionId);
        return {
          id: r.id,
          date: session ? this.toLocalDateKey(session.attendanceDate) : null,
          startsAt: session ? this.formatTime(session.startsAt) : null,
          subject: session ? (subjectMap.get(session.subjectId) ?? null) : null,
          batch: session ? (batchMap.get(session.batchId) ?? null) : null,
          status: r.attendanceStatus,
          lateMinutes: r.lateMinutes,
          remarks: r.remarks,
          markedAt: r.markedAt,
        };
      }),
    };
  }

  // ─── PHASE 6: MY COURSES & SYLLABUS TREE ────────────────────────────────

  async getCourses(tenantId: string, userId: string) {
    const ctx = await this.resolveStudentContext(tenantId, userId);
    const batchIds = ctx.activeEnrollments.map((e) => e.batchId);

    if (batchIds.length === 0) return { courses: [] };

    // Step 1: Get unique courseIds from enrolled batches
    const batches = await this.prisma.batches.findMany({
      where: { tenantId, id: { in: batchIds } },
      select: { id: true, name: true, courseId: true, status: true },
    });

    const courseIds = [...new Set(batches.map((b) => b.courseId))];
    const batchesByCourse = new Map<
      string,
      { id: string; name: string; status: string }[]
    >();
    for (const b of batches) {
      if (!batchesByCourse.has(b.courseId)) batchesByCourse.set(b.courseId, []);
      batchesByCourse
        .get(b.courseId)!
        .push({ id: b.id, name: b.name, status: b.status });
    }

    // Step 2: Fetch active courses
    const courses = await this.prisma.courses.findMany({
      where: { tenantId, id: { in: courseIds }, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
    });
    if (courses.length === 0) return { courses: [] };

    // Step 3: Fetch active course-subjects (for student: all active, no subject filter)
    const courseSubjects = await this.prisma.courseSubjects.findMany({
      where: {
        tenantId,
        courseId: { in: courseIds },
        isActive: true,
        deletedAt: null,
      },
      orderBy: { displayOrder: 'asc' },
    });
    if (courseSubjects.length === 0) {
      return {
        courses: courses.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          displayName: c.displayName,
          description: c.description,
          courseType: c.courseType,
          durationMonths: c.durationMonths,
          isActive: c.isActive,
          batches: batchesByCourse.get(c.id) ?? [],
          subjects: [],
        })),
      };
    }

    const csIds = courseSubjects.map((cs) => cs.id);
    const subjectIds = [...new Set(courseSubjects.map((cs) => cs.subjectId))];

    // Step 4: Fetch subject names
    const subjects = await this.prisma.subjects.findMany({
      where: { tenantId, id: { in: subjectIds }, deletedAt: null },
    });
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    // Step 5: Chapters (active only)
    const chapters = await this.prisma.chapters.findMany({
      where: {
        tenantId,
        courseSubjectId: { in: csIds },
        isActive: true,
        deletedAt: null,
      },
      orderBy: { displayOrder: 'asc' },
    });
    const chapterIds = chapters.map((ch) => ch.id);

    // Step 6: Topics (active only)
    const topics = await this.prisma.topics.findMany({
      where: {
        tenantId,
        chapterId: { in: chapterIds },
        isActive: true,
        deletedAt: null,
      },
      orderBy: { displayOrder: 'asc' },
    });

    // Step 7: Topic item counts (active items matching tutor visibility)
    const topicItemCounts = await this.prisma.topicItems.groupBy({
      by: ['topicId'],
      where: {
        tenantId,
        topicId: { in: topics.map((t) => t.id) },
        deletedAt: null,
      },
      _count: { id: true },
    });
    const countMap = new Map(
      topicItemCounts.map((r) => [r.topicId, r._count.id]),
    );

    // Build nested maps
    const topicsByChapter = new Map<string, typeof topics>();
    for (const t of topics) {
      if (!topicsByChapter.has(t.chapterId))
        topicsByChapter.set(t.chapterId, []);
      topicsByChapter.get(t.chapterId)!.push(t);
    }

    const chaptersByCs = new Map<string, typeof chapters>();
    for (const ch of chapters) {
      if (!chaptersByCs.has(ch.courseSubjectId))
        chaptersByCs.set(ch.courseSubjectId, []);
      chaptersByCs.get(ch.courseSubjectId)!.push(ch);
    }

    const csByCourse = new Map<string, typeof courseSubjects>();
    for (const cs of courseSubjects) {
      if (!csByCourse.has(cs.courseId)) csByCourse.set(cs.courseId, []);
      csByCourse.get(cs.courseId)!.push(cs);
    }

    return {
      courses: courses.map((c) => {
        const csList = csByCourse.get(c.id) ?? [];
        return {
          id: c.id,
          code: c.code,
          name: c.name,
          displayName: c.displayName,
          description: c.description,
          courseType: c.courseType,
          durationMonths: c.durationMonths,
          isActive: c.isActive,
          batches: batchesByCourse.get(c.id) ?? [],
          subjects: csList
            .filter((cs) => subjectMap.has(cs.subjectId))
            .map((cs) => {
              const sub = subjectMap.get(cs.subjectId)!;
              const chList = chaptersByCs.get(cs.id) ?? [];
              return {
                id: cs.id,
                displayOrder: cs.displayOrder,
                isMandatory: cs.isMandatory,
                subject: {
                  id: sub.id,
                  code: sub.code,
                  name: sub.name,
                  shortName: sub.shortName,
                  displayName: sub.displayName,
                  subjectType: sub.subjectType,
                },
                chapters: chList.map((ch) => {
                  const topicList = topicsByChapter.get(ch.id) ?? [];
                  return {
                    id: ch.id,
                    code: ch.code,
                    name: ch.name,
                    shortName: ch.shortName,
                    description: ch.description,
                    plannedHours: ch.plannedHours,
                    displayOrder: ch.displayOrder,
                    topics: topicList.map((t) => ({
                      id: t.id,
                      code: t.code,
                      name: t.name,
                      shortName: t.shortName,
                      description: t.description,
                      difficultyLevel: t.difficultyLevel,
                      plannedHours: t.plannedHours,
                      displayOrder: t.displayOrder,
                      publishedItemCount: countMap.get(t.id) ?? 0,
                    })),
                  };
                }),
              };
            }),
        };
      }),
    };
  }
}
