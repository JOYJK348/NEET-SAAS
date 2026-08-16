import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateFeePlanDto, CreateInstallmentPlanDto, UpdateFeePlanDto } from '../dto/fee-plan.dto';

@Injectable()
export class FeePlanService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllFeePlans(tenantId: string) {
    const plans = await this.prisma.feeStructures.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    const items = await this.prisma.feeStructureItems.findMany({
      where: {
        tenantId,
        feeStructureId: { in: plans.map((p) => p.id) },
        deletedAt: null,
      },
    });

    const installmentPlans = await this.prisma.feeInstallmentPlans.findMany({
      where: {
        tenantId,
        feeStructureId: { in: plans.map((p) => p.id) },
        deletedAt: null,
      },
    });

    const installmentPlanItems = await this.prisma.feeInstallmentPlanItems.findMany({
      where: {
        tenantId,
        installmentPlanId: { in: installmentPlans.map((ip) => ip.id) },
        deletedAt: null,
      },
      orderBy: { installmentNumber: 'asc' },
    });

    return plans.map((plan) => {
      const planItems = items.filter((i) => i.feeStructureId === plan.id);
      const totalAmount = planItems.reduce((acc, item) => acc + Number(item.amount), 0);
      const planInstallmentPlans = installmentPlans
        .filter((ip) => ip.feeStructureId === plan.id)
        .map((ip) => ({
          ...ip,
          items: installmentPlanItems.filter((ipi) => ipi.installmentPlanId === ip.id),
        }));

      return {
        ...plan,
        totalAmount,
        items: planItems,
        installmentPlans: planInstallmentPlans,
      };
    });
  }

  async findOneFeePlan(id: string, tenantId: string) {
    const plan = await this.prisma.feeStructures.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!plan) {
      throw new NotFoundException('Fee plan not found');
    }

    const items = await this.prisma.feeStructureItems.findMany({
      where: { tenantId, feeStructureId: id, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
    });

    const installmentPlans = await this.prisma.feeInstallmentPlans.findMany({
      where: { tenantId, feeStructureId: id, deletedAt: null },
    });

    const installmentPlanItems = await this.prisma.feeInstallmentPlanItems.findMany({
      where: {
        tenantId,
        installmentPlanId: { in: installmentPlans.map((ip) => ip.id) },
        deletedAt: null,
      },
      orderBy: { installmentNumber: 'asc' },
    });

    const totalAmount = items.reduce((acc, item) => acc + Number(item.amount), 0);

    return {
      ...plan,
      totalAmount,
      items,
      installmentPlans: installmentPlans.map((ip) => ({
        ...ip,
        items: installmentPlanItems.filter((ipi) => ipi.installmentPlanId === ip.id),
      })),
    };
  }

  async createFeePlan(tenantId: string, userId: string, dto: CreateFeePlanDto) {
    const existing = await this.prisma.feeStructures.findFirst({
      where: { tenantId, code: dto.code, deletedAt: null },
    });

    if (existing) {
      throw new BadRequestException(`Fee plan code '${dto.code}' already exists`);
    }

    // Generate unique branchId and departmentId if static to avoid DB unique constraint collisions
    const branchId = dto.branchId && dto.branchId !== 'HQ_SIVAKASI' ? dto.branchId : `BRANCH_${Date.now()}`;
    const departmentId = dto.departmentId && dto.departmentId !== 'DEPT_ACADEMIC' ? dto.departmentId : `DEPT_${Date.now()}`;

    const createdId = await this.prisma.$transaction(async (tx) => {
      const feeStructure = await tx.feeStructures.create({
        data: {
          tenantId,
          courseId: dto.courseId || `COURSE_${Date.now()}`,
          academicYearId: dto.academicYearId || `AY_${Date.now()}`,
          branchId,
          departmentId,
          code: dto.code,
          name: dto.name,
          description: dto.description || '',
          effectiveFrom: new Date(dto.effectiveFrom),
          effectiveTo: new Date(dto.effectiveTo),
          status: 'ACTIVE',
          createdBy: userId,
          updatedBy: userId,
        },
      });

      if (dto.items && dto.items.length > 0) {
        await tx.feeStructureItems.createMany({
          data: dto.items.map((item, idx) => ({
            tenantId,
            feeStructureId: feeStructure.id,
            itemName: item.itemName,
            amount: item.amount,
            taxPercentage: item.taxPercentage || 0,
            mandatory: item.mandatory !== undefined ? item.mandatory : true,
            refundable: item.refundable || false,
            displayOrder: idx + 1,
            createdBy: userId,
            updatedBy: userId,
          })),
        });
      }

      return feeStructure.id;
    });

    return this.findOneFeePlan(createdId, tenantId);
  }

  async createInstallmentPlan(
    feeStructureId: string,
    tenantId: string,
    userId: string,
    dto: CreateInstallmentPlanDto,
  ) {
    const feeStructure = await this.prisma.feeStructures.findFirst({
      where: { id: feeStructureId, tenantId, deletedAt: null },
    });

    if (!feeStructure) {
      throw new NotFoundException('Fee plan not found');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.feeInstallmentPlans.updateMany({
          where: { tenantId, feeStructureId, deletedAt: null },
          data: { deletedAt: new Date(), deletedBy: userId, isDefault: false },
        });
      }

      const plan = await tx.feeInstallmentPlans.create({
        data: {
          tenantId,
          feeStructureId,
          name: dto.name,
          description: dto.description || '',
          isDefault: dto.isDefault || false,
          status: 'ACTIVE',
          createdBy: userId,
          updatedBy: userId,
        },
      });

      if (dto.items && dto.items.length > 0) {
        await tx.feeInstallmentPlanItems.createMany({
          data: dto.items.map((item) => ({
            tenantId,
            installmentPlanId: plan.id,
            installmentNumber: item.installmentNumber,
            label: item.label,
            dueDate: new Date(item.dueDate),
            amountFixed: item.amountFixed !== undefined ? item.amountFixed : null,
            amountPercentage: item.amountPercentage !== undefined ? item.amountPercentage : null,
            createdBy: userId,
            updatedBy: userId,
          })),
        });
      }

      const items = await tx.feeInstallmentPlanItems.findMany({
        where: { tenantId, installmentPlanId: plan.id },
        orderBy: { installmentNumber: 'asc' },
      });

      return {
        ...plan,
        items,
      };
    });
  }

  async updateFeePlan(id: string, tenantId: string, userId: string, dto: UpdateFeePlanDto) {
    const existing = await this.prisma.feeStructures.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Fee plan not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.feeStructures.update({
        where: { id },
        data: {
          code: dto.code,
          name: dto.name,
          description: dto.description || '',
          updatedBy: userId,
        },
      });

      if (dto.items && dto.items.length > 0) {
        await tx.feeStructureItems.updateMany({
          where: { feeStructureId: id, tenantId, deletedAt: null },
          data: { deletedAt: new Date(), deletedBy: userId },
        });

        await tx.feeStructureItems.createMany({
          data: dto.items.map((item, idx) => ({
            tenantId,
            feeStructureId: id,
            itemName: item.itemName,
            amount: item.amount,
            taxPercentage: item.taxPercentage || 0,
            mandatory: item.mandatory !== undefined ? item.mandatory : true,
            refundable: item.refundable || false,
            displayOrder: idx + 1,
            createdBy: userId,
            updatedBy: userId,
          })),
        });
      }
    });

    return this.findOneFeePlan(id, tenantId);
  }
}
