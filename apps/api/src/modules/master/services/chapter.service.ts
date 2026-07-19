/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
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
import { CreateChapterDto } from '../dto/create-chapter.dto';
import { UpdateChapterDto } from '../dto/update-chapter.dto';

const SEARCH_FIELDS = ['name', 'shortName', 'code'];

@Injectable()
export class ChapterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScoped: TenantScopedPrisma,
  ) {}

  async create(dto: CreateChapterDto, tenantId: string, userId: string) {
    return this.prisma.chapters.create({
      data: {
        tenantId,
        courseSubjectId: dto.courseSubjectId,
        code: dto.code,
        name: dto.name,
        shortName: dto.shortName || dto.name,
        description: dto.description || '',
        plannedHours: dto.plannedHours || 10,
        estimatedSessions: dto.estimatedSessions || 8,
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
    courseSubjectId?: string,
  ): Promise<PaginatedResult<any>> {
    const where: any = this.tenantScoped.buildWhere(tenantId);
    if (courseSubjectId) where.courseSubjectId = courseSubjectId;
    if (query.search)
      where.OR = buildPrismaSearch(query.search, SEARCH_FIELDS)?.OR;
    return paginate({
      model: this.prisma.chapters,
      where,
      orderBy: buildPrismaOrderBy(query.sortBy, query.sortOrder),
      query,
      tenantId,
    });
  }

  async findOne(id: string, tenantId: string) {
    const chapter = await this.prisma.chapters.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id }),
    });
    if (!chapter) throw new NotFoundException('Chapter not found');
    return chapter;
  }

  async update(
    id: string,
    dto: UpdateChapterDto,
    tenantId: string,
    userId: string,
  ) {
    await this.findOne(id, tenantId);
    return this.prisma.chapters.update({
      where: { tenantId_id: { tenantId, id } },
      data: { ...dto, updatedBy: userId },
    });
  }

  async remove(id: string, tenantId: string, userId: string) {
    await this.findOne(id, tenantId);
    await this.tenantScoped.softDelete(
      this.prisma.chapters,
      id,
      tenantId,
      userId,
    );
  }
}
