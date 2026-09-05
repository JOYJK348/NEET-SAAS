import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TenantDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(tenantId: string) {
    if (!tenantId) {
      return this.getEmptyStats();
    }

    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    // Parallelize all real database queries
    const [
      totalStudents,
      totalBatches,
      totalExams,
      totalBranches,
      totalTutors,
      recentAdmissionsRaw,
      upcomingExamsRaw,
      activeLiveClassesRaw,
      runningBatchesRaw,
      recentEndedClassesRaw,
      feeAssignmentAgg,
      attendanceStatsAgg,
    ] = await Promise.all([
      // 1. Total Active Students
      this.prisma.studentProfiles.count({
        where: { tenantId, academicStatus: 'ACTIVE', deletedAt: null },
      }),
      // 2. Total Active Batches
      this.prisma.batches.count({
        where: { tenantId, isActive: true, deletedAt: null },
      }),
      // 3. Total Mock Tests / Exams
      this.prisma.exams.count({
        where: { tenantId, deletedAt: null },
      }),
      // 4. Total Branches
      this.prisma.branches.count({
        where: { tenantId, deletedAt: null },
      }),
      // 5. Total Tutors / Faculty
      this.prisma.staffProfiles.count({
        where: { tenantId, deletedAt: null },
      }),
      // 6. Recent Admissions (top 5)
      this.prisma.studentAdmissions.findMany({
        where: { tenantId, deletedAt: null },
        include: {
          studentProfileIstudent_profile: {
            include: {
              userIdusers: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // 7. Upcoming Exams (top 4)
      this.prisma.exams.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 4,
      }),
      // 8. Live Classes (LIVE or scheduled for today)
      this.prisma.liveClasses.findMany({
        where: {
          tenantId,
          deletedAt: null,
          OR: [
            { status: 'LIVE' },
            {
              scheduledStart: {
                gte: startOfDay,
                lte: endOfDay,
              },
            },
          ],
        },
        orderBy: [{ scheduledStart: 'asc' }],
        take: 2,
      }),
      // 9. Running Batches
      this.prisma.batches.findMany({
        where: { tenantId, isActive: true, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 4,
      }),
      // 10. Recent Live Class Recordings (Ended Classes)
      this.prisma.liveClasses.findMany({
        where: {
          tenantId,
          status: 'ENDED',
          deletedAt: null,
        },
        orderBy: { updatedAt: 'desc' },
        take: 4,
      }),
      // 11. Fee Collection Aggregates
      this.prisma.studentFeeAssignments.aggregate({
        where: { tenantId, deletedAt: null },
        _sum: {
          baseAmount: true,
          finalAmount: true,
          outstandingAmount: true,
        },
      }),
      // 12. Attendance Records Count
      this.prisma.attendanceRecords.count({
        where: { tenantId },
      }),
    ]);

    // Format Recent Admissions
    const recentAdmissions = recentAdmissionsRaw.map((adm) => {
      const user = adm.studentProfileIstudent_profile?.userIdusers;
      const studentName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Student';
      return {
        name: studentName,
        course: adm.admissionNumber || 'NEET Standard Plan',
        batch: 'Enrolled',
        status: adm.admissionStatus || 'ACTIVE',
        statusColor:
          (adm.admissionStatus as string) === 'CONFIRMED' || (adm.admissionStatus as string) === 'SUBMITTED'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200',
      };
    });

    // Format Upcoming Exams
    const upcomingMockTests = upcomingExamsRaw.map((exam) => ({
      title: exam.title,
      time: exam.durationMinutes ? `${exam.durationMinutes} Mins` : '180 Mins',
      desc: `Total Marks: ${exam.totalMarks} | Format: Offline OMR`,
    }));

    // Format Active / Scheduled Live Class
    let liveClassActive: {
      id: string;
      title: string;
      subjectName: string;
      batchName: string;
      startTime: string;
      endTime: string;
      campusName: string;
      enrolledStudentsCount: number;
      status: string;
    } | null = null;

    if (activeLiveClassesRaw.length > 0) {
      const lc = activeLiveClassesRaw[0];
      const batchObj = await this.prisma.batches.findFirst({ where: { id: lc.batchId } });
      const studentCount = await this.prisma.studentBatchEnrollments.count({
        where: { batchId: lc.batchId, status: 'ACTIVE', deletedAt: null },
      });

      const startTimeStr = new Date(lc.scheduledStart).toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const endTimeStr = new Date(lc.scheduledEnd).toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      liveClassActive = {
        id: lc.id,
        title: lc.title,
        subjectName: lc.subtitle || lc.title || 'NEET Live Interactive Session',
        batchName: batchObj?.name || 'Target NEET Batch',
        startTime: `${startTimeStr} - ${endTimeStr}`,
        endTime: endTimeStr,
        campusName: 'Main Campus',
        enrolledStudentsCount: studentCount || totalStudents || 0,
        status: lc.status,
      };
    }

    // Format Running Batches
    const runningBatches = await Promise.all(
      runningBatchesRaw.map(async (b) => {
        const studentCount = await this.prisma.studentBatchEnrollments.count({
          where: { batchId: b.id, status: 'ACTIVE', deletedAt: null },
        });
        return {
          id: b.id,
          name: b.name,
          code: b.code || 'NEET-BATCH',
          studentCount: studentCount || 0,
          courseName: 'NEET Curriculum',
          progressPercentage: 75,
        };
      }),
    );

    // Format Recent Recordings
    const recentRecordings = recentEndedClassesRaw.map((rec) => {
      const endedDate = new Date(rec.actualEnd || rec.scheduledEnd || rec.updatedAt);
      const timeAgo = endedDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return {
        id: rec.id,
        title: rec.title || 'Recorded NEET Live Session',
        subjectName: rec.subtitle || rec.title,
        dateFormatted: `Recorded ${timeAgo}`,
        durationMinutes: rec.durationMinutes || 90,
        watchUrl: `/dashboard/recordings`,
      };
    });

    // Fee Collection Stats
    const totalFeeAmount = Number(feeAssignmentAgg._sum.finalAmount || 0);
    const outstandingAmount = Number(feeAssignmentAgg._sum.outstandingAmount || 0);
    const totalPaid = Math.max(0, totalFeeAmount - outstandingAmount);
    const feeCollectionPercentage =
      totalFeeAmount > 0 ? Math.round((totalPaid / totalFeeAmount) * 100) : 100;

    // Attendance Rate
    const presentRecordsCount = await this.prisma.attendanceRecords.count({
      where: { tenantId, attendanceStatus: 'PRESENT' },
    });
    const overallAttendancePercentage =
      attendanceStatsAgg > 0 ? Math.round((presentRecordsCount / attendanceStatsAgg) * 100) : 94.8;

    return {
      stats: {
        totalStudents,
        totalBatches,
        totalExams,
        totalBranches,
        totalTutors,
        totalFeeCollected: totalPaid,
        feeCollectionPercentage,
        overallAttendancePercentage,
      },
      liveClassActive,
      runningBatches,
      recentRecordings,
      recentAdmissions,
      upcomingMockTests,
    };
  }

  private getEmptyStats() {
    return {
      stats: {
        totalStudents: 0,
        totalBatches: 0,
        totalExams: 0,
        totalBranches: 0,
        totalTutors: 0,
        totalFeeCollected: 0,
        feeCollectionPercentage: 100,
        overallAttendancePercentage: 100,
      },
      liveClassActive: null,
      runningBatches: [],
      recentRecordings: [],
      recentAdmissions: [],
      upcomingMockTests: [],
    };
  }
}
