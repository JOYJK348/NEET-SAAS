/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { UpdateScheduleDto } from '../dto/update-schedule.dto';
import { QueryScheduleDto } from '../dto/query-schedule.dto';
import { CheckConflictsDto } from '../dto/check-conflicts.dto';
import {
  WeekdayType,
  AttendanceModeType,
  ScheduleStatusEnum,
} from '@prisma/client';

// ─── Conflict result types ────────────────────────────────────────────────────

export type ConflictType = 'BATCH' | 'TUTOR' | 'ROOM' | 'STUDENT';

export interface ConflictItem {
  type: ConflictType;
  message: string;
  isSoftConflict?: boolean;
  studentNames?: string[];
  existingSchedule: {
    id: string;
    dayOfWeek: WeekdayType;
    startTime: string;
    endTime: string;
    batchId: string;
    subjectId: string;
    staffProfileId: string;
    roomId: string | null;
    deliveryMode: AttendanceModeType;
    batchName?: string;
  };
}

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: ConflictItem[];
}

// ─── Select helper (for joins in list/detail queries) ─────────────────────────

const SCHEDULE_SELECT = {
  id: true,
  tenantId: true,
  branchId: true,
  academicYearId: true,
  batchId: true,
  subjectId: true,
  staffProfileId: true,
  dayOfWeek: true,
  startTime: true,
  endTime: true,
  effectiveFrom: true,
  effectiveUntil: true,
  deliveryMode: true,
  roomId: true,
  meetingProvider: true,
  meetingLink: true,
  meetingCode: true,
  meetingPassword: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  version: true,
  room: {
    select: {
      id: true,
      name: true,
      code: true,
      capacity: true,
      roomType: true,
    },
  },
} as const;

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── CONFLICT DETECTION ENGINE ─────────────────────────────────────────────

  /**
   * The core conflict engine.
   *
   * Rules:
   *  1. TUTOR: same staffProfileId + same day + overlapping time
   *  2. BATCH: same batchId + same day + overlapping time
   *  3. ROOM:  same roomId + same day + overlapping time (only for CLASSROOM/HYBRID)
   *
   * Time overlap formula: existing.startTime < new.endTime AND existing.endTime > new.startTime
   *
   * @param input  The new/updated schedule data to check
   * @param excludeScheduleId  On update: exclude self from conflict check
   */
  async detectConflicts(
    tenantId: string,
    input: CheckConflictsDto,
    excludeScheduleId?: string,
  ): Promise<ConflictResult> {
    const conflicts: ConflictItem[] = [];

    // Base WHERE clause — same day, ACTIVE status, date ranges overlap, time overlaps
    const baseWhere = {
      tenantId,
      dayOfWeek: input.dayOfWeek,
      status: ScheduleStatusEnum.ACTIVE,
      deletedAt: null,
      // Date period overlap: existing schedule must still be active during the new range
      effectiveUntil: { gte: new Date(input.effectiveFrom) },
      effectiveFrom: { lte: new Date(input.effectiveUntil) },
      // Exclude self on update
      ...(excludeScheduleId ? { id: { not: excludeScheduleId } } : {}),
      // Time overlap: existing starts before new ends AND existing ends after new starts
      AND: [
        { startTime: { lt: input.endTime } },
        { endTime: { gt: input.startTime } },
      ],
    };

    // ── 1. TUTOR CONFLICT ────────────────────────────────────────────────────
    const tutorHit = await this.prisma.schedules.findFirst({
      where: { ...baseWhere, staffProfileId: input.staffProfileId },
      select: {
        ...SCHEDULE_SELECT,
        room: {
          select: {
            id: true,
            name: true,
            code: true,
            capacity: true,
            roomType: true,
          },
        },
      },
    });

    if (tutorHit) {
      conflicts.push({
        type: 'TUTOR',
        message: `This tutor is already assigned to another batch on ${tutorHit.dayOfWeek} from ${tutorHit.startTime} to ${tutorHit.endTime}. A tutor cannot teach two batches simultaneously.`,
        existingSchedule: {
          id: tutorHit.id,
          dayOfWeek: tutorHit.dayOfWeek,
          startTime: tutorHit.startTime,
          endTime: tutorHit.endTime,
          batchId: tutorHit.batchId,
          subjectId: tutorHit.subjectId,
          staffProfileId: tutorHit.staffProfileId,
          roomId: tutorHit.roomId,
          deliveryMode: tutorHit.deliveryMode,
        },
      });
    }

    // ── 2. BATCH CONFLICT ────────────────────────────────────────────────────
    const batchHit = await this.prisma.schedules.findFirst({
      where: { ...baseWhere, batchId: input.batchId },
      select: SCHEDULE_SELECT,
    });

    if (batchHit) {
      conflicts.push({
        type: 'BATCH',
        message: `This batch already has a class scheduled on ${batchHit.dayOfWeek} from ${batchHit.startTime} to ${batchHit.endTime}. Students cannot attend two classes simultaneously.`,
        existingSchedule: {
          id: batchHit.id,
          dayOfWeek: batchHit.dayOfWeek,
          startTime: batchHit.startTime,
          endTime: batchHit.endTime,
          batchId: batchHit.batchId,
          subjectId: batchHit.subjectId,
          staffProfileId: batchHit.staffProfileId,
          roomId: batchHit.roomId,
          deliveryMode: batchHit.deliveryMode,
        },
      });
    }

    // ── 3. ROOM CONFLICT (only for CLASSROOM / HYBRID) ───────────────────────
    if (input.roomId && input.deliveryMode !== AttendanceModeType.ONLINE) {
      const roomHit = await this.prisma.schedules.findFirst({
        where: { ...baseWhere, roomId: input.roomId },
        select: SCHEDULE_SELECT,
      });

      if (roomHit) {
        conflicts.push({
          type: 'ROOM',
          message: `This room is already booked on ${roomHit.dayOfWeek} from ${roomHit.startTime} to ${roomHit.endTime}. The same physical room cannot host two classes simultaneously.`,
          existingSchedule: {
            id: roomHit.id,
            dayOfWeek: roomHit.dayOfWeek,
            startTime: roomHit.startTime,
            endTime: roomHit.endTime,
            batchId: roomHit.batchId,
            subjectId: roomHit.subjectId,
            staffProfileId: roomHit.staffProfileId,
            roomId: roomHit.roomId,
            deliveryMode: roomHit.deliveryMode,
          },
        });
      }
    }

    // ── 4. STUDENT CONFLICT (Intersection query first) ───────────────────────
    // Query active schedules that overlap in date range, weekday, and time slot (excluding current batch)
    const overlappingSchedules = await this.prisma.schedules.findMany({
      where: {
        tenantId,
        dayOfWeek: input.dayOfWeek,
        status: ScheduleStatusEnum.ACTIVE,
        deletedAt: null,
        effectiveUntil: { gte: new Date(input.effectiveFrom) },
        effectiveFrom: { lte: new Date(input.effectiveUntil) },
        batchId: { not: input.batchId },
        ...(excludeScheduleId ? { id: { not: excludeScheduleId } } : {}),
        AND: [
          { startTime: { lt: input.endTime } },
          { endTime: { gt: input.startTime } },
        ],
      },
      select: {
        id: true,
        batchId: true,
        startTime: true,
        endTime: true,
        dayOfWeek: true,
        subjectId: true,
        staffProfileId: true,
        roomId: true,
        deliveryMode: true,
      },
    });

    if (overlappingSchedules.length > 0) {
      const overlappingBatchIds = Array.from(
        new Set(overlappingSchedules.map((s) => s.batchId)),
      );

      // Get students active in target batch
      const targetBatchEnrollments =
        await this.prisma.studentBatchEnrollments.findMany({
          where: {
            tenantId,
            batchId: input.batchId,
            status: 'ACTIVE',
            deletedAt: null,
          },
          select: { studentAdmissionId: true },
        });
      const targetStudentIds = targetBatchEnrollments.map(
        (e) => e.studentAdmissionId,
      );

      if (targetStudentIds.length > 0) {
        // Find which students are also in any of the overlapping batches
        const intersectingEnrollments =
          await this.prisma.studentBatchEnrollments.findMany({
            where: {
              tenantId,
              studentAdmissionId: { in: targetStudentIds },
              batchId: { in: overlappingBatchIds },
              status: 'ACTIVE',
              deletedAt: null,
            },
            select: {
              studentAdmissionId: true,
              batchId: true,
            },
          });

        if (intersectingEnrollments.length > 0) {
          const intersectingStudentIds = Array.from(
            new Set(intersectingEnrollments.map((e) => e.studentAdmissionId)),
          );

          // Get names of intersecting students
          const studentsData = await this.prisma.studentAdmissions.findMany({
            where: {
              tenantId,
              id: { in: intersectingStudentIds },
            },
            select: {
              id: true,
              studentProfileIstudent_profile: {
                select: {
                  userIdusers: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          });

          const studentNameMap = new Map<string, string>();
          studentsData.forEach((s) => {
            const user = s.studentProfileIstudent_profile?.userIdusers;
            if (user) {
              studentNameMap.set(
                s.id,
                `${user.firstName} ${user.lastName}`.trim(),
              );
            }
          });

          // Fetch batch names for context
          const conflictingBatches = await this.prisma.batches.findMany({
            where: {
              tenantId,
              id: { in: overlappingBatchIds },
            },
            select: { id: true, name: true },
          });
          const batchNameMap = new Map(
            conflictingBatches.map((b) => [b.id, b.name]),
          );

          // Group conflicting students by schedule
          const scheduleToStudents = new Map<string, string[]>();
          intersectingEnrollments.forEach((e) => {
            const matchingSchedules = overlappingSchedules.filter(
              (s) => s.batchId === e.batchId,
            );
            const studentName =
              studentNameMap.get(e.studentAdmissionId) || 'Unknown Student';

            matchingSchedules.forEach((sched) => {
              const list = scheduleToStudents.get(sched.id) || [];
              list.push(studentName);
              scheduleToStudents.set(sched.id, list);
            });
          });

          scheduleToStudents.forEach((studentNames, scheduleId) => {
            const sched = overlappingSchedules.find(
              (s) => s.id === scheduleId,
            )!;
            const batchName =
              batchNameMap.get(sched.batchId) || 'Unknown Batch';

            conflicts.push({
              type: 'STUDENT',
              isSoftConflict: true,
              studentNames,
              message: `${studentNames.length} student(s) enrolled in this batch are already scheduled in "${batchName}" on ${sched.dayOfWeek} from ${sched.startTime} to ${sched.endTime}.`,
              existingSchedule: {
                id: sched.id,
                dayOfWeek: sched.dayOfWeek,
                startTime: sched.startTime,
                endTime: sched.endTime,
                batchId: sched.batchId,
                subjectId: sched.subjectId,
                staffProfileId: sched.staffProfileId,
                roomId: sched.roomId,
                deliveryMode: sched.deliveryMode,
                batchName,
              },
            });
          });
        }
      }
    }

    // Sort conflicts by priority: BATCH first, then TUTOR, ROOM, and STUDENT
    const priorityMap: Record<ConflictType, number> = {
      BATCH: 1,
      TUTOR: 2,
      ROOM: 3,
      STUDENT: 4,
    };
    conflicts.sort((a, b) => priorityMap[a.type] - priorityMap[b.type]);

    return { hasConflict: conflicts.length > 0, conflicts };
  }

  // ─── CHECK CONFLICTS (no save) ─────────────────────────────────────────────

  async checkConflicts(
    tenantId: string,
    dto: CheckConflictsDto,
  ): Promise<ConflictResult> {
    this.validateTimeRange(dto.startTime, dto.endTime);
    return this.detectConflicts(tenantId, dto, dto.excludeScheduleId);
  }

  // ─── CREATE ────────────────────────────────────────────────────────────────

  async create(tenantId: string, userId: string, dto: CreateScheduleDto) {
    // Validate time range
    this.validateTimeRange(dto.startTime, dto.endTime);

    // Validate delivery mode constraints
    this.validateDeliveryMode(dto);

    // Run conflict detection — BLOCK if conflict found
    const conflictResult = await this.detectConflicts(tenantId, dto);
    if (conflictResult.hasConflict) {
      const hasHardConflict = conflictResult.conflicts.some(
        (c) => c.type !== 'STUDENT',
      );
      const hasStudentConflict = conflictResult.conflicts.some(
        (c) => c.type === 'STUDENT',
      );

      if (
        hasHardConflict ||
        (hasStudentConflict && !dto.bypassStudentConflict)
      ) {
        throw new ConflictException(conflictResult);
      }
    }

    const schedule = await this.prisma.schedules.create({
      data: {
        tenantId,
        branchId: dto.branchId,
        academicYearId: dto.academicYearId,
        batchId: dto.batchId,
        subjectId: dto.subjectId,
        staffProfileId: dto.staffProfileId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveUntil: new Date(dto.effectiveUntil),
        deliveryMode: dto.deliveryMode,
        roomId: dto.roomId ?? null,
        meetingProvider: dto.meetingProvider ?? null,
        meetingLink: dto.meetingLink ?? null,
        meetingCode: dto.meetingCode ?? null,
        meetingPassword: dto.meetingPassword ?? null,
        notes: dto.notes ?? null,
        status: ScheduleStatusEnum.ACTIVE,
        createdBy: userId,
        updatedBy: userId,
      },
      select: SCHEDULE_SELECT,
    });

    return schedule;
  }

  // ─── LIST ──────────────────────────────────────────────────────────────────

  async findAll(tenantId: string, query: QueryScheduleDto) {
    const {
      branchId,
      academicYearId,
      batchId,
      subjectId,
      staffProfileId,
      dayOfWeek,
      deliveryMode,
      status,
      onDate,
    } = query;

    return this.prisma.schedules.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(branchId && { branchId }),
        ...(academicYearId && { academicYearId }),
        ...(batchId && { batchId }),
        ...(subjectId && { subjectId }),
        ...(staffProfileId && { staffProfileId }),
        ...(dayOfWeek && { dayOfWeek }),
        ...(deliveryMode && { deliveryMode }),
        ...(status ? { status } : { status: ScheduleStatusEnum.ACTIVE }),
        ...(onDate && {
          effectiveFrom: { lte: new Date(onDate) },
          effectiveUntil: { gte: new Date(onDate) },
        }),
      },
      select: SCHEDULE_SELECT,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  // ─── WEEKLY VIEW ───────────────────────────────────────────────────────────

  /**
   * Returns schedules grouped by day of week — used by the frontend weekly calendar grid.
   * Filters to schedules active in the given week (defaults to current week).
   */
  async getWeeklyView(tenantId: string, query: QueryScheduleDto) {
    const schedules = await this.findAll(tenantId, query);

    // Group by dayOfWeek
    const weeklyView: Record<WeekdayType, typeof schedules> = {
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: [],
      SATURDAY: [],
      SUNDAY: [],
    };

    for (const s of schedules) {
      weeklyView[s.dayOfWeek].push(s);
    }

    // Sort each day by startTime
    for (const day of Object.keys(weeklyView) as WeekdayType[]) {
      weeklyView[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    return weeklyView;
  }

  // ─── GET ONE ───────────────────────────────────────────────────────────────

  async findOne(tenantId: string, id: string) {
    const schedule = await this.prisma.schedules.findFirst({
      where: { tenantId, id, deletedAt: null },
      select: SCHEDULE_SELECT,
    });
    if (!schedule) throw new NotFoundException(`Schedule ${id} not found`);
    return schedule;
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  async update(
    tenantId: string,
    id: string,
    userId: string,
    dto: UpdateScheduleDto,
  ) {
    await this.findOne(tenantId, id);

    // Cast to access all optional fields — PartialType loses TS inference at compile time
    const d = dto as Record<string, any>;

    // If timing/tutor/batch/room fields are changing, re-run conflict check
    if (
      d.dayOfWeek ||
      d.startTime ||
      d.endTime ||
      d.staffProfileId ||
      d.batchId ||
      d.roomId !== undefined
    ) {
      // Get current to merge for conflict check
      const current = await this.prisma.schedules.findUniqueOrThrow({
        where: { id },
      });

      const conflictInput: CheckConflictsDto = {
        branchId: d.branchId ?? current.branchId,
        academicYearId: d.academicYearId ?? current.academicYearId,
        batchId: d.batchId ?? current.batchId,
        subjectId: d.subjectId ?? current.subjectId,
        staffProfileId: d.staffProfileId ?? current.staffProfileId,
        dayOfWeek: d.dayOfWeek ?? current.dayOfWeek,
        startTime: d.startTime ?? current.startTime,
        endTime: d.endTime ?? current.endTime,
        effectiveFrom: d.effectiveFrom ?? current.effectiveFrom.toISOString(),
        effectiveUntil:
          d.effectiveUntil ?? current.effectiveUntil.toISOString(),
        deliveryMode: d.deliveryMode ?? current.deliveryMode,
        roomId: d.roomId ?? current.roomId ?? undefined,
        excludeScheduleId: id,
      };

      if (conflictInput.startTime && conflictInput.endTime) {
        this.validateTimeRange(conflictInput.startTime, conflictInput.endTime);
      }

      const conflictResult = await this.detectConflicts(
        tenantId,
        conflictInput,
        id,
      );
      if (conflictResult.hasConflict) {
        const hasHardConflict = conflictResult.conflicts.some(
          (c) => c.type !== 'STUDENT',
        );
        const hasStudentConflict = conflictResult.conflicts.some(
          (c) => c.type === 'STUDENT',
        );

        if (
          hasHardConflict ||
          (hasStudentConflict && !d.bypassStudentConflict)
        ) {
          throw new ConflictException(conflictResult);
        }
      }
    }

    return this.prisma.schedules.update({
      where: { id },
      data: {
        ...d,
        ...(d.effectiveFrom && { effectiveFrom: new Date(d.effectiveFrom) }),
        ...(d.effectiveUntil && { effectiveUntil: new Date(d.effectiveUntil) }),
        updatedBy: userId,
        updatedAt: new Date(),
      },
      select: SCHEDULE_SELECT,
    });
  }

  // ─── DEACTIVATE / DELETE ───────────────────────────────────────────────────

  async remove(tenantId: string, id: string, userId: string) {
    await this.findOne(tenantId, id);
    return this.prisma.schedules.update({
      where: { id },
      data: {
        status: ScheduleStatusEnum.CANCELLED,
        deletedAt: new Date(),
        deletedBy: userId,
        updatedBy: userId,
      },
      select: SCHEDULE_SELECT,
    });
  }

  // ─── STUDENT ENROLLMENT CONFLICT CHECKER ───────────────────────────────────

  async checkEnrollmentConflict(
    tenantId: string,
    studentProfileId: string,
    newBatchId: string,
    excludeAdmissionId?: string,
  ): Promise<ConflictResult> {
    const conflicts: ConflictItem[] = [];

    // 1. Fetch all other active admissions of the student
    const activeAdmissions = await this.prisma.studentAdmissions.findMany({
      where: {
        tenantId,
        studentProfileId,
        admissionStatus: 'ACTIVE',
        deletedAt: null,
        ...(excludeAdmissionId ? { id: { not: excludeAdmissionId } } : {}),
      },
      select: { id: true },
    });

    const activeAdmissionIds = activeAdmissions.map((a) => a.id);
    if (activeAdmissionIds.length === 0) {
      return { hasConflict: false, conflicts: [] };
    }

    // 2. Fetch the student's active batch enrollments
    const enrollments = await this.prisma.studentBatchEnrollments.findMany({
      where: {
        tenantId,
        studentAdmissionId: { in: activeAdmissionIds },
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: { batchId: true },
    });

    const currentBatchIds = Array.from(
      new Set(enrollments.map((e) => e.batchId)),
    );
    if (currentBatchIds.length === 0) {
      return { hasConflict: false, conflicts: [] };
    }

    // 3. Fetch the schedules of these current batches
    const currentSchedules = await this.prisma.schedules.findMany({
      where: {
        tenantId,
        batchId: { in: currentBatchIds },
        status: ScheduleStatusEnum.ACTIVE,
        deletedAt: null,
      },
    });

    if (currentSchedules.length === 0) {
      return { hasConflict: false, conflicts: [] };
    }

    // 4. Fetch the schedules of the new target batch
    const newSchedules = await this.prisma.schedules.findMany({
      where: {
        tenantId,
        batchId: newBatchId,
        status: ScheduleStatusEnum.ACTIVE,
        deletedAt: null,
      },
    });

    if (newSchedules.length === 0) {
      return { hasConflict: false, conflicts: [] };
    }

    // Fetch batch names for context
    const allBatchIds = Array.from(new Set([...currentBatchIds, newBatchId]));
    const batches = await this.prisma.batches.findMany({
      where: { tenantId, id: { in: allBatchIds } },
      select: { id: true, name: true },
    });
    const batchNameMap = new Map(batches.map((b) => [b.id, b.name]));

    // 5. Compare current schedules with new schedules for overlaps
    for (const newSched of newSchedules) {
      for (const currSched of currentSchedules) {
        // Must be same weekday
        if (newSched.dayOfWeek !== currSched.dayOfWeek) continue;

        // Must overlap in date period
        const dateOverlap =
          newSched.effectiveUntil >= currSched.effectiveFrom &&
          newSched.effectiveFrom <= currSched.effectiveUntil;
        if (!dateOverlap) continue;

        // Must overlap in time slot
        const timeOverlap =
          newSched.startTime < currSched.endTime &&
          newSched.endTime > currSched.startTime;
        if (!timeOverlap) continue;

        const newBatchName = batchNameMap.get(newBatchId) || 'New Batch';
        const currBatchName =
          batchNameMap.get(currSched.batchId) || 'Current Batch';

        conflicts.push({
          type: 'STUDENT',
          isSoftConflict: true,
          message: `This student has a timetable clash on ${newSched.dayOfWeek} from ${newSched.startTime} to ${newSched.endTime}. The new batch "${newBatchName}" overlaps with their class in "${currBatchName}".`,
          existingSchedule: {
            id: currSched.id,
            dayOfWeek: currSched.dayOfWeek,
            startTime: currSched.startTime,
            endTime: currSched.endTime,
            batchId: currSched.batchId,
            subjectId: currSched.subjectId,
            staffProfileId: currSched.staffProfileId,
            roomId: currSched.roomId,
            deliveryMode: currSched.deliveryMode,
            batchName: currBatchName,
          },
        });
      }
    }

    return { hasConflict: conflicts.length > 0, conflicts };
  }

  // ─── VALIDATION HELPERS ────────────────────────────────────────────────────

  private validateTimeRange(startTime: string, endTime: string) {
    if (startTime >= endTime) {
      throw new BadRequestException(
        `startTime "${startTime}" must be before endTime "${endTime}"`,
      );
    }
  }

  private validateDeliveryMode(dto: CreateScheduleDto) {
    if (dto.deliveryMode === AttendanceModeType.CLASSROOM && !dto.roomId) {
      throw new BadRequestException(
        'roomId is required for CLASSROOM delivery mode',
      );
    }
  }
}
