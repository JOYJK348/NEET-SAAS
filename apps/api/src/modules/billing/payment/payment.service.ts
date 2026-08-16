import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PaymentMethodEnum } from '../dto/payment.dto';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Core ACID Money-Flow Invariant function.
   * Runs inside a single DB transaction.
   */
  async collectPayment(
    tenantId: string,
    userId: string,
    data: {
      studentFeeInstallmentId: string;
      amount: number;
      paymentMethod: PaymentMethodEnum;
      referenceNumber: string;
      remarks?: string;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch Installment
      const installment = await tx.studentFeeInstallments.findFirst({
        where: { id: data.studentFeeInstallmentId, tenantId, deletedAt: null },
      });

      if (!installment) {
        throw new NotFoundException('Fee installment record not found');
      }

      if (installment.status === 'PAID') {
        throw new BadRequestException('This installment has already been fully paid');
      }

      // 2. Prevent duplicate referenceNumber (for offline payments / manual duplicate entry prevention)
      if (data.referenceNumber && data.paymentMethod !== 'ONLINE_GATEWAY') {
        const existingPayment = await tx.feePayments.findFirst({
          where: { tenantId, referenceNumber: data.referenceNumber, deletedAt: null },
        });
        if (existingPayment) {
          throw new ConflictException(
            `Payment with reference number '${data.referenceNumber}' already exists`,
          );
        }
      }

      // 3. Compute new amounts & status
      const currentPaid = Number(installment.paidAmount);
      const instFinal = Number(installment.finalAmount);
      const newPaidAmount = currentPaid + Number(data.amount);
      const newBalanceAmount = Math.max(0, instFinal - newPaidAmount);

      let newStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' = 'UNPAID';
      if (newBalanceAmount <= 0) {
        newStatus = 'PAID';
      } else if (newPaidAmount > 0) {
        newStatus = 'PARTIALLY_PAID';
      }

      // 4. Update StudentFeeInstallment
      const updatedInstallment = await tx.studentFeeInstallments.update({
        where: { id: installment.id },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: newBalanceAmount,
          status: newStatus,
          updatedBy: userId,
        },
      });

      // 5. Create FeePayments
      const payment = await tx.feePayments.create({
        data: {
          tenantId,
          studentFeeInstallmentId: installment.id,
          collectionCenterId: 'HQ',
          closureId: 'SYSTEM',
          financialPeriodId: '2026-2027',
          paymentDate: new Date(),
          amount: data.amount,
          paymentMethod: data.paymentMethod as any,
          referenceNumber: data.referenceNumber || `REF-${Date.now()}`,
          receivedBy: userId,
          remarks: data.remarks || '',
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 6. Recalculate StudentFeeAssignment.outstandingAmount
      const allInstallments = await tx.studentFeeInstallments.findMany({
        where: {
          studentFeeAssignmentId: installment.studentFeeAssignmentId,
          tenantId,
          deletedAt: null,
        },
      });

      const totalOutstanding = allInstallments.reduce(
        (sum, inst) => sum + (inst.id === installment.id ? newBalanceAmount : Number(inst.balanceAmount)),
        0,
      );

      await tx.studentFeeAssignments.update({
        where: { id: installment.studentFeeAssignmentId },
        data: {
          outstandingAmount: totalOutstanding,
          updatedBy: userId,
        },
      });

      // 7. Generate Receipt
      const count = await tx.feeReceipts.count({ where: { tenantId } });
      const year = new Date().getFullYear();
      const seqStr = String(count + 1).padStart(6, '0');
      const receiptNumber = `RCP-${year}-${seqStr}`;

      const receipt = await tx.feeReceipts.create({
        data: {
          tenantId,
          paymentId: payment.id,
          receiptNumber,
          storageObjectId: 'N/A',
          generatedAt: new Date(),
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 8. Create FeeAuditLog
      const assignment = await tx.studentFeeAssignments.findFirst({
        where: { id: installment.studentFeeAssignmentId },
      });

      await tx.feeAuditLogs.create({
        data: {
          tenantId,
          studentAdmissionId: assignment?.studentAdmissionId || 'N/A',
          eventType: 'PAYMENT_RECEIVED',
          description: `Collected ₹${data.amount} via ${data.paymentMethod} for installment ${installment.installmentNumber} (${receiptNumber})`,
          payload: {
            paymentId: payment.id,
            receiptNumber,
            installmentId: installment.id,
            amount: data.amount,
            method: data.paymentMethod,
          },
          triggeredBy: userId,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      return {
        payment,
        installment: updatedInstallment,
        receipt,
        outstandingAmount: totalOutstanding,
      };
    });
  }

  async getPaymentReceipt(paymentId: string, tenantId: string) {
    const payment = await this.prisma.feePayments.findFirst({
      where: { id: paymentId, tenantId, deletedAt: null },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    const receipt = await this.prisma.feeReceipts.findFirst({
      where: { paymentId, tenantId, deletedAt: null },
    });

    const installment = await this.prisma.studentFeeInstallments.findFirst({
      where: { id: payment.studentFeeInstallmentId, tenantId },
    });

    const assignment = installment
      ? await this.prisma.studentFeeAssignments.findFirst({
          where: { id: installment.studentFeeAssignmentId, tenantId },
        })
      : null;

    const admission = assignment
      ? await this.prisma.studentAdmissions.findFirst({
          where: { id: assignment.studentAdmissionId, tenantId },
          include: {
            studentProfileIstudent_profile: {
              include: {
                userIdusers: true,
              },
            },
          },
        })
      : null;

    const feeStructure = assignment
      ? await this.prisma.feeStructures.findFirst({
          where: { id: assignment.feeStructureId, tenantId },
        })
      : null;

    const studentUser = admission?.studentProfileIstudent_profile?.userIdusers;

    return {
      receiptNumber: receipt?.receiptNumber || `RCP-${payment.id.substring(0, 8).toUpperCase()}`,
      generatedAt: receipt?.generatedAt || payment.createdAt,
      paymentId: payment.id,
      amount: Number(payment.amount),
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber,
      paymentDate: payment.paymentDate,
      installmentNumber: installment?.installmentNumber || 1,
      studentName: studentUser ? `${studentUser.firstName} ${studentUser.lastName}`.trim() : 'Student',
      admissionNumber: admission?.admissionNumber || 'N/A',
      courseName: feeStructure?.name || 'NEET Course',
    };
  }
}
