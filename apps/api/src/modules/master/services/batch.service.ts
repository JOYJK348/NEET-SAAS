/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-enum-comparison */

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
import { PaginatedResult } from '../../../common/dto/query-params.dto';
import { CreateBatchDto } from '../dto/create-batch.dto';
import { UpdateBatchDto, BatchStatusType } from '../dto/update-batch.dto';
import { QueryBatchDto } from '../dto/query-batch.dto';

const SEARCH_FIELDS = ['name', 'code'];

@Injectable()
export class BatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScoped: TenantScopedPrisma,
  ) {}

  private async validateReferences(
    tenantId: string,
    branchId?: string,
    courseId?: string,
    academicYearId?: string,
    deliveryTypeId?: string,
  ) {
    if (branchId) {
      const branch = await this.prisma.branches.findFirst({
        where: { id: branchId, tenantId, deletedAt: null, status: 'ACTIVE' },
      });
      if (!branch)
        throw new NotFoundException(
          'Active Branch not found or does not belong to the tenant',
        );
    }
    if (courseId) {
      const course = await this.prisma.courses.findFirst({
        where: { id: courseId, tenantId, deletedAt: null, isActive: true },
      });
      if (!course)
        throw new NotFoundException(
          'Active Course not found or does not belong to the tenant',
        );
    }
    let academicYear: any = null;
    if (academicYearId) {
      academicYear = await this.prisma.academicYears.findFirst({
        where: {
          id: academicYearId,
          tenantId,
          deletedAt: null,
          isActive: true,
        },
      });
      if (!academicYear)
        throw new NotFoundException(
          'Active Academic Year not found or does not belong to the tenant',
        );
    }
    if (deliveryTypeId) {
      const dt = await this.prisma.batchDeliveryTypes.findFirst({
        where: {
          id: deliveryTypeId,
          tenantId,
          deletedAt: null,
          isActive: true,
        },
      });
      if (!dt)
        throw new NotFoundException(
          'Active Batch Delivery Type not found or does not belong to the tenant',
        );
    }
    return academicYear;
  }

  async create(dto: CreateBatchDto, tenantId: string, userId: string) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (start >= end) {
      throw new BadRequestException('Batch start date must be before end date');
    }

    const academicYear = await this.validateReferences(
      tenantId,
      dto.branchId,
      dto.courseId,
      dto.academicYearId,
      dto.deliveryTypeId,
    );

    // Get Course details to check dates & duration constraints
    const course = await this.prisma.courses.findFirst({
      where: { id: dto.courseId, tenantId, deletedAt: null },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // 1. Verify batch dates fall within course start and end dates (if configured)
    if (course.startDate || course.endDate) {
      const cStart = course.startDate ? new Date(course.startDate) : null;
      const cEnd = course.endDate ? new Date(course.endDate) : null;

      const batchStart = new Date(start);
      batchStart.setHours(0, 0, 0, 0);
      const batchEnd = new Date(end);
      batchEnd.setHours(0, 0, 0, 0);

      if (cStart) {
        cStart.setHours(0, 0, 0, 0);
        if (batchStart < cStart) {
          throw new BadRequestException(
            `Batch start date (${batchStart.toISOString().split('T')[0]}) cannot be before course start date (${cStart.toISOString().split('T')[0]})`,
          );
        }
      }

      if (cEnd) {
        cEnd.setHours(23, 59, 59, 999);
        if (batchEnd > cEnd) {
          throw new BadRequestException(
            `Batch end date (${batchEnd.toISOString().split('T')[0]}) cannot be after course end date (${cEnd.toISOString().split('T')[0]})`,
          );
        }
      }
    }

    // 2. Verify batch duration (in months) does not exceed course duration limit
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = diffDays / 30.4375; // average days in a month

    // Allow a small grace window of 3 days to account for calendar alignments
    if (diffMonths > course.durationMonths + 0.1) {
      throw new BadRequestException(
        `Batch duration (${Math.round(diffMonths * 10) / 10} months) exceeds the course duration limit of ${course.durationMonths} months`,
      );
    }

    if (academicYear) {
      // Normalize dates by removing timezone time components to compare only calendar days
      const ayStart = new Date(academicYear.startDate);
      ayStart.setHours(0, 0, 0, 0);
      const ayEnd = new Date(academicYear.endDate);
      ayEnd.setHours(23, 59, 59, 999);

      const batchStart = new Date(start);
      batchStart.setHours(0, 0, 0, 0);
      const batchEnd = new Date(end);
      batchEnd.setHours(0, 0, 0, 0);

      if (batchStart < ayStart || batchEnd > ayEnd) {
        throw new BadRequestException(
          `Batch dates (${batchStart.toISOString().split('T')[0]} to ${batchEnd.toISOString().split('T')[0]}) must be fully contained within the selected Academic Year period (${ayStart.toISOString().split('T')[0]} to ${ayEnd.toISOString().split('T')[0]})`,
        );
      }
    }

    const normalizedCode = dto.code.trim().toUpperCase();

    // Check code uniqueness among active batches
    const existing = await this.prisma.batches.findFirst({
      where: {
        tenantId,
        code: normalizedCode,
        deletedAt: null,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Batch with code "${dto.code}" already exists`,
      );
    }

    const batch = await this.prisma.batches.create({
      data: {
        tenantId,
        branchId: dto.branchId,
        courseId: dto.courseId,
        academicYearId: dto.academicYearId,
        deliveryTypeId: dto.deliveryTypeId,
        code: normalizedCode,
        name: dto.name.trim(),
        description: dto.description || '',
        status: BatchStatusType.PLANNED,
        maxStudents: dto.maxStudents,
        startDate: start,
        endDate: end,
        startTime: dto.startTime || null,
        endTime: dto.endTime || null,
        allowNewAdmissions: dto.allowNewAdmissions ?? true,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return this.mapBatchResponse(batch);
  }

  async findAll(
    tenantId: string,
    query: QueryBatchDto,
  ): Promise<PaginatedResult<any>> {
    if (query.perPage && !query.limit) {
      query.limit = query.perPage;
    }

    const where: any = this.tenantScoped.buildWhere(tenantId);

    if (query.courseId) where.courseId = query.courseId;
    if (query.branchId) where.branchId = query.branchId;
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.deliveryTypeId) where.deliveryTypeId = query.deliveryTypeId;
    if (query.status && query.status !== 'ALL') where.status = query.status;

    if (query.search) {
      where.OR = buildPrismaSearch(query.search, SEARCH_FIELDS)?.OR;
    }

    const paginated = await paginate({
      model: this.prisma.batches,
      where,
      orderBy: buildPrismaOrderBy(query.sortBy, query.sortOrder),
      query,
      tenantId,
    });

    // Map each batch to include names and deliveryType info
    const mappedData = await Promise.all(
      paginated.data.map((batch) => this.mapBatchResponse(batch)),
    );

    return {
      data: mappedData,
      meta: paginated.meta,
    };
  }

  async findOne(id: string, tenantId: string) {
    const batch = await this.prisma.batches.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id }),
    });
    if (!batch) throw new NotFoundException('Batch not found');
    return this.mapBatchResponse(batch);
  }

  async update(
    id: string,
    dto: UpdateBatchDto,
    tenantId: string,
    userId: string,
  ) {
    const existingBatch = await this.prisma.batches.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id }),
    });
    if (!existingBatch) throw new NotFoundException('Batch not found');

    const start = dto.startDate
      ? new Date(dto.startDate)
      : existingBatch.startDate;
    const end = dto.endDate ? new Date(dto.endDate) : existingBatch.endDate;

    if (start >= end) {
      throw new BadRequestException('Batch start date must be before end date');
    }

    // Validate active references
    const academicYear = await this.validateReferences(
      tenantId,
      dto.branchId,
      dto.courseId,
      dto.academicYearId,
      dto.deliveryTypeId,
    );

    // If academicYear is not fetched (optional in update), fetch it to verify date containment bounds
    const targetAY =
      academicYear ||
      (await this.prisma.academicYears.findFirst({
        where: {
          id: dto.academicYearId || existingBatch.academicYearId,
          tenantId,
        },
      }));

    // Get Course details to check dates & duration constraints
    const targetCourseId = dto.courseId || existingBatch.courseId;
    const course = await this.prisma.courses.findFirst({
      where: { id: targetCourseId, tenantId, deletedAt: null },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // 1. Verify batch dates fall within course start and end dates (if configured)
    if (course.startDate || course.endDate) {
      const cStart = course.startDate ? new Date(course.startDate) : null;
      const cEnd = course.endDate ? new Date(course.endDate) : null;

      const batchStart = new Date(start);
      batchStart.setHours(0, 0, 0, 0);
      const batchEnd = new Date(end);
      batchEnd.setHours(0, 0, 0, 0);

      if (cStart) {
        cStart.setHours(0, 0, 0, 0);
        if (batchStart < cStart) {
          throw new BadRequestException(
            `Batch start date (${batchStart.toISOString().split('T')[0]}) cannot be before course start date (${cStart.toISOString().split('T')[0]})`,
          );
        }
      }

      if (cEnd) {
        cEnd.setHours(23, 59, 59, 999);
        if (batchEnd > cEnd) {
          throw new BadRequestException(
            `Batch end date (${batchEnd.toISOString().split('T')[0]}) cannot be after course end date (${cEnd.toISOString().split('T')[0]})`,
          );
        }
      }
    }

    // 2. Verify batch duration (in months) does not exceed course duration limit
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = diffDays / 30.4375; // average days in a month

    // Allow a small grace window of 3 days to account for calendar alignments
    if (diffMonths > course.durationMonths + 0.1) {
      throw new BadRequestException(
        `Batch duration (${Math.round(diffMonths * 10) / 10} months) exceeds the course duration limit of ${course.durationMonths} months`,
      );
    }

    if (targetAY) {
      const ayStart = new Date(targetAY.startDate);
      ayStart.setHours(0, 0, 0, 0);
      const ayEnd = new Date(targetAY.endDate);
      ayEnd.setHours(23, 59, 59, 999);

      const batchStart = new Date(start);
      batchStart.setHours(0, 0, 0, 0);
      const batchEnd = new Date(end);
      batchEnd.setHours(0, 0, 0, 0);

      if (batchStart < ayStart || batchEnd > ayEnd) {
        throw new BadRequestException(
          `Batch dates (${batchStart.toISOString().split('T')[0]} to ${batchEnd.toISOString().split('T')[0]}) must be fully contained within the selected Academic Year period (${ayStart.toISOString().split('T')[0]} to ${ayEnd.toISOString().split('T')[0]})`,
        );
      }
    }

    // Handle status transitions lifecycle
    if (dto.status && dto.status !== existingBatch.status) {
      const allowedTransitions: Record<string, string[]> = {
        PLANNED: ['ACTIVE', 'CANCELLED'],
        ACTIVE: ['COMPLETED', 'CANCELLED'],
        COMPLETED: ['ARCHIVED'],
        CANCELLED: ['ARCHIVED'],
        ARCHIVED: [],
      };
      const allowed = allowedTransitions[existingBatch.status];
      if (!allowed || !allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Invalid status transition from ${existingBatch.status} to ${dto.status}`,
        );
      }
    }

    const updatePayload: Record<string, any> = {
      ...dto,
      updatedBy: userId,
      updatedAt: new Date(),
    };
    if (dto.startDate) updatePayload.startDate = start;
    if (dto.endDate) updatePayload.endDate = end;
    if (dto.startTime !== undefined)
      updatePayload.startTime = dto.startTime || null;
    if (dto.endTime !== undefined) updatePayload.endTime = dto.endTime || null;

    const updated = await this.prisma.batches.update({
      where: { tenantId_id: { tenantId, id } },
      data: updatePayload,
    });

    return this.mapBatchResponse(updated);
  }

  async remove(id: string, tenantId: string, userId: string) {
    const existingBatch = await this.prisma.batches.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id }),
    });
    if (!existingBatch) throw new NotFoundException('Batch not found');

    // Check StudentBatchEnrollments
    const enrollmentCount = await this.prisma.studentBatchEnrollments.count({
      where: { tenantId, batchId: id, deletedAt: null },
    });
    if (enrollmentCount > 0) {
      throw new ConflictException(
        'Cannot delete batch: it has active student enrollments',
      );
    }

    await this.tenantScoped.softDelete(
      this.prisma.batches,
      id,
      tenantId,
      userId,
    );
  }

  async getStats(tenantId: string) {
    const batches = await this.prisma.batches.findMany({
      where: { tenantId, deletedAt: null },
    });

    const total = batches.length;
    const planned = batches.filter((b) => b.status === 'PLANNED').length;
    const active = batches.filter((b) => b.status === 'ACTIVE').length;
    const completed = batches.filter((b) => b.status === 'COMPLETED').length;
    const cancelled = batches.filter((b) => b.status === 'CANCELLED').length;
    const archived = batches.filter((b) => b.status === 'ARCHIVED').length;

    const totalCapacity = batches.reduce((sum, b) => sum + b.maxStudents, 0);

    const activeEnrollments =
      await this.prisma.studentBatchEnrollments.findMany({
        where: {
          tenantId,
          deletedAt: null,
          status: 'ACTIVE',
        },
      });
    const totalEnrolled = activeEnrollments.length;

    return {
      total,
      planned,
      active,
      completed,
      cancelled,
      archived,
      totalCapacity,
      totalEnrolled,
      utilizationRate:
        totalCapacity > 0
          ? Math.round((totalEnrolled / totalCapacity) * 100)
          : 0,
    };
  }

  async getTimelineEvents(batchId: string, tenantId: string) {
    const batch = await this.prisma.batches.findFirst({
      where: { id: batchId, tenantId },
    });
    if (!batch) throw new NotFoundException('Batch not found');

    return [
      {
        id: `evt-${batch.id}-create`,
        batchId: batch.id,
        type: 'CREATED',
        title: 'Batch Created',
        createdBy: 'System',
        createdAt: batch.createdAt,
      },
      {
        id: `evt-${batch.id}-update`,
        batchId: batch.id,
        type: 'UPDATED',
        title: 'Batch Last Updated',
        createdBy: 'System',
        createdAt: batch.updatedAt,
      },
    ];
  }

  async getBatchStudents(batchId: string, tenantId: string) {
    const batch = await this.prisma.batches.findFirst({
      where: { id: batchId, tenantId },
    });
    if (!batch) throw new NotFoundException('Batch not found');

    const enrollments = await this.prisma.studentBatchEnrollments.findMany({
      where: { tenantId, batchId, deletedAt: null },
      orderBy: { joinedAt: 'desc' },
    });

    return Promise.all(
      enrollments.map(async (enr) => {
        const admission = await this.prisma.studentAdmissions.findFirst({
          where: { id: enr.studentAdmissionId, tenantId },
        });
        let studentName = 'Student';
        let email = '';
        const phone = '';
        if (admission) {
          const user = await this.prisma.users.findFirst({
            where: { id: admission.studentProfileId, tenantId },
          });
          if (user) {
            studentName = `${user.firstName} ${user.lastName || ''}`.trim();
            email = user.email || '';
          }
        }
        return {
          id: enr.id,
          studentId: admission?.studentProfileId || '',
          studentName,
          email,
          phone,
          joinedAt: enr.joinedAt,
          status: enr.status,
          isPrimary: enr.isPrimary,
        };
      }),
    );
  }

  async getBatchStaffAssignments(batchId: string, tenantId: string) {
    const batch = await this.prisma.batches.findFirst({
      where: { id: batchId, tenantId },
    });
    if (!batch) throw new NotFoundException('Batch not found');

    const assignments = await this.prisma.staffBatchAssignments.findMany({
      where: { tenantId, batchId, deletedAt: null },
      orderBy: { effectiveFrom: 'desc' },
    });

    return Promise.all(
      assignments.map(async (ass) => {
        const user = await this.prisma.users.findFirst({
          where: { id: ass.staffProfileId, tenantId },
        });
        const subject = await this.prisma.subjects.findFirst({
          where: { id: ass.subjectId, tenantId },
        });
        return {
          id: ass.id,
          staffId: ass.staffProfileId,
          staffName: user
            ? `${user.firstName} ${user.lastName || ''}`.trim()
            : 'Staff Member',
          subject: subject?.name || 'Subject',
          effectiveFrom: ass.effectiveFrom,
          effectiveTo: ass.effectiveTo,
          isActive: ass.isActive,
        };
      }),
    );
  }

  private async mapBatchResponse(batch: any) {
    const [branch, course, academicYear, deliveryType, enrolledCount] =
      await Promise.all([
        this.prisma.branches.findFirst({ where: { id: batch.branchId } }),
        this.prisma.courses.findFirst({ where: { id: batch.courseId } }),
        this.prisma.academicYears.findFirst({
          where: { id: batch.academicYearId },
        }),
        this.prisma.batchDeliveryTypes.findFirst({
          where: { id: batch.deliveryTypeId },
        }),
        this.prisma.studentBatchEnrollments.count({
          where: {
            tenantId: batch.tenantId,
            batchId: batch.id,
            deletedAt: null,
            status: 'ACTIVE',
          },
        }),
      ]);

    return {
      ...batch,
      branchName: branch?.name || '',
      courseName: course?.name || '',
      academicYearName: academicYear?.name || '',
      deliveryType: deliveryType || null,
      enrolledCount,
    };
  }
}
