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
    return this.prisma.branches.create({
      data: {
        tenantId,
        code: dto.code,
        slug: dto.slug,
        name: dto.name,
        displayName: dto.displayName,
        email: dto.email,
        phone: dto.phone,
        branchType: dto.branchType as any,
        status: dto.status || 'ACTIVE',
        timezone: dto.timezone || 'Asia/Kolkata',
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
    return this.prisma.branches.update({
      where: { tenantId_id: { tenantId, id } },
      data: { ...dto, updatedBy: userId },
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
