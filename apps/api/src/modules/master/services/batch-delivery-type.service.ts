/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { TenantScopedPrisma } from '../../../common/utils/tenant-scoped-prisma';
import {
  paginate,
  buildPrismaOrderBy,
} from '../../../common/utils/prisma-paginator';
import {
  PaginatedResult,
  QueryParamsDto,
} from '../../../common/dto/query-params.dto';
import { CreateBatchDeliveryTypeDto } from '../dto/create-batch-delivery-type.dto';

@Injectable()
export class BatchDeliveryTypeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScoped: TenantScopedPrisma,
  ) {}

  async create(
    dto: CreateBatchDeliveryTypeDto,
    tenantId: string,
    userId: string,
  ) {
    const start = new Date(dto.defaultStartTime);
    const end = new Date(dto.defaultEndTime);

    if (start >= end) {
      throw new BadRequestException(
        'Default start time must be before end time',
      );
    }

    const normalizedCode = dto.code.trim().toUpperCase();

    // Check duplicate code among active delivery types
    const existing = await this.prisma.batchDeliveryTypes.findFirst({
      where: {
        tenantId,
        code: normalizedCode,
        deletedAt: null,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Batch delivery type with code "${dto.code}" already exists`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.batchDeliveryTypes.updateMany({
          where: { tenantId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.batchDeliveryTypes.create({
        data: {
          tenantId,
          code: normalizedCode,
          name: dto.name.trim(),
          description: dto.description || '',
          attendanceMode: dto.attendanceMode as any,
          defaultMaxStudents: dto.defaultMaxStudents || 40,
          defaultStartTime: start,
          defaultEndTime: end,
          colorCode: dto.colorCode || '',
          iconName: dto.iconName || '',
          displayOrder: dto.displayOrder || 1,
          isDefault: dto.isDefault || false,
          isActive: dto.isActive ?? true,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    });
  }

  async findAll(
    tenantId: string,
    query: QueryParamsDto,
  ): Promise<PaginatedResult<any>> {
    const where: any = this.tenantScoped.buildWhere(tenantId);
    let result = await paginate({
      model: this.prisma.batchDeliveryTypes,
      where,
      orderBy: buildPrismaOrderBy(
        query.sortBy || 'displayOrder',
        query.sortOrder || 'asc',
      ),
      query,
      tenantId,
    });

    if (result.data.length === 0) {
      const defaults = [
        {
          code: 'OFFLINE',
          name: 'Offline Classroom Mode',
          attendanceMode: 'CLASSROOM',
          displayOrder: 1,
        },
        {
          code: 'ONLINE',
          name: 'Online Live Class Mode',
          attendanceMode: 'ONLINE',
          displayOrder: 2,
        },
        {
          code: 'HYBRID',
          name: 'Hybrid (Offline + Online)',
          attendanceMode: 'HYBRID',
          displayOrder: 3,
        },
      ];

      const now = new Date();
      const startTime = new Date(now.setHours(9, 0, 0, 0));
      const endTime = new Date(now.setHours(17, 0, 0, 0));

      for (const d of defaults) {
        await this.prisma.batchDeliveryTypes.create({
          data: {
            tenantId,
            code: d.code,
            name: d.name,
            description: `${d.name} for batches`,
            attendanceMode: d.attendanceMode as any,
            defaultMaxStudents: 60,
            defaultStartTime: startTime,
            defaultEndTime: endTime,
            colorCode: '#7c3aed',
            iconName: 'Layers',
            displayOrder: d.displayOrder,
            isDefault: d.code === 'OFFLINE',
            isActive: true,
            createdBy: 'system',
            updatedBy: 'system',
          },
        });
      }

      result = await paginate({
        model: this.prisma.batchDeliveryTypes,
        where,
        orderBy: buildPrismaOrderBy(
          query.sortBy || 'displayOrder',
          query.sortOrder || 'asc',
        ),
        query,
        tenantId,
      });
    }

    return result;
  }

  async findOne(id: string, tenantId: string) {
    const dt = await this.prisma.batchDeliveryTypes.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id }),
    });
    if (!dt) throw new NotFoundException('Batch delivery type not found');
    return dt;
  }

  async update(
    id: string,
    dto: Partial<CreateBatchDeliveryTypeDto>,
    tenantId: string,
    userId: string,
  ) {
    const existingDt = await this.findOne(id, tenantId);

    const start = dto.defaultStartTime
      ? new Date(dto.defaultStartTime)
      : existingDt.defaultStartTime;
    const end = dto.defaultEndTime
      ? new Date(dto.defaultEndTime)
      : existingDt.defaultEndTime;

    if (start >= end) {
      throw new BadRequestException(
        'Default start time must be before end time',
      );
    }

    const normalizedCode = dto.code ? dto.code.trim().toUpperCase() : undefined;

    if (normalizedCode) {
      const existing = await this.prisma.batchDeliveryTypes.findFirst({
        where: {
          tenantId,
          code: normalizedCode,
          deletedAt: null,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException(
          `Batch delivery type with code "${dto.code}" already exists`,
        );
      }
    }

    const updatePayload: Record<string, any> = {
      ...dto,
      updatedBy: userId,
    };
    if (normalizedCode) updatePayload.code = normalizedCode;
    if (dto.name) updatePayload.name = dto.name.trim();
    if (dto.defaultStartTime) updatePayload.defaultStartTime = start;
    if (dto.defaultEndTime) updatePayload.defaultEndTime = end;

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.batchDeliveryTypes.updateMany({
          where: { tenantId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }
      return tx.batchDeliveryTypes.update({
        where: { tenantId_id: { tenantId, id } },
        data: updatePayload,
      });
    });
  }

  async remove(id: string, tenantId: string, userId: string) {
    await this.findOne(id, tenantId);
    const batchCount = await this.prisma.batches.count({
      where: { tenantId, deliveryTypeId: id, deletedAt: null },
    });
    if (batchCount > 0)
      throw new ConflictException(
        'Cannot delete delivery type: it is used by active batches',
      );
    await this.tenantScoped.softDelete(
      this.prisma.batchDeliveryTypes,
      id,
      tenantId,
      userId,
    );
  }
}
