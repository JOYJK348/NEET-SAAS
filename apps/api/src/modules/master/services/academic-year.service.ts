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
import { CreateAcademicYearDto } from '../dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from '../dto/update-academic-year.dto';

@Injectable()
export class AcademicYearService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScoped: TenantScopedPrisma,
  ) {}

  async create(dto: CreateAcademicYearDto, tenantId: string, userId: string) {
    if (dto.isCurrent) await this.clearCurrentFlag(tenantId);
    return this.prisma.academicYears.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name,
        description: dto.description || '',
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        displayOrder: dto.displayOrder || 1,
        isCurrent: dto.isCurrent || false,
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
      model: this.prisma.academicYears,
      where,
      orderBy: buildPrismaOrderBy(query.sortBy, query.sortOrder),
      query,
      tenantId,
    });
  }

  async findOne(id: string, tenantId: string) {
    const year = await this.prisma.academicYears.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id }),
    });
    if (!year) throw new NotFoundException('Academic year not found');
    return year;
  }

  async update(
    id: string,
    dto: UpdateAcademicYearDto,
    tenantId: string,
    userId: string,
  ) {
    await this.findOne(id, tenantId);
    if (dto.isCurrent) await this.clearCurrentFlag(tenantId);

    const updateData: Record<string, unknown> = {
      ...dto,
      updatedBy: userId,
    };
    if (dto.startDate) {
      updateData['startDate'] = new Date(dto.startDate);
    }
    if (dto.endDate) {
      updateData['endDate'] = new Date(dto.endDate);
    }

    return this.prisma.academicYears.update({
      where: { tenantId_id: { tenantId, id } },
      data: updateData,
    });
  }

  async remove(id: string, tenantId: string, userId: string) {
    await this.findOne(id, tenantId);
    const batchCount = await this.prisma.batches.count({
      where: { tenantId, academicYearId: id, deletedAt: null },
    });
    if (batchCount > 0)
      throw new ConflictException(
        'Cannot delete academic year: it has active batches',
      );
    await this.tenantScoped.softDelete(
      this.prisma.academicYears,
      id,
      tenantId,
      userId,
    );
  }

  private async clearCurrentFlag(tenantId: string) {
    await this.prisma.academicYears.updateMany({
      where: { tenantId, isCurrent: true },
      data: { isCurrent: false },
    });
  }
}
