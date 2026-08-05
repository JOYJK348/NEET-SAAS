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
    const trimmedName = dto.name.trim();

    // Check duplicate by name (case-insensitive) or code
    const existing = await this.prisma.subjects.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { name: { equals: trimmedName, mode: 'insensitive' } },
          ...(dto.code ? [{ code: dto.code }] : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictException(`Subject "${trimmedName}" already exists`);
    }

    if (!dto.code) {
      const clean = trimmedName.replace(/[^a-zA-Z0-9]/g, '');
      const prefix = clean.length >= 3 ? clean.substring(0, 3).toUpperCase() : 'SUB';
      dto.code = `SUB-${prefix}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const subject = await this.prisma.subjects.create({
      data: {
        tenantId,
        code: dto.code,
        name: trimmedName,
        shortName: dto.shortName || trimmedName,
        displayName: dto.displayName ? dto.displayName.trim() : trimmedName,
        description: dto.description || '',
        subjectType: dto.subjectType || 'CORE',
        displayOrder: dto.displayOrder || 1,
        isActive: dto.isActive ?? true,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    if (dto.chapters && dto.chapters.length > 0) {
      const cs = await this.getOrCreateMasterCourseSubject(
        subject.id,
        tenantId,
        userId,
      );
      let order = 1;
      for (const ch of dto.chapters) {
        if (!ch.name || !ch.name.trim()) continue;
        const cleanName = ch.name.trim();
        const codePrefix =
          cleanName
            .replace(/[^a-zA-Z0-9]/g, '')
            .substring(0, 4)
            .toUpperCase() || 'CHAP';

        await this.prisma.chapters.create({
          data: {
            tenantId,
            courseSubjectId: cs.id,
            code: `CH-${codePrefix}-${order}`,
            name: cleanName,
            shortName: cleanName,
            description: '',
            displayOrder: order++,
            createdBy: userId,
            updatedBy: userId,
          },
        });
      }
    }

    return subject;
  }

  async bulkCreate(
    dtos: CreateSubjectDto[],
    tenantId: string,
    userId: string,
  ) {
    const createdSubjects: any[] = [];
    let skippedCount = 0;

    // Get existing active subjects for tenant
    const existing = await this.prisma.subjects.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, name: true, code: true },
    });

    const existingNamesSet = new Set(
      existing.map((s) => s.name.trim().toLowerCase()),
    );
    const existingCodesSet = new Set(existing.map((s) => s.code.toUpperCase()));
    const batchProcessedNames = new Set<string>();

    for (const dto of dtos) {
      if (!dto.name || !dto.name.trim()) continue;
      const normalizedName = dto.name.trim().toLowerCase();

      // Skip duplicate within batch or existing DB
      if (batchProcessedNames.has(normalizedName) || existingNamesSet.has(normalizedName)) {
        skippedCount++;
        continue;
      }

      batchProcessedNames.add(normalizedName);
      existingNamesSet.add(normalizedName);

      if (!dto.code) {
        const clean = dto.name.trim().replace(/[^a-zA-Z0-9]/g, '');
        const prefix = clean.length >= 3 ? clean.substring(0, 3).toUpperCase() : 'SUB';
        let candidateCode = `SUB-${prefix}-${Math.floor(100 + Math.random() * 900)}`;
        let attempts = 0;
        while (existingCodesSet.has(candidateCode) && attempts < 50) {
          candidateCode = `SUB-${prefix}-${Math.floor(100 + Math.random() * 900)}`;
          attempts++;
        }
        dto.code = candidateCode;
        existingCodesSet.add(candidateCode);
      }

      if (!dto.displayName) dto.displayName = dto.name;

      try {
        const subj = await this.create(dto, tenantId, userId);
        createdSubjects.push(subj);
      } catch {
        skippedCount++;
      }
    }

    return {
      count: createdSubjects.length,
      skipped: skippedCount,
      subjects: createdSubjects,
    };
  }

  async findAll(
    tenantId: string,
    query: QueryParamsDto,
  ): Promise<PaginatedResult<any>> {
    const where: any = this.tenantScoped.buildWhere(tenantId);
    if (query.search)
      where.OR = buildPrismaSearch(query.search, SEARCH_FIELDS)?.OR;
    const paginated = await paginate({
      model: this.prisma.subjects,
      where,
      orderBy: buildPrismaOrderBy(query.sortBy, query.sortOrder),
      query,
      tenantId,
    });

    const subjectIds = paginated.data.map((s: any) => s.id);
    if (subjectIds.length === 0) return paginated;

    const courseSubjects = await this.prisma.courseSubjects.findMany({
      where: { tenantId, subjectId: { in: subjectIds }, deletedAt: null },
      select: { id: true, subjectId: true },
    });

    const csIds = courseSubjects.map((cs) => cs.id);
    const csSubjectMap = new Map<string, string[]>();
    for (const cs of courseSubjects) {
      if (!csSubjectMap.has(cs.subjectId)) csSubjectMap.set(cs.subjectId, []);
      csSubjectMap.get(cs.subjectId)!.push(cs.id);
    }

    const chapters = await this.prisma.chapters.findMany({
      where: { tenantId, courseSubjectId: { in: csIds }, deletedAt: null },
      select: { id: true, courseSubjectId: true },
    });

    const chapterIds = chapters.map((ch) => ch.id);
    const topics = await this.prisma.topics.findMany({
      where: { tenantId, chapterId: { in: chapterIds }, deletedAt: null },
      select: { id: true, chapterId: true },
    });

    const enrichedData = paginated.data.map((s: any) => {
      const subjectCSIds = csSubjectMap.get(s.id) || [];
      const subjChapters = chapters.filter((ch) =>
        subjectCSIds.includes(ch.courseSubjectId),
      );
      const subjChapterIds = subjChapters.map((ch) => ch.id);
      const subjTopics = topics.filter((tp) =>
        subjChapterIds.includes(tp.chapterId),
      );

      return {
        ...s,
        _count: {
          chapters: subjChapters.length,
          topics: subjTopics.length,
        },
      };
    });

    return { ...paginated, data: enrichedData };
  }

  async findOne(id: string, tenantId: string) {
    const subj = await this.prisma.subjects.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id }),
    });
    if (!subj) throw new NotFoundException('Subject not found');
    return subj;
  }

  async getOrCreateMasterCourseSubject(
    subjectId: string,
    tenantId: string,
    userId: string,
  ) {
    await this.findOne(subjectId, tenantId);

    let cs = await this.prisma.courseSubjects.findFirst({
      where: { tenantId, subjectId, deletedAt: null },
    });

    if (!cs) {
      let masterCourse = await this.prisma.courses.findFirst({
        where: { tenantId, code: 'MASTER-PROGRAM', deletedAt: null },
      });

      if (!masterCourse) {
        masterCourse = await this.prisma.courses.create({
          data: {
            tenantId,
            code: 'MASTER-PROGRAM',
            name: 'Master Curriculum Program',
            displayName: 'Master Curriculum Program',
            description: 'Master course repository',
            courseType: 'REGULAR',
            durationMonths: 12,
            isActive: true,
            createdBy: userId,
            updatedBy: userId,
          },
        });
      }

      cs = await this.prisma.courseSubjects.create({
        data: {
          tenantId,
          courseId: masterCourse.id,
          subjectId,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }

    // Find ALL courseSubjects for this subjectId in the tenant
    const allCS = await this.prisma.courseSubjects.findMany({
      where: { tenantId, subjectId, deletedAt: null },
      select: { id: true },
    });
    const allCSIds = allCS.map((c) => c.id);

    // Find ALL chapters under any courseSubject for this subject
    const rawChapters = await this.prisma.chapters.findMany({
      where: { tenantId, courseSubjectId: { in: allCSIds }, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
    });

    // Group chapters by normalized key (code || name)
    const chapterMap = new Map<string, { main: (typeof rawChapters)[0]; allIds: string[] }>();
    for (const ch of rawChapters) {
      const key = (ch.code || ch.name).trim().toUpperCase();
      if (!chapterMap.has(key)) {
        chapterMap.set(key, { main: ch, allIds: [ch.id] });
      } else {
        chapterMap.get(key)!.allIds.push(ch.id);
      }
    }

    const chaptersWithTopics: any[] = [];
    for (const { main: ch, allIds } of chapterMap.values()) {
      // Find ALL topics under any matching chapter ID
      const rawTopics = await this.prisma.topics.findMany({
        where: { tenantId, chapterId: { in: allIds }, deletedAt: null },
        orderBy: { displayOrder: 'asc' },
      });

      // Deduplicate topics by normalized key (code || name)
      const topicMap = new Map<string, (typeof rawTopics)[0]>();
      for (const tp of rawTopics) {
        const key = (tp.code || tp.name).trim().toUpperCase();
        if (!topicMap.has(key)) {
          topicMap.set(key, tp);
        }
      }

      chaptersWithTopics.push({
        ...ch,
        topics: Array.from(topicMap.values()),
      });
    }

    return {
      ...cs,
      chapters: chaptersWithTopics,
    };
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
