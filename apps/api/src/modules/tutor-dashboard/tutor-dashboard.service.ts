import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  AttendanceSessionStatusEnum,
  AttendanceStatusEnum,
  AttendanceSessions,
} from '@prisma/client';
import {
  BulkAttendanceRequestDto,
  BulkAttendanceResponseDto,
} from './dto/tutor-dashboard-response.dto';

@Injectable()
export class TutorDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── HELPER: Format DateTime to HH:mm string ──────────────────────────

  private formatTime(dt: Date): string {
    const h = dt.getHours().toString().padStart(2, '0');
    const m = dt.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  // ─── HELPER: Get YYYY-MM-DD from Date using local timezone ────────────

  private toLocalDateKey(d: Date): string {
    const y = d.getFullYear();
    const mo = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${mo}-${day}`;
  }

  // ─── HELPER: Get weekday name from YYYY-MM-DD string ──────────────────

  private weekdayFromDateKey(dateKey: string): string {
    const [y, mo, d] = dateKey.split('-').map(Number);
    return new Date(y, mo - 1, d).toLocaleDateString('en-US', {
      weekday: 'long',
    });
  }

  // ─── HELPER: Resolve authenticated tutor's staff profile ──────────────────

  private async resolveTutor(tenantId: string, userId: string) {
    let profile = await this.prisma.staffProfiles.findFirst({
      where: { userId, tenantId, deletedAt: null },
      select: { userId: true, employeeCode: true },
    });

    if (!profile) {
      const anyProfile = await this.prisma.staffProfiles.findFirst({
        where: { tenantId, deletedAt: null },
        select: { userId: true, employeeCode: true },
      });
      profile = anyProfile ?? {
        userId,
        employeeCode: `EMP-${userId.replace(/-/g, '').slice(0, 6).toUpperCase()}`,
      };
    }

    return profile;
  }

  // ─── OVERVIEW ─────────────────────────────────────────────────────────────

  async getOverview(tenantId: string, userId: string) {
    const profile = await this.resolveTutor(tenantId, userId);
    const staffProfileId = profile.userId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 8);

    // Today's classes count
    const todaysClasses = await this.prisma.attendanceSessions.count({
      where: {
        tenantId,
        staffProfileId,
        deletedAt: null,
        attendanceDate: { gte: today, lt: tomorrow },
        sessionStatus: { not: AttendanceSessionStatusEnum.CANCELLED },
      },
    });

    // Upcoming classes count (next 7 days excluding today)
    const upcomingClasses = await this.prisma.attendanceSessions.count({
      where: {
        tenantId,
        staffProfileId,
        deletedAt: null,
        attendanceDate: { gte: tomorrow, lt: nextWeek },
        sessionStatus: { not: AttendanceSessionStatusEnum.CANCELLED },
      },
    });

    // Assigned batches count
    const myBatches = await this.prisma.staffBatchAssignments.count({
      where: { tenantId, staffProfileId, isActive: true, deletedAt: null },
    });

    // Total assigned students across all batches
    const batchAssignments = await this.prisma.staffBatchAssignments.findMany({
      where: { tenantId, staffProfileId, isActive: true, deletedAt: null },
      select: { batchId: true },
    });
    const batchIds = batchAssignments.map((ba) => ba.batchId);
    const totalStudents =
      batchIds.length > 0
        ? await this.prisma.studentBatchEnrollments.count({
            where: {
              tenantId,
              batchId: { in: batchIds },
              status: 'ACTIVE',
              deletedAt: null,
            },
          })
        : 0;

    // Today's schedule
    let todaysSessions = await this.prisma.attendanceSessions.findMany({
      where: {
        tenantId,
        staffProfileId,
        deletedAt: null,
        attendanceDate: { gte: today, lt: tomorrow },
        sessionStatus: { not: AttendanceSessionStatusEnum.CANCELLED },
      },
      orderBy: { startsAt: 'asc' },
    });

    // Fallback: If no materialized attendance sessions exist for today, check recurring schedules for today's weekday
    if (todaysSessions.length === 0) {
      const weekdays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;
      const todayDayOfWeek = weekdays[today.getDay()];

      const todaySchedules = await this.prisma.schedules.findMany({
        where: {
          tenantId,
          staffProfileId,
          dayOfWeek: todayDayOfWeek,
          effectiveFrom: { lte: today },
        },
        select: {
          id: true,
          batchId: true,
          subjectId: true,
          branchId: true,
          startTime: true,
          endTime: true,
          deliveryMode: true,
          meetingLink: true,
        },
      });

      if (todaySchedules.length > 0) {
        todaysSessions = todaySchedules.map((sch) => {
          const [startH, startM] = sch.startTime.split(':').map(Number);
          const [endH, endM] = sch.endTime.split(':').map(Number);

          const sTime = new Date(today);
          sTime.setHours(startH, startM, 0, 0);

          const eTime = new Date(today);
          eTime.setHours(endH, endM, 0, 0);

          return {
            id: sch.id,
            tenantId,
            batchId: sch.batchId,
            subjectId: sch.subjectId,
            branchId: sch.branchId,
            staffProfileId,
            scheduleId: sch.id,
            attendanceDate: today,
            startsAt: sTime,
            endsAt: eTime,
            sessionStatus: 'SCHEDULED' as AttendanceSessionStatusEnum,
            sessionSource: 'SCHEDULED',
            overrideType: null,
            cancelledReason: null,
            createdAt: today,
            updatedAt: today,
            deletedAt: null,
          } as unknown as AttendanceSessions;
        });
      }
    }

    // Upcoming classes
    let upcomingSessions = await this.prisma.attendanceSessions.findMany({
      where: {
        tenantId,
        staffProfileId,
        deletedAt: null,
        attendanceDate: { gte: tomorrow, lt: nextWeek },
        sessionStatus: { not: AttendanceSessionStatusEnum.CANCELLED },
      },
      orderBy: [{ attendanceDate: 'asc' }, { startsAt: 'asc' }],
      take: 10,
    });

    // Fallback: If no materialized attendance sessions exist for upcoming days, generate virtual slots for next 7 days (starting tomorrow)
    if (upcomingSessions.length === 0) {
      const weekdays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

      const futureSchedules = await this.prisma.schedules.findMany({
        where: {
          tenantId,
          staffProfileId,
          effectiveFrom: { lte: nextWeek },
        },
        select: {
          id: true,
          batchId: true,
          subjectId: true,
          branchId: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
        },
      });

      if (futureSchedules.length > 0) {
        const virtualUpcoming: AttendanceSessions[] = [];

        // Loop through days 1 to 7 (starting tomorrow)
        for (let i = 1; i <= 7; i++) {
          const futureDate = new Date(today);
          futureDate.setDate(today.getDate() + i);
          futureDate.setHours(0, 0, 0, 0);

          const futureWeekday = weekdays[futureDate.getDay()];
          const matchingSchedules = futureSchedules.filter((sch) => sch.dayOfWeek === futureWeekday);

          for (const sch of matchingSchedules) {
            const [startH, startM] = sch.startTime.split(':').map(Number);
            const [endH, endM] = sch.endTime.split(':').map(Number);

            const sTime = new Date(futureDate);
            sTime.setHours(startH, startM, 0, 0);

            const eTime = new Date(futureDate);
            eTime.setHours(endH, endM, 0, 0);

            virtualUpcoming.push({
              id: `${sch.id}-${futureDate.toISOString().slice(0, 10)}`,
              tenantId,
              batchId: sch.batchId,
              subjectId: sch.subjectId,
              branchId: sch.branchId,
              staffProfileId,
              scheduleId: sch.id,
              attendanceDate: futureDate,
              startsAt: sTime,
              endsAt: eTime,
              sessionStatus: 'SCHEDULED' as AttendanceSessionStatusEnum,
              sessionSource: 'SCHEDULED',
              overrideType: null,
              cancelledReason: null,
              createdAt: futureDate,
              updatedAt: futureDate,
              deletedAt: null,
            } as unknown as AttendanceSessions);
          }
        }

        upcomingSessions = virtualUpcoming;
      }
    }

    // Enrich sessions with related data
    const [todaysEnriched, upcomingEnriched] = await Promise.all([
      this.enrichSessions(tenantId, todaysSessions),
      this.enrichSessions(tenantId, upcomingSessions),
    ]);

    // Live-now detection
    const liveNow = todaysEnriched.filter((s) => s.liveStatus === 'LIVE_NOW' || s.canJoin);

    return {
      stats: { todaysClasses, upcomingClasses, myBatches, totalStudents },
      todaysSchedule: todaysEnriched,
      upcomingSchedule: upcomingEnriched,
      liveNow,
    };
  }

  // ─── HELPER: Enrich sessions with related data ────────────────────────────

  private async enrichSessions(
    tenantId: string,
    sessions: AttendanceSessions[],
  ) {
    if (sessions.length === 0) return [];

    const batchIds = [...new Set(sessions.map((s) => s.batchId))];
    const subjectIds = [...new Set(sessions.map((s) => s.subjectId))];
    const branchIds = [...new Set(sessions.map((s) => s.branchId))];

    const [batches, subjects, branches, activeLiveClasses] = await Promise.all([
      this.prisma.batches.findMany({
        where: { tenantId, id: { in: batchIds } },
        select: { id: true, name: true, code: true },
      }),
      this.prisma.subjects.findMany({
        where: { tenantId, id: { in: subjectIds } },
        select: { id: true, name: true, code: true },
      }),
      this.prisma.branches.findMany({
        where: { tenantId, id: { in: branchIds } },
        select: { id: true, name: true },
      }),
      this.prisma.liveClasses.findMany({
        where: {
          tenantId,
          status: { in: ['SCHEDULED', 'LIVE', 'DRAFT'] },
          deletedAt: null,
        },
        select: { id: true, batchId: true, subjectId: true, scheduledStart: true, scheduledEnd: true, status: true },
      }),
    ]);

    const scheduleIds = sessions
      .map((s) => s.scheduleId)
      .filter((id): id is string => id !== null);

    const schedules =
      scheduleIds.length > 0
        ? await this.prisma.schedules.findMany({
            where: { tenantId, id: { in: scheduleIds } },
            select: { id: true, startTime: true, endTime: true, deliveryMode: true, meetingLink: true },
          })
        : [];

    const batchMap = new Map(batches.map((b) => [b.id, b]));
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));
    const branchMap = new Map(branches.map((b) => [b.id, b]));
    const scheduleMap = new Map(schedules.map((s) => [s.id, s]));

    return sessions.map((s) => {
      const sched = s.scheduleId ? scheduleMap.get(s.scheduleId) : null;

      const matchingLiveClass = activeLiveClasses.find(
        (lc) =>
          lc.id === s.id ||
          (lc.batchId && lc.batchId === s.batchId && lc.subjectId === s.subjectId) ||
          (lc.batchId && lc.batchId === s.batchId),
      );

      // Always use the actual session row times (s.startsAt/endsAt) as ground truth.
      // The session row is synced by ScheduleService.update whenever the schedule changes.
      // sched.startTime/endTime is the TEMPLATE and may be stale if the series was split.
      let startHHMM = this.formatTime(new Date(s.startsAt));
      let endHHMM = this.formatTime(new Date(s.endsAt));

      // Also check the schedule template - if it has a LATER end time than the session row,
      // use the template's time (handles race condition where session sync hasn't happened yet)
      if (sched?.endTime && sched.endTime > endHHMM) {
        endHHMM = sched.endTime;
      }
      if (sched?.startTime && sched.startTime < startHHMM) {
        startHHMM = sched.startTime;
      }

      // If a live class is active, its scheduled times take highest priority
      if (matchingLiveClass?.scheduledStart) {
        startHHMM = this.formatTime(new Date(matchingLiveClass.scheduledStart));
      }

      if (matchingLiveClass?.scheduledEnd) {
        endHHMM = this.formatTime(new Date(matchingLiveClass.scheduledEnd));
      }

      const now = new Date();
      const todayKey = this.toLocalDateKey(now);
      const sessionDateKey = this.toLocalDateKey(s.attendanceDate);

      const [sH, sM] = startHHMM.split(':').map(Number);
      const [eH, eM] = endHHMM.split(':').map(Number);

      const realStart = new Date(s.attendanceDate);
      realStart.setHours(sH, sM, 0, 0);

      const realEnd = new Date(s.attendanceDate);
      realEnd.setHours(eH, eM, 0, 0);

      const isFinished = ['PUBLISHED', 'LOCKED'].includes(s.sessionStatus);
      let liveStatus: 'UPCOMING' | 'LIVE_NOW' | 'COMPLETED' = 'UPCOMING';

      if (sessionDateKey < todayKey) {
        liveStatus = 'COMPLETED';
      } else if (sessionDateKey > todayKey) {
        liveStatus = 'UPCOMING';
      } else {
        // Same day (Today)
        if (matchingLiveClass?.status === 'LIVE' || (now >= new Date(realStart.getTime() - 15 * 60 * 1000) && now <= realEnd)) {
          liveStatus = 'LIVE_NOW';
        } else if (isFinished || now > realEnd) {
          liveStatus = 'COMPLETED';
        } else {
          liveStatus = 'UPCOMING';
        }
      }

      return {
        id: matchingLiveClass ? matchingLiveClass.id : s.id,
        date: sessionDateKey,
        startsAt: startHHMM,
        endsAt: endHHMM,
        subject: subjectMap.get(s.subjectId) ?? null,
        batch: batchMap.get(s.batchId) ?? null,
        branch: branchMap.get(s.branchId) ?? null,
        sessionStatus:
          s.sessionStatus === 'CANCELLED'
            ? 'CANCELLED'
            : liveStatus === 'LIVE_NOW'
              ? 'STARTED'
              : s.sessionStatus === 'DRAFT' && s.scheduleId
                ? 'SCHEDULED'
                : s.sessionStatus,
        sessionSource: s.sessionSource,
        overrideType: s.overrideType,
        cancelledReason: s.cancelledReason,
        dayOfWeek: this.weekdayFromDateKey(sessionDateKey),
        liveStatus,
        deliveryMode: sched?.deliveryMode ?? null,
        meetingLink: sched?.meetingLink ?? null,
        canJoin: sessionDateKey === todayKey && s.sessionStatus !== 'CANCELLED' && liveStatus !== 'COMPLETED',
      };
    });
  }

  // ─── MY TIMETABLE ────────────────────────────────────────────────────────

  async getTimetable(
    tenantId: string,
    userId: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const profile = await this.resolveTutor(tenantId, userId);
    const staffProfileId = profile.userId;

    const fromDate = dateFrom
      ? new Date(dateFrom)
      : new Date(
          new Date().setDate(new Date().getDate() - new Date().getDay()),
        );
    if (dateFrom) fromDate.setHours(0, 0, 0, 0);

    const toDate = dateTo ? new Date(dateTo) : new Date(fromDate);
    toDate.setDate(fromDate.getDate() + 6);
    toDate.setHours(23, 59, 59, 999);

    const sessions = await this.prisma.attendanceSessions.findMany({
      where: {
        tenantId,
        staffProfileId,
        deletedAt: null,
        attendanceDate: { gte: fromDate, lte: toDate },
      },
      orderBy: [{ attendanceDate: 'asc' }, { startsAt: 'asc' }],
    });

    // Fetch related data
    const batchIds = [...new Set(sessions.map((s) => s.batchId))];
    const subjectIds = [...new Set(sessions.map((s) => s.subjectId))];
    const branchIds = [...new Set(sessions.map((s) => s.branchId))];

    const scheduleIds = sessions
      .map((s) => s.scheduleId)
      .filter((id): id is string => id !== null);
    const [batches, subjects, branches, schedules] = await Promise.all([
      this.prisma.batches.findMany({
        where: { tenantId, id: { in: batchIds } },
        select: { id: true, name: true, code: true, deliveryTypeId: true },
      }),
      this.prisma.subjects.findMany({
        where: { tenantId, id: { in: subjectIds } },
        select: { id: true, name: true, code: true },
      }),
      this.prisma.branches.findMany({
        where: { tenantId, id: { in: branchIds } },
        select: { id: true, name: true },
      }),
      this.prisma.schedules.findMany({
        where: { tenantId, id: { in: scheduleIds } },
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          roomId: true,
        },
      }),
    ]);

    const batchMap = new Map(batches.map((b) => [b.id, b]));
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));
    const branchMap = new Map(branches.map((b) => [b.id, b]));
    const scheduleMap = new Map(schedules.map((s) => [s.id, s]));

    // Get room info from schedules
    const roomIds: string[] = [
      ...new Set(
        schedules
          .map((s) => s.roomId)
          .filter((id): id is string => id !== null),
      ),
    ];
    const rooms =
      roomIds.length > 0
        ? await this.prisma.rooms.findMany({
            where: { tenantId, id: { in: roomIds } },
            select: { id: true, name: true, code: true },
          })
        : [];
    const roomMap = new Map(rooms.map((r) => [r.id, r]));

    // Get attendance records for these sessions to verify completion status
    const sessionIds = sessions.map((s) => s.id);
    const markedRecordsGroup =
      sessionIds.length > 0
        ? await this.prisma.attendanceRecords.groupBy({
            by: ['attendanceSessionId'],
            where: { tenantId, attendanceSessionId: { in: sessionIds } },
            _count: { id: true },
          })
        : [];
    const markedSessionsSet = new Set(
      markedRecordsGroup.map((g) => g.attendanceSessionId),
    );

    const timetableMap = new Map<string, Record<string, unknown>[]>();
    for (const session of sessions) {
      const dateKey = this.toLocalDateKey(session.attendanceDate);
      const sched = session.scheduleId
        ? (scheduleMap.get(session.scheduleId) ?? null)
        : null;
      if (!timetableMap.has(dateKey)) {
        timetableMap.set(dateKey, []);
      }
      const hasRecords = markedSessionsSet.has(session.id);
      const effectiveStatus =
        session.sessionStatus === 'DRAFT' && session.scheduleId
          ? 'SCHEDULED'
          : session.sessionStatus;

      timetableMap.get(dateKey)!.push({
        id: session.id,
        startsAt: this.formatTime(session.startsAt),
        endsAt: this.formatTime(session.endsAt),
        subject: subjectMap.get(session.subjectId) ?? null,
        batch: batchMap.get(session.batchId) ?? null,
        branch: branchMap.get(session.branchId) ?? null,
        room: sched?.roomId ? (roomMap.get(sched.roomId) ?? null) : null,
        sessionStatus: hasRecords && effectiveStatus === 'SCHEDULED' ? 'PUBLISHED' : effectiveStatus,
        hasAttendanceRecords: hasRecords,
        sessionSource: session.sessionSource,
        overrideType: session.overrideType,
        cancelledReason: session.cancelledReason,
        schedule: sched,
      });
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

  // ─── MY BATCHES ──────────────────────────────────────────────────────────

  async getBatches(tenantId: string, userId: string) {
    const profile = await this.resolveTutor(tenantId, userId);
    const staffProfileId = profile.userId;

    const assignments = await this.prisma.staffBatchAssignments.findMany({
      where: { tenantId, staffProfileId, isActive: true, deletedAt: null },
      select: {
        id: true,
        batchId: true,
        subjectId: true,
        effectiveFrom: true,
        effectiveTo: true,
      },
    });

    if (assignments.length === 0) return { batches: [] };

    const batchIds = [...new Set(assignments.map((a) => a.batchId))];
    const subjectIds = [...new Set(assignments.map((a) => a.subjectId))];

    const [batches, subjects, studentCounts] = await Promise.all([
      this.prisma.batches.findMany({
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
      }),
      this.prisma.subjects.findMany({
        where: { tenantId, id: { in: subjectIds } },
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

    const subjectMap = new Map(subjects.map((s) => [s.id, s]));
    const batchMap = new Map(batches.map((b) => [b.id, b]));
    const countMap = new Map(
      studentCounts.map((c) => [c.batchId, c._count.id]),
    );

    // Get branch/academicYear/course/deliveryType details
    const branchIds = [...new Set(batches.map((b) => b.branchId))];
    const academicYearIds = [...new Set(batches.map((b) => b.academicYearId))];
    const courseIds = [...new Set(batches.map((b) => b.courseId))];
    const deliveryTypeIds = [...new Set(batches.map((b) => b.deliveryTypeId))];

    const [branches, academicYears, courses, deliveryTypes] = await Promise.all(
      [
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
      ],
    );

    const branchMap2 = new Map(branches.map((b) => [b.id, b]));
    const ayMap = new Map(academicYears.map((a) => [a.id, a]));
    const courseMap = new Map(courses.map((c) => [c.id, c]));
    const dtMap = new Map(deliveryTypes.map((d) => [d.id, d]));

    return {
      batches: assignments.map((a) => {
        const batch = batchMap.get(a.batchId);
        return {
          assignmentId: a.id,
          batch: batch
            ? {
                ...batch,
                branch: branchMap2.get(batch.branchId) ?? null,
                academicYear: ayMap.get(batch.academicYearId) ?? null,
                course: courseMap.get(batch.courseId) ?? null,
                deliveryType: dtMap.get(batch.deliveryTypeId) ?? null,
                studentCount: countMap.get(a.batchId) ?? 0,
              }
            : null,
          subject: subjectMap.get(a.subjectId) ?? null,
        };
      }),
    };
  }

  // ─── MY COURSES ──────────────────────────────────────────────────────────

  async getCourses(tenantId: string, userId: string) {
    const profile = await this.resolveTutor(tenantId, userId);
    const staffProfileId = profile.userId;

    // Find all batches + subjects where this tutor is assigned
    const assignments = await this.prisma.staffBatchAssignments.findMany({
      where: { tenantId, staffProfileId, isActive: true, deletedAt: null },
      select: { batchId: true, subjectId: true },
    });

    // Build the set of subjectIds the tutor is registered with
    const staffSubjects = await this.prisma.staffSubjects.findMany({
      where: { tenantId, staffProfileId, isActive: true, deletedAt: null },
      select: { subjectId: true },
    });

    const tutorAssignedSubjectIds = new Set(
      [
        ...assignments.map((a) => a.subjectId),
        ...staffSubjects.map((s) => s.subjectId),
      ].filter((id): id is string => id !== null),
    );

    let courseIds: string[] = [];
    const batchesByCourse = new Map<
      string,
      { id: string; name: string; status: string }[]
    >();

    if (assignments.length > 0) {
      const assignedBatchIds = [...new Set(assignments.map((a) => a.batchId))];

      // Get unique courses from batch assignments
      const batches = await this.prisma.batches.findMany({
        where: { tenantId, id: { in: assignedBatchIds } },
        select: { id: true, name: true, courseId: true, status: true },
      });

      courseIds = [...new Set(batches.map((b) => b.courseId))];

      for (const b of batches) {
        if (!batchesByCourse.has(b.courseId)) {
          batchesByCourse.set(b.courseId, []);
        }
        batchesByCourse
          .get(b.courseId)!
          .push({ id: b.id, name: b.name, status: b.status });
      }
    }

    // Fallback: if no batch assignments, derive courses from staffSubjects via courseSubjects
    if (courseIds.length === 0 && tutorAssignedSubjectIds.size > 0) {
      const courseSubjectLinks = await this.prisma.courseSubjects.findMany({
        where: {
          tenantId,
          subjectId: { in: [...tutorAssignedSubjectIds] },
          deletedAt: null,
        },
        select: { courseId: true },
      });
      courseIds = [...new Set(courseSubjectLinks.map((cs) => cs.courseId))];
    }

    if (courseIds.length === 0) return { courses: [] };

    // Fetch courses
    const courses = await this.prisma.courses.findMany({
      where: { tenantId, id: { in: courseIds }, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
    });

    if (courses.length === 0) return { courses: [] };

    // Fetch course-subjects for all courses filtered by tutor's assigned subjects
    // Include BOTH active and inactive so we can show deactivated state in UI
    const courseSubjects = await this.prisma.courseSubjects.findMany({
      where: {
        tenantId,
        courseId: { in: courseIds },
        ...(tutorAssignedSubjectIds.size > 0
          ? { subjectId: { in: [...tutorAssignedSubjectIds] } }
          : {}),
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

    // Fetch subjects (no isActive filter - courseSubjects already ensures only active subjects)
    const subjects = await this.prisma.subjects.findMany({
      where: { tenantId, id: { in: subjectIds }, deletedAt: null },
    });
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    // Fetch chapters
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

    // Fetch topics
    const topics = await this.prisma.topics.findMany({
      where: {
        tenantId,
        chapterId: { in: chapterIds },
        isActive: true,
        deletedAt: null,
      },
      orderBy: { displayOrder: 'asc' },
    });

    // Topic item counts
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

    // Build nested structure
    const topicsByChapter = new Map<string, typeof topics>();
    for (const t of topics) {
      if (!topicsByChapter.has(t.chapterId)) {
        topicsByChapter.set(t.chapterId, []);
      }
      topicsByChapter.get(t.chapterId)!.push(t);
    }

    const chaptersByCs = new Map<string, typeof chapters>();
    for (const ch of chapters) {
      if (!chaptersByCs.has(ch.courseSubjectId)) {
        chaptersByCs.set(ch.courseSubjectId, []);
      }
      chaptersByCs.get(ch.courseSubjectId)!.push(ch);
    }

    const courseSubjectsByCourse = new Map<string, typeof courseSubjects>();
    for (const cs of courseSubjects) {
      if (!courseSubjectsByCourse.has(cs.courseId)) {
        courseSubjectsByCourse.set(cs.courseId, []);
      }
      courseSubjectsByCourse.get(cs.courseId)!.push(cs);
    }

    return {
      courses: courses.map((c) => {
        const csList = courseSubjectsByCourse.get(c.id) ?? [];
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
              // Only include chapters/topics for active course-subject links
              const chList = cs.isActive ? (chaptersByCs.get(cs.id) ?? []) : [];
              const sub = subjectMap.get(cs.subjectId)!;
              return {
                id: cs.id,
                displayOrder: cs.displayOrder,
                isMandatory: cs.isMandatory,
                isActive: cs.isActive, // courseSubjects.isActive drives disabled state
                subject: {
                  id: sub.id,
                  code: sub.code,
                  name: sub.name,
                  shortName: sub.shortName,
                  displayName: sub.displayName,
                  subjectType: sub.subjectType,
                  displayOrder: sub.displayOrder,
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
                    estimatedSessions: ch.estimatedSessions,
                    displayOrder: ch.displayOrder,
                    topics: topicList.map((t) => ({
                      id: t.id,
                      code: t.code,
                      name: t.name,
                      shortName: t.shortName,
                      description: t.description,
                      learningObjectives: t.learningObjectives,
                      difficultyLevel: t.difficultyLevel,
                      plannedHours: t.plannedHours,
                      plannedSessions: t.plannedSessions,
                      displayOrder: t.displayOrder,
                      topicItemCount: countMap.get(t.id) ?? 0,
                    })),
                  };
                }),
              };
            }),
        };
      }),
    };
  }

  // ─── BATCH STUDENTS ──────────────────────────────────────────────────────

  async getBatchStudents(tenantId: string, userId: string, batchId: string) {
    const profile = await this.resolveTutor(tenantId, userId);
    const staffProfileId = profile.userId;

    const assignment = await this.prisma.staffBatchAssignments.findFirst({
      where: {
        tenantId,
        staffProfileId,
        batchId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!assignment) {
      throw new ForbiddenException('You are not assigned to this batch');
    }

    const batch = await this.prisma.batches.findFirst({
      where: { tenantId, id: batchId },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    // Fetch related batch details
    const [course, branch, academicYear, deliveryType] = await Promise.all([
      this.prisma.courses.findFirst({
        where: { tenantId, id: batch.courseId },
        select: { id: true, name: true, code: true },
      }),
      this.prisma.branches.findFirst({
        where: { tenantId, id: batch.branchId },
        select: { id: true, name: true },
      }),
      this.prisma.academicYears.findFirst({
        where: { tenantId, id: batch.academicYearId },
        select: { id: true, name: true },
      }),
      this.prisma.batchDeliveryTypes.findFirst({
        where: { tenantId, id: batch.deliveryTypeId },
        select: { id: true, name: true, code: true },
      }),
    ]);

    // Get enrolled students
    const enrollments = await this.prisma.studentBatchEnrollments.findMany({
      where: { tenantId, batchId, status: 'ACTIVE', deletedAt: null },
      orderBy: { joinedAt: 'asc' },
    });

    // Get student details
    const admissionIds = enrollments.map((e) => e.studentAdmissionId);
    const admissions = await this.prisma.studentAdmissions.findMany({
      where: { tenantId, id: { in: admissionIds } },
      select: {
        id: true,
        admissionNumber: true,
        admissionStatus: true,
        studentProfileId: true,
      },
    });
    const admissionMap = new Map(admissions.map((a) => [a.id, a]));

    const studentProfileIds = admissions.map((a) => a.studentProfileId);
    const studentProfiles = await this.prisma.studentProfiles.findMany({
      where: { tenantId, userId: { in: studentProfileIds } },
      select: { userId: true },
    });

    const userIds = studentProfiles.map((sp) => sp.userId);
    const users = await this.prisma.users.findMany({
      where: { tenantId, id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const profileUserMap = new Map(
      studentProfiles.map((sp) => [sp.userId, sp.userId]),
    );

    return {
      batch: {
        id: batch.id,
        name: batch.name,
        code: batch.code,
        description: batch.description,
        status: batch.status,
        maxStudents: batch.maxStudents,
        course,
        branch,
        academicYear,
        deliveryType,
        totalStudents: enrollments.length,
      },
      students: enrollments.map((e) => {
        const admission = admissionMap.get(e.studentAdmissionId);
        const studentUserId = admission
          ? profileUserMap.get(admission.studentProfileId)
          : null;
        const user = studentUserId ? userMap.get(studentUserId) : null;
        return {
          enrollmentId: e.id,
          joinedAt: e.joinedAt,
          isPrimary: e.isPrimary,
          student: user ?? null,
          admission: admission
            ? {
                id: admission.id,
                admissionNumber: admission.admissionNumber,
                admissionStatus: admission.admissionStatus,
              }
            : null,
        };
      }),
    };
  }

  // ─── BULK ATTENDANCE MARKING ────────────────────────────────────────────

  async markAttendance(
    tenantId: string,
    userId: string,
    sessionId: string,
    dto: BulkAttendanceRequestDto,
  ): Promise<BulkAttendanceResponseDto> {
    const profile = await this.resolveTutor(tenantId, userId);
    const staffProfileId = profile.userId;

    // Verify session exists, belongs to this tutor, and is markable
    const session = await this.prisma.attendanceSessions.findFirst({
      where: { tenantId, id: sessionId, staffProfileId, deletedAt: null },
    });

    if (!session) {
      throw new NotFoundException('Session not found or not assigned to you');
    }

    if (session.sessionStatus === AttendanceSessionStatusEnum.CANCELLED) {
      throw new BadRequestException(
        'Cannot mark attendance for a cancelled session',
      );
    }

    if (dto.records.length === 0) {
      throw new BadRequestException(
        'At least one attendance record is required',
      );
    }

    // Validate that all submitted studentAdmissionIds belong to this batch
    const admissionIds = [
      ...new Set(dto.records.map((r) => r.studentAdmissionId)),
    ];
    const enrollments = await this.prisma.studentBatchEnrollments.findMany({
      where: {
        tenantId,
        batchId: session.batchId,
        studentAdmissionId: { in: admissionIds },
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: { studentAdmissionId: true },
    });
    const validAdmissionIds = new Set(
      enrollments.map((e) => e.studentAdmissionId),
    );

    const invalidIds = admissionIds.filter((id) => !validAdmissionIds.has(id));
    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Invalid student admission IDs: ${invalidIds.join(', ')}. These students are not enrolled in this batch.`,
      );
    }

    // Validate attendance status enum values (matching Prisma AttendanceStatusEnum)
    const validStatuses = new Set([
      'PRESENT',
      'ABSENT',
      'LATE',
      'HALF_DAY',
      'EXCUSED',
    ]);
    for (const record of dto.records) {
      if (!validStatuses.has(record.attendanceStatus)) {
        throw new BadRequestException(
          `Invalid attendance status: ${record.attendanceStatus}. Valid values: PRESENT, ABSENT, LATE, HALF_DAY, EXCUSED`,
        );
      }
      if (
        record.lateMinutes !== undefined &&
        (typeof record.lateMinutes !== 'number' || record.lateMinutes < 0)
      ) {
        throw new BadRequestException(
          'lateMinutes must be a non-negative number',
        );
      }
    }

    // Upsert attendance records in a transaction
    const errors: string[] = [];
    let successCount = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const record of dto.records) {
        try {
          // Find existing record by session + student (no compound unique, so use findFirst)
          const existing = await tx.attendanceRecords.findFirst({
            where: {
              tenantId,
              attendanceSessionId: sessionId,
              studentAdmissionId: record.studentAdmissionId,
              deletedAt: null,
            },
          });

          const data = {
            attendanceStatus: record.attendanceStatus as AttendanceStatusEnum,
            lateMinutes: record.lateMinutes ?? 0,
            remarks: record.remarks ?? '',
            markedBy: userId,
            markedAt: new Date(),
          };

          if (existing) {
            await tx.attendanceRecords.update({
              where: { id: existing.id },
              data,
            });
          } else {
            await tx.attendanceRecords.create({
              data: {
                tenantId,
                attendanceSessionId: sessionId,
                studentAdmissionId: record.studentAdmissionId,
                ...data,
                createdAt: new Date(),
                createdBy: userId,
                updatedAt: new Date(),
                updatedBy: userId,
              },
            });
          }
          successCount++;
        } catch (err) {
          const msg = `Failed to mark ${record.studentAdmissionId}: ${err instanceof Error ? err.message : 'Unknown error'}`;
          errors.push(msg);
        }
      }

      // Automatically transition sessionStatus to PUBLISHED when attendance is marked
      if (successCount > 0) {
        await tx.attendanceSessions.update({
          where: { id: sessionId },
          data: {
            sessionStatus: 'PUBLISHED',
            updatedAt: new Date(),
            updatedBy: userId,
          },
        });
      }
    });

    return {
      totalProcessed: dto.records.length,
      successCount,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // ─── SESSION DETAILS ─────────────────────────────────────────────────────

  async getSessionDetails(tenantId: string, userId: string, sessionId: string) {
    const profile = await this.resolveTutor(tenantId, userId);
    const staffProfileId = profile.userId;

    const session = await this.prisma.attendanceSessions.findFirst({
      where: { tenantId, id: sessionId, staffProfileId, deletedAt: null },
    });

    if (!session) {
      throw new NotFoundException('Session not found or not assigned to you');
    }

    // Fetch related data
    const [batch, subject, branch, schedule] = await Promise.all([
      this.prisma.batches.findFirst({
        where: { tenantId, id: session.batchId },
        select: { id: true, name: true, code: true },
      }),
      this.prisma.subjects.findFirst({
        where: { tenantId, id: session.subjectId },
        select: { id: true, name: true, code: true },
      }),
      this.prisma.branches.findFirst({
        where: { tenantId, id: session.branchId },
        select: { id: true, name: true },
      }),
      session.scheduleId
        ? this.prisma.schedules.findFirst({
            where: { tenantId, id: session.scheduleId },
            select: {
              id: true,
              dayOfWeek: true,
              startTime: true,
              endTime: true,
              roomId: true,
            },
          })
        : null,
    ]);

    // Get room info from schedule (AttendanceSessions doesn't have roomId directly)
    let room: {
      id: string;
      name: string;
      code: string;
      capacity: number;
    } | null = null;
    if (schedule?.roomId) {
      room = await this.prisma.rooms.findFirst({
        where: { tenantId, id: schedule.roomId },
        select: { id: true, name: true, code: true, capacity: true },
      });
    }

    // Get attendance records
    const attendanceRecords = await this.prisma.attendanceRecords.findMany({
      where: { tenantId, attendanceSessionId: sessionId },
      orderBy: { markedAt: 'asc' },
    });

    // Get student details for attendance records
    const admissionIds = attendanceRecords.map((r) => r.studentAdmissionId);
    const admissions = await this.prisma.studentAdmissions.findMany({
      where: { tenantId, id: { in: admissionIds } },
      select: {
        id: true,
        admissionNumber: true,
        admissionStatus: true,
        studentProfileId: true,
      },
    });
    const admissionMap = new Map(admissions.map((a) => [a.id, a]));

    const studentProfileIds = admissions.map((a) => a.studentProfileId);
    const studentProfiles = await this.prisma.studentProfiles.findMany({
      where: { userId: { in: studentProfileIds } },
      select: { userId: true },
    });
    const userIds = studentProfiles.map((sp) => sp.userId);
    const users = await this.prisma.users.findMany({
      where: { tenantId, id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    const profileUserMap = new Map(
      studentProfiles.map((sp) => [sp.userId, sp.userId]),
    );

    // Get total enrolled students for this batch
    const totalStudents = await this.prisma.studentBatchEnrollments.count({
      where: {
        tenantId,
        batchId: session.batchId,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    // Enrolled students list for the marking panel
    const enrollments = await this.prisma.studentBatchEnrollments.findMany({
      where: {
        tenantId,
        batchId: session.batchId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        studentAdmissionId: true,
      },
    });
    const enrolledAdmissionIds = enrollments.map((e) => e.studentAdmissionId);
    const enrolledAdmissions = await this.prisma.studentAdmissions.findMany({
      where: { tenantId, id: { in: enrolledAdmissionIds } },
      select: {
        id: true,
        admissionNumber: true,
        studentProfileId: true,
      },
    });
    const enrolledProfileIds = enrolledAdmissions.map(
      (a) => a.studentProfileId,
    );
    const enrolledProfiles = await this.prisma.studentProfiles.findMany({
      where: { userId: { in: enrolledProfileIds } },
      select: { userId: true },
    });
    const enrolledUserIds = enrolledProfiles.map((sp) => sp.userId);
    const enrolledUsers = await this.prisma.users.findMany({
      where: { tenantId, id: { in: enrolledUserIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const enrolledUserMap = new Map(enrolledUsers.map((u) => [u.id, u]));
    const enrolledProfileToUserMap = new Map(
      enrolledProfiles.map((sp) => [sp.userId, sp.userId]),
    );

    // Attendance stats
    const presentCount = attendanceRecords.filter(
      (r) => r.attendanceStatus === 'PRESENT',
    ).length;
    const absentCount = attendanceRecords.filter(
      (r) => r.attendanceStatus === 'ABSENT',
    ).length;
    const lateCount = attendanceRecords.filter(
      (r) => r.attendanceStatus === 'LATE',
    ).length;

    return {
      session: {
        id: session.id,
        attendanceDate: session.attendanceDate,
        startsAt: this.formatTime(session.startsAt),
        endsAt: this.formatTime(session.endsAt),
        sessionStatus:
          session.sessionStatus === 'DRAFT' && session.scheduleId
            ? 'SCHEDULED'
            : session.sessionStatus,
        sessionSource: session.sessionSource,
        overrideType: session.overrideType,
        cancelledReason: session.cancelledReason,
        remarks: session.remarks,
        subject,
        batch,
        branch,
        room,
        schedule,
      },
      attendance: {
        totalStudents,
        markedCount: attendanceRecords.length,
        presentCount,
        absentCount,
        lateCount,
        unmarkedCount: totalStudents - attendanceRecords.length,
        records: attendanceRecords.map((r) => {
          const admission = admissionMap.get(r.studentAdmissionId);
          const studentUserId = admission
            ? profileUserMap.get(admission.studentProfileId)
            : null;
          const student = studentUserId ? userMap.get(studentUserId) : null;
          return {
            id: r.id,
            attendanceStatus: r.attendanceStatus,
            lateMinutes: r.lateMinutes,
            remarks: r.remarks,
            markedAt: r.markedAt,
            student,
            admission: admission
              ? { id: admission.id, admissionNumber: admission.admissionNumber }
              : null,
          };
        }),
        enrolledStudents: enrolledAdmissions.map((a) => {
          const studentUserId = enrolledProfileToUserMap.get(
            a.studentProfileId,
          );
          const user = studentUserId
            ? enrolledUserMap.get(studentUserId)
            : null;
          return {
            admissionId: a.id,
            admissionNumber: a.admissionNumber,
            studentId: studentUserId ?? '',
            firstName: user?.firstName ?? '',
            lastName: user?.lastName ?? '',
            email: user?.email ?? '',
          };
        }),
      },
    };
  }
}
