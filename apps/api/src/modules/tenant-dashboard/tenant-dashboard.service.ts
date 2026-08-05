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

    // 1. Total Active Students
    const totalStudents = await this.prisma.studentProfiles.count({
      where: { tenantId, academicStatus: 'ACTIVE', deletedAt: null },
    });

    // 2. Total Active Batches
    const totalBatches = await this.prisma.batches.count({
      where: { tenantId, isActive: true, deletedAt: null },
    });

    // 3. Total Mock Tests / Exams Created
    const totalExams = await this.prisma.exams.count({
      where: { tenantId, deletedAt: null },
    });

    // 4. Total Branches
    const totalBranches = await this.prisma.branches.count({
      where: { tenantId, deletedAt: null },
    });

    // 5. Total Tutors / Staff
    const totalTutors = await this.prisma.staffProfiles.count({
      where: { tenantId, deletedAt: null },
    });

    // 6. Recent Admissions (top 5)
    const recentAdmissionsRaw = await this.prisma.studentAdmissions.findMany({
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
    });

    const recentAdmissions = recentAdmissionsRaw.map((adm) => {
      const user = adm.studentProfileIstudent_profile?.userIdusers;
      const studentName = user ? `${user.firstName} ${user.lastName}` : 'Student';
      return {
        name: studentName,
        course: adm.admissionNumber || 'Standard Course',
        batch: 'Enrolled',
        status: adm.admissionStatus || 'ACTIVE',
        statusColor:
          (adm.admissionStatus as string) === 'CONFIRMED' || (adm.admissionStatus as string) === 'SUBMITTED'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200',
      };
    });

    // 7. Today's Scheduled Classes
    const todaySessions = await this.prisma.attendanceSessions.findMany({
      where: {
        tenantId,
        attendanceDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        deletedAt: null,
      },
      take: 4,
      orderBy: { startsAt: 'asc' },
    });

    const todayClasses = todaySessions.map((session, idx) => {
      const startTime = session.startsAt ? new Date(session.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00 AM';
      const endTime = session.endsAt ? new Date(session.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:30 AM';
      const colors = [
        'bg-indigo-50 border-indigo-100 text-indigo-900',
        'bg-emerald-50 border-emerald-100 text-emerald-900',
        'bg-amber-50 border-amber-100 text-amber-900',
        'bg-rose-50 border-rose-100 text-rose-900',
      ];
      return {
        time: `${startTime} - ${endTime}`,
        subject: session.remarks || 'Scheduled Session',
        topic: 'Regular Class',
        color: colors[idx % colors.length],
      };
    });

    // 8. Upcoming Exams
    const upcomingExamsRaw = await this.prisma.exams.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
    });

    const upcomingMockTests = upcomingExamsRaw.map((exam) => ({
      title: exam.title,
      time: exam.durationMinutes ? `${exam.durationMinutes} Mins` : '180 Mins',
      desc: `Total Marks: ${exam.totalMarks} | Format: Offline OMR`,
    }));

    return {
      stats: {
        totalStudents,
        totalBatches,
        totalExams,
        totalBranches,
        totalTutors,
      },
      recentAdmissions,
      todayClasses,
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
      },
      recentAdmissions: [],
      todayClasses: [],
      upcomingMockTests: [],
    };
  }
}
