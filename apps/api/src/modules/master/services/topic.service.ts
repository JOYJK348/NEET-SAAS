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
import { CreateTopicDto } from '../dto/create-topic.dto';
import { UpdateTopicDto } from '../dto/update-topic.dto';

const SEARCH_FIELDS = ['name', 'shortName', 'code'];

@Injectable()
export class TopicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScoped: TenantScopedPrisma,
  ) {}

  async create(dto: CreateTopicDto, tenantId: string, userId: string) {
    return this.prisma.topics.create({
      data: {
        tenantId,
        chapterId: dto.chapterId,
        code: dto.code,
        name: dto.name,
        shortName: dto.shortName || dto.name,
        description: dto.description || '',
        learningObjectives: dto.learningObjectives || '',
        difficultyLevel: dto.difficultyLevel || 'MEDIUM',
        plannedHours: dto.plannedHours || 4,
        plannedSessions: dto.plannedSessions || 3,
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
    chapterId?: string,
  ): Promise<PaginatedResult<any>> {
    const where: any = this.tenantScoped.buildWhere(tenantId);
    if (chapterId) where.chapterId = chapterId;
    if (query.search)
      where.OR = buildPrismaSearch(query.search, SEARCH_FIELDS)?.OR;
    return paginate({
      model: this.prisma.topics,
      where,
      orderBy: buildPrismaOrderBy(query.sortBy, query.sortOrder),
      query,
      tenantId,
    });
  }

  async findOne(id: string, tenantId: string) {
    const topic = await this.prisma.topics.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id }),
    });
    if (!topic) throw new NotFoundException('Topic not found');
    return topic;
  }

  async update(
    id: string,
    dto: UpdateTopicDto,
    tenantId: string,
    userId: string,
  ) {
    await this.findOne(id, tenantId);
    return this.prisma.topics.update({
      where: { tenantId_id: { tenantId, id } },
      data: { ...dto, updatedBy: userId },
    });
  }

  async remove(id: string, tenantId: string, userId: string) {
    await this.findOne(id, tenantId);
    await this.tenantScoped.softDelete(
      this.prisma.topics,
      id,
      tenantId,
      userId,
    );
  }
}
