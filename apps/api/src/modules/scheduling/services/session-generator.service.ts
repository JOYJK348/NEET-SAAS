/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ScheduleStatusEnum, WeekdayType } from '@prisma/client';

// Map WeekdayType enum → JS Date.getDay() (0=Sun, 1=Mon, ..., 6=Sat)
const WEEKDAY_TO_JS_DAY: Record<WeekdayType, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

/**
 * Parses an "HH:mm" string and applies it to a base date,
 * returning a new Date set to that time (UTC midnight of the date + offset).
 */
function parseTimeOnDate(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Returns all Date objects between start and end (inclusive) matching the given JS weekday.
 */
function getWeekdayDatesInRange(
  start: Date,
  end: Date,
  targetJsDay: number,
): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    if (cursor.getDay() === targetJsDay) {
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

// System user ID used for auto-generated sessions
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

@Injectable()
export class SessionGeneratorService {
  private readonly logger = new Logger(SessionGeneratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates AttendanceSessions for a single schedule within the next `windowDays` days.
   * Called after Schedule creation and by the daily cron job.
   *
   * Key rules:
   *  - Never generates beyond schedule.effectiveUntil
   *  - Never generates in the past (before today)
   *  - Skips dates where a session already exists for this schedule (idempotent)
   */
  async generateForSchedule(
    scheduleId: string,
    windowDays = 30,
    userId?: string,
  ): Promise<number> {
    const schedule = await this.prisma.schedules.findUnique({
      where: { id: scheduleId },
    });

    if (
      !schedule ||
      schedule.status !== ScheduleStatusEnum.ACTIVE ||
      schedule.deletedAt
    ) {
      return 0;
    }

    const activeUserId = userId || schedule.createdBy;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const windowEnd = new Date(today);
    windowEnd.setDate(today.getDate() + windowDays);

    // Respect the schedule's own date range
    const generationStart =
      today < schedule.effectiveFrom ? schedule.effectiveFrom : today;
    const generationEnd =
      windowEnd < schedule.effectiveUntil ? windowEnd : schedule.effectiveUntil;

    if (generationStart > generationEnd) {
      // Schedule hasn't started yet within window, or already ended
      return 0;
    }

    const targetJsDay = WEEKDAY_TO_JS_DAY[schedule.dayOfWeek];
    const dates = getWeekdayDatesInRange(
      generationStart,
      generationEnd,
      targetJsDay,
    );

    let created = 0;
    for (const date of dates) {
      // Idempotency check: skip if session already exists for this schedule on this date
      const exists = await this.prisma.attendanceSessions.findFirst({
        where: {
          tenantId: schedule.tenantId,
          scheduleId: schedule.id,
          attendanceDate: date,
        },
      });

      if (exists) continue;

      const startsAt = parseTimeOnDate(date, schedule.startTime);
      const endsAt = parseTimeOnDate(date, schedule.endTime);

      await this.prisma.attendanceSessions.create({
        data: {
          tenantId: schedule.tenantId,
          branchId: schedule.branchId,
          academicYearId: schedule.academicYearId,
          batchId: schedule.batchId,
          subjectId: schedule.subjectId,
          staffProfileId: schedule.staffProfileId,
          scheduleId: schedule.id, // ← link back to schedule
          attendanceDate: date,
          startsAt,
          endsAt,
          sessionStatus: 'DRAFT',
          // Required non-nullable fields — use valid creator user ID
          publishedBy: activeUserId,
          publishedAt: date,
          lockedBy: activeUserId,
          lockedAt: date,
          remarks: '',
          createdBy: activeUserId,
          updatedBy: activeUserId,
        },
      });
      created++;
    }

    this.logger.log(
      `Generated ${created} sessions for schedule ${scheduleId} (window: ${windowDays} days)`,
    );
    return created;
  }

  /**
   * Generates sessions for ALL active schedules within the rolling window.
   * Designed to be called by a nightly cron job.
   */
  async generateForAllActiveSchedules(windowDays = 30): Promise<void> {
    const activeSchedules = await this.prisma.schedules.findMany({
      where: {
        status: ScheduleStatusEnum.ACTIVE,
        deletedAt: null,
        effectiveUntil: { gte: new Date() },
      },
      select: { id: true },
    });

    this.logger.log(
      `Running session generation for ${activeSchedules.length} active schedules`,
    );

    for (const { id } of activeSchedules) {
      await this.generateForSchedule(id, windowDays).catch((err) => {
        this.logger.error(
          `Failed to generate sessions for schedule ${id}: ${err.message}`,
        );
      });
    }
  }
}
