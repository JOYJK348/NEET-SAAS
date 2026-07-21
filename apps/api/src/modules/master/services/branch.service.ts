/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
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
  buildPrismaSearch,
} from '../../../common/utils/prisma-paginator';
import {
  PaginatedResult,
  QueryParamsDto,
} from '../../../common/dto/query-params.dto';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';

const SEARCH_FIELDS = ['name', 'displayName', 'code', 'email', 'phone'];

@Injectable()
export class BranchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScoped: TenantScopedPrisma,
  ) {}

  async create(dto: CreateBranchDto, tenantId: string, userId: string) {
    const normalizedCode = dto.code.trim().toUpperCase();
    const normalizedSlug = dto.slug.trim().toLowerCase();
    const normalizedEmail = dto.email.trim().toLowerCase();

    // Active duplicate checks
    const existing = await this.prisma.branches.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { code: normalizedCode },
          { slug: normalizedSlug },
          { email: normalizedEmail },
        ],
      },
    });
    if (existing) {
      if (existing.code === normalizedCode)
        throw new ConflictException(
          `Branch with code "${dto.code}" already exists`,
        );
      if (existing.slug === normalizedSlug)
        throw new ConflictException(
          `Branch with slug "${dto.slug}" already exists`,
        );
      if (existing.email === normalizedEmail)
        throw new ConflictException(
          `Branch with email "${dto.email}" already exists`,
        );
    }

    return this.prisma.branches.create({
      data: {
        tenantId,
        code: normalizedCode,
        slug: normalizedSlug,
        name: dto.name.trim(),
        displayName: dto.displayName.trim(),
        email: normalizedEmail,
        phone: dto.phone.trim(),
        branchType: dto.branchType as any,
        status: dto.status || 'ACTIVE',
        timezone: dto.timezone || 'Asia/Kolkata',
        academicYearId: dto.academicYearId || null,
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
    if (query.search)
      where.OR = buildPrismaSearch(query.search, SEARCH_FIELDS)?.OR;
    if (query.status) {
      where.status = query.status;
    }
    return paginate({
      model: this.prisma.branches,
      where,
      orderBy: buildPrismaOrderBy(query.sortBy, query.sortOrder),
      query,
      tenantId,
    });
  }

  async findOne(id: string, tenantId: string) {
    const branch = await this.prisma.branches.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id }),
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async update(
    id: string,
    dto: UpdateBranchDto,
    tenantId: string,
    userId: string,
  ) {
    await this.findOne(id, tenantId);

    const normalizedSlug = dto.slug ? dto.slug.trim().toLowerCase() : undefined;
    const normalizedEmail = dto.email
      ? dto.email.trim().toLowerCase()
      : undefined;

    // Check duplicate among active branches excluding the current record
    const duplicateChecks: any[] = [];
    if (normalizedSlug) duplicateChecks.push({ slug: normalizedSlug });
    if (normalizedEmail) duplicateChecks.push({ email: normalizedEmail });

    if (duplicateChecks.length > 0) {
      const existing = await this.prisma.branches.findFirst({
        where: {
          tenantId,
          deletedAt: null,
          id: { not: id },
          OR: duplicateChecks,
        },
      });
      if (existing) {
        if (normalizedSlug && existing.slug === normalizedSlug)
          throw new ConflictException(
            `Branch with slug "${dto.slug}" already exists`,
          );
        if (normalizedEmail && existing.email === normalizedEmail)
          throw new ConflictException(
            `Branch with email "${dto.email}" already exists`,
          );
      }
    }

    const { branchType, ...updateData } = dto;
    const updatePayload: Record<string, any> = {
      ...updateData,
      updatedBy: userId,
    };

    if (normalizedSlug) updatePayload.slug = normalizedSlug;
    if (normalizedEmail) updatePayload.email = normalizedEmail;
    if (dto.name) updatePayload.name = dto.name.trim();
    if (dto.displayName) updatePayload.displayName = dto.displayName.trim();
    if (dto.phone) updatePayload.phone = dto.phone.trim();

    if (branchType) {
      updatePayload.branchType = branchType as any;
    }

    return this.prisma.branches.update({
      where: { tenantId_id: { tenantId, id } },
      data: updatePayload,
    });
  }

  async remove(id: string, tenantId: string, userId: string) {
    await this.findOne(id, tenantId);
    const batchCount = await this.prisma.batches.count({
      where: { tenantId, branchId: id, deletedAt: null },
    });
    if (batchCount > 0)
      throw new ConflictException(
        'Cannot delete branch: it has active batches',
      );
    await this.tenantScoped.softDelete(
      this.prisma.branches,
      id,
      tenantId,
      userId,
    );
  }
}
