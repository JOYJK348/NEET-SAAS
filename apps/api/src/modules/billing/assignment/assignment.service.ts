import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AssignStudentFeeDto } from '../dto/fee-assignment.dto';

@Injectable()
export class FeeAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  async assignFeeToStudent(tenantId: string, userId: string, dto: AssignStudentFeeDto) {
    const admission = await this.prisma.studentAdmissions.findFirst({
      where: { id: dto.studentAdmissionId, tenantId, deletedAt: null },
    });

    if (!admission) {
      throw new NotFoundException('Student admission not found');
    }

    const tenantFilter = tenantId
      ? { in: [tenantId, '00000000-0000-0000-0000-000000000001', 'default'] }
      : undefined;

    const feeStructure = await this.prisma.feeStructures.findFirst({
      where: {
        id: dto.feeStructureId,
        deletedAt: null,
        ...(tenantFilter ? { tenantId: tenantFilter } : {}),
      },
    });

    if (!feeStructure) {
      throw new NotFoundException('Fee plan not found');
    }

    const items = await this.prisma.feeStructureItems.findMany({
      where: {
        feeStructureId: dto.feeStructureId,
        deletedAt: null,
        ...(tenantFilter ? { tenantId: tenantFilter } : {}),
      },
    });

    let baseAmount = items.reduce((acc, item) => acc + Number(item.amount), 0);
    if (baseAmount <= 0) {
      baseAmount = 11997; // Fallback standard course fee
    }
    const taxAmount = items.reduce(
      (acc, item) => acc + (Number(item.amount) * Number(item.taxPercentage)) / 100,
      0,
    );
    const discountAmount = dto.discountAmount || 0;
    const finalAmount = Math.max(0, baseAmount + taxAmount - discountAmount);

    let chosenPlan: any = null;
    let planItems: any[] = [];

    if (dto.installmentPlanId) {
      chosenPlan = await this.prisma.feeInstallmentPlans.findFirst({
        where: {
          id: dto.installmentPlanId,
          feeStructureId: dto.feeStructureId,
          deletedAt: null,
          ...(tenantFilter ? { tenantId: tenantFilter } : {}),
        },
      });
      if (!chosenPlan) {
        throw new NotFoundException('Selected installment plan not found');
      }
      planItems = await this.prisma.feeInstallmentPlanItems.findMany({
        where: {
          installmentPlanId: dto.installmentPlanId,
          deletedAt: null,
          ...(tenantFilter ? { tenantId: tenantFilter } : {}),
        },
        orderBy: { installmentNumber: 'asc' },
      });
    } else {
      // Default plan if any
      chosenPlan = await this.prisma.feeInstallmentPlans.findFirst({
        where: {
          feeStructureId: dto.feeStructureId,
          isDefault: true,
          deletedAt: null,
          ...(tenantFilter ? { tenantId: tenantFilter } : {}),
        },
      });
      if (!chosenPlan) {
        chosenPlan = await this.prisma.feeInstallmentPlans.findFirst({
          where: {
            feeStructureId: dto.feeStructureId,
            deletedAt: null,
            ...(tenantFilter ? { tenantId: tenantFilter } : {}),
          },
          orderBy: { createdAt: 'desc' },
        });
      }
      if (chosenPlan) {
        planItems = await this.prisma.feeInstallmentPlanItems.findMany({
          where: {
            installmentPlanId: chosenPlan.id,
            deletedAt: null,
            ...(tenantFilter ? { tenantId: tenantFilter } : {}),
          },
          orderBy: { installmentNumber: 'asc' },
        });
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Create StudentFeeAssignment record (snapshot)
      const assignment = await tx.studentFeeAssignments.create({
        data: {
          tenantId,
          studentAdmissionId: dto.studentAdmissionId,
          feeStructureId: dto.feeStructureId,
          installmentPlanId: chosenPlan ? chosenPlan.id : null,
          baseAmount,
          taxAmount,
          discountAmount,
          adjustmentAmount: 0,
          finalAmount,
          outstandingAmount: finalAmount,
          assignedBy: userId,
          remarks: dto.remarks || '',
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // Update student admission record with feeStructureId link
      await tx.studentAdmissions.update({
        where: { id: dto.studentAdmissionId },
        data: { feeStructureId: dto.feeStructureId },
      });

      // Generate materialised StudentFeeInstallments
      if (planItems.length > 0) {
        let totalPlanAllocated = 0;
        const installmentData = planItems.map((item, idx) => {
          let instBaseAmount = 0;
          if (item.amountFixed !== null && Number(item.amountFixed) > 0) {
            instBaseAmount = Number(item.amountFixed);
          } else if (item.amountPercentage !== null && Number(item.amountPercentage) > 0) {
            instBaseAmount = (finalAmount * Number(item.amountPercentage)) / 100;
          } else {
            instBaseAmount = finalAmount / planItems.length;
          }

          // Last installment handles precision rounding remainder
          if (idx === planItems.length - 1) {
            instBaseAmount = Math.max(0, finalAmount - totalPlanAllocated);
          } else {
            totalPlanAllocated += instBaseAmount;
          }

          return {
            tenantId,
            studentFeeAssignmentId: assignment.id,
            feeInstallmentId: item.id,
            installmentNumber: item.installmentNumber,
            dueDate: item.dueDate,
            baseAmount: instBaseAmount,
            taxAmount: 0,
            discountAmount: 0,
            penaltyAmount: 0,
            finalAmount: instBaseAmount,
            paidAmount: 0,
            balanceAmount: instBaseAmount,
            status: 'UNPAID' as const,
            createdBy: userId,
            updatedBy: userId,
          };
        });

        await tx.studentFeeInstallments.createMany({
          data: installmentData,
        });
      } else {
        // Single installment for full amount
        await tx.studentFeeInstallments.create({
          data: {
            tenantId,
            studentFeeAssignmentId: assignment.id,
            feeInstallmentId: assignment.id,
            installmentNumber: 1,
            dueDate: new Date(),
            baseAmount: finalAmount,
            taxAmount: 0,
            discountAmount: 0,
            penaltyAmount: 0,
            finalAmount,
            paidAmount: 0,
            balanceAmount: finalAmount,
            status: 'UNPAID',
            createdBy: userId,
            updatedBy: userId,
          },
        });
      }

      // Write Audit Log
      await tx.feeAuditLogs.create({
        data: {
          tenantId,
          studentAdmissionId: dto.studentAdmissionId,
          eventType: 'FEE_ASSIGNED',
          description: `Assigned fee structure ${feeStructure.name} with total amount ₹${finalAmount}`,
          payload: { assignmentId: assignment.id, finalAmount, discountAmount },
          triggeredBy: userId,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      return this.getStudentFeeAccount(dto.studentAdmissionId, tenantId);
    });
  }

  async getStudentFeeAccount(studentAdmissionId: string, tenantId: string) {
    const tenantFilter = tenantId
      ? { in: [tenantId, '00000000-0000-0000-0000-000000000001', 'default'] }
      : undefined;

    let admission = await this.prisma.studentAdmissions.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { id: studentAdmissionId },
          { studentProfileId: studentAdmissionId },
          { studentProfileIstudent_profile: { userId: studentAdmissionId } },
        ],
        ...(tenantFilter ? { tenantId: tenantFilter } : {}),
      },
      include: {
        studentProfileIstudent_profile: {
          include: {
            userIdusers: true,
          },
        },
      },
    });

    if (!admission) {
      // Look up admission across any tenant by student profile userId or email or ID
      admission = await this.prisma.studentAdmissions.findFirst({
        where: {
          deletedAt: null,
          OR: [
            { id: studentAdmissionId },
            { studentProfileId: studentAdmissionId },
            { studentProfileIstudent_profile: { userId: studentAdmissionId } },
            { studentProfileIstudent_profile: { userIdusers: { email: studentAdmissionId } } },
          ],
        },
        include: {
          studentProfileIstudent_profile: {
            include: {
              userIdusers: true,
            },
          },
        },
      });
    }

    if (!admission) {
      return {
        hasFeeAssigned: false,
        student: {
          id: studentAdmissionId,
          admissionNumber: 'N/A',
          name: 'Student',
        },
        feeStructure: null,
        assignment: null,
        installments: [],
        payments: [],
      };
    }

    const effectiveTenantId = admission.tenantId;

    let assignment = await this.prisma.studentFeeAssignments.findFirst({
      where: { studentAdmissionId: admission.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!assignment) {
      // Auto-assign course fee structure if available
      let feeStructure: any = null;
      if (admission.feeStructureId) {
        feeStructure = await this.prisma.feeStructures.findFirst({
          where: { id: admission.feeStructureId, deletedAt: null },
        });
      }
      if (!feeStructure && admission.courseId) {
        feeStructure = await this.prisma.feeStructures.findFirst({
          where: { courseId: admission.courseId, deletedAt: null },
          orderBy: { createdAt: 'desc' },
        });
      }
      if (!feeStructure) {
        feeStructure = await this.prisma.feeStructures.create({
          data: {
            tenantId: effectiveTenantId,
            courseId: admission.courseId || 'COURSE_NEET_STD',
            academicYearId: admission.academicYearId || 'AY_2026_2027',
            branchId: admission.branchId || 'MAIN_BRANCH',
            departmentId: 'DEPT_ACADEMIC',
            name: 'NEET Standard Course Fee',
            code: `FEE-NEET-${Date.now().toString().slice(-6)}`,
            description: 'Standard NEET academy course fee plan',
            effectiveFrom: new Date(),
            effectiveTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            status: 'ACTIVE',
            createdBy: 'SYSTEM_AUTO',
            updatedBy: 'SYSTEM_AUTO',
          },
        });
      }

      if (feeStructure) {
        try {
          await this.assignFeeToStudent(effectiveTenantId, 'SYSTEM_AUTO', {
            studentAdmissionId: admission.id,
            feeStructureId: feeStructure.id,
            discountAmount: 0,
            remarks: 'Auto-assigned course fee structure',
          });

          assignment = await this.prisma.studentFeeAssignments.findFirst({
            where: { studentAdmissionId: admission.id, deletedAt: null },
            orderBy: { createdAt: 'desc' },
          });
        } catch (err) {
          console.error('Auto fee assignment failed:', err);
        }
      }
    }

    if (!assignment) {
      const studentUser = admission.studentProfileIstudent_profile?.userIdusers;
      return {
        hasFeeAssigned: false,
        student: {
          id: admission.id,
          admissionNumber: admission.admissionNumber,
          name: studentUser ? `${studentUser.firstName} ${studentUser.lastName}`.trim() : 'Student',
        },
        assignment: null,
        installments: [],
        payments: [],
      };
    }

    const installments = await this.prisma.studentFeeInstallments.findMany({
      where: { studentFeeAssignmentId: assignment.id, deletedAt: null },
      orderBy: { installmentNumber: 'asc' },
    });

    const installmentIds = installments.map((i) => i.id);

    const payments = await this.prisma.feePayments.findMany({
      where: {
        studentFeeInstallmentId: { in: installmentIds },
        deletedAt: null,
      },
      orderBy: { paymentDate: 'desc' },
    });

    const receivedByIds = [...new Set(payments.map((p) => p.receivedBy).filter(Boolean))];
    const payerUsers =
      receivedByIds.length > 0
        ? await this.prisma.users.findMany({
            where: { id: { in: receivedByIds } },
            select: { id: true, firstName: true, lastName: true, userType: true },
          })
        : [];
    const payerMap = new Map(payerUsers.map((u) => [u.id, u]));

    const formattedPayments = payments.map((p) => {
      const payerUser = payerMap.get(p.receivedBy);
      const userType = String(payerUser?.userType || '').toUpperCase();
      let paidByRole: 'STUDENT' | 'PARENT' | 'ADMIN' = 'STUDENT';
      let paidByRoleLabel = 'Paid by Student 🎓';

      if (userType === 'PARENT') {
        paidByRole = 'PARENT';
        paidByRoleLabel = 'Paid by Parent 👨‍👩‍👧';
      } else if (userType.includes('ADMIN') || userType.includes('SUPER') || userType.includes('STAFF')) {
        paidByRole = 'ADMIN';
        paidByRoleLabel = 'Paid by Admin 🏛️';
      } else {
        paidByRole = 'STUDENT';
        paidByRoleLabel = 'Paid by Student 🎓';
      }

      const payerName = payerUser
        ? `${payerUser.firstName || ''} ${payerUser.lastName || ''}`.trim()
        : 'Student';

      return {
        id: p.id,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        referenceNumber: p.referenceNumber,
        paymentDate: p.paymentDate,
        remarks: p.remarks,
        paidBy: payerName,
        paidByRole,
        paidByRoleLabel,
      };
    });

    const feeStructure = await this.prisma.feeStructures.findFirst({
      where: { id: assignment.feeStructureId },
    });

    const studentUser = admission.studentProfileIstudent_profile?.userIdusers;

    let batchId = '';
    let batchName = 'General Batch';
    let courseId = admission.courseId || (feeStructure?.courseId || '');
    let courseName = 'NEET Standard Course';

    const enrollment = await this.prisma.studentBatchEnrollments.findFirst({
      where: { studentAdmissionId: admission.id, status: 'ACTIVE', deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (enrollment) {
      const batch = await this.prisma.batches.findFirst({
        where: { id: enrollment.batchId },
      });
      if (batch) {
        batchId = batch.id;
        batchName = batch.name;
        if (!courseId) courseId = batch.courseId;
      }
    }

    if (courseId) {
      const course = await this.prisma.courses.findFirst({
        where: { id: courseId },
      });
      if (course) {
        courseName = course.displayName || course.name;
      }
    }

    return {
      hasFeeAssigned: true,
      student: {
        id: admission.id,
        admissionNumber: admission.admissionNumber,
        name: studentUser ? `${studentUser.firstName} ${studentUser.lastName}`.trim() : 'Student',
        courseId: courseId || 'course_default',
        courseName,
        batchId: batchId || 'batch_default',
        batchName,
      },
      feeStructure: feeStructure
        ? { id: feeStructure.id, name: feeStructure.name, code: feeStructure.code }
        : null,
      assignment,
      installments,
      payments: formattedPayments,
    };
  }

  async listAllFeeAccounts(tenantId: string) {
    const tenantFilter = tenantId
      ? { in: [tenantId, '00000000-0000-0000-0000-000000000001', 'default'] }
      : undefined;

    let admissions = await this.prisma.studentAdmissions.findMany({
      where: {
        deletedAt: null,
        ...(tenantFilter ? { tenantId: tenantFilter } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        studentProfileIstudent_profile: {
          include: {
            userIdusers: true,
          },
        },
      },
    });

    if (admissions.length === 0) {
      admissions = await this.prisma.studentAdmissions.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          studentProfileIstudent_profile: {
            include: {
              userIdusers: true,
            },
          },
        },
      });
    }

    const summaries = await Promise.all(
      admissions.map(async (adm) => {
        return this.getStudentFeeAccount(adm.id, tenantId);
      }),
    );

    return summaries;
  }
}
