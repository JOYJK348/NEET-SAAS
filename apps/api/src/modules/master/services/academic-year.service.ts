/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
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
import { CreateAcademicYearDto } from '../dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from '../dto/update-academic-year.dto';

@Injectable()
export class AcademicYearService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScoped: TenantScopedPrisma,
  ) {}

  async create(dto: CreateAcademicYearDto, tenantId: string, userId: string) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (start >= end) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Check for duplicate active code
    const existingCode = await this.prisma.academicYears.findFirst({
      where: {
        tenantId,
        code: dto.code.trim().toUpperCase(),
        deletedAt: null,
      },
    });
    if (existingCode) {
      throw new ConflictException(
        `Academic year with code "${dto.code}" already exists`,
      );
    }

    // Check for overlaps among active academic years
    // Commented out: multiple academic year tracks/schedules can run concurrently on overlapping dates
    /*
    const overlapping = await this.prisma.academicYears.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });
    if (overlapping) {
      throw new ConflictException(
        `Academic year overlaps with an existing active year: ${overlapping.name} (${overlapping.code})`,
      );
    }
    */

    return this.prisma.$transaction(async (tx) => {
      if (dto.isCurrent) {
        await tx.academicYears.updateMany({
          where: { tenantId, isCurrent: true },
          data: { isCurrent: false },
        });
      }
      return tx.academicYears.create({
        data: {
          tenantId,
          code: dto.code.trim().toUpperCase(),
          name: dto.name.trim(),
          description: dto.description?.trim() || '',
          startDate: start,
          endDate: end,
          displayOrder: dto.displayOrder || 1,
          isCurrent: dto.isCurrent || false,
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
    if (query.status) {
      if (query.status === 'ACTIVE') {
        where.isActive = true;
      } else if (query.status === 'INACTIVE') {
        where.isActive = false;
      }
    }
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
    const existing = await this.findOne(id, tenantId);
    const start = dto.startDate ? new Date(dto.startDate) : existing.startDate;
    const end = dto.endDate ? new Date(dto.endDate) : existing.endDate;

    if (start >= end) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Check overlaps excluding current record
    // Commented out: multiple academic year tracks/schedules can run concurrently on overlapping dates
    /*
    const overlapping = await this.prisma.academicYears.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        id: { not: id },
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });
    if (overlapping) {
      throw new ConflictException(
        `Academic year overlaps with an existing active year: ${overlapping.name} (${overlapping.code})`,
      );
    }
    */

    const updateData: Record<string, unknown> = {
      ...dto,
      updatedBy: userId,
    };
    if (dto.name) updateData.name = dto.name.trim();
    if (dto.description) updateData.description = dto.description.trim();
    if (dto.startDate) updateData.startDate = start;
    if (dto.endDate) updateData.endDate = end;

    return this.prisma.$transaction(async (tx) => {
      if (dto.isCurrent) {
        await tx.academicYears.updateMany({
          where: { tenantId, isCurrent: true, id: { not: id } },
          data: { isCurrent: false },
        });
      }
      return tx.academicYears.update({
        where: { tenantId_id: { tenantId, id } },
        data: updateData,
      });
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
}
