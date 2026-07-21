import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
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

    // Manually join subjects
    const subjectIds = [...new Set(courseSubjects.map((cs) => cs.subjectId))];
    const subjects = await this.prisma.subjects.findMany({
      where: { id: { in: subjectIds }, tenantId, deletedAt: null },
    });
    const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s]));

    return courseSubjects.map((cs) => ({
      ...cs,
      subject: subjectMap[cs.subjectId] ?? null,
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
}
