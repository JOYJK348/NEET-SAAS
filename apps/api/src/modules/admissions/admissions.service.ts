/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  PaginatedResult,
  QueryParamsDto,
} from '../../common/dto/query-params.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenantScopedPrisma } from '../../common/utils/tenant-scoped-prisma';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { AdmissionResponseDto } from './dto/admission-response.dto';
import { UpdateAdmissionStatusDto } from './dto/update-admission-status.dto';
import { AdmissionHistoryResponseDto } from './dto/admission-history-response.dto';
import { AdmissionNumberGenerator } from './utils/admission-number-generator';
import { validateAdmissionStatusTransition } from './admissions.validation';
import { paginateAndMap } from '../../common/utils/prisma-paginator';
import { AdmissionStatusEnum } from '@prisma/client';

const ACTIVE_ADMISSION_STATUSES: AdmissionStatusEnum[] = [
  AdmissionStatusEnum.PENDING,
  AdmissionStatusEnum.CONFIRMED,
  AdmissionStatusEnum.ACTIVE,
];

@Injectable()
export class AdmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScoped: TenantScopedPrisma,
    private readonly admissionNumberGenerator: AdmissionNumberGenerator,
  ) {}

  async create(
    studentId: string,
    dto: CreateAdmissionDto,
    tenantId: string,
    userId: string,
  ): Promise<AdmissionResponseDto> {
    await this.validateStudent(studentId, tenantId);
    await this.validateAcademicYear(dto.academicYearId, tenantId);
    await this.validateCourse(dto.courseId, tenantId);
    await this.validateBranch(dto.branchId, tenantId);
    await this.validateNoDuplicateAdmission(
      studentId,
      tenantId,
      dto.academicYearId,
    );

    const admissionNumber = await this.admissionNumberGenerator.generate(
      tenantId,
      dto.academicYearId,
    );

    const admission = await this.prisma.$transaction(async (tx) => {
      const created = await tx.studentAdmissions.create({
        data: {
          tenantId,
          studentProfileId: studentId,
          admissionNumber,
          academicYearId: dto.academicYearId,
          courseId: dto.courseId,
          branchId: dto.branchId,
          admissionStatus: AdmissionStatusEnum.PENDING,
          admissionDate: new Date(),
          createdBy: userId,
          updatedBy: userId,
        },
      });

      await tx.admissionStatusHistory.create({
        data: {
          tenantId,
          admissionId: created.id,
          fromStatus: null as unknown as AdmissionStatusEnum,
          toStatus: AdmissionStatusEnum.PENDING,
          changedAt: new Date(),
          changedBy: userId,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      return created;
    });

    return this.toResponse(admission);
  }

  async findAll(
    studentId: string,
    tenantId: string,
    query: QueryParamsDto,
  ): Promise<PaginatedResult<AdmissionResponseDto>> {
    await this.validateStudent(studentId, tenantId);

    const where = {
      ...this.tenantScoped.buildWhere(tenantId, {
        studentProfileId: studentId,
      }),
    };

    return paginateAndMap(
      this.prisma.studentAdmissions,
      {
        where,
        orderBy: { createdAt: 'desc' as const },
      },
      query,
      tenantId,
      (admission: any) => this.toResponse(admission),
    );
  }

  async findCurrent(
    studentId: string,
    tenantId: string,
  ): Promise<AdmissionResponseDto> {
    await this.validateStudent(studentId, tenantId);

    const priorityOrder: AdmissionStatusEnum[] = [
      AdmissionStatusEnum.ACTIVE,
      AdmissionStatusEnum.CONFIRMED,
      AdmissionStatusEnum.PENDING,
    ];

    for (const status of priorityOrder) {
      const admission = await this.prisma.studentAdmissions.findFirst({
        where: this.tenantScoped.buildWhere(tenantId, {
          studentProfileId: studentId,
          admissionStatus: status,
        }),
      });

      if (admission) {
        return this.toResponse(admission);
      }
    }

    throw new NotFoundException('No current active admission found');
  }

  async findOne(
    admissionId: string,
    tenantId: string,
  ): Promise<AdmissionResponseDto> {
    const admission = await this.prisma.studentAdmissions.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id: admissionId }),
    });

    if (!admission) {
      throw new NotFoundException('Admission not found');
    }

    const historyCount = await this.prisma.admissionStatusHistory.count({
      where: { admissionId, tenantId },
    });

    return { ...this.toResponse(admission), historyCount };
  }

  async updateStatus(
    admissionId: string,
    dto: UpdateAdmissionStatusDto,
    tenantId: string,
    userId: string,
  ): Promise<AdmissionResponseDto> {
    const admission = await this.prisma.studentAdmissions.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id: admissionId }),
    });

    if (!admission) {
      throw new NotFoundException('Admission not found');
    }

    validateAdmissionStatusTransition(admission.admissionStatus, dto.status);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.studentAdmissions.update({
        where: { id: admissionId },
        data: {
          admissionStatus: dto.status,
          updatedBy: userId,
          ...(dto.remarks !== undefined ? { remarks: dto.remarks } : {}),
        },
      });

      await tx.admissionStatusHistory.create({
        data: {
          tenantId,
          admissionId,
          fromStatus: admission.admissionStatus,
          toStatus: dto.status,
          reason: dto.reason || null,
          changedAt: new Date(),
          changedBy: userId,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      return result;
    });

    return this.toResponse(updated);
  }

  async getHistory(
    admissionId: string,
    tenantId: string,
  ): Promise<AdmissionHistoryResponseDto[]> {
    const admission = await this.prisma.studentAdmissions.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id: admissionId }),
    });

    if (!admission) {
      throw new NotFoundException('Admission not found');
    }

    const history = await this.prisma.admissionStatusHistory.findMany({
      where: { admissionId, tenantId, deletedAt: null },
      orderBy: { changedAt: 'asc' },
    });

    return history.map((h: any) => ({
      id: h.id,
      admissionId: h.admissionId,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      reason: h.reason,
      changedBy: h.changedBy,
      changedAt: h.changedAt,
      createdAt: h.createdAt,
    }));
  }

  private async validateStudent(
    studentId: string,
    tenantId: string,
  ): Promise<void> {
    const student = await this.prisma.studentProfiles.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { userId: studentId }),
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }
  }

  private async validateAcademicYear(
    academicYearId: string,
    tenantId: string,
  ): Promise<void> {
    const academicYear = await this.prisma.academicYears.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id: academicYearId }),
    });

    if (!academicYear) {
      throw new NotFoundException('Academic year not found');
    }

    if (academicYear.isActive === false) {
      throw new ConflictException('Academic year is not active');
    }
  }

  private async validateCourse(
    courseId: string,
    tenantId: string,
  ): Promise<void> {
    const course = await this.prisma.courses.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id: courseId }),
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }
  }

  private async validateBranch(
    branchId: string,
    tenantId: string,
  ): Promise<void> {
    const branch = await this.prisma.branches.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id: branchId }),
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
  }

  private async validateNoDuplicateAdmission(
    studentId: string,
    tenantId: string,
    academicYearId: string,
  ): Promise<void> {
    const existing = await this.prisma.studentAdmissions.findFirst({
      where: {
        tenantId,
        studentProfileId: studentId,
        academicYearId,
        admissionStatus: { in: ACTIVE_ADMISSION_STATUSES },
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Student already has an active admission for this academic year',
      );
    }
  }

  private toResponse(admission: {
    id: string;
    admissionNumber: string;
    studentProfileId: string;
    academicYearId: string;
    courseId: string;
    branchId: string;
    admissionStatus: AdmissionStatusEnum;
    admissionDate: Date;
    createdAt: Date;
    updatedAt: Date;
  }): AdmissionResponseDto {
    return {
      id: admission.id,
      admissionNumber: admission.admissionNumber,
      studentId: admission.studentProfileId,
      academicYearId: admission.academicYearId,
      courseId: admission.courseId,
      branchId: admission.branchId,
      admissionStatus: admission.admissionStatus,
      admissionDate: admission.admissionDate,
      createdAt: admission.createdAt,
      updatedAt: admission.updatedAt,
    };
  }
}
