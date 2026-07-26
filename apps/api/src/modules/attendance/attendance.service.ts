import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(tenantId: string) {
    const batches = await this.prisma.batches.findMany({
      where: { tenantId, deletedAt: null, isActive: true },
      select: { id: true, name: true, code: true, courseId: true },
    });

    const allSessions = await this.prisma.attendanceSessions.findMany({
      where: { tenantId, deletedAt: null, sessionStatus: { not: 'CANCELLED' } },
      select: { id: true, batchId: true },
    });
    const sessionIds = allSessions.map((s) => s.id);
    const totalSessions = allSessions.length;

    const markedSessionIds = new Set<string>();
    if (sessionIds.length > 0) {
      const marked = await this.prisma.attendanceRecords.findMany({
        where: {
          tenantId,
          attendanceSessionId: { in: sessionIds },
          deletedAt: null,
        },
        select: { attendanceSessionId: true },
        distinct: ['attendanceSessionId'],
      });
      marked.forEach((m) => markedSessionIds.add(m.attendanceSessionId));
    }
    const markedSessions = markedSessionIds.size;

    const allRecords = await this.prisma.attendanceRecords.findMany({
      where: { tenantId, deletedAt: null },
      select: { attendanceStatus: true, studentAdmissionId: true },
    });

    const presentCount = allRecords.filter(
      (r) => r.attendanceStatus === 'PRESENT',
    ).length;
    const overallRate =
      allRecords.length > 0
        ? Math.round((presentCount / allRecords.length) * 100)
        : 0;

    const studentPresentMap = new Map<
      string,
      { total: number; present: number }
    >();
    for (const r of allRecords) {
      const cur = studentPresentMap.get(r.studentAdmissionId) ?? {
        total: 0,
        present: 0,
      };
      cur.total += 1;
      if (r.attendanceStatus === 'PRESENT') cur.present += 1;
      studentPresentMap.set(r.studentAdmissionId, cur);
    }

    let lowAttendanceStudents = 0;
    for (const stats of studentPresentMap.values()) {
      if (stats.total > 0 && (stats.present / stats.total) * 100 < 75) {
        lowAttendanceStudents += 1;
      }
    }

    const sessionByBatch = new Map<string, string[]>();
    for (const s of allSessions) {
      const list = sessionByBatch.get(s.batchId) ?? [];
      list.push(s.id);
      sessionByBatch.set(s.batchId, list);
    }

    const batchSummaries = await Promise.all(
      batches.map(async (b) => {
        const batchSessionIds = sessionByBatch.get(b.id) ?? [];
        const sessionsConducted = batchSessionIds.length;

        const batchMarkedIds = batchSessionIds.filter((sid) =>
          markedSessionIds.has(sid),
        );
        const sessionsMarked = batchMarkedIds.length;

        const enrollments = await this.prisma.studentBatchEnrollments.findMany({
          where: { batchId: b.id, status: 'ACTIVE', deletedAt: null },
          select: { studentAdmissionId: true },
        });
        const enrolledIds = new Set(
          enrollments.map((e) => e.studentAdmissionId),
        );

        let batchTotal = 0;
        let batchPresent = 0;
        let studentCount = 0;
        let below75Count = 0;

        for (const sid of enrolledIds) {
          const stats = studentPresentMap.get(sid);
          if (stats) {
            studentCount += 1;
            batchTotal += stats.total;
            batchPresent += stats.present;
            if ((stats.present / stats.total) * 100 < 75) below75Count += 1;
          }
        }

        const rate =
          batchTotal > 0 ? Math.round((batchPresent / batchTotal) * 100) : 0;

        return {
          batchId: b.id,
          batchName: b.name,
          batchCode: b.code,
          overallRate: rate,
          totalStudents: studentCount,
          sessionsConducted,
          sessionsMarked,
          studentsBelow75: below75Count,
        };
      }),
    );

    return {
      overview: {
        overallRate,
        totalSessions,
        markedSessions,
        pendingSessions: totalSessions - markedSessions,
        lowAttendanceStudents,
      },
      batches: batchSummaries,
    };
  }

  async getBatchDetail(tenantId: string, batchId: string) {
    const batch = await this.prisma.batches.findFirst({
      where: { id: batchId, tenantId, deletedAt: null },
      select: { id: true, name: true, code: true },
    });
    if (!batch) throw new NotFoundException('Batch not found');

    const sessions = await this.prisma.attendanceSessions.findMany({
      where: {
        tenantId,
        batchId,
        deletedAt: null,
        sessionStatus: { not: 'CANCELLED' },
      },
      select: { id: true, attendanceDate: true, subjectId: true },
      orderBy: { attendanceDate: 'desc' },
    });
    const sessionIds = sessions.map((s) => s.id);
    const sessionsConducted = sessionIds.length;

    const records = await this.prisma.attendanceRecords.findMany({
      where: {
        tenantId,
        attendanceSessionId: { in: sessionIds },
        deletedAt: null,
      },
      select: {
        id: true,
        attendanceStatus: true,
        studentAdmissionId: true,
        lateMinutes: true,
        markedAt: true,
        remarks: true,
        attendanceSessionId: true,
      },
    });

    const markedSessionIds = new Set(records.map((r) => r.attendanceSessionId));
    const sessionsMarked = markedSessionIds.size;

    const enrollments = await this.prisma.studentBatchEnrollments.findMany({
      where: { batchId, status: 'ACTIVE', deletedAt: null },
      select: { studentAdmissionId: true },
    });
    const enrollmentIds = new Set(enrollments.map((e) => e.studentAdmissionId));

    const studentStats = new Map<
      string,
      { present: number; absent: number; late: number; total: number }
    >();
    for (const r of records) {
      if (!enrollmentIds.has(r.studentAdmissionId)) continue;
      const cur = studentStats.get(r.studentAdmissionId) ?? {
        present: 0,
        absent: 0,
        late: 0,
        total: 0,
      };
      cur.total += 1;
      if (r.attendanceStatus === 'PRESENT') cur.present += 1;
      else if (r.attendanceStatus === 'ABSENT') cur.absent += 1;
      if (r.lateMinutes > 0) cur.late += 1;
      studentStats.set(r.studentAdmissionId, cur);
    }

    const admissionIds = Array.from(studentStats.keys());
    const admissions = await this.prisma.studentAdmissions.findMany({
      where: { id: { in: admissionIds }, tenantId },
      select: { id: true, studentProfileId: true },
    });

    const profileIds = admissions.map((a) => a.studentProfileId);
    const profiles = await this.prisma.studentProfiles.findMany({
      where: { userId: { in: profileIds }, tenantId, deletedAt: null },
      select: {
        userId: true,
        studentCode: true,
        userIdusers: { select: { firstName: true, lastName: true } },
      },
    });
    const profileMap = new Map(profiles.map((p) => [p.userId, p]));
    const admissionToProfile = new Map(
      admissions.map((a) => [a.id, a.studentProfileId]),
    );

    const totalPresent = records.filter(
      (r) => r.attendanceStatus === 'PRESENT',
    ).length;
    const overallRate =
      records.length > 0
        ? Math.round((totalPresent / records.length) * 100)
        : 0;

    const students = Array.from(studentStats.entries())
      .map(([admissionId, stats]) => {
        const profileId = admissionToProfile.get(admissionId);
        const profile = profileId ? profileMap.get(profileId) : undefined;
        const name = profile
          ? `${profile.userIdusers.firstName} ${profile.userIdusers.lastName}`
          : 'Unknown';
        const code = profile?.studentCode ?? '--';
        return {
          studentAdmissionId: admissionId,
          studentName: name,
          studentCode: code,
          present: stats.present,
          absent: stats.absent,
          late: stats.late,
          total: stats.total,
          rate:
            stats.total > 0
              ? Math.round((stats.present / stats.total) * 100)
              : null,
        };
      })
      .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0));

    return {
      batchId: batch.id,
      batchName: batch.name,
      batchCode: batch.code,
      overallRate,
      totalStudents: studentStats.size,
      sessionsConducted,
      sessionsMarked,
      students,
    };
  }

  async getStudentDetail(tenantId: string, studentAdmissionId: string) {
    const admission = await this.prisma.studentAdmissions.findFirst({
      where: { id: studentAdmissionId, tenantId, deletedAt: null },
      select: { studentProfileId: true },
    });
    if (!admission) throw new NotFoundException('Student admission not found');

    const profile = await this.prisma.studentProfiles.findFirst({
      where: { userId: admission.studentProfileId, tenantId, deletedAt: null },
      select: {
        studentCode: true,
        userIdusers: { select: { firstName: true, lastName: true } },
      },
    });
    if (!profile) throw new NotFoundException('Student profile not found');

    const studentName = `${profile.userIdusers.firstName} ${profile.userIdusers.lastName}`;
    const studentCode = profile.studentCode;

    const records = await this.prisma.attendanceRecords.findMany({
      where: { tenantId, studentAdmissionId, deletedAt: null },
      orderBy: { markedAt: 'desc' },
      take: 200,
      select: {
        id: true,
        attendanceSessionId: true,
        attendanceStatus: true,
        lateMinutes: true,
        markedAt: true,
        remarks: true,
      },
    });

    const total = records.length;
    const present = records.filter(
      (r) => r.attendanceStatus === 'PRESENT',
    ).length;
    const absent = records.filter(
      (r) => r.attendanceStatus === 'ABSENT',
    ).length;
    const late = records.filter((r) => r.lateMinutes > 0).length;
    const rate = total > 0 ? Math.round((present / total) * 100) : null;

    const sessionIds = records.map((r) => r.attendanceSessionId);
    const sessions = await this.prisma.attendanceSessions.findMany({
      where: { tenantId, id: { in: sessionIds }, deletedAt: null },
      select: { id: true, attendanceDate: true, subjectId: true },
    });
    const sessionMap = new Map(sessions.map((s) => [s.id, s]));

    const subjectIds = [...new Set(sessions.map((s) => s.subjectId))];
    const subjects =
      subjectIds.length > 0
        ? await this.prisma.subjects.findMany({
            where: { tenantId, id: { in: subjectIds } },
            select: { id: true, name: true, code: true },
          })
        : [];
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    return {
      studentAdmissionId,
      studentName,
      studentCode,
      summary: { total, present, absent, late, rate },
      records: records.map((r) => {
        const session = sessionMap.get(r.attendanceSessionId);
        return {
          id: r.id,
          date: session
            ? session.attendanceDate.toISOString().split('T')[0]
            : null,
          subject: session ? (subjectMap.get(session.subjectId) ?? null) : null,
          attendanceStatus: r.attendanceStatus,
          lateMinutes: r.lateMinutes,
          remarks: r.remarks,
          markedAt: r.markedAt,
        };
      }),
    };
  }
}
