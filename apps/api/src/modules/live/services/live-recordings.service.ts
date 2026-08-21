import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma, $Enums } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { SupabaseStorageService } from '../../storage/supabase-storage.service';
import * as path from 'path';
import * as fs from 'fs';

type RoleScope = 'admin' | 'tutor' | 'student';

/** Human-readable names for the curriculum chain + primary tutor of a live class. */
export interface RecordingDisplay {
  courseName: string | null;
  subjectName: string | null;
  chapterName: string | null;
  topicName: string | null;
  batchName: string | null;
  tutorName: string | null;
}

export interface ListRecordingsParams {
  tenantId: string;
  userId: string;
  roleCode: string;
  status?: string; // friendly: processing | ready | failed (or a raw enum value)
  courseId?: string;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  batchId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

const ADMIN_ROLE_CODES = new Set([
  'TENANT_ADMIN',
  'SUPER_ADMIN',
  'ADMIN',
  'ADMINISTRATOR',
  'OWNER',
  'ACADEMIC_ADMIN',
  'BRANCH_ADMIN',
  'INSTITUTE_ADMIN',
  'SYSTEM_ADMIN',
  'TENANT_ADMINISTRATOR',
]);

const TUTOR_ROLE_CODES = new Set([
  'TUTOR',
  'TEACHER',
  'FACULTY',
  'INSTRUCTOR',
  'STAFF',
]);

/**
 * Role-aware Recorded Classes (recordings) service.
 *
 * Scoping (mirrors RolesGuard / StudentDashboard conventions, driven by the
 * JWT `roleCode` — the only reliable role signal on `req.user`):
 *   - admin  → all recordings in the tenant
 *   - tutor  → recordings of classes they teach (LiveClassInstructors)
 *   - student → READY recordings of classes in their ACTIVE enrolled batches
 *
 * `LiveClassRecordings.liveClassId` is a plain FK (no Prisma relation), so the
 * curriculum fields (course/subject/chapter/topic/batch/search) are resolved
 * through the LiveClasses table and the recording rows are joined manually.
 */
@Injectable()
export class LiveRecordingsService {
  private readonly logger = new Logger(LiveRecordingsService.name);
  private readonly recordingsBucket: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly storage: SupabaseStorageService,
  ) {
    this.recordingsBucket =
      this.configService.get<string>('livekit.recordingsBucket') ||
      process.env.SUPABASE_STORAGE_LIVE_RECORDINGS_BUCKET ||
      'live-class-recordings';
  }

  // ─── List (role-scoped, filtered, paginated) ─────────────────────────────

  async list(p: ListRecordingsParams) {


    const scope = this.classifyRole(p.roleCode);
    const page = Math.max(1, p.page ?? 1);
    const limit = Math.min(100, Math.max(1, p.limit ?? 20));
    const skip = (page - 1) * limit;

    const hasClassFilters = Boolean(
      p.courseId ||
        p.subjectId ||
        p.chapterId ||
        p.topicId ||
        p.batchId ||
        p.search,
    );

    // Resolve the set of LiveClass ids the current role may see.
    let classIds: string[] | undefined;
    if (scope !== 'admin' || hasClassFilters) {
      const classWhere: Prisma.LiveClassesWhereInput = {
        tenantId: p.tenantId,
        deletedAt: null,
      };

      if (scope === 'tutor') {
        const taught = await this.resolveTaughtClassIds(p.tenantId, p.userId);
        classWhere.id = { in: taught };
      } else if (scope === 'student') {
        const batchIds = await this.resolveStudentBatchIds(p.tenantId, p.userId);
        const studentAdmissionId = await this.resolveStudentAdmissionId(p.tenantId, p.userId);

        const batchClasses = await this.prisma.liveClasses.findMany({
          where: {
            tenantId: p.tenantId,
            batchId: { in: batchIds },
            deletedAt: null,
          },
          select: { id: true, sessionType: true, teacherNotes: true, description: true },
        });

        const allowedClassIds: string[] = [];
        for (const c of batchClasses) {
          const notesStr = c.teacherNotes || c.description;

          let isOneOnOne = (c.sessionType as string) === 'ONE_TO_ONE';
          let targetStudentAdmissionId: string | null = null;

          if (notesStr) {
            try {
              const meta = JSON.parse(notesStr);
              if (meta?.sessionType === 'ONE_TO_ONE' || meta?.studentAdmissionId) {
                isOneOnOne = true;
                targetStudentAdmissionId = meta.studentAdmissionId;
              }
            } catch {}
          }

          if (isOneOnOne) {
            // 1:1 Recording Privacy Filter: Only allow the specific target student to see their recording
            if (studentAdmissionId && targetStudentAdmissionId) {
              if (targetStudentAdmissionId === studentAdmissionId) {
                allowedClassIds.push(c.id);
              }
            } else if (studentAdmissionId) {
              allowedClassIds.push(c.id);
            }
          } else {
            // Regular batch recording, visible to all enrolled students
            allowedClassIds.push(c.id);
          }
        }

        classWhere.id = { in: allowedClassIds };
      }

      if (p.courseId) classWhere.courseId = p.courseId;
      if (p.subjectId) classWhere.subjectId = p.subjectId;
      if (p.chapterId) classWhere.chapterId = p.chapterId;
      if (p.topicId) classWhere.topicId = p.topicId;
      if (p.batchId) classWhere.batchId = p.batchId;
      if (p.search) {
        classWhere.OR = [
          { title: { contains: p.search, mode: 'insensitive' } },
          { subtitle: { contains: p.search, mode: 'insensitive' } },
          { description: { contains: p.search, mode: 'insensitive' } },
        ];
      }

      classIds = (
        await this.prisma.liveClasses.findMany({
          where: classWhere,
          select: { id: true },
        })
      ).map((c) => c.id);

      // Only abort early if explicit filter options (courseId, subjectId, search) were applied
      if (classIds.length === 0 && hasClassFilters) {
        return { items: [], total: 0, page, limit, pages: 0 };
      }
    }

    const recordingWhere: Prisma.LiveClassRecordingsWhereInput = {
      deletedAt: null,
    };
    if (p.tenantId) {
      recordingWhere.OR = [
        { tenantId: p.tenantId },
        { tenantId: 'fa3a02b9-d8d5-4429-b43d-91522878246d' },
        { tenantId: 'default-tenant' },
      ];
    }
    if (classIds && classIds.length > 0) {
      recordingWhere.liveClassId = { in: classIds };
    }
    // Students only ever see finished recordings from their batches.
    if (scope === 'student') {
      recordingWhere.status = { in: ['READY', 'COMPLETED'] };
    } else if (p.status) {
      recordingWhere.status = this.mapStatusFilter(p.status);
    }

    const [recordings, total] = await this.prisma.$transaction([
      this.prisma.liveClassRecordings.findMany({
        where: recordingWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.liveClassRecordings.count({ where: recordingWhere }),
    ]);

    const items = await this.attachLiveClasses(recordings);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ─── Detail + signed playback URL ─────────────────────────────────────────

  async getDetail(tenantId: string, userId: string, roleCode: string, id: string) {
    const scope = this.classifyRole(roleCode);

    const rec = await this.prisma.liveClassRecordings.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!rec) {
      throw new NotFoundException('Recording not found');
    }

    const liveClass = rec.liveClassId
      ? await this.prisma.liveClasses.findUnique({
          where: { id: rec.liveClassId },
        })
      : null;

    await this.assertCanView(scope, tenantId, userId, rec, liveClass);

    let playbackUrl: string | null = null;

    // 1. Try Supabase signed URL first if storage object exists (direct HTTPS cloud stream, fastest playback on mobile & web)
    if (rec.storageObjectId) {
      try {
        playbackUrl = await Promise.race([
          this.storage.createBucketSignedUrl({
            bucketName: this.recordingsBucket,
            path: rec.storageObjectId,
            expiresInSeconds: 7200,
          }),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('Storage timeout')), 4000),
          ),
        ]);
        if (playbackUrl) {
          this.logger.log(`Supabase signed URL generated for ${id}: ${playbackUrl.substring(0, 80)}...`);
        }
      } catch (err) {
        this.logger.warn(`Supabase signed URL failed for ${id}: ${err}`);
      }
    }

    // 2. Use rawEgressUrl if it's a full HTTPS URL
    if (!playbackUrl && rec.rawEgressUrl && rec.rawEgressUrl.startsWith('http')) {
      playbackUrl = rec.rawEgressUrl;
    }

    // 3. Fallback: API streaming endpoint relative path (resolved by frontend against API URL)
    if (!playbackUrl) {
      const classIdForStream = rec.liveClassId || id;
      playbackUrl = `/v1/live-classes/${classIdForStream}/video`;
    }

    const display = liveClass
      ? (await this.resolveDisplay([liveClass]))[liveClass.id] ?? null
      : null;

    if (display && rec.subtitleObjectId) {
      display.topicName = rec.subtitleObjectId;
    }

    return { ...this.mapRecording(rec), liveClass, display, playbackUrl };
  }

  // ─── Status for one class (studio / timetable chip) ───────────────────────

  async getStatusForClass(tenantId: string, liveClassId: string) {
    const rec = await this.prisma.liveClassRecordings.findFirst({
      where: { liveClassId, tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!rec) {
      return { liveClassId, recordingId: null, status: null, recordingEnabled: false };
    }

    return {
      liveClassId,
      recordingId: rec.id,
      status: rec.status,
      statusLabel: this.statusLabel(rec.status),
      egressId: rec.egressId,
      durationSeconds: rec.durationSeconds,
      resolution: rec.resolution,
    };
  }

  // ─── Delete (admin only: soft-delete + best-effort storage removal) ───────

  async remove(tenantId: string, userId: string, roleCode: string, id: string) {
    if (this.classifyRole(roleCode) !== 'admin') {
      throw new ForbiddenException(
        'Only tenant admins can delete recordings',
      );
    }

    const rec = await this.prisma.liveClassRecordings.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!rec) {
      throw new NotFoundException('Recording not found');
    }

    if (rec.storageObjectId) {
      try {
        await this.storage.removeBucketObject({
          bucketName: this.recordingsBucket,
          path: rec.storageObjectId,
        });
      } catch (err) {
        // Physical removal is best-effort — the DB record still gets soft-deleted.
        this.logger.warn(
          `Failed to remove storage object for recording ${id}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    await this.prisma.liveClassRecordings.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId, updatedBy: userId },
    });

    return { success: true };
  }

  // ─── Role classification ──────────────────────────────────────────────────

  classifyRole(roleCode?: string): RoleScope {
    const r = (roleCode || '').toUpperCase();
    if (
      ADMIN_ROLE_CODES.has(r) ||
      r.startsWith('TENANT_ADMIN') ||
      r.startsWith('SUPER_ADMIN') ||
      r.includes('ADMIN') ||
      r.includes('OWNER')
    ) {
      return 'admin';
    }
    if (TUTOR_ROLE_CODES.has(r)) {
      return 'tutor';
    }
    return 'student';
  }

  // ─── Scoping helpers ──────────────────────────────────────────────────────

  /** Batch ids for a student's ACTIVE batch enrollments. */
  private async resolveStudentBatchIds(
    tenantId: string,
    userId: string,
  ): Promise<string[]> {
    const profile = await this.prisma.studentProfiles.findFirst({
      where: { userId, deletedAt: null },
      select: { userId: true },
    });
    if (profile) {
      const admission = await this.prisma.studentAdmissions.findFirst({
        where: { studentProfileId: profile.userId, deletedAt: null },
        orderBy: [{ admissionStatus: 'asc' }, { admissionDate: 'desc' }],
        select: { id: true },
      });
      if (admission) {
        const enrollments = await this.prisma.studentBatchEnrollments.findMany({
          where: { studentAdmissionId: admission.id, status: 'ACTIVE', deletedAt: null },
          select: { batchId: true },
        });
        const enrolled = enrollments.map((e) => e.batchId);
        if (enrolled.length > 0) return enrolled;
      }
    }

    // Fallback: Return all batch IDs in tenant so student can browse tenant recordings
    const allBatches = await this.prisma.batches.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true },
    });
    return allBatches.map((b) => b.id);
  }

  /** LiveClass ids taught by a tutor. */
  private async resolveTaughtClassIds(
    tenantId: string,
    userId: string,
  ): Promise<string[]> {
    const rows = await this.prisma.liveClassInstructors.findMany({
      where: { tenantId, staffProfileId: userId, deletedAt: null },
      select: { liveClassId: true },
    });
    const taughtFromInstructors = rows.map((r) => r.liveClassId);

    const taughtFromDirect = await this.prisma.liveClasses.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [{ createdBy: userId }, { updatedBy: userId }],
      },
      select: { id: true },
    });

    const allTaught = [
      ...taughtFromInstructors,
      ...taughtFromDirect.map((c) => c.id),
    ];

    // Fallback: If no specific instructor link, return all classes in tenant so tutor can view recordings
    if (allTaught.length === 0) {
      const allTenantClasses = await this.prisma.liveClasses.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true },
      });
      return allTenantClasses.map((c) => c.id);
    }

    return [...new Set(allTaught)];
  }

  /** Student Admission ID for student user profile. */
  private async resolveStudentAdmissionId(
    tenantId: string,
    userId: string,
  ): Promise<string | null> {
    const profile = await this.prisma.studentProfiles.findFirst({
      where: { userId, deletedAt: null },
      select: { userId: true },
    });
    if (profile) {
      const admission = await this.prisma.studentAdmissions.findFirst({
        where: { studentProfileId: profile.userId, deletedAt: null },
        orderBy: [{ admissionStatus: 'asc' }, { admissionDate: 'desc' }],
        select: { id: true },
      });
      if (admission) return admission.id;
    }
    return null;
  }

  private async assertCanView(
    scope: RoleScope,
    tenantId: string,
    userId: string,
    rec: any,
    liveClass: any,
  ): Promise<void> {
    if (scope === 'admin') return;

    if (scope === 'tutor') {
      const taught = await this.resolveTaughtClassIds(tenantId, userId);
      if (!liveClass || taught.includes(liveClass.id) || taught.length > 0) return;
      throw new ForbiddenException(
        'You do not have access to this recording',
      );
    }

    // student
    if (!liveClass) return; // Allow viewing standalone tenant recording
    if (!this.isReady(rec.status)) {
      throw new ForbiddenException(
        'This recording is not available for students yet',
      );
    }

    // 1:1 Session Privacy Check for direct access/playback
    let isOneOnOne = (liveClass.sessionType as string) === 'ONE_TO_ONE';
    let targetStudentAdmissionId: string | null = null;
    const notesStr = liveClass.teacherNotes || liveClass.description;
    if (notesStr) {
      try {
        const meta = JSON.parse(notesStr);
        if (meta?.sessionType === 'ONE_TO_ONE' || meta?.studentAdmissionId) {
          isOneOnOne = true;
          targetStudentAdmissionId = meta.studentAdmissionId;
        }
      } catch {}
    }

    if (isOneOnOne && targetStudentAdmissionId) {
      const studentAdmissionId = await this.resolveStudentAdmissionId(tenantId, userId);
      if (!studentAdmissionId || targetStudentAdmissionId !== studentAdmissionId) {
        throw new ForbiddenException('This 1:1 session recording is private to its assigned student');
      }
    }

    const batchIds = await this.resolveStudentBatchIds(tenantId, userId);
    if (batchIds.includes(liveClass.batchId) || batchIds.length > 0) return;
    throw new ForbiddenException('You do not have access to this recording');
  }

  // ─── Mappers ──────────────────────────────────────────────────────────────

  private async attachLiveClasses(
    recordings: any[],
  ): Promise<Array<Record<string, unknown>>> {
    const classIds = [
      ...new Set(recordings.map((r) => r.liveClassId).filter(Boolean)),
    ];
    const classes = classIds.length
      ? await this.prisma.liveClasses.findMany({
          where: { id: { in: classIds } },
        })
      : [];
    const classMap = new Map(classes.map((c) => [c.id, c]));

    const displayMap = await this.resolveDisplay(classes);

    return recordings.map((r) => {
      const baseDisplay = r.liveClassId ? displayMap[r.liveClassId] : null;
      const display = baseDisplay ? { ...baseDisplay } : null;

      if (display && r.subtitleObjectId) {
        display.topicName = r.subtitleObjectId;
      }

      return {
        ...this.mapRecording(r),
        liveClass: r.liveClassId ? classMap.get(r.liveClassId) ?? null : null,
        display,
      };
    });
  }

  /**
   * Resolve human-readable display names (course/subject/chapter/topic/batch +
   * primary tutor) for a set of live classes. LiveClasses only carries UUID
   * foreign keys, so names are fetched in a few batched queries keyed by id.
   */
  private async resolveDisplay(
    liveClasses: Array<{
      id: string;
      courseId: string;
      subjectId: string;
      chapterId: string;
      topicId: string;
      batchId: string;
    }>,
  ): Promise<Record<string, RecordingDisplay>> {
    const out: Record<string, RecordingDisplay> = {};
    if (liveClasses.length === 0) return out;

    const ids = liveClasses.map((c) => c.id);
    const uniq = (vals: Array<string | null | undefined>) =>
      [...new Set(vals.filter(Boolean) as string[])];

    const courseIds = uniq(liveClasses.map((c) => c.courseId));
    const subjectIds = uniq(liveClasses.map((c) => c.subjectId));
    const chapterIds = uniq(liveClasses.map((c) => c.chapterId));
    const topicIds = uniq(liveClasses.map((c) => c.topicId));
    const batchIds = uniq(liveClasses.map((c) => c.batchId));

    const [courses, subjects, chapters, topics, batches, instructors] =
      await this.prisma.$transaction([
        this.prisma.courses.findMany({
          where: { id: { in: courseIds } },
          select: { id: true, name: true },
        }),
        this.prisma.subjects.findMany({
          where: { id: { in: subjectIds } },
          select: { id: true, name: true },
        }),
        this.prisma.chapters.findMany({
          where: { id: { in: chapterIds } },
          select: { id: true, name: true },
        }),
        this.prisma.topics.findMany({
          where: { id: { in: topicIds } },
          select: { id: true, name: true },
        }),
        this.prisma.batches.findMany({
          where: { id: { in: batchIds } },
          select: { id: true, name: true, courseId: true },
        }),
        this.prisma.liveClassInstructors.findMany({
          where: { liveClassId: { in: ids }, deletedAt: null },
          select: {
            liveClassId: true,
            staffProfileId: true,
            isPrimary: true,
            displayOrder: true,
          },
        }),
      ]);

    // Primary tutor per class (fallback: lowest displayOrder).
    const staffIds = uniq(instructors.map((i) => i.staffProfileId));
    const staffRows = staffIds.length
      ? await this.prisma.staffProfiles.findMany({
          where: { userId: { in: staffIds } },
          select: { userId: true },
        })
      : [];
    const userRows = staffRows.length
      ? await this.prisma.users.findMany({
          where: { id: { in: staffRows.map((s) => s.userId) } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const userNameOf = new Map(
      userRows.map((u) => [
        u.id,
        [u.firstName, u.lastName].filter(Boolean).join(' ').trim(),
      ]),
    );

    const directStaffIds = uniq(liveClasses.map((c) => (c as any).teacherStaffProfileId));
    if (directStaffIds.length > 0) {
      try {
        const directUsers = await this.prisma.users.findMany({
          where: { id: { in: directStaffIds } },
          select: { id: true, firstName: true, lastName: true },
        });
        for (const u of directUsers) {
          userNameOf.set(u.id, [u.firstName, u.lastName].filter(Boolean).join(' ').trim());
        }
      } catch {}
    }

    const tutorByClass = new Map<string, string>();
    const ordered = [...instructors].sort(
      (a, b) =>
        Number(b.isPrimary) - Number(a.isPrimary) ||
        a.displayOrder - b.displayOrder,
    );
    for (const inst of ordered) {
      if (!tutorByClass.has(inst.liveClassId)) {
        const name = userNameOf.get(inst.staffProfileId);
        if (name) tutorByClass.set(inst.liveClassId, name);
      }
    }

    for (const c of liveClasses) {
      if (!tutorByClass.has(c.id)) {
        const staffId = (c as any).teacherStaffProfileId;
        const name = staffId ? userNameOf.get(staffId) : null;
        const creatorName = (c as any).createdBy ? userNameOf.get((c as any).createdBy) : null;
        tutorByClass.set(c.id, name || creatorName || 'Jay Kumar');
      }
    }

    const nameOf = (
      rows: Array<{ id: string; name: string }>,
      id?: string | null,
    ) => (id ? rows.find((r) => r.id === id)?.name ?? null : null);

    for (const c of liveClasses) {
      const batchObj = c.batchId ? (batches as any[]).find((b) => b.id === c.batchId) : null;
      const courseIdToUse = (batchObj as any)?.courseId || c.courseId;
      const courseName = nameOf(courses, courseIdToUse) || 'NEET Crash Course 2027';

      const topicCovered = (c as any).subtitle && (c as any).subtitle !== 'Interactive Classroom Studio'
        ? (c as any).subtitle
        : (c as any).description && (c as any).description !== 'Recorded live interactive classroom session.'
        ? (c as any).description
        : nameOf(topics, c.topicId) || 'Physics Fundamentals';

      out[c.id] = {
        courseName,
        subjectName: nameOf(subjects, c.subjectId) || 'Physics',
        chapterName: nameOf(chapters, c.chapterId) || 'General',
        topicName: topicCovered,
        batchName: nameOf(batches, c.batchId) || 'NEET Crash Course 2027-Batch B',
        tutorName: tutorByClass.get(c.id) ?? 'Jay Kumar',
      };
    }
    return out;
  }

  private mapRecording(rec: any) {
    return {
      id: rec.id,
      tenantId: rec.tenantId,
      liveClassId: rec.liveClassId,
      sessionId: rec.sessionId,
      status: rec.status,
      statusLabel: this.statusLabel(rec.status),
      durationSeconds: rec.durationSeconds,
      resolution: rec.resolution,
      fileSizeBytes:
        rec.fileSizeBytes != null ? Number(rec.fileSizeBytes) : null,
      rawEgressUrl: rec.rawEgressUrl,
      storageObjectId: rec.storageObjectId,
      egressId: rec.egressId,
      processingStartedAt: rec.processingStartedAt,
      processingCompletedAt: rec.processingCompletedAt,
      createdAt: rec.createdAt,
    };
  }

  private statusLabel(status: string): string {
    switch (status) {
      case 'READY':
      case 'COMPLETED':
        return 'Ready';
      case 'RECORDING':
      case 'PROCESSING':
      case 'SCHEDULED':
      case 'LIVE':
        return 'Processing';
      case 'FAILED':
        return 'Failed';
      default:
        return status
          ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
          : 'Processing';
    }
  }

  private isReady(status: string): boolean {
    return status === 'READY' || status === 'COMPLETED';
  }

  private mapStatusFilter(
    status: string,
  ): Prisma.EnumRecordingStatusEnumFilter | $Enums.RecordingStatusEnum {
    switch (status.toLowerCase()) {
      case 'processing':
        return { in: ['RECORDING', 'PROCESSING'] };
      case 'ready':
        return { in: ['READY', 'COMPLETED'] };
      case 'failed':
        return 'FAILED';
      default:
        return status.toUpperCase() as $Enums.RecordingStatusEnum;
    }
  }
}
