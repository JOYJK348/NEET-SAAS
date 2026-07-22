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
  buildPrismaSearch,
} from '../../../common/utils/prisma-paginator';
import {
  PaginatedResult,
  QueryParamsDto,
} from '../../../common/dto/query-params.dto';
import { CreateTopicDto } from '../dto/create-topic.dto';
import { UpdateTopicDto } from '../dto/update-topic.dto';
import { ReorderTopicsDto } from '../dto/reorder.dto';

const SEARCH_FIELDS = ['name', 'shortName', 'code'];

@Injectable()
export class TopicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScoped: TenantScopedPrisma,
  ) {}

  async create(dto: CreateTopicDto, tenantId: string, userId: string) {
    const normalizedCode = dto.code.trim().toUpperCase();

    if (dto.plannedHours !== undefined && dto.plannedHours < 0) {
      throw new BadRequestException('Planned hours cannot be negative');
    }
    if (dto.plannedSessions !== undefined && dto.plannedSessions < 0) {
      throw new BadRequestException('Planned sessions cannot be negative');
    }

    // Verify parent Chapter exists and belongs to the tenant
    const chapter = await this.prisma.chapters.findFirst({
      where: { id: dto.chapterId, tenantId, deletedAt: null },
    });
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    // Check code uniqueness within parent chapter scope
    const existing = await this.prisma.topics.findFirst({
      where: {
        tenantId,
        chapterId: dto.chapterId,
        code: normalizedCode,
        deletedAt: null,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Topic with code "${dto.code}" already exists for this chapter`,
      );
    }

    return this.prisma.topics.create({
      data: {
        tenantId,
        chapterId: dto.chapterId,
        code: normalizedCode,
        name: dto.name.trim(),
        shortName: dto.shortName?.trim() || dto.name.trim(),
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
    const existingTopic = await this.findOne(id, tenantId);

    if (dto.plannedHours !== undefined && dto.plannedHours < 0) {
      throw new BadRequestException('Planned hours cannot be negative');
    }
    if (dto.plannedSessions !== undefined && dto.plannedSessions < 0) {
      throw new BadRequestException('Planned sessions cannot be negative');
    }

    const normalizedCode = dto.code ? dto.code.trim().toUpperCase() : undefined;

    if (normalizedCode) {
      const existing = await this.prisma.topics.findFirst({
        where: {
          tenantId,
          chapterId: existingTopic.chapterId,
          code: normalizedCode,
          deletedAt: null,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException(
          `Topic with code "${dto.code}" already exists for this chapter`,
        );
      }
    }

    const updatePayload: Record<string, any> = {
      ...dto,
      updatedBy: userId,
    };
    if (normalizedCode) updatePayload.code = normalizedCode;
    if (dto.name) updatePayload.name = dto.name.trim();
    if (dto.shortName) updatePayload.shortName = dto.shortName.trim();

    return this.prisma.topics.update({
      where: { tenantId_id: { tenantId, id } },
      data: updatePayload,
    });
  }

  async remove(id: string, tenantId: string, userId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.topicItems.updateMany({
      where: { tenantId, topicId: id, deletedAt: null },
      data: { deletedAt: new Date(), deletedBy: userId, updatedBy: userId },
    });
    await this.tenantScoped.softDelete(
      this.prisma.topics,
      id,
      tenantId,
      userId,
    );
  }

  async reorder(dto: ReorderTopicsDto, tenantId: string, userId: string) {
    const chapter = await this.prisma.chapters.findFirst({
      where: { id: dto.chapterId, tenantId, deletedAt: null },
    });
    if (!chapter) throw new BadRequestException('Chapter not found');

    const topicIds = dto.items.map((i) => i.id);
    const existing = await this.prisma.topics.findMany({
      where: {
        tenantId,
        chapterId: dto.chapterId,
        id: { in: topicIds },
        deletedAt: null,
      },
      select: { id: true },
    });
    if (existing.length !== topicIds.length) {
      throw new BadRequestException(
        'One or more topics do not belong to this chapter',
      );
    }

    await Promise.all(
      dto.items.map((item) =>
        this.prisma.topics.update({
          where: { tenantId_id: { tenantId, id: item.id } },
          data: { displayOrder: item.displayOrder, updatedBy: userId },
        }),
      ),
    );
    return { success: true };
  }
}
