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
    return this.prisma.courses.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name,
        displayName: dto.displayName,
        description: dto.description || '',
        courseType: dto.courseType || 'REGULAR',
        durationMonths: dto.durationMonths || 12,
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
    await this.findOne(id, tenantId);
    return this.prisma.courses.update({
      where: { tenantId_id: { tenantId, id } },
      data: { ...dto, updatedBy: userId },
    });
  }

  async remove(id: string, tenantId: string, userId: string) {
    await this.findOne(id, tenantId);
    const subjectCount = await this.prisma.courseSubjects.count({
      where: { tenantId, courseId: id, deletedAt: null },
    });
    if (subjectCount > 0)
      throw new ConflictException(
        'Cannot delete course: it has subjects mapped to it',
      );
    const batchCount = await this.prisma.batches.count({
      where: { tenantId, courseId: id, deletedAt: null },
    });
    if (batchCount > 0)
      throw new ConflictException(
        'Cannot delete course: it has active batches',
      );
    await this.tenantScoped.softDelete(
      this.prisma.courses,
      id,
      tenantId,
      userId,
    );
  }
}
