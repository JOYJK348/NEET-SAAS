import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { GoogleAuthService } from './google-auth.service';
import { GoogleCalendarService, CalendarEventPayload } from './google-calendar.service';

@Injectable()
export class CalendarSyncService {
  private readonly logger = new Logger(CalendarSyncService.name);
  private readonly activeLocks = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly googleCalendarService: GoogleCalendarService,
  ) {}

  /**
   * Dispatch Live Class synchronization (Non-blocking background queue)
   */
  async queueLiveClassSync(liveClassId: string, action: 'CREATE' | 'UPDATE' | 'CANCEL' | 'DELETE') {
    // Process asynchronously without blocking response
    setImmediate(() => {
      this.processLiveClassSync(liveClassId, action).catch((err) =>
        this.logger.error(`Async LiveClass sync failed for ${liveClassId}:`, err?.message),
      );
    });
  }

  /**
   * Dispatch Attendance Session synchronization (Non-blocking background queue)
   */
  async queueAttendanceSessionSync(sessionId: string, action: 'CREATE' | 'UPDATE' | 'CANCEL' | 'DELETE') {
    setImmediate(() => {
      this.processAttendanceSessionSync(sessionId, action).catch((err) =>
        this.logger.error(`Async AttendanceSession sync failed for ${sessionId}:`, err?.message),
      );
    });
  }

  /**
   * Sync all upcoming classes for a newly connected or re-connected user
   */
  async syncUserUpcomingClasses(tenantId: string, userId: string) {
    setImmediate(async () => {
      try {
        const now = new Date();
        // 1. Fetch upcoming Live Classes
        const liveClasses = await this.prisma.liveClasses.findMany({
          where: {
            tenantId,
            status: { in: ['SCHEDULED', 'LIVE', 'WAITING'] },
            scheduledEnd: { gte: now },
            deletedAt: null,
          },
        });

        for (const lc of liveClasses) {
          await this.processLiveClassSync(lc.id, 'CREATE');
        }

        // 2. Fetch upcoming Timetable Sessions
        const sessions = await this.prisma.attendanceSessions.findMany({
          where: {
            tenantId,
            endsAt: { gte: now },
            deletedAt: null,
          },
        });

        for (const s of sessions) {
          await this.processAttendanceSessionSync(s.id, 'CREATE');
        }
      } catch (err: any) {
        this.logger.error(`Failed to sync upcoming classes for user ${userId}:`, err?.message);
      }
    });
  }

  /**
   * Process Live Class sync for tutor and opted-in students with idempotency lock & retries
   */
  private async processLiveClassSync(liveClassId: string, action: 'CREATE' | 'UPDATE' | 'CANCEL' | 'DELETE') {
    const liveClass = await this.prisma.liveClasses.findFirst({
      where: { id: liveClassId, deletedAt: null },
    });

    if (!liveClass) return;

    // 1. Identify Target Users
    const targetUserIds = new Set<string>();

    // Creator & Assigned Instructors (Tutors)
    if (liveClass.createdBy) targetUserIds.add(liveClass.createdBy);

    const instructors = await this.prisma.liveClassInstructors.findMany({
      where: { liveClassId: liveClass.id, deletedAt: null },
      select: { staffProfileId: true },
    });
    instructors.forEach((i) => {
      if (i.staffProfileId) targetUserIds.add(i.staffProfileId);
    });

    // Enrolled Batch Students
    const enrollments = await (this.prisma as any).batchEnrollmentAdmissions.findMany({
      where: { tenantId: liveClass.tenantId, batchId: liveClass.batchId, status: 'ACTIVE', deletedAt: null },
      select: { studentAdmission: { select: { studentProfileId: true } } },
    });

    enrollments.forEach((e: any) => {
      if (e.studentAdmission?.studentProfileId) targetUserIds.add(e.studentAdmission.studentProfileId);
    });

    const userList = Array.from(targetUserIds);
    if (userList.length === 0) return;

    // 2. Fetch Active Google Calendar Connections for target users
    const connections = await (this.prisma as any).googleCalendarConnections.findMany({
      where: {
        userId: { in: userList },
        status: 'ACTIVE',
        autoSyncClasses: true, // Respect Student Opt-In
      },
    });

    if (connections.length === 0) return;

    const payload: CalendarEventPayload = {
      title: liveClass.title,
      description: liveClass.description || `Live Class for Batch ${liveClass.batchId}`,
      startDateTime: liveClass.scheduledStart.toISOString(),
      endDateTime: liveClass.scheduledEnd.toISOString(),
      joiningLink: liveClass.meetingCode ? `https://meet.jit.si/${liveClass.meetingCode}` : undefined,
    };

    // 3. Process each connection
    for (const conn of connections) {
      const lockKey = `${liveClass.tenantId}:${conn.userId}:LIVE_CLASS:${liveClassId}`;
      if (this.activeLocks.has(lockKey)) continue;

      this.activeLocks.add(lockKey);
      try {
        await this.syncUserEventWithRetry(conn, 'LIVE_CLASS', liveClassId, action, payload);
      } finally {
        this.activeLocks.delete(lockKey);
      }
    }
  }

  /**
   * Process Timetable Attendance Session sync
   */
  private async processAttendanceSessionSync(sessionId: string, action: 'CREATE' | 'UPDATE' | 'CANCEL' | 'DELETE') {
    const session = await this.prisma.attendanceSessions.findFirst({
      where: { id: sessionId, deletedAt: null },
    });

    if (!session) return;

    const targetUserIds = new Set<string>();
    if (session.staffProfileId) targetUserIds.add(session.staffProfileId);

    const enrollments = await (this.prisma as any).batchEnrollmentAdmissions.findMany({
      where: { tenantId: session.tenantId, batchId: session.batchId, status: 'ACTIVE', deletedAt: null },
      select: { studentAdmission: { select: { studentProfileId: true } } },
    });

    enrollments.forEach((e: any) => {
      if (e.studentAdmission?.studentProfileId) targetUserIds.add(e.studentAdmission.studentProfileId);
    });

    const userList = Array.from(targetUserIds);
    if (userList.length === 0) return;

    const connections = await (this.prisma as any).googleCalendarConnections.findMany({
      where: {
        userId: { in: userList },
        status: 'ACTIVE',
        autoSyncClasses: true,
      },
    });

    if (connections.length === 0) return;

    const payload: CalendarEventPayload = {
      title: `Class Session - ${session.remarks || 'Scheduled Subject'}`,
      description: session.cancelledReason ? `Cancelled: ${session.cancelledReason}` : `Timetable Session`,
      startDateTime: session.startsAt.toISOString(),
      endDateTime: session.endsAt.toISOString(),
    };

    for (const conn of connections) {
      const lockKey = `${session.tenantId}:${conn.userId}:ATTENDANCE_SESSION:${sessionId}`;
      if (this.activeLocks.has(lockKey)) continue;

      this.activeLocks.add(lockKey);
      try {
        await this.syncUserEventWithRetry(conn, 'ATTENDANCE_SESSION', sessionId, action, payload);
      } finally {
        this.activeLocks.delete(lockKey);
      }
    }
  }

  /**
   * Idempotently syncs event to Google API for a specific user connection with exponential retry strategy
   */
  private async syncUserEventWithRetry(
    conn: any,
    entityType: 'LIVE_CLASS' | 'ATTENDANCE_SESSION',
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'CANCEL' | 'DELETE',
    payload: CalendarEventPayload,
  ) {
    const existingSync = await (this.prisma as any).calendarEventSyncs.findUnique({
      where: {
        userId_entityType_entityId: {
          userId: conn.userId,
          entityType,
          entityId,
        },
      },
    });

    const accessToken = await this.googleAuthService.getValidAccessToken(conn.id);
    if (!accessToken) {
      this.logger.warn(`Skipping calendar sync for user ${conn.userId}: No valid access token`);
      return;
    }

    const delays = [0, 30000, 120000, 600000]; // 0s, 30s, 2m, 10m
    let lastError: string | null = null;

    for (let attempt = 0; attempt < delays.length; attempt++) {
      if (delays[attempt] > 0) {
        await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
      }

      try {
        if (action === 'DELETE' || action === 'CANCEL') {
          if (existingSync?.googleCalendarEventId) {
            await this.googleCalendarService.deleteEvent(accessToken, conn.calendarId, existingSync.googleCalendarEventId);
            await (this.prisma as any).calendarEventSyncs.update({
              where: { id: existingSync.id },
              data: { syncStatus: 'CANCELLED', lastSyncedAt: new Date() },
            });
          }
          return;
        }

        if (existingSync?.googleCalendarEventId) {
          // Update existing event
          await this.googleCalendarService.updateEvent(
            accessToken,
            conn.calendarId,
            existingSync.googleCalendarEventId,
            payload,
          );
          await (this.prisma as any).calendarEventSyncs.update({
            where: { id: existingSync.id },
            data: { syncStatus: 'SYNCED', lastSyncedAt: new Date(), lastError: null },
          });
        } else {
          // Insert new event
          const googleEventId = await this.googleCalendarService.createEvent(
            accessToken,
            conn.calendarId,
            payload,
          );
          await (this.prisma as any).calendarEventSyncs.upsert({
            where: {
              userId_entityType_entityId: {
                userId: conn.userId,
                entityType,
                entityId,
              },
            },
            create: {
              tenantId: conn.tenantId,
              userId: conn.userId,
              connectionId: conn.id,
              entityType,
              entityId,
              googleCalendarEventId: googleEventId,
              calendarId: conn.calendarId,
              syncStatus: 'SYNCED',
              lastSyncedAt: new Date(),
            },
            update: {
              googleCalendarEventId: googleEventId,
              syncStatus: 'SYNCED',
              lastSyncedAt: new Date(),
              lastError: null,
            },
          });
        }

        // Update connection last synced time
        await (this.prisma as any).googleCalendarConnections.update({
          where: { id: conn.id },
          data: { lastSyncedAt: new Date() },
        });

        this.logger.log(
          `🔔 [GOOGLE CALENDAR SYNC SUCCESS] Action: ${action} | User: ${conn.email || conn.userId} | Event: "${payload.title}" | Start: ${payload.startDateTime}`,
        );

        return; // Success!
      } catch (err: any) {
        lastError = err?.response?.data?.error?.message || err?.message || 'Unknown sync error';
        this.logger.warn(`Google Calendar sync attempt ${attempt + 1} failed for user ${conn.userId}: ${lastError}`);
      }
    }

    // Mark as FAILED if all retries exhausted
    if (existingSync) {
      await (this.prisma as any).calendarEventSyncs.update({
        where: { id: existingSync.id },
        data: { syncStatus: 'FAILED', lastError, lastSyncedAt: new Date() },
      });
    }
  }

  /**
   * Send a test notification event directly to Google Calendar and log to backend console
   */
  async sendTestNotification(tenantId: string, userId: string) {
    const conn = await (this.prisma as any).googleCalendarConnections.findFirst({
      where: { tenantId, userId, status: 'ACTIVE' },
    });

    if (!conn) {
      this.logger.warn(`[Test Notification Failed] User ${userId} has no active Google Calendar connection.`);
      return { success: false, message: 'No active Google Calendar connection found for this account.' };
    }

    const accessToken = await this.googleAuthService.getValidAccessToken(conn.id);
    if (!accessToken) {
      this.logger.warn(`[Test Notification Failed] Access token invalid or expired for user ${userId}`);
      return { success: false, message: 'Google authorization expired. Please reconnect.' };
    }

    const now = new Date();
    const testStart = new Date(now.getTime() + 15 * 60 * 1000); // 15 mins from now
    const testEnd = new Date(testStart.getTime() + 60 * 60 * 1000);

    const payload: CalendarEventPayload = {
      title: '🔔 Test Class Notification - NEET Platform',
      description: 'Test notification event generated from NEET Academy Platform to verify 15-minute popup alerts.',
      startDateTime: testStart.toISOString(),
      endDateTime: testEnd.toISOString(),
      joiningLink: 'https://meet.jit.si/neet-test-room',
    };

    const googleEventId = await this.googleCalendarService.createEvent(accessToken, conn.calendarId, payload);

    this.logger.log(`================================================================`);
    this.logger.log(`🔔 [TEST NOTIFICATION SUCCESS]`);
    this.logger.log(`   Connected Email : ${conn.email}`);
    this.logger.log(`   User ID         : ${conn.userId}`);
    this.logger.log(`   Event Summary   : "${payload.title}"`);
    this.logger.log(`   Scheduled Start : ${testStart.toLocaleString()}`);
    this.logger.log(`   Google Event ID : ${googleEventId}`);
    this.logger.log(`   Reminder Popup  : 15 minutes before class start`);
    this.logger.log(`================================================================`);

    return {
      success: true,
      email: conn.email,
      eventId: googleEventId,
      message: `Test event successfully sent to Google Calendar (${conn.email})! Popup alert set for 15 minutes before class.`,
    };
  }
}
