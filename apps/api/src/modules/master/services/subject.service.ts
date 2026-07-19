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
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { UpdateSubjectDto } from '../dto/update-subject.dto';

const SEARCH_FIELDS = ['name', 'displayName', 'shortName', 'code'];

@Injectable()
export class SubjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScoped: TenantScopedPrisma,
  ) {}

  async create(dto: CreateSubjectDto, tenantId: string, userId: string) {
    return this.prisma.subjects.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name,
        shortName: dto.shortName || dto.name,
        displayName: dto.displayName,
        description: dto.description || '',
        subjectType: dto.subjectType || 'CORE',
        displayOrder: dto.displayOrder || 1,
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
    if (query.search)
      where.OR = buildPrismaSearch(query.search, SEARCH_FIELDS)?.OR;
    return paginate({
      model: this.prisma.subjects,
      where,
      orderBy: buildPrismaOrderBy(query.sortBy, query.sortOrder),
      query,
      tenantId,
    });
  }

  async findOne(id: string, tenantId: string) {
    const subj = await this.prisma.subjects.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id }),
    });
    if (!subj) throw new NotFoundException('Subject not found');
    return subj;
  }

  async update(
    id: string,
    dto: UpdateSubjectDto,
    tenantId: string,
    userId: string,
  ) {
    await this.findOne(id, tenantId);
    return this.prisma.subjects.update({
      where: { tenantId_id: { tenantId, id } },
      data: { ...dto, updatedBy: userId },
    });
  }

  async remove(id: string, tenantId: string, userId: string) {
    await this.findOne(id, tenantId);
    const mappingCount = await this.prisma.courseSubjects.count({
      where: { tenantId, subjectId: id, deletedAt: null },
    });
    if (mappingCount > 0)
      throw new ConflictException(
        'Cannot delete subject: it is mapped to one or more courses',
      );
    await this.tenantScoped.softDelete(
      this.prisma.subjects,
      id,
      tenantId,
      userId,
    );
  }
}
