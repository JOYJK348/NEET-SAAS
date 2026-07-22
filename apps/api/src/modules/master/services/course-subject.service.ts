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
      where: { tenantId, topicId: { in: topics.map((tp) => tp.id) } },
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
