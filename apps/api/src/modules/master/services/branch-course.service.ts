import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { TenantScopedPrisma } from '../../../common/utils/tenant-scoped-prisma';
import { MapBranchCourseDto } from '../dto/map-branch-course.dto';

@Injectable()
export class BranchCourseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScoped: TenantScopedPrisma,
  ) {}

  async create(dto: MapBranchCourseDto, tenantId: string, userId: string) {
    // Verify branch exists
    const branch = await this.prisma.branches.findFirst({
      where: { id: dto.branchId, tenantId, deletedAt: null },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    // Verify course exists
    const course = await this.prisma.courses.findFirst({
      where: { id: dto.courseId, tenantId, deletedAt: null },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Verify academic year exists
    const year = await this.prisma.academicYears.findFirst({
      where: { id: dto.academicYearId, tenantId, deletedAt: null },
    });
    if (!year) {
      throw new NotFoundException('Academic Year not found');
    }

    const existing = await this.prisma.branchCourses.findFirst({
      where: {
        tenantId,
        branchId: dto.branchId,
        courseId: dto.courseId,
        academicYearId: dto.academicYearId,
        deletedAt: null,
      },
    });

    if (existing) {
      if (existing.isActive !== (dto.isActive ?? true)) {
        return this.prisma.branchCourses.update({
          where: { tenantId_id: { tenantId, id: existing.id } },
          data: {
            isActive: dto.isActive ?? true,
            updatedBy: userId,
          },
        });
      }
      throw new ConflictException(
        'Course is already mapped to this branch for this academic year',
      );
    }

    return this.prisma.branchCourses.create({
      data: {
        tenantId,
        branchId: dto.branchId,
        courseId: dto.courseId,
        academicYearId: dto.academicYearId,
        isActive: dto.isActive ?? true,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async findByBranch(branchId: string, tenantId: string) {
    return this.prisma.branchCourses.findMany({
      where: this.tenantScoped.buildWhere(tenantId, { branchId }),
      include: {
        tenant: true,
        academicYear: true,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.branchCourses.findMany({
      where: this.tenantScoped.buildWhere(tenantId),
      include: {
        academicYear: true,
      },
    });
  }

  async remove(id: string, tenantId: string, userId: string) {
    const mapping = await this.prisma.branchCourses.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id }),
    });
    if (!mapping) {
      throw new NotFoundException('Branch-course mapping not found');
    }

    // Check if there are active batches using this branch, course, and academic year mapping
    const batchCount = await this.prisma.batches.count({
      where: {
        tenantId,
        branchId: mapping.branchId,
        courseId: mapping.courseId,
        academicYearId: mapping.academicYearId,
        deletedAt: null,
      },
    });
    if (batchCount > 0) {
      throw new ConflictException(
        'Cannot remove mapping: active batches exist for this branch and course under this academic year',
      );
    }

    await this.tenantScoped.softDelete(
      this.prisma.branchCourses,
      id,
      tenantId,
      userId,
    );
  }
}
