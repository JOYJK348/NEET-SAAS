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
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';

const SEARCH_FIELDS = ['name', 'displayName', 'code', 'description'];

@Injectable()
export class CourseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScoped: TenantScopedPrisma,
  ) {}

  async create(dto: CreateCourseDto, tenantId: string, userId: string) {
    const normalizedCode = dto.code.trim().toUpperCase();
    const durationMonths = dto.durationMonths ?? 12;

    if (durationMonths < 1 || durationMonths > 60) {
      throw new BadRequestException('Duration must be between 1 and 60 months');
    }

    const existing = await this.prisma.courses.findFirst({
      where: {
        tenantId,
        code: normalizedCode,
        deletedAt: null,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Course with code "${dto.code}" already exists`,
      );
    }

    const start = dto.startDate ? new Date(dto.startDate) : null;
    const end = dto.endDate ? new Date(dto.endDate) : null;

    if (start && end && start >= end) {
      throw new BadRequestException(
        'Course start date must be before end date',
      );
    }

    return this.prisma.courses.create({
      data: {
        tenantId,
        code: normalizedCode,
        name: dto.name.trim(),
        displayName: dto.displayName.trim(),
        description: dto.description || '',
        courseType: dto.courseType || 'REGULAR',
        durationMonths,
        startDate: start,
        endDate: end,
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
  ): Promise<PaginatedResult<any>> {
    const where: any = this.tenantScoped.buildWhere(tenantId);
    if (query.search)
      where.OR = buildPrismaSearch(query.search, SEARCH_FIELDS)?.OR;
    return paginate({
      model: this.prisma.courses,
      where,
      orderBy: buildPrismaOrderBy(query.sortBy, query.sortOrder),
      query,
      tenantId,
    });
  }

  async findOne(id: string, tenantId: string) {
    const course = await this.prisma.courses.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id }),
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async update(
    id: string,
    dto: UpdateCourseDto,
    tenantId: string,
    userId: string,
  ) {
    const course = await this.findOne(id, tenantId);

    if (
      dto.durationMonths !== undefined &&
      (dto.durationMonths < 1 || dto.durationMonths > 60)
    ) {
      throw new BadRequestException('Duration must be between 1 and 60 months');
    }

    const start =
      dto.startDate !== undefined
        ? dto.startDate
          ? new Date(dto.startDate)
          : null
        : undefined;
    const end =
      dto.endDate !== undefined
        ? dto.endDate
          ? new Date(dto.endDate)
          : null
        : undefined;

    if (start !== undefined || end !== undefined) {
      const activeStart =
        start !== undefined
          ? start
          : course.startDate
            ? new Date(course.startDate)
            : null;
      const activeEnd =
        end !== undefined
          ? end
          : course.endDate
            ? new Date(course.endDate)
            : null;

      if (activeStart && activeEnd && activeStart >= activeEnd) {
        throw new BadRequestException(
          'Course start date must be before end date',
        );
      }
    }

    const updatePayload: Record<string, any> = {
      ...dto,
      updatedBy: userId,
    };
    if (dto.name) updatePayload.name = dto.name.trim();
    if (dto.displayName) updatePayload.displayName = dto.displayName.trim();
    if (start !== undefined) updatePayload.startDate = start;
    if (end !== undefined) updatePayload.endDate = end;

    return this.prisma.courses.update({
      where: { tenantId_id: { tenantId, id } },
      data: updatePayload,
    });
  }

  async remove(id: string, tenantId: string, userId: string) {
    await this.findOne(id, tenantId);

    // Check CourseSubject mappings
    const subjectCount = await this.prisma.courseSubjects.count({
      where: { tenantId, courseId: id, deletedAt: null },
    });
    if (subjectCount > 0) {
      throw new ConflictException(
        'Cannot delete course: it has subjects mapped to it',
      );
    }

    // Check Batches
    const batchCount = await this.prisma.batches.count({
      where: { tenantId, courseId: id, deletedAt: null },
    });
    if (batchCount > 0) {
      throw new ConflictException(
        'Cannot delete course: it has active batches',
      );
    }

    // Check Student Admissions
    const admissionCount = await this.prisma.studentAdmissions.count({
      where: { tenantId, courseId: id, deletedAt: null },
    });
    if (admissionCount > 0) {
      throw new ConflictException(
        'Cannot delete course: it has student admissions mapped to it',
      );
    }

    // Check Exams
    const examCount = await this.prisma.exams.count({
      where: { tenantId, courseId: id, deletedAt: null },
    });
    if (examCount > 0) {
      throw new ConflictException(
        'Cannot delete course: it has exams mapped to it',
      );
    }

    // Check Learning Materials
    const materialCount = await this.prisma.learningMaterials.count({
      where: { tenantId, courseId: id, deletedAt: null },
    });
    if (materialCount > 0) {
      throw new ConflictException(
        'Cannot delete course: it has learning materials mapped to it',
      );
    }

    // Check Fee Structures
    const feeCount = await this.prisma.feeStructures.count({
      where: { tenantId, courseId: id, deletedAt: null },
    });
    if (feeCount > 0) {
      throw new ConflictException(
        'Cannot delete course: it has fee structures mapped to it',
      );
    }

    await this.tenantScoped.softDelete(
      this.prisma.courses,
      id,
      tenantId,
      userId,
    );
  }
}
