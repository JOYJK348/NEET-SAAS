/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PaginatedResult,
  QueryParamsDto,
} from '../../common/dto/query-params.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenantScopedPrisma } from '../../common/utils/tenant-scoped-prisma';
import { paginateAndMap } from '../../common/utils/prisma-paginator';
import { CreateBatchEnrollmentDto } from './dto/create-batch-enrollment.dto';
import { BatchEnrollmentResponseDto } from './dto/batch-enrollment-response.dto';
import {
  validateAdmissionForEnrollment,
  validateBatchForEnrollment,
  validateNoDuplicateEnrollment,
  validateBatchCapacity,
} from './batch-enrollments.validation';
import { BatchStatusType } from '@prisma/client';

@Injectable()
export class BatchEnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScoped: TenantScopedPrisma,
  ) {}

  async create(
    admissionId: string,
    dto: CreateBatchEnrollmentDto,
    tenantId: string,
    userId: string,
  ): Promise<BatchEnrollmentResponseDto> {
    const enrollment = await this.prisma.$transaction(async (tx) => {
      const admission = await validateAdmissionForEnrollment(
        admissionId,
        tenantId,
        tx,
      );

      await validateBatchForEnrollment(dto.batchId, tenantId, admission, tx);

      await validateNoDuplicateEnrollment(
        admissionId,
        dto.batchId,
        tenantId,
        tx,
      );

      await validateBatchCapacity(dto.batchId, tenantId, tx);

      const isPrimary = dto.isPrimary ?? true;

      if (isPrimary) {
        await tx.studentBatchEnrollments.updateMany({
          where: {
            tenantId,
            studentAdmissionId: admissionId,
            isPrimary: true,
            deletedAt: null,
          },
          data: {
            isPrimary: false,
            updatedBy: userId,
            updatedAt: new Date(),
          },
        });
      }

      const now = new Date();
      const created = await tx.studentBatchEnrollments.create({
        data: {
          tenantId,
          studentAdmissionId: admissionId,
          batchId: dto.batchId,
          joinedAt: now,
          leftAt: now,
          status: BatchStatusType.ACTIVE,
          isPrimary,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      return created;
    });

    return this.toResponse(enrollment);
  }

  async findAll(
    admissionId: string,
    tenantId: string,
    query: QueryParamsDto,
  ): Promise<PaginatedResult<BatchEnrollmentResponseDto>> {
    const admission = await this.prisma.studentAdmissions.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id: admissionId }),
    });

    if (!admission) {
      throw new NotFoundException('Admission not found');
    }

    const where = this.tenantScoped.buildWhere(tenantId, {
      studentAdmissionId: admissionId,
    });

    return paginateAndMap(
      this.prisma.studentBatchEnrollments,
      { where, orderBy: { createdAt: 'desc' as const } },
      query,
      tenantId,
      (item: any) => this.toResponse(item),
    );
  }

  async findCurrent(
    admissionId: string,
    tenantId: string,
  ): Promise<BatchEnrollmentResponseDto> {
    const enrollment = await this.prisma.studentBatchEnrollments.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, {
        studentAdmissionId: admissionId,
        isPrimary: true,
      }),
    });

    if (!enrollment) {
      throw new NotFoundException('No primary batch enrollment found');
    }

    return this.toResponse(enrollment);
  }

  async remove(
    enrollmentId: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const enrollment = await this.prisma.studentBatchEnrollments.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id: enrollmentId }),
    });

    if (!enrollment) {
      throw new NotFoundException('Batch enrollment not found');
    }

    await this.tenantScoped.softDelete(
      this.prisma.studentBatchEnrollments,
      enrollmentId,
      tenantId,
      userId,
    );
  }

  private toResponse(enrollment: any): BatchEnrollmentResponseDto {
    return {
      id: enrollment.id,
      admissionId: enrollment.studentAdmissionId,
      batchId: enrollment.batchId,
      joinedAt: enrollment.joinedAt,
      status: enrollment.status,
      isPrimary: enrollment.isPrimary,
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
    };
  }
}
