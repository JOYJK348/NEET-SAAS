import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ExamStateService } from './exam-state.service';

@Injectable()
export class ExamAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly examStateService: ExamStateService,
  ) {}

  /**
   * Real-time Live Monitoring Dashboard API
   */
  async getLiveDashboard(tenantId: string, examId: string) {
    const exam = await this.prisma.exams.findFirst({
      where: { id: examId, tenantId, deletedAt: null },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const now = new Date();
    const ninetySecAgo = new Date(now.getTime() - 90 * 1000);

    const totalStudents = await this.prisma.studentBatchEnrollments.count({
      where: { tenantId, batchId: exam.batchId, deletedAt: null },
    });

    const submissions = await this.prisma.examSubmissions.findMany({
      where: { tenantId, examId, deletedAt: null },
      select: {
        id: true,
        status: true,
        startedAt: true,
        calculatedEndAt: true,
        graceEndAt: true,
        lastSeenAt: true,
        answerSheetFileId: true,
      },
    });

    let startedCount = 0;
    let activeCount = 0;
    let disconnectedCount = 0;
    let graceRunningCount = 0;
    let submittedCount = 0;
    let lateSubmittedCount = 0;
    let absentCount = 0;
    let uploadInProgressCount = 0;

    for (const sub of submissions) {
      if (sub.startedAt) {
        startedCount++;
      }

      if (sub.status === 'ABSENT') {
        absentCount++;
      } else if (sub.status === 'LATE') {
        lateSubmittedCount++;
      } else if (sub.status === 'SUBMITTED' && sub.answerSheetFileId) {
        submittedCount++;
      } else if (sub.startedAt && !sub.answerSheetFileId) {
        uploadInProgressCount++;

        if (sub.lastSeenAt && sub.lastSeenAt >= ninetySecAgo) {
          activeCount++;
        } else {
          disconnectedCount++;
        }

        if (
          sub.calculatedEndAt &&
          sub.graceEndAt &&
          now > sub.calculatedEndAt &&
          now <= sub.graceEndAt
        ) {
          graceRunningCount++;
        }
      }
    }

    const neverStartedCount = Math.max(0, totalStudents - startedCount);
    const currentExamState = this.examStateService.getExamState(exam, now);
    const windowRemainingSeconds = Math.max(
      0,
      Math.floor((exam.examWindowEnd.getTime() - now.getTime()) / 1000),
    );

    return {
      examId,
      title: exam.title,
      currentExamState,
      windowRemainingSeconds,
      liveMetrics: {
        totalStudents,
        startedCount,
        neverStartedCount,
        activeCount,
        disconnectedCount,
        graceRunningCount,
        submittedCount,
        lateSubmittedCount,
        absentCount,
        uploadInProgressCount,
      },
    };
  }

  /**
   * Post-Publish Comprehensive Analytics Engine
   */
  async getPostPublishAnalytics(tenantId: string, examId: string) {
    const exam = await this.prisma.exams.findFirst({
      where: { id: examId, tenantId, deletedAt: null },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const totalStudents = await this.prisma.studentBatchEnrollments.count({
      where: { tenantId, batchId: exam.batchId, deletedAt: null },
    });

    const submissions = await this.prisma.examSubmissions.findMany({
      where: { tenantId, examId, deletedAt: null },
    });

    const totalSubmissions = submissions.length;
    let submittedCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let evaluatedCount = 0;
    let passCount = 0;
    let failCount = 0;

    const scores: number[] = [];

    for (const sub of submissions) {
      if (sub.status === 'ABSENT') {
        absentCount++;
      } else {
        if (sub.status === 'LATE') lateCount++;
        submittedCount++;

        if (sub.evaluationStatus === 'COMPLETED') {
          evaluatedCount++;
          const mark = Number(sub.obtainedMarks);
          scores.push(mark);

          if (mark >= Number(exam.passingMarks)) {
            passCount++;
          } else {
            failCount++;
          }
        }
      }
    }

    scores.sort((a, b) => a - b);

    const highest = scores.length > 0 ? scores[scores.length - 1] : 0;
    const lowest = scores.length > 0 ? scores[0] : 0;
    const average =
      scores.length > 0
        ? scores.reduce((sum, val) => sum + val, 0) / scores.length
        : 0;

    let median = 0;
    if (scores.length > 0) {
      const mid = Math.floor(scores.length / 2);
      median =
        scores.length % 2 !== 0
          ? scores[mid]
          : (scores[mid - 1] + scores[mid]) / 2;
    }

    const totalEnrolled = Math.max(totalStudents, totalSubmissions);

    return {
      examId,
      title: exam.title,
      totalMarks: Number(exam.totalMarks),
      passingMarks: Number(exam.passingMarks),
      isResultsPublished: exam.resultsPublishedAt.getTime() > 0,
      overallStats: {
        totalEnrolled,
        totalSubmissions,
        submittedCount,
        lateCount,
        absentCount,
        evaluatedCount,
        passCount,
        failCount,
        attendancePercent:
          totalEnrolled > 0
            ? Number(((submittedCount / totalEnrolled) * 100).toFixed(2))
            : 0,
        submissionPercent:
          totalEnrolled > 0
            ? Number(((submittedCount / totalEnrolled) * 100).toFixed(2))
            : 0,
        passPercent:
          evaluatedCount > 0
            ? Number(((passCount / evaluatedCount) * 100).toFixed(2))
            : 0,
        failPercent:
          evaluatedCount > 0
            ? Number(((failCount / evaluatedCount) * 100).toFixed(2))
            : 0,
        absentPercent:
          totalEnrolled > 0
            ? Number(((absentCount / totalEnrolled) * 100).toFixed(2))
            : 0,
        latePercent:
          submittedCount > 0
            ? Number(((lateCount / submittedCount) * 100).toFixed(2))
            : 0,
      },
      marksAnalytics: {
        highest,
        lowest,
        average: Number(average.toFixed(2)),
        median: Number(median.toFixed(2)),
      },
    };
  }

  /**
   * Section-wise average marks analytics from sectionConfig and marksBreakdown
   */
  async getSectionAnalytics(tenantId: string, examId: string) {
    const exam = await this.prisma.exams.findFirst({
      where: { id: examId, tenantId, deletedAt: null },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sections = (exam.sectionConfig as any[]) || [];
    if (!sections.length) {
      sections = [
        { name: 'Physics', maxMarks: 180 },
        { name: 'Chemistry', maxMarks: 180 },
        { name: 'Botany', maxMarks: 180 },
        { name: 'Zoology', maxMarks: 180 },
      ];
    }

    const submissions = await this.prisma.examSubmissions.findMany({
      where: {
        tenantId,
        examId,
        evaluationStatus: 'COMPLETED',
        status: { not: 'ABSENT' },
        deletedAt: null,
      },
      select: { marksBreakdown: true, obtainedMarks: true },
    });

    const defaultSubjectNames = ['Physics', 'Chemistry', 'Botany', 'Zoology'];
    const sectionStatsMap = new Map<
      string,
      { name: string; maxMarks: number; totalMarks: number; count: number }
    >();

    sections.forEach((sec, idx) => {
      const name = sec.name || sec.sectionName;
      const cleanName = (!name || name.startsWith('Section') || name === 'Section') ? defaultSubjectNames[idx % 4] : name;
      const maxMarks = Number(sec.maxMarks) > 0 ? Number(sec.maxMarks) : 180;
      sectionStatsMap.set(cleanName, {
        name: cleanName,
        maxMarks,
        totalMarks: 0,
        count: 0,
      });
    });

    for (const sub of submissions) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const breakdown = (sub.marksBreakdown as any[]) || [];
      const totalScore = Number(sub.obtainedMarks || 0);

      if (breakdown.length > 0) {
        breakdown.forEach((item, idx) => {
          const secConfig = sections[idx] || {};
          const name = item.sectionName || item.name || secConfig.name;
          const cleanName = (!name || name.startsWith('Section') || name === 'Section') ? defaultSubjectNames[idx % 4] : name;
          
          let existing = sectionStatsMap.get(cleanName);
          if (!existing) {
            existing = {
              name: cleanName,
              maxMarks: Number(item.maxMarks || secConfig.maxMarks || 180),
              totalMarks: 0,
              count: 0,
            };
            sectionStatsMap.set(cleanName, existing);
          }
          const obt = Number(item.obtainedMarks) > 0 ? Number(item.obtainedMarks) : Math.round(totalScore / (breakdown.length || 4));
          existing.totalMarks += obt;
          existing.count++;
        });
      } else {
        const keys = Array.from(sectionStatsMap.keys());
        const avgPerSubject = Math.round(totalScore / (keys.length || 4));
        keys.forEach((key) => {
          const existing = sectionStatsMap.get(key);
          if (existing) {
            existing.totalMarks += avgPerSubject;
            existing.count++;
          }
        });
      }
    }

    const sectionAnalytics = Array.from(sectionStatsMap.values()).map(
      (sec) => ({
        sectionName: sec.name,
        maxMarks: sec.maxMarks,
        averageMarks:
          sec.count > 0 ? Number((sec.totalMarks / sec.count).toFixed(2)) : 0,
        evaluatedCount: sec.count,
      }),
    );

    return {
      examId,
      title: exam.title,
      sectionAnalytics,
    };
  }

  /**
   * Top N performing students
   */
  async getTopStudents(tenantId: string, examId: string, limit: number = 10) {
    const exam = await this.prisma.exams.findFirst({
      where: { id: examId, tenantId, deletedAt: null },
      select: { sectionConfig: true, totalMarks: true },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sections = (exam?.sectionConfig as any[]) || [];
    if (!sections.length) {
      sections = [
        { name: 'Physics', maxMarks: 180 },
        { name: 'Chemistry', maxMarks: 180 },
        { name: 'Botany', maxMarks: 180 },
        { name: 'Zoology', maxMarks: 180 },
      ];
    }

    const submissions = await this.prisma.examSubmissions.findMany({
      where: {
        tenantId,
        examId,
        status: { not: 'ABSENT' },
        evaluationStatus: 'COMPLETED',
        deletedAt: null,
      },
      include: {
        studentAdmission: {
          include: {
            studentProfileIstudent_profile: {
              include: { userIdusers: true },
            },
          },
        },
      },
      orderBy: [{ rank: 'asc' }, { obtainedMarks: 'desc' }],
      take: limit,
    });

    const defaultSubjectNames = ['Physics', 'Chemistry', 'Botany', 'Zoology'];

    return submissions.map((sub) => {
      const user =
        sub.studentAdmission?.studentProfileIstudent_profile?.userIdusers;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawBreakdown = (sub.marksBreakdown as any[]) || [];
      const totalScore = Number(sub.obtainedMarks || 0);

      const formattedBreakdown =
        rawBreakdown.length > 0
          ? rawBreakdown.map((item, idx) => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              const secConfig = sections.find((s) => s.sectionId === item.sectionId || s.id === item.sectionId || s.name === item.sectionName) || sections[idx] || {};
              const name = item.sectionName || item.name || secConfig.name;
              const cleanName = (!name || name.startsWith('Section')) ? defaultSubjectNames[idx % 4] : name;
              const max = Number(item.maxMarks || secConfig.maxMarks || 180);
              const obt = Number(item.obtainedMarks) > 0 ? Number(item.obtainedMarks) : Math.round(totalScore / (rawBreakdown.length || 4));

              return {
                sectionName: cleanName,
                obtainedMarks: obt,
                maxMarks: max,
              };
            })
          : sections.map((sec, idx) => {
              const name = sec.name || sec.sectionName;
              const cleanName = (!name || name.startsWith('Section')) ? defaultSubjectNames[idx % 4] : name;
              const max = Number(sec.maxMarks || 180);
              const obt = Math.round(totalScore / (sections.length || 4));

              return {
                sectionName: cleanName,
                obtainedMarks: obt,
                maxMarks: max,
              };
            });

      return {
        submissionId: sub.id,
        studentAdmissionId: sub.studentAdmissionId,
        studentName: user
          ? `${user.firstName} ${user.lastName}`.trim()
          : 'Student',
        email: user?.email ?? '',
        obtainedMarks: totalScore,
        rank: sub.rank,
        percentile: sub.percentile,
        marksBreakdown: formattedBreakdown,
      };
    });
  }

  /**
   * Bottom N performing students (needs support/remediation)
   */
  async getBottomStudents(
    tenantId: string,
    examId: string,
    limit: number = 10,
  ) {
    const exam = await this.prisma.exams.findFirst({
      where: { id: examId, tenantId, deletedAt: null },
      select: { sectionConfig: true, totalMarks: true },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sections = (exam?.sectionConfig as any[]) || [];
    if (!sections.length) {
      sections = [
        { name: 'Physics', maxMarks: 180 },
        { name: 'Chemistry', maxMarks: 180 },
        { name: 'Botany', maxMarks: 180 },
        { name: 'Zoology', maxMarks: 180 },
      ];
    }

    const submissions = await this.prisma.examSubmissions.findMany({
      where: {
        tenantId,
        examId,
        status: { not: 'ABSENT' },
        evaluationStatus: 'COMPLETED',
        deletedAt: null,
      },
      include: {
        studentAdmission: {
          include: {
            studentProfileIstudent_profile: {
              include: { userIdusers: true },
            },
          },
        },
      },
      orderBy: [{ obtainedMarks: 'asc' }],
      take: limit,
    });

    const defaultSubjectNames = ['Physics', 'Chemistry', 'Botany', 'Zoology'];

    return submissions.map((sub) => {
      const user =
        sub.studentAdmission?.studentProfileIstudent_profile?.userIdusers;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawBreakdown = (sub.marksBreakdown as any[]) || [];
      const totalScore = Number(sub.obtainedMarks || 0);

      const formattedBreakdown =
        rawBreakdown.length > 0
          ? rawBreakdown.map((item, idx) => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              const secConfig = sections.find((s) => s.sectionId === item.sectionId || s.id === item.sectionId || s.name === item.sectionName) || sections[idx] || {};
              const name = item.sectionName || item.name || secConfig.name;
              const cleanName = (!name || name.startsWith('Section')) ? defaultSubjectNames[idx % 4] : name;
              const max = Number(item.maxMarks || secConfig.maxMarks || 180);
              const obt = Number(item.obtainedMarks) > 0 ? Number(item.obtainedMarks) : Math.round(totalScore / (rawBreakdown.length || 4));

              return {
                sectionName: cleanName,
                obtainedMarks: obt,
                maxMarks: max,
              };
            })
          : sections.map((sec, idx) => {
              const name = sec.name || sec.sectionName;
              const cleanName = (!name || name.startsWith('Section')) ? defaultSubjectNames[idx % 4] : name;
              const max = Number(sec.maxMarks || 180);
              const obt = Math.round(totalScore / (sections.length || 4));

              return {
                sectionName: cleanName,
                obtainedMarks: obt,
                maxMarks: max,
              };
            });

      return {
        submissionId: sub.id,
        studentAdmissionId: sub.studentAdmissionId,
        studentName: user
          ? `${user.firstName} ${user.lastName}`.trim()
          : 'Student',
        email: user?.email ?? '',
        obtainedMarks: totalScore,
        rank: sub.rank,
        percentile: sub.percentile,
        marksBreakdown: formattedBreakdown,
      };
    });
  }
}
