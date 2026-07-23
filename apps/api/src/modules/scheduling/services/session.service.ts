/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ScheduleService } from './schedule.service';
import { OverrideSessionDto } from '../dto/override-session.dto';
import { CreateExtraSessionDto } from '../dto/create-extra-session.dto';
import {
  OverrideTypeEnum,
  SessionSourceEnum,
  ScheduleStatusEnum,
  SessionAuditActionEnum,
  AttendanceSessionStatusEnum,
} from '@prisma/client';

// ─── Select helper for session queries ───────────────────────────────────────

const SESSION_SELECT = {
  id: true,
  tenantId: true,
  branchId: true,
  academicYearId: true,
  batchId: true,
  subjectId: true,
  staffProfileId: true,
  attendanceDate: true,
  startsAt: true,
  endsAt: true,
  sessionStatus: true,
  sessionSource: true,
  overrideType: true,
  cancelledReason: true,
  originalStartsAt: true,
  originalEndsAt: true,
  scheduleId: true,
  remarks: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scheduleService: ScheduleService,
  ) {}

  // ─── HELPER: Write Audit Log ───────────────────────────────────────────────

  private async writeAudit(params: {
    tenantId: string;
    attendanceSessionId?: string;
    scheduleId?: string;
    entity: 'SESSION' | 'SCHEDULE';
    action: SessionAuditActionEnum;
    originalData?: object;
    newData?: object;
    reason?: string;
    scope?: string;
    changedBy: string;
  }) {
    await this.prisma.sessionAuditLogs.create({
      data: {
        tenantId: params.tenantId,
        attendanceSessionId: params.attendanceSessionId,
        scheduleId: params.scheduleId,
        entity: params.entity,
        action: params.action,
        originalData: params.originalData ?? {},
        newData: params.newData ?? {},
        reason: params.reason,
        scope: params.scope,
        changedBy: params.changedBy,
      },
    });
  }

  // ─── HELPER: Queue Notification ───────────────────────────────────────────

  private async queueNotification(params: {
    tenantId: string;
    entityType: string;
    entityId: string;
    eventType: string;
    payload: object;
  }) {
    await this.prisma.notificationEvents.create({
      data: {
        tenantId: params.tenantId,
        entityType: params.entityType,
        entityId: params.entityId,
        eventType: params.eventType,
        payload: params.payload as any,
        channels: ['PUSH', 'EMAIL'], // configurable per tenant in future
        status: 'PENDING',
      },
    });
  }

  // ─── GET ONE ──────────────────────────────────────────────────────────────

  async findOne(tenantId: string, id: string) {
    const session = await this.prisma.attendanceSessions.findFirst({
      where: { tenantId, id, deletedAt: null },
      select: SESSION_SELECT,
    });
    if (!session) throw new NotFoundException(`Session ${id} not found`);
    return session;
  }

  // ─── GET AUDIT HISTORY ────────────────────────────────────────────────────

  async getHistory(tenantId: string, sessionId: string) {
    await this.findOne(tenantId, sessionId);
    return this.prisma.sessionAuditLogs.findMany({
      where: { tenantId, attendanceSessionId: sessionId },
      orderBy: { changedAt: 'asc' },
    });
  }

  // ─── OVERRIDE SESSION ─────────────────────────────────────────────────────

  async override(
    tenantId: string,
    sessionId: string,
    userId: string,
    dto: OverrideSessionDto,
  ) {
    const session = await this.findOne(tenantId, sessionId);

    // Build the override type from what's being changed
    let overrideType: OverrideTypeEnum = OverrideTypeEnum.NONE;
    if (dto.cancel) overrideType = OverrideTypeEnum.CANCELLED;
    else if (
      dto.staffProfileId &&
      dto.staffProfileId !== session.staffProfileId
    )
      overrideType = OverrideTypeEnum.TUTOR_CHANGED;
    else if (dto.newDate || dto.newStartTime || dto.newEndTime)
      overrideType = OverrideTypeEnum.TIME_CHANGED;
    else if (dto.roomId) overrideType = OverrideTypeEnum.ROOM_CHANGED;

    // ── 1. Conflict check before ANY change ──
    if (!dto.cancel) {
      const newDate = dto.newDate
        ? new Date(dto.newDate)
        : session.attendanceDate;

      const newStartsAt =
        dto.newDate || dto.newStartTime
          ? new Date(
              `${dto.newDate ?? session.attendanceDate.toISOString().split('T')[0]}T${dto.newStartTime ?? session.startsAt.toISOString().split('T')[1].slice(0, 5)}:00`,
            )
          : session.startsAt;

      const newEndsAt =
        dto.newDate || dto.newEndTime
          ? new Date(
              `${dto.newDate ?? session.attendanceDate.toISOString().split('T')[0]}T${dto.newEndTime ?? session.endsAt.toISOString().split('T')[1].slice(0, 5)}:00`,
            )
          : session.endsAt;

      // Check for tutor conflict on the new day/time
      if (dto.staffProfileId) {
        const tutorBusy = await this.prisma.attendanceSessions.findFirst({
          where: {
            tenantId,
            staffProfileId: dto.staffProfileId,
            deletedAt: null,
            id: { not: sessionId },
            attendanceDate: newDate,
            AND: [
              { startsAt: { lt: newEndsAt } },
              { endsAt: { gt: newStartsAt } },
            ],
          },
        });
        if (tutorBusy) {
          throw new ConflictException({
            message: 'The selected tutor already has a class at this time.',
            conflictingSessionId: tutorBusy.id,
          });
        }
      }

      // Check for batch conflict on the new day/time
      if (dto.newDate || dto.newStartTime || dto.newEndTime) {
        const batchBusy = await this.prisma.attendanceSessions.findFirst({
          where: {
            tenantId,
            batchId: session.batchId,
            deletedAt: null,
            id: { not: sessionId },
            attendanceDate: newDate,
            AND: [
              { startsAt: { lt: newEndsAt } },
              { endsAt: { gt: newStartsAt } },
            ],
          },
        });
        if (batchBusy) {
          throw new ConflictException({
            message: 'This batch already has a class at the new time.',
            conflictingSessionId: batchBusy.id,
          });
        }
      }
    }

    const originalData = {
      staffProfileId: session.staffProfileId,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      attendanceDate: session.attendanceDate,
    };

    // ── 2. Apply by scope ─────────────────────────────────────────────────────
    if (dto.scope === 'ONLY_THIS') {
      return this.applyOnlyThis(
        tenantId,
        sessionId,
        session,
        dto,
        userId,
        overrideType,
        originalData,
      );
    }

    if (dto.scope === 'THIS_AND_FUTURE') {
      return this.applyThisAndFuture(
        tenantId,
        sessionId,
        session,
        dto,
        userId,
        overrideType,
        originalData,
      );
    }

    if (dto.scope === 'ENTIRE_SERIES') {
      return this.applyEntireSeries(
        tenantId,
        session,
        dto,
        userId,
        overrideType,
        originalData,
      );
    }

    throw new BadRequestException('Invalid scope');
  }

  // ─── SCOPE: ONLY THIS SESSION ─────────────────────────────────────────────

  private async applyOnlyThis(
    tenantId: string,
    sessionId: string,
    session: any,
    dto: OverrideSessionDto,
    userId: string,
    overrideType: OverrideTypeEnum,
    originalData: object,
  ) {
    const newDate = dto.newDate ? new Date(dto.newDate) : undefined;
    const newStartsAt =
      dto.newDate || dto.newStartTime
        ? new Date(
            `${dto.newDate ?? session.attendanceDate.toISOString().split('T')[0]}T${dto.newStartTime ?? session.startsAt.toISOString().split('T')[1].slice(0, 5)}:00`,
          )
        : undefined;
    const newEndsAt =
      dto.newDate || dto.newEndTime
        ? new Date(
            `${dto.newDate ?? session.attendanceDate.toISOString().split('T')[0]}T${dto.newEndTime ?? session.endsAt.toISOString().split('T')[1].slice(0, 5)}:00`,
          )
        : undefined;

    const updated = await this.prisma.attendanceSessions.update({
      where: { id: sessionId },
      data: {
        ...(dto.staffProfileId && { staffProfileId: dto.staffProfileId }),
        ...(newDate && { attendanceDate: newDate }),
        ...(newStartsAt && { startsAt: newStartsAt }),
        ...(newEndsAt && { endsAt: newEndsAt }),
        ...(dto.roomId && { roomId: dto.roomId }),
        ...(dto.cancel && {
          sessionStatus: AttendanceSessionStatusEnum.CANCELLED,
          cancelledReason: dto.reason ?? 'ADMIN_CANCELLED',
        }),
        overrideType,
        // Preserve original times only on first override
        ...(!session.originalStartsAt &&
          newStartsAt && { originalStartsAt: session.startsAt }),
        ...(!session.originalEndsAt &&
          newEndsAt && { originalEndsAt: session.endsAt }),
        updatedBy: userId,
        updatedAt: new Date(),
      },
      select: SESSION_SELECT,
    });

    const action = dto.cancel
      ? SessionAuditActionEnum.CANCELLED
      : overrideType === OverrideTypeEnum.TUTOR_CHANGED
        ? SessionAuditActionEnum.TUTOR_CHANGED
        : SessionAuditActionEnum.RESCHEDULED;

    await this.writeAudit({
      tenantId,
      attendanceSessionId: sessionId,
      scheduleId: session.scheduleId,
      entity: 'SESSION',
      action,
      originalData,
      newData: {
        staffProfileId: updated.staffProfileId,
        startsAt: updated.startsAt,
        endsAt: updated.endsAt,
      },
      reason: dto.reason,
      scope: 'ONLY_THIS',
      changedBy: userId,
    });

    await this.queueNotification({
      tenantId,
      entityType: 'SESSION',
      entityId: sessionId,
      eventType: dto.cancel ? 'CANCELLED' : overrideType,
      payload: {
        sessionId,
        batchId: session.batchId,
        originalData,
        newData: {
          staffProfileId: updated.staffProfileId,
          startsAt: updated.startsAt,
        },
        reason: dto.reason,
      },
    });

    return updated;
  }

  // ─── SCOPE: THIS AND FUTURE ───────────────────────────────────────────────

  private async applyThisAndFuture(
    tenantId: string,
    sessionId: string,
    session: any,
    dto: OverrideSessionDto,
    userId: string,
    overrideType: OverrideTypeEnum,
    originalData: object,
  ) {
    if (!session.scheduleId) {
      // No parent template — just apply to this single session
      return this.applyOnlyThis(
        tenantId,
        sessionId,
        session,
        dto,
        userId,
        overrideType,
        originalData,
      );
    }

    // 1. Mark the parent template as SUPERSEDED
    const parentSchedule = await this.prisma.schedules.findUniqueOrThrow({
      where: { id: session.scheduleId },
    });

    await this.prisma.schedules.update({
      where: { id: session.scheduleId },
      data: {
        status: ScheduleStatusEnum.SUPERSEDED,
        effectiveUntil: new Date(
          new Date(session.attendanceDate).getTime() - 86400000,
        ), // day before
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });

    // 2. Cancel all future unconducted sessions from this one onwards
    const futureSessionIds = await this.prisma.attendanceSessions.findMany({
      where: {
        tenantId,
        scheduleId: session.scheduleId,
        deletedAt: null,
        sessionStatus: {
          in: [
            AttendanceSessionStatusEnum.SCHEDULED,
            AttendanceSessionStatusEnum.DRAFT,
          ],
        },
        attendanceDate: { gte: new Date(session.attendanceDate) },
      },
      select: { id: true },
    });

    await this.prisma.attendanceSessions.updateMany({
      where: { id: { in: futureSessionIds.map((s) => s.id) } },
      data: {
        sessionStatus: AttendanceSessionStatusEnum.CANCELLED,
        cancelledReason: 'SUPERSEDED',
        overrideType: OverrideTypeEnum.CANCELLED,
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });

    // 3. Create a new schedule template from today's date with the new parameters
    const newSchedule = await this.prisma.schedules.create({
      data: {
        tenantId,
        branchId: parentSchedule.branchId,
        academicYearId: parentSchedule.academicYearId,
        batchId: parentSchedule.batchId,
        subjectId: parentSchedule.subjectId,
        staffProfileId: dto.staffProfileId ?? parentSchedule.staffProfileId,
        dayOfWeek: parentSchedule.dayOfWeek,
        startTime: dto.newStartTime ?? parentSchedule.startTime,
        endTime: dto.newEndTime ?? parentSchedule.endTime,
        effectiveFrom: new Date(session.attendanceDate),
        effectiveUntil: parentSchedule.effectiveUntil,
        deliveryMode: parentSchedule.deliveryMode,
        roomId: dto.roomId ?? parentSchedule.roomId,
        status: ScheduleStatusEnum.ACTIVE,
        notes: `Series split on ${session.attendanceDate.toISOString().split('T')[0]}. Reason: ${dto.reason ?? 'Admin update'}`,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await this.writeAudit({
      tenantId,
      scheduleId: session.scheduleId,
      entity: 'SCHEDULE',
      action: SessionAuditActionEnum.STATUS_CHANGED,
      originalData: { status: 'ACTIVE', scheduleId: session.scheduleId },
      newData: { status: 'SUPERSEDED', newScheduleId: newSchedule.id },
      reason: dto.reason,
      scope: 'THIS_AND_FUTURE',
      changedBy: userId,
    });

    await this.queueNotification({
      tenantId,
      entityType: 'SCHEDULE',
      entityId: newSchedule.id,
      eventType: 'RESCHEDULED',
      payload: {
        affectedSessionCount: futureSessionIds.length,
        newScheduleId: newSchedule.id,
        reason: dto.reason,
      },
    });

    return {
      superseded: session.scheduleId,
      newSchedule: newSchedule.id,
      cancelledSessions: futureSessionIds.length,
    };
  }

  // ─── SCOPE: ENTIRE SERIES ─────────────────────────────────────────────────

  private async applyEntireSeries(
    tenantId: string,
    session: any,
    dto: OverrideSessionDto,
    userId: string,
    overrideType: OverrideTypeEnum,
    originalData: object,
  ) {
    if (!session.scheduleId) {
      throw new BadRequestException(
        'This session has no parent recurring schedule to update.',
      );
    }

    // Update the parent template
    await this.prisma.schedules.update({
      where: { id: session.scheduleId },
      data: {
        ...(dto.staffProfileId && { staffProfileId: dto.staffProfileId }),
        ...(dto.newStartTime && { startTime: dto.newStartTime }),
        ...(dto.newEndTime && { endTime: dto.newEndTime }),
        ...(dto.roomId && { roomId: dto.roomId }),
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });

    // Update all pending/scheduled future sessions generated from this template
    const targetFields: any = {
      updatedBy: userId,
      updatedAt: new Date(),
    };
    if (dto.staffProfileId) {
      targetFields.staffProfileId = dto.staffProfileId;
      targetFields.overrideType = OverrideTypeEnum.TUTOR_CHANGED;
    }

    await this.prisma.attendanceSessions.updateMany({
      where: {
        tenantId,
        scheduleId: session.scheduleId,
        deletedAt: null,
        sessionStatus: {
          in: [
            AttendanceSessionStatusEnum.SCHEDULED,
            AttendanceSessionStatusEnum.DRAFT,
          ],
        },
        attendanceDate: { gte: new Date() },
      },
      data: targetFields,
    });

    await this.writeAudit({
      tenantId,
      scheduleId: session.scheduleId,
      entity: 'SCHEDULE',
      action:
        overrideType === OverrideTypeEnum.TUTOR_CHANGED
          ? SessionAuditActionEnum.TUTOR_CHANGED
          : SessionAuditActionEnum.RESCHEDULED,
      originalData,
      newData: {
        staffProfileId: dto.staffProfileId,
        startTime: dto.newStartTime,
      },
      reason: dto.reason,
      scope: 'ENTIRE_SERIES',
      changedBy: userId,
    });

    await this.queueNotification({
      tenantId,
      entityType: 'SCHEDULE',
      entityId: session.scheduleId,
      eventType: overrideType,
      payload: { scheduleId: session.scheduleId, reason: dto.reason },
    });

    return { updated: 'entire_series', scheduleId: session.scheduleId };
  }

  // ─── CREATE EXTRA CLASS ───────────────────────────────────────────────────

  async createExtra(
    tenantId: string,
    userId: string,
    dto: CreateExtraSessionDto,
  ) {
    const newSession = await this.prisma.attendanceSessions.create({
      data: {
        tenantId,
        branchId: dto.branchId,
        academicYearId: dto.academicYearId,
        batchId: dto.batchId,
        subjectId: dto.subjectId,
        staffProfileId: dto.staffProfileId,
        attendanceDate: new Date(dto.attendanceDate),
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        sessionStatus: AttendanceSessionStatusEnum.SCHEDULED,
        sessionSource: dto.sessionSource ?? SessionSourceEnum.MANUAL,
        overrideType: OverrideTypeEnum.NONE,
        scheduleId: null,
        publishedBy: userId,
        publishedAt: new Date(),
        lockedBy: userId,
        lockedAt: new Date(),
        remarks: dto.remarks ?? '',
        createdBy: userId,
        updatedBy: userId,
      },
      select: SESSION_SELECT,
    });

    await this.writeAudit({
      tenantId,
      attendanceSessionId: newSession.id,
      entity: 'SESSION',
      action: SessionAuditActionEnum.EXTRA_CLASS_CREATED,
      newData: {
        batchId: dto.batchId,
        startsAt: dto.startsAt,
        sessionSource: newSession.sessionSource,
      },
      reason: dto.remarks,
      changedBy: userId,
    });

    await this.queueNotification({
      tenantId,
      entityType: 'SESSION',
      entityId: newSession.id,
      eventType: 'EXTRA_CLASS',
      payload: {
        sessionId: newSession.id,
        batchId: dto.batchId,
        startsAt: dto.startsAt,
      },
    });

    return newSession;
  }
}
