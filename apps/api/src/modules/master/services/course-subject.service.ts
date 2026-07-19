import {
  Injectable,
  NotFoundException,
  ConflictException,
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
    return this.prisma.courseSubjects.create({
      data: {
        tenantId,
        courseId: dto.courseId,
        subjectId: dto.subjectId,
        displayOrder: dto.displayOrder || 1,
        isMandatory: dto.isMandatory ?? true,
        totalMarks: dto.totalMarks || 100,
        passingMarks: dto.passingMarks || 40,
        credits: dto.credits || 0,
        plannedHours: dto.plannedHours || 100,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async findByCourse(courseId: string, tenantId: string) {
    return this.prisma.courseSubjects.findMany({
      where: this.tenantScoped.buildWhere(tenantId, { courseId }),
      orderBy: { displayOrder: 'asc' },
    });
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
