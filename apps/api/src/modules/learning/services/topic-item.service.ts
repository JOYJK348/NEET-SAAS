import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { TenantScopedPrisma } from '../../../common/utils/tenant-scoped-prisma';
import { CreateTopicItemDto } from '../dto/create-topic-item.dto';
import { UpdateTopicItemDto } from '../dto/update-topic-item.dto';
import { ReorderTopicItemsDto } from '../dto/reorder-topic-items.dto';

@Injectable()
export class TopicItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScoped: TenantScopedPrisma,
  ) {}

  async create(dto: CreateTopicItemDto, tenantId: string, userId: string) {
    const topic = await this.prisma.topics.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id: dto.topicId }),
    });
    if (!topic) throw new NotFoundException('Topic not found');

    const maxOrder = await this.prisma.topicItems.findFirst({
      where: { tenantId, topicId: dto.topicId, deletedAt: null },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });

    return this.prisma.topicItems.create({
      data: {
        tenantId,
        topicId: dto.topicId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        content: (dto.content as Prisma.InputJsonValue) ?? undefined,
        fileUrl: dto.fileUrl,
        externalUrl: dto.externalUrl,
        metadata: (dto.metadata as Prisma.InputJsonValue) ?? undefined,
        displayOrder:
          dto.displayOrder ?? (maxOrder ? maxOrder.displayOrder + 1 : 1),
        durationMins: dto.durationMins,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async findByTopic(topicId: string, tenantId: string) {
    const topic = await this.prisma.topics.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id: topicId }),
    });
    if (!topic) throw new NotFoundException('Topic not found');

    return this.prisma.topicItems.findMany({
      where: { tenantId, topicId, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const item = await this.prisma.topicItems.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id }),
    });
    if (!item) throw new NotFoundException('Topic item not found');
    return item;
  }

  async update(
    id: string,
    dto: UpdateTopicItemDto,
    tenantId: string,
    userId: string,
  ) {
    await this.findOne(id, tenantId);
    const data: Record<string, unknown> = { updatedBy: userId };
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.fileUrl !== undefined) data.fileUrl = dto.fileUrl;
    if (dto.externalUrl !== undefined) data.externalUrl = dto.externalUrl;
    if (dto.metadata !== undefined) data.metadata = dto.metadata;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.displayOrder !== undefined) data.displayOrder = dto.displayOrder;
    if (dto.durationMins !== undefined) data.durationMins = dto.durationMins;
    if (dto.completionRule !== undefined)
      data.completionRule = dto.completionRule;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.topicItems.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, tenantId: string, userId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.topicItems.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        updatedBy: userId,
      },
    });
  }

  async reorder(dto: ReorderTopicItemsDto, tenantId: string, userId: string) {
    const topic = await this.prisma.topics.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id: dto.topicId }),
    });
    if (!topic) throw new BadRequestException('Topic not found in this tenant');

    const itemIds = dto.items.map((i) => i.id);
    const existing = await this.prisma.topicItems.findMany({
      where: {
        tenantId,
        topicId: dto.topicId,
        id: { in: itemIds },
        deletedAt: null,
      },
      select: { id: true },
    });
    if (existing.length !== itemIds.length) {
      throw new BadRequestException(
        'One or more items do not belong to this topic',
      );
    }

    await Promise.all(
      dto.items.map((item) =>
        this.prisma.topicItems.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder, updatedBy: userId },
        }),
      ),
    );

    return { success: true };
  }
}
