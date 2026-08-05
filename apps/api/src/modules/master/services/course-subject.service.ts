import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */

import { PrismaService } from '../../../common/prisma/prisma.service';
import { TenantScopedPrisma } from '../../../common/utils/tenant-scoped-prisma';
import { CreateCourseSubjectDto } from '../dto/create-course-subject.dto';

@Injectable()
export class CourseSubjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScoped: TenantScopedPrisma,
  ) {}

  async create(dto: CreateCourseSubjectDto, tenantId: string, userId: string) {
    const totalMarks = dto.totalMarks ?? 100;
    const passingMarks = dto.passingMarks ?? 40;
    const plannedHours = dto.plannedHours ?? 100;
    const credits = dto.credits ?? 0;

    if (
      totalMarks <= 0 ||
      passingMarks <= 0 ||
      plannedHours < 0 ||
      credits < 0
    ) {
      throw new BadRequestException(
        'Marks, hours, and credits must be non-negative/positive values',
      );
    }
    if (passingMarks > totalMarks) {
      throw new BadRequestException('Passing marks cannot exceed total marks');
    }

    // Verify parent Course exists and belongs to the tenant
    const course = await this.prisma.courses.findFirst({
      where: { id: dto.courseId, tenantId, deletedAt: null },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Verify parent Subject exists and belongs to the tenant
    const subject = await this.prisma.subjects.findFirst({
      where: { id: dto.subjectId, tenantId, deletedAt: null },
    });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    const existing = await this.prisma.courseSubjects.findFirst({
      where: {
        tenantId,
        courseId: dto.courseId,
        subjectId: dto.subjectId,
        deletedAt: null,
      },
    });
    if (existing)
      throw new ConflictException('Subject is already mapped to this course');
    const created = await this.prisma.courseSubjects.create({
      data: {
        tenantId,
        courseId: dto.courseId,
        subjectId: dto.subjectId,
        displayOrder: dto.displayOrder || 1,
        isMandatory: dto.isMandatory ?? true,
        totalMarks,
        passingMarks,
        credits,
        plannedHours,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    // Auto-clone existing master chapters and topics for this subject if available
    try {
      const existingCSList = await this.prisma.courseSubjects.findMany({
        where: {
          tenantId,
          subjectId: dto.subjectId,
          id: { not: created.id },
          deletedAt: null,
        },
        select: { id: true },
      });

      const existingCSIds = existingCSList.map((cs) => cs.id);

      if (existingCSIds.length > 0) {
        const masterChapters = await this.prisma.chapters.findMany({
          where: {
            tenantId,
            courseSubjectId: { in: existingCSIds },
            deletedAt: null,
          },
          orderBy: { displayOrder: 'asc' },
        });

        // Deduplicate chapters by code or uppercase name
        const uniqueChaptersMap = new Map<string, (typeof masterChapters)[0]>();
        for (const ch of masterChapters) {
          const key = ch.code || ch.name.trim().toUpperCase();
          if (!uniqueChaptersMap.has(key)) {
            // If specific chapter IDs are passed, check inclusion
            if (
              dto.selectedChapterIds &&
              dto.selectedChapterIds.length > 0 &&
              !dto.selectedChapterIds.includes(ch.id) &&
              !dto.selectedChapterIds.includes(ch.code)
            ) {
              continue;
            }
            uniqueChaptersMap.set(key, ch);
          }
        }

        for (const ch of uniqueChaptersMap.values()) {
          const newChapter = await this.prisma.chapters.create({
            data: {
              tenantId,
              courseSubjectId: created.id,
              code: ch.code,
              name: ch.name,
              shortName: ch.shortName,
              description: ch.description,
              plannedHours: ch.plannedHours,
              estimatedSessions: ch.estimatedSessions,
              displayOrder: ch.displayOrder,
              isActive: ch.isActive,
              isSystem: ch.isSystem,
              createdBy: userId,
              updatedBy: userId,
            },
          });

          const topics = await this.prisma.topics.findMany({
            where: { tenantId, chapterId: ch.id, deletedAt: null },
            orderBy: { displayOrder: 'asc' },
          });

          const uniqueTopicsMap = new Map<string, (typeof topics)[0]>();
          for (const tp of topics) {
            const key = tp.code || tp.name.trim().toUpperCase();
            if (!uniqueTopicsMap.has(key)) {
              // If specific topic IDs are passed, check inclusion
              if (
                dto.selectedTopicIds &&
                dto.selectedTopicIds.length > 0 &&
                !dto.selectedTopicIds.includes(tp.id) &&
                !dto.selectedTopicIds.includes(tp.code)
              ) {
                continue;
              }
              uniqueTopicsMap.set(key, tp);
            }
          }

          for (const tp of uniqueTopicsMap.values()) {
            const newTopic = await this.prisma.topics.create({
              data: {
                tenantId,
                chapterId: newChapter.id,
                code: tp.code,
                name: tp.name,
                shortName: tp.shortName,
                description: tp.description,
                learningObjectives: tp.learningObjectives,
                difficultyLevel: tp.difficultyLevel,
                plannedHours: tp.plannedHours,
                plannedSessions: tp.plannedSessions,
                displayOrder: tp.displayOrder,
                isActive: tp.isActive,
                isSystem: tp.isSystem,
                createdBy: userId,
                updatedBy: userId,
              },
            });

            const topicItems = await this.prisma.topicItems.findMany({
              where: { tenantId, topicId: tp.id, deletedAt: null },
              orderBy: { displayOrder: 'asc' },
            });

            for (const item of topicItems) {
              await this.prisma.topicItems.create({
                data: {
                  tenantId,
                  topicId: newTopic.id,
                  type: item.type,
                  title: item.title,
                  content: (item.content as any) ?? {},
                  metadata: (item.metadata as any) ?? {},
                  displayOrder: item.displayOrder,
                  isActive: item.isActive,
                  createdBy: userId,
                  updatedBy: userId,
                },
              });
            }
          }
        }
      }
    } catch {
      // Ignore cloning error to ensure courseSubject creation completes
    }

    return { ...created, subject };
  }

  async findByCourse(courseId: string, tenantId: string) {
    const courseSubjects = await this.prisma.courseSubjects.findMany({
      where: this.tenantScoped.buildWhere(tenantId, { courseId }),
      orderBy: { displayOrder: 'asc' },
    });

    if (courseSubjects.length === 0) return [];

    const courseSubjectIds = courseSubjects.map((cs) => cs.id);

    const subjectIds = [...new Set(courseSubjects.map((cs) => cs.subjectId))];
    const subjects = await this.prisma.subjects.findMany({
      where: { id: { in: subjectIds }, tenantId, deletedAt: null },
    });
    const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s]));

    const chapters = await this.prisma.chapters.findMany({
      where: {
        tenantId,
        courseSubjectId: { in: courseSubjectIds },
        deletedAt: null,
      },
      orderBy: { displayOrder: 'asc' },
    });

    const chapterIds = chapters.map((ch) => ch.id);
    const topics = await this.prisma.topics.findMany({
      where: { tenantId, chapterId: { in: chapterIds }, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
    });

    const topicItemCounts = await this.prisma.topicItems.groupBy({
      by: ['topicId'],
      where: { tenantId, topicId: { in: topics.map((tp) => tp.id) }, deletedAt: null },
      _count: { id: true },
    });
    const countMap: Record<string, number> = {};
    for (const row of topicItemCounts) {
      countMap[row.topicId] = row._count.id;
    }

    const topicMap: Record<string, any[]> = {};
    for (const tp of topics) {
      if (!topicMap[tp.chapterId]) topicMap[tp.chapterId] = [];
      topicMap[tp.chapterId].push({
        ...tp,
        _count: { topicItems: countMap[tp.id] ?? 0 },
      });
    }

    const chapterMap: Record<string, any[]> = {};
    for (const ch of chapters) {
      const chWithTopics = {
        ...ch,
        topics: topicMap[ch.id] || [],
      };
      if (!chapterMap[ch.courseSubjectId]) chapterMap[ch.courseSubjectId] = [];
      chapterMap[ch.courseSubjectId].push(chWithTopics);
    }

    return courseSubjects.map((cs) => ({
      ...cs,
      subject: subjectMap[cs.subjectId] ?? null,
      chapters: chapterMap[cs.id] || [],
    }));
  }

  async syncMasterChapters(
    courseSubjectId: string,
    tenantId: string,
    userId: string,
  ) {
    const cs = await this.prisma.courseSubjects.findFirst({
      where: { id: courseSubjectId, tenantId, deletedAt: null },
    });
    if (!cs) throw new NotFoundException('Course subject not found');

    const allCSList = await this.prisma.courseSubjects.findMany({
      where: { tenantId, subjectId: cs.subjectId, deletedAt: null },
      select: { id: true },
    });
    const allCSIds = allCSList.map((c) => c.id);

    if (allCSIds.length === 0) return { count: 0 };

    const masterChapters = await this.prisma.chapters.findMany({
      where: { tenantId, courseSubjectId: { in: allCSIds }, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
    });

    // Deduplicate chapters by code or uppercase name
    const uniqueChaptersMap = new Map<string, (typeof masterChapters)[0]>();
    for (const ch of masterChapters) {
      if (ch.courseSubjectId === cs.id) continue; // Skip existing in current
      const key = ch.code || ch.name.trim().toUpperCase();
      if (!uniqueChaptersMap.has(key)) {
        uniqueChaptersMap.set(key, ch);
      }
    }

    let addedCount = 0;
    for (const mCh of uniqueChaptersMap.values()) {
      let existingCh = await this.prisma.chapters.findFirst({
        where: { tenantId, courseSubjectId: cs.id, code: mCh.code, deletedAt: null },
      });

      if (!existingCh) {
        existingCh = await this.prisma.chapters.create({
          data: {
            tenantId,
            courseSubjectId: cs.id,
            code: mCh.code,
            name: mCh.name,
            shortName: mCh.shortName,
            description: mCh.description,
            plannedHours: mCh.plannedHours,
            estimatedSessions: mCh.estimatedSessions,
            displayOrder: mCh.displayOrder,
            isActive: mCh.isActive,
            isSystem: mCh.isSystem,
            createdBy: userId,
            updatedBy: userId,
          },
        });
        addedCount++;
      }

      const masterTopics = await this.prisma.topics.findMany({
        where: { tenantId, chapterId: mCh.id, deletedAt: null },
      });

      for (const mTp of masterTopics) {
        const existingTp = await this.prisma.topics.findFirst({
          where: { tenantId, chapterId: existingCh.id, code: mTp.code, deletedAt: null },
        });
        if (!existingTp) {
          await this.prisma.topics.create({
            data: {
              tenantId,
              chapterId: existingCh.id,
              code: mTp.code,
              name: mTp.name,
              shortName: mTp.shortName,
              description: mTp.description,
              learningObjectives: mTp.learningObjectives,
              difficultyLevel: mTp.difficultyLevel,
              plannedHours: mTp.plannedHours,
              plannedSessions: mTp.plannedSessions,
              displayOrder: mTp.displayOrder,
              isActive: mTp.isActive,
              isSystem: mTp.isSystem,
              createdBy: userId,
              updatedBy: userId,
            },
          });
        }
      }
    }

    return { count: addedCount };
  }

  async remove(id: string, tenantId: string, userId: string) {
    const mapping = await this.prisma.courseSubjects.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id }),
    });
    if (!mapping)
      throw new NotFoundException('Course-subject mapping not found');
    const chapterCount = await this.prisma.chapters.count({
      where: { tenantId, courseSubjectId: id, deletedAt: null },
    });
    if (chapterCount > 0)
      throw new ConflictException(
        'Cannot remove subject: it has chapters defined for this course',
      );
    await this.tenantScoped.softDelete(
      this.prisma.courseSubjects,
      id,
      tenantId,
      userId,
    );
  }

  async update(id: string, dto: any, tenantId: string, userId: string) {
    const mapping = await this.prisma.courseSubjects.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id }),
    });
    if (!mapping)
      throw new NotFoundException('Course-subject mapping not found');

    const totalMarks =
      dto.totalMarks !== undefined ? dto.totalMarks : mapping.totalMarks;
    const passingMarks =
      dto.passingMarks !== undefined ? dto.passingMarks : mapping.passingMarks;

    if (
      totalMarks !== null &&
      passingMarks !== null &&
      passingMarks > totalMarks
    ) {
      throw new BadRequestException('Passing marks cannot exceed total marks');
    }

    const updated = await this.prisma.courseSubjects.update({
      where: { id },
      data: {
        displayOrder:
          dto.displayOrder !== undefined
            ? dto.displayOrder
            : mapping.displayOrder,
        isMandatory:
          dto.isMandatory !== undefined ? dto.isMandatory : mapping.isMandatory,
        totalMarks:
          dto.totalMarks !== undefined ? dto.totalMarks : mapping.totalMarks,
        passingMarks:
          dto.passingMarks !== undefined
            ? dto.passingMarks
            : mapping.passingMarks,
        plannedHours:
          dto.plannedHours !== undefined
            ? dto.plannedHours
            : mapping.plannedHours,
        isActive: dto.isActive !== undefined ? dto.isActive : mapping.isActive,
        updatedBy: userId,
      },
    });

    const subject = await this.prisma.subjects.findFirst({
      where: { id: updated.subjectId, tenantId, deletedAt: null },
    });

    return { ...updated, subject };
  }
}
