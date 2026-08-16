import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class FeeLedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async getOutstandingReport(
    tenantId: string,
    query?: {
      status?: 'OVERDUE' | 'UNPAID' | 'PARTIALLY_PAID';
      courseId?: string;
    },
  ) {
    const whereCondition: any = {
      tenantId,
      deletedAt: null,
      balanceAmount: { gt: 0 },
    };

    if (query?.status) {
      whereCondition.status = query.status;
    }

    const installments = await this.prisma.studentFeeInstallments.findMany({
      where: whereCondition,
      orderBy: { dueDate: 'asc' },
    });

    const assignmentIds = Array.from(new Set(installments.map((i) => i.studentFeeAssignmentId)));

    const assignments = await this.prisma.studentFeeAssignments.findMany({
      where: {
        id: { in: assignmentIds },
        tenantId,
        deletedAt: null,
      },
    });

    const admissionIds = Array.from(new Set(assignments.map((a) => a.studentAdmissionId)));

    const admissions = await this.prisma.studentAdmissions.findMany({
      where: {
        id: { in: admissionIds },
        tenantId,
        deletedAt: null,
      },
      include: {
        studentProfileIstudent_profile: {
          include: {
            userIdusers: true,
          },
        },
      },
    });

    const feeStructures = await this.prisma.feeStructures.findMany({
      where: {
        id: { in: Array.from(new Set(assignments.map((a) => a.feeStructureId))) },
        tenantId,
      },
    });

    const now = new Date();

    return installments.map((inst) => {
      const assignment = assignments.find((a) => a.id === inst.studentFeeAssignmentId);
      const admission = admissions.find((adm) => adm.id === assignment?.studentAdmissionId);
      const structure = feeStructures.find((fs) => fs.id === assignment?.feeStructureId);

      const dueDate = new Date(inst.dueDate);
      const isOverdue = inst.status === 'OVERDUE' || (dueDate < now && inst.status !== 'PAID');
      const daysOverdue = isOverdue
        ? Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)))
        : 0;

      const studentUser = admission?.studentProfileIstudent_profile?.userIdusers;

      return {
        installmentId: inst.id,
        installmentNumber: inst.installmentNumber,
        dueDate: inst.dueDate,
        amount: Number(inst.finalAmount),
        paidAmount: Number(inst.paidAmount),
        balanceAmount: Number(inst.balanceAmount),
        status: isOverdue ? 'OVERDUE' : inst.status,
        daysOverdue,
        student: {
          admissionId: admission?.id,
          admissionNumber: admission?.admissionNumber,
          studentName: studentUser ? `${studentUser.firstName} ${studentUser.lastName}`.trim() : 'Student',
        },
        courseName: structure?.name || 'NEET Course',
      };
    });
  }

  async getCollectionReport(tenantId: string) {
    const payments = await this.prisma.feePayments.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { paymentDate: 'desc' },
      take: 100,
    });

    const totalCollected = payments.reduce((acc, p) => acc + Number(p.amount), 0);

    const byMethod: Record<string, number> = {};
    for (const p of payments) {
      const mode = p.paymentMethod || 'CASH';
      byMethod[mode] = (byMethod[mode] || 0) + Number(p.amount);
    }

    return {
      totalCollected,
      totalCount: payments.length,
      byMethod,
      recentPayments: payments,
    };
  }

  async getBillingDashboardKpis(tenantId: string) {
    const assignments = await this.prisma.studentFeeAssignments.findMany({
      where: { tenantId, deletedAt: null },
    });

    const totalAssignedFee = assignments.reduce((acc, a) => acc + Number(a.finalAmount), 0);
    const totalOutstanding = assignments.reduce((acc, a) => acc + Number(a.outstandingAmount), 0);
    const totalCollected = totalAssignedFee - totalOutstanding;

    const overdueCount = await this.prisma.studentFeeInstallments.count({
      where: {
        tenantId,
        deletedAt: null,
        status: 'OVERDUE',
      },
    });

    return {
      totalAssignedFee,
      totalCollected,
      totalOutstanding,
      overdueCount,
    };
  }
}
