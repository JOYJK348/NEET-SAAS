/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ConflictException,
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
    if (dto.isDefault) await this.clearDefaultFlag(tenantId);
    return this.prisma.batchDeliveryTypes.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name,
        description: dto.description || '',
        attendanceMode: dto.attendanceMode as any,
        defaultMaxStudents: dto.defaultMaxStudents || 40,
        defaultStartTime: new Date(dto.defaultStartTime),
        defaultEndTime: new Date(dto.defaultEndTime),
        colorCode: dto.colorCode || '',
        iconName: dto.iconName || '',
        displayOrder: dto.displayOrder || 1,
        isDefault: dto.isDefault || false,
        isActive: dto.isActive ?? true,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async findAll(
    tenantId: string,
    query: QueryParamsDto,
  ): Promise<PaginatedResult<any>> {
    const where: any = this.tenantScoped.buildWhere(tenantId);
    return paginate({
      model: this.prisma.batchDeliveryTypes,
      where,
      orderBy: buildPrismaOrderBy(query.sortBy, query.sortOrder),
      query,
      tenantId,
    });
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
    await this.findOne(id, tenantId);
    if (dto.isDefault) await this.clearDefaultFlag(tenantId);
    return this.prisma.batchDeliveryTypes.update({
      where: { tenantId_id: { tenantId, id } },
      data: { ...dto, updatedBy: userId },
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

  private async clearDefaultFlag(tenantId: string) {
    await this.prisma.batchDeliveryTypes.updateMany({
      where: { tenantId, isDefault: true },
      data: { isDefault: false },
    });
  }
}
