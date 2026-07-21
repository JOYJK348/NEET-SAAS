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
import { CreateChapterDto } from '../dto/create-chapter.dto';
import { UpdateChapterDto } from '../dto/update-chapter.dto';
import { ReorderChaptersDto } from '../dto/reorder.dto';

const SEARCH_FIELDS = ['name', 'shortName', 'code'];

@Injectable()
export class ChapterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScoped: TenantScopedPrisma,
  ) {}

  async create(dto: CreateChapterDto, tenantId: string, userId: string) {
    const normalizedCode = dto.code.trim().toUpperCase();

    if (dto.plannedHours !== undefined && dto.plannedHours < 0) {
      throw new BadRequestException('Planned hours cannot be negative');
    }
    if (dto.estimatedSessions !== undefined && dto.estimatedSessions < 0) {
      throw new BadRequestException('Estimated sessions cannot be negative');
    }

    // Verify parent CourseSubject exists and belongs to the tenant
    const courseSubject = await this.prisma.courseSubjects.findFirst({
      where: { id: dto.courseSubjectId, tenantId, deletedAt: null },
    });
    if (!courseSubject) {
      throw new NotFoundException('Course subject mapping not found');
    }

    // Check code uniqueness within parent courseSubject scope
    const existing = await this.prisma.chapters.findFirst({
      where: {
        tenantId,
        courseSubjectId: dto.courseSubjectId,
        code: normalizedCode,
        deletedAt: null,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Chapter with code "${dto.code}" already exists for this subject`,
      );
    }

    return this.prisma.chapters.create({
      data: {
        tenantId,
        courseSubjectId: dto.courseSubjectId,
        code: normalizedCode,
        name: dto.name.trim(),
        shortName: dto.shortName?.trim() || dto.name.trim(),
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
    const existingChapter = await this.findOne(id, tenantId);

    if (dto.plannedHours !== undefined && dto.plannedHours < 0) {
      throw new BadRequestException('Planned hours cannot be negative');
    }
    if (dto.estimatedSessions !== undefined && dto.estimatedSessions < 0) {
      throw new BadRequestException('Estimated sessions cannot be negative');
    }

    const normalizedCode = dto.code ? dto.code.trim().toUpperCase() : undefined;

    if (normalizedCode) {
      const existing = await this.prisma.chapters.findFirst({
        where: {
          tenantId,
          courseSubjectId: existingChapter.courseSubjectId,
          code: normalizedCode,
          deletedAt: null,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException(
          `Chapter with code "${dto.code}" already exists for this subject`,
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

    return this.prisma.chapters.update({
      where: { tenantId_id: { tenantId, id } },
      data: updatePayload,
    });
  }

  async remove(id: string, tenantId: string, userId: string) {
    await this.findOne(id, tenantId);
    const topicCount = await this.prisma.topics.count({
      where: { tenantId, chapterId: id, deletedAt: null },
    });
    if (topicCount > 0)
      throw new ConflictException('Cannot delete chapter: it has topics');
    await this.tenantScoped.softDelete(
      this.prisma.chapters,
      id,
      tenantId,
      userId,
    );
  }

  async reorder(dto: ReorderChaptersDto, tenantId: string, userId: string) {
    const subject = await this.prisma.courseSubjects.findFirst({
      where: { id: dto.courseSubjectId, tenantId, deletedAt: null },
    });
    if (!subject) throw new BadRequestException('Course subject not found');

    const chapterIds = dto.items.map((i) => i.id);
    const existing = await this.prisma.chapters.findMany({
      where: {
        tenantId,
        courseSubjectId: dto.courseSubjectId,
        id: { in: chapterIds },
        deletedAt: null,
      },
      select: { id: true },
    });
    if (existing.length !== chapterIds.length) {
      throw new BadRequestException(
        'One or more chapters do not belong to this subject',
      );
    }

    await Promise.all(
      dto.items.map((item) =>
        this.prisma.chapters.update({
          where: { tenantId_id: { tenantId, id: item.id } },
          data: { displayOrder: item.displayOrder, updatedBy: userId },
        }),
      ),
    );
    return { success: true };
  }
}
