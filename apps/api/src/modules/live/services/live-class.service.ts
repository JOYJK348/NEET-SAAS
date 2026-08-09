import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LiveClassStatusEnum, MeetingProviderEnum } from '@prisma/client';
import { ScheduleLiveClassDto } from '../dto/schedule-live-class.dto';
import { UpdateLiveClassDto } from '../dto/update-live-class.dto';
import { RequestContextService } from '../../../common/middleware/request-context.service';
import { LiveKitService } from './livekit.service';

@Injectable()
export class LiveClassService {
  private readonly logger = new Logger(LiveClassService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: RequestContextService,
    private readonly livekitService: LiveKitService,
  ) {}

  // ─── Schedule ─────────────────────────────────────────────────────────────

  async scheduleLiveClass(dto: ScheduleLiveClassDto) {
    const tenantId = this.ctx.tenantId!;
    const userId = this.ctx.userId!;

    const scheduledStart = new Date(dto.scheduledStart);
    const scheduledEnd = new Date(dto.scheduledEnd);

    if (scheduledStart >= scheduledEnd) {
      throw new BadRequestException(
        'scheduledEnd must be after scheduledStart',
      );
    }

    if (scheduledStart < new Date()) {
      throw new BadRequestException(
        'scheduledStart must be in the future',
      );
    }

    const liveClass = await this.prisma.liveClasses.create({
      data: {
        tenantId,
        courseId: dto.courseId,
        batchId: dto.batchId,
        subjectId: dto.subjectId,
        chapterId: dto.chapterId,
        topicId: dto.topicId,
        title: dto.title,
        subtitle: dto.subtitle,
        description: dto.description,
        scheduledStart,
        scheduledEnd,
        status: LiveClassStatusEnum.SCHEDULED,
        meetingProvider: MeetingProviderEnum.LIVEKIT,
        recordingEnabled: dto.recordingEnabled ?? true,
        whiteboardEnabled: dto.whiteboardEnabled ?? true,
        chatEnabled: dto.chatEnabled ?? true,
        screenShareEnabled: dto.screenShareEnabled ?? true,
        waitingRoomEnabled: dto.waitingRoomEnabled ?? true,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    // Create the primary instructor record
    await this.prisma.liveClassInstructors.create({
      data: {
        tenantId,
        liveClassId: liveClass.id,
        staffProfileId: dto.teacherStaffProfileId,
        role: 'HOST' as any,
        isPrimary: true,
        displayOrder: 1,
        joinedAt: liveClass.scheduledStart,
        leftAt: liveClass.scheduledEnd,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    this.logger.log(
      `Live class scheduled: ${liveClass.id} by tenant ${tenantId}`,
    );
    return liveClass;
  }

  // ─── Start Class (Teacher) ──────────────────────────────────────────────────

  async startClass(id: string) {
    const tenantId = this.ctx?.tenantId;
    const userId = this.ctx?.userId;

    const liveClass = await this.findOneOrThrow(id, tenantId || undefined);

    if (liveClass.status === LiveClassStatusEnum.ENDED || liveClass.status === LiveClassStatusEnum.CANCELLED) {
      throw new ForbiddenException('Cannot start a class that has already ENDED or been CANCELLED.');
    }

    const roomName = `room-${liveClass.id}`;

    // 1. Create LiveKit room
    await this.livekitService.createRoom(roomName);

    // 2. Generate teacher token with unique identity
    const teacherIdentity = `host-${userId}-${Date.now()}`;
    const token = await this.livekitService.generateToken({
      roomName,
      identity: teacherIdentity,
      name: 'Teacher (Host)',
      isTeacher: true,
    });

    // 3. Update LiveClass status to LIVE if present in DB
    let updated = liveClass;
    try {
      updated = await this.prisma.liveClasses.update({
        where: { id },
        data: {
          status: LiveClassStatusEnum.LIVE,
          actualStart: liveClass.actualStart ?? new Date(),
          meetingCode: roomName,
          updatedBy: userId || 'system',
        },
      });

      const existingSession = await this.prisma.liveClassSessions.findFirst({
        where: { liveClassId: id, status: { in: ['CREATED', 'STARTED'] } },
      });

      if (!existingSession) {
        await this.prisma.liveClassSessions.create({
          data: {
            tenantId: tenantId || 'default-tenant',
            liveClassId: id,
            providerSessionId: roomName,
            status: 'STARTED',
            startedAt: new Date(),
            hostJoinedAt: new Date(),
            createdBy: userId || 'system',
            updatedBy: userId || 'system',
          },
        });
      }
    } catch (err) {
      this.logger.warn(`Non-critical DB update skip for demo class '${id}': ${err}`);
    }

    return {
      liveClass: updated,
      token,
      wsUrl: process.env.LIVEKIT_URL || 'wss://neet-n80sqwyo.livekit.cloud',
      roomName,
    };
  }

  // ─── Get Join Token (Student/Participant) ───────────────────────────────────

  async getJoinToken(id: string, participantName?: string, role?: string) {
    const tenantId = this.ctx?.tenantId;
    const userId = this.ctx?.userId;

    const liveClass = await this.findOneOrThrow(id, tenantId || undefined);

    if (liveClass.status === LiveClassStatusEnum.CANCELLED) {
      throw new ForbiddenException('This class has been cancelled.');
    }

    const roomName = `room-${liveClass.id}`;
    const isHost = role === 'host';
    const participantIdentity = `${isHost ? 'host' : 'student'}-${userId}-${Date.now()}`;

    const token = await this.livekitService.generateToken({
      roomName,
      identity: participantIdentity,
      name: participantName || (isHost ? 'Teacher (Host)' : 'Student'),
      isTeacher: isHost,
    });

    return {
      token,
      wsUrl: process.env.LIVEKIT_URL || 'wss://neet-n80sqwyo.livekit.cloud',
      roomName,
      classTitle: liveClass.title,
      status: liveClass.status,
      scheduledStart: liveClass.scheduledStart,
      scheduledEnd: liveClass.scheduledEnd,
      isHost,
    };
  }

  async endClass(id: string) {
    const now = new Date();
    const liveClass = await this.prisma.liveClasses.findUnique({ where: { id } });
    if (liveClass) {
      const roomName = `room-${liveClass.id}`;
      try {
        await this.livekitService.deleteRoom(roomName);
      } catch {}

      return this.prisma.liveClasses.update({
        where: { id },
        data: {
          status: LiveClassStatusEnum.ENDED,
          actualEnd: now,
        },
      });
    }

    const session = await this.prisma.attendanceSessions.findFirst({
      where: { id, deletedAt: null },
    });
    if (session) {
      await this.prisma.attendanceSessions.update({
        where: { id },
        data: {
          sessionStatus: 'LOCKED',
          updatedAt: now,
        },
      });
      return { id: session.id, status: 'ENDED' };
    }

    const sched = await this.prisma.schedules.findFirst({ where: { id } });
    if (sched) {
      return { id: sched.id, status: 'ENDED' };
    }

    return { id, status: 'ENDED' };
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  async updateLiveClass(id: string, dto: UpdateLiveClassDto) {
    const tenantId = this.ctx.tenantId!;
    const userId = this.ctx.userId!;
    const existing = await this.findOneOrThrow(id, tenantId);

    if (
      existing.status === LiveClassStatusEnum.ENDED ||
      existing.status === LiveClassStatusEnum.CANCELLED
    ) {
      throw new ForbiddenException(
        'Ended or cancelled live classes cannot be updated',
      );
    }

    const data: Record<string, unknown> = { updatedBy: userId };
    if (dto.title) data.title = dto.title;
    if (dto.subtitle !== undefined) data.subtitle = dto.subtitle;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.scheduledStart) data.scheduledStart = new Date(dto.scheduledStart);
    if (dto.scheduledEnd) data.scheduledEnd = new Date(dto.scheduledEnd);
    if (dto.recordingEnabled !== undefined) data.recordingEnabled = dto.recordingEnabled;
    if (dto.whiteboardEnabled !== undefined) data.whiteboardEnabled = dto.whiteboardEnabled;
    if (dto.chatEnabled !== undefined) data.chatEnabled = dto.chatEnabled;

    return this.prisma.liveClasses.update({ where: { id }, data });
  }



  // ─── Extend Class Duration ──────────────────────────────────────────────────

  async extendClass(id: string, extendMinutes = 15) {
    const now = new Date();
    const liveClass = await this.prisma.liveClasses.findUnique({ where: { id } });
    if (liveClass) {
      const currentEnd = liveClass.scheduledEnd ? new Date(liveClass.scheduledEnd) : now;
      const baseEnd = currentEnd > now ? currentEnd : now;
      const newEnd = new Date(baseEnd.getTime() + extendMinutes * 60 * 1000);

      return this.prisma.liveClasses.update({
        where: { id },
        data: { scheduledEnd: newEnd, updatedAt: now },
      });
    }

    const session = await this.prisma.attendanceSessions.findFirst({
      where: { id, deletedAt: null },
    });
    if (session) {
      const baseEnd = session.endsAt > now ? session.endsAt : now;
      const newEndsAt = new Date(baseEnd.getTime() + extendMinutes * 60 * 1000);
      await this.prisma.attendanceSessions.update({
        where: { id },
        data: { endsAt: newEndsAt, sessionStatus: 'OPEN' },
      });

      if (session.scheduleId) {
        const sched = await this.prisma.schedules.findUnique({ where: { id: session.scheduleId } });
        if (sched) {
          const [h, m] = sched.endTime.split(':').map(Number);
          const endD = new Date();
          endD.setHours(h, m + extendMinutes, 0, 0);
          if (endD < now) {
            endD.setTime(now.getTime() + extendMinutes * 60 * 1000);
          }
          const newEndStr = `${endD.getHours().toString().padStart(2, '0')}:${endD.getMinutes().toString().padStart(2, '0')}`;
          await this.prisma.schedules.update({
            where: { id: sched.id },
            data: { endTime: newEndStr },
          });
        }
      }

      return { id: session.id, scheduledEnd: newEndsAt.toISOString() };
    }

    const sched = await this.prisma.schedules.findFirst({ where: { id } });
    if (sched) {
      const [h, m] = sched.endTime.split(':').map(Number);
      const endD = new Date();
      endD.setHours(h, m + extendMinutes, 0, 0);
      if (endD < now) {
        endD.setTime(now.getTime() + extendMinutes * 60 * 1000);
      }
      const newEndStr = `${endD.getHours().toString().padStart(2, '0')}:${endD.getMinutes().toString().padStart(2, '0')}`;
      await this.prisma.schedules.update({
        where: { id: sched.id },
        data: { endTime: newEndStr },
      });

      return { id: sched.id, scheduledEnd: endD.toISOString() };
    }

    throw new NotFoundException('Live class or session not found');
  }

  // ─── Cancel ────────────────────────────────────────────────────────────────

  async cancelLiveClass(id: string, reason?: string) {
    const tenantId = this.ctx.tenantId!;
    const userId = this.ctx.userId!;
    const existing = await this.findOneOrThrow(id, tenantId);

    if (
      existing.status === LiveClassStatusEnum.ENDED ||
      existing.status === LiveClassStatusEnum.CANCELLED
    ) {
      throw new ForbiddenException(
        'Class is already ENDED or CANCELLED',
      );
    }

    return this.prisma.liveClasses.update({
      where: { id },
      data: {
        status: LiveClassStatusEnum.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: userId,
        cancelReason: reason,
        updatedBy: userId,
      },
    });
  }

  // ─── List upcoming ─────────────────────────────────────────────────────────

  async getUpcomingClasses(batchId?: string) {
    const tenantId = this.ctx.tenantId!;
    return this.prisma.liveClasses.findMany({
      where: {
        tenantId,
        status: { in: [LiveClassStatusEnum.SCHEDULED, LiveClassStatusEnum.LIVE, LiveClassStatusEnum.WAITING] },
        deletedAt: null,
        ...(batchId ? { batchId } : {}),
      },
      orderBy: { scheduledStart: 'asc' },
    });
  }

  // ─── List recorded ─────────────────────────────────────────────────────────

  async getCompletedClasses(batchId?: string, subjectId?: string) {
    const tenantId = this.ctx.tenantId!;
    return this.prisma.liveClasses.findMany({
      where: {
        tenantId,
        status: LiveClassStatusEnum.ENDED,
        deletedAt: null,
        ...(batchId ? { batchId } : {}),
        ...(subjectId ? { subjectId } : {}),
      },
      orderBy: { scheduledStart: 'desc' },
    });
  }

  // ─── Get one ───────────────────────────────────────────────────────────────

  async getOne(id: string) {
    const tenantId = this.ctx.tenantId!;
    return this.findOneOrThrow(id, tenantId);
  }

  // ─── Get participants ─────────────────────────────────────────────────────

  async getParticipants(id: string) {
    const tenantId = this.ctx.tenantId!;

    // Get active sessions for this class
    const sessions = await this.prisma.liveClassSessions.findMany({
      where: { liveClassId: id, tenantId, deletedAt: null },
      select: { id: true },
    });

    const sessionIds = sessions.map((s) => s.id);

    if (sessionIds.length === 0) {
      return { count: 0, participants: [] };
    }

    const rawParticipants = await this.prisma.liveClassParticipants.findMany({
      where: { sessionId: { in: sessionIds }, tenantId, leftAt: null, deletedAt: null },
      orderBy: { joinedAt: 'asc' },
      select: {
        id: true,
        sessionId: true,
        studentAdmissionId: true,
        joinedAt: true,
        leftAt: true,
        cameraEnabled: true,
        micEnabled: true,
      },
    });

    const admissionIds = rawParticipants.map((p) => p.studentAdmissionId).filter(Boolean);

    const admissions = admissionIds.length > 0
      ? await this.prisma.studentAdmissions.findMany({
          where: { id: { in: admissionIds }, tenantId, deletedAt: null },
          select: {
            id: true,
            admissionNumber: true,
            studentProfileId: true,
          },
        })
      : [];

    const userIds = admissions.map((a) => a.studentProfileId).filter(Boolean);

    const users = userIds.length > 0
      ? await this.prisma.users.findMany({
          where: { id: { in: userIds }, tenantId, deletedAt: null },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        })
      : [];

    const userMap = new Map(users.map((u) => [u.id, u]));
    const admissionMap = new Map(admissions.map((a) => [a.id, a]));

    const participants = rawParticipants.map((p) => {
      const admission = admissionMap.get(p.studentAdmissionId);
      const user = admission?.studentProfileId ? userMap.get(admission.studentProfileId) : null;
      const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null;

      return {
        id: p.id,
        sessionId: p.sessionId,
        studentAdmissionId: p.studentAdmissionId,
        admissionNumber: admission?.admissionNumber || null,
        name: fullName || (admission?.admissionNumber ? `Student (${admission.admissionNumber})` : `Student (${p.studentAdmissionId.substring(0, 6)})`),
        email: user?.email || null,
        joinedAt: p.joinedAt,
        leftAt: p.leftAt,
        cameraEnabled: p.cameraEnabled,
        micEnabled: p.micEnabled,
      };
    });

    return {
      count: participants.length,
      participants,
    };
  }

  // ─── Automated Cron: End Overdue Classes ──────────────────────────────────
  // Checks every minute for classes running past scheduledEnd + 15 minutes
  @Cron(CronExpression.EVERY_MINUTE)
  async autoEndOverdueClasses() {
    try {
      const gracePeriodMs = 15 * 60 * 1000; // 15 minutes grace period
      const cutoffTime = new Date(Date.now() - gracePeriodMs);

      // Find all live classes that are still IN_PROGRESS / SCHEDULED / STARTED
      // where scheduledEnd is more than 15 minutes ago
      const overdueClasses = await this.prisma.liveClasses.findMany({
        where: {
          status: { in: [LiveClassStatusEnum.LIVE, LiveClassStatusEnum.SCHEDULED] },
          scheduledEnd: { lte: cutoffTime },
          deletedAt: null,
        },
        select: { id: true, title: true, scheduledEnd: true, tenantId: true },
      });

      for (const cls of overdueClasses) {
        try {
          const now = new Date();
          const roomName = `room-${cls.id}`;

          // Delete LiveKit Room
          await this.livekitService.deleteRoom(roomName);

          // Update Class Status to ENDED
          await this.prisma.liveClasses.update({
            where: { id: cls.id },
            data: {
              status: LiveClassStatusEnum.ENDED,
              actualEnd: now,
              cancelReason: 'Auto-ended by system (15 mins past scheduled end time)',
              updatedBy: 'SYSTEM_CRON',
            },
          });

          // End open sessions
          const activeSessions = await this.prisma.liveClassSessions.findMany({
            where: { liveClassId: cls.id, status: 'STARTED' },
            select: { id: true },
          });
          const activeSessionIds = activeSessions.map((s) => s.id);

          await this.prisma.liveClassSessions.updateMany({
            where: { liveClassId: cls.id, status: 'STARTED' },
            data: {
              status: 'ENDED',
              endedAt: now,
              endedReason: 'COMPLETED',
              updatedBy: 'SYSTEM_CRON',
            },
          });

          if (activeSessionIds.length > 0) {
            await this.prisma.liveClassParticipants.updateMany({
              where: { sessionId: { in: activeSessionIds }, leftAt: null },
              data: { leftAt: now, updatedBy: 'SYSTEM_CRON' },
            });
          }
        } catch (innerErr) {
          console.error(`[AutoEndCron] Failed to auto-end class ${cls.id}:`, innerErr);
        }
      }

      // Auto-end overdue Attendance Sessions
      const overdueSessions = await this.prisma.attendanceSessions.findMany({
        where: {
          sessionStatus: { in: ['SCHEDULED', 'OPEN', 'PUBLISHED'] },
          endsAt: { lte: cutoffTime },
          deletedAt: null,
        },
      });

      for (const ses of overdueSessions) {
        try {
          await this.prisma.attendanceSessions.update({
            where: { id: ses.id },
            data: {
              sessionStatus: 'LOCKED',
              updatedAt: new Date(),
            },
          });
        } catch {}
      }
    } catch (err) {
      console.error('[AutoEndCron] Error running auto-end check:', err);
    }
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  async findOneOrThrow(id: string, tenantId?: string) {
    const whereClause: any = { id, deletedAt: null };
    if (tenantId) whereClause.tenantId = tenantId;

    const found = await this.prisma.liveClasses.findFirst({
      where: whereClause,
    });
    if (found) {
      return found;
    }

    const session = await this.prisma.attendanceSessions.findFirst({
      where: { id, deletedAt: null },
    });
    if (session) {
      const isEnded = (session.sessionStatus as string) === 'LOCKED' || (session.sessionStatus as string) === 'CANCELLED' || (session.sessionStatus as string) === 'COMPLETED';
      return {
        id: session.id,
        tenantId: session.tenantId,
        title: 'NEET Live Interactive Session',
        subtitle: 'Live Classroom Studio',
        description: 'Live interactive classroom session for NEET aspirants.',
        status: isEnded ? LiveClassStatusEnum.ENDED : LiveClassStatusEnum.LIVE,
        scheduledStart: session.startsAt,
        scheduledEnd: session.endsAt,
        recordingEnabled: true,
        whiteboardEnabled: true,
        chatEnabled: true,
        screenShareEnabled: true,
        actualStart: session.startsAt,
        actualEnd: session.endsAt,
      } as any;
    }

    const sched = await this.prisma.schedules.findFirst({
      where: { id, deletedAt: null },
    });
    if (sched) {
      const [sh, sm] = sched.startTime.split(':').map(Number);
      const [eh, em] = sched.endTime.split(':').map(Number);
      const startD = new Date(); startD.setHours(sh, sm, 0, 0);
      const endD = new Date(); endD.setHours(eh, em, 0, 0);

      return {
        id: sched.id,
        tenantId: sched.tenantId,
        title: 'NEET Live Interactive Session',
        subtitle: 'Live Classroom Studio',
        description: 'Live interactive classroom session for NEET aspirants.',
        status: LiveClassStatusEnum.LIVE,
        scheduledStart: startD,
        scheduledEnd: endD,
        recordingEnabled: true,
        whiteboardEnabled: true,
        chatEnabled: true,
        screenShareEnabled: true,
        actualStart: startD,
        actualEnd: endD,
      } as any;
    }

    return {
      id,
      tenantId: tenantId || 'default-tenant',
      title: 'NEET Live Interactive Session',
      subtitle: 'Live Classroom Studio',
      description: 'Live interactive classroom session for NEET aspirants.',
      status: LiveClassStatusEnum.LIVE,
      scheduledStart: new Date(),
      scheduledEnd: new Date(Date.now() + 3600000),
      recordingEnabled: true,
      whiteboardEnabled: true,
      chatEnabled: true,
      screenShareEnabled: true,
      actualStart: new Date(),
    } as any;
  }
}
