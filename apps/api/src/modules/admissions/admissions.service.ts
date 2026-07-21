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
import { AdminAdmissionQueryDto } from './dto/admin-admission-query.dto';
import {
  validateAdmissionStatusTransition,
  validateActiveAdmission,
} from './admissions.validation';
import { paginateAndMap } from '../../common/utils/prisma-paginator';
import { AdmissionStatusEnum, BatchStatusType } from '@prisma/client';

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
    const studentProfile = await this.prisma.studentProfiles.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { userId: studentId }),
    });

    if (!studentProfile) {
      throw new NotFoundException('Student not found');
    }

    await this.validateStudent(studentId, tenantId);
    await this.validateStudentActive(studentId, tenantId);
    // Students can have multiple admissions concurrently across different courses
    // await this.validateNoExistingActiveAdmission(studentId, tenantId);
    await this.validateAcademicYear(dto.academicYearId, tenantId);
    await this.validateCourse(dto.courseId, tenantId);
    await this.validateBranch(dto.branchId, tenantId);
    await this.validateNoDuplicateAdmission(
      studentProfile.userId,
      tenantId,
      dto.academicYearId,
      dto.courseId,
    );

    const admissionNumber = await this.admissionNumberGenerator.generate(
      tenantId,
      dto.academicYearId,
    );

    const admission = await this.prisma.$transaction(async (tx) => {
      const created = await tx.studentAdmissions.create({
        data: {
          tenantId,
          studentProfileId: studentProfile.userId,
          admissionNumber,
          academicYearId: dto.academicYearId,
          courseId: dto.courseId,
          branchId: dto.branchId,
          admissionStatus: AdmissionStatusEnum.ACTIVE,
          admissionDate: new Date(),
          createdBy: userId,
          updatedBy: userId,
        },
      });

      await tx.admissionStatusHistory.create({
        data: {
          tenantId,
          admissionId: created.id,
          fromStatus: AdmissionStatusEnum.ACTIVE,
          toStatus: AdmissionStatusEnum.ACTIVE,
          changedAt: new Date(),
          changedBy: userId,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      if (dto.batchId) {
        await tx.studentBatchEnrollments.create({
          data: {
            tenantId,
            studentAdmissionId: created.id,
            batchId: dto.batchId,
            joinedAt: new Date(),
            leftAt: new Date('2099-12-31'),
            status: 'ACTIVE',
            isPrimary: true,
            createdBy: userId,
            updatedBy: userId,
          },
        });
      }

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

    const admission = await this.prisma.studentAdmissions.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, {
        studentProfileId: studentId,
        admissionStatus: AdmissionStatusEnum.ACTIVE,
      }),
    });

    if (admission) {
      return this.toResponse(admission);
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
      if (dto.status === AdmissionStatusEnum.ACTIVE) {
        await validateActiveAdmission(
          admission.studentProfileId,
          tenantId,
          admission.academicYearId,
          { excludeAdmissionId: admissionId, prisma: tx },
        );
      }

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

  async updateBatch(
    admissionId: string,
    dto: { batchId: string },
    tenantId: string,
    userId: string,
  ): Promise<AdmissionResponseDto> {
    const admission = await this.prisma.studentAdmissions.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id: admissionId }),
    });

    if (!admission) {
      throw new NotFoundException('Admission not found');
    }

    // Verify batch exists
    const batch = await this.prisma.batches.findFirst({
      where: { id: dto.batchId, tenantId },
    });
    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    await this.prisma.$transaction(async (tx) => {
      // Inactivate any current active batch enrollments for this admission
      await tx.studentBatchEnrollments.updateMany({
        where: {
          studentAdmissionId: admissionId,
          tenantId,
          status: BatchStatusType.ACTIVE,
          deletedAt: null,
        },
        data: {
          status: BatchStatusType.ARCHIVED,
          leftAt: new Date(),
          updatedBy: userId,
        },
      });

      // Create new batch enrollment
      await tx.studentBatchEnrollments.create({
        data: {
          tenantId,
          studentAdmissionId: admissionId,
          batchId: dto.batchId,
          joinedAt: new Date(),
          leftAt: new Date('2099-12-31'),
          status: 'ACTIVE',
          isPrimary: true,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    });

    return this.toResponse(admission);
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

  private async validateStudentActive(
    studentId: string,
    tenantId: string,
  ): Promise<void> {
    const student = await this.prisma.studentProfiles.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { userId: studentId }),
      select: { academicStatus: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (student.academicStatus !== 'ACTIVE') {
      throw new ConflictException('Only active students can be admitted');
    }
  }

  private async validateNoExistingActiveAdmission(
    studentId: string,
    tenantId: string,
  ): Promise<void> {
    const existing = await this.prisma.studentAdmissions.findFirst({
      where: {
        tenantId,
        studentProfileId: studentId,
        admissionStatus: AdmissionStatusEnum.ACTIVE,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException('Student already has an active admission');
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
    courseId: string,
  ): Promise<void> {
    const existing = await this.prisma.studentAdmissions.findFirst({
      where: {
        tenantId,
        studentProfileId: studentId,
        courseId,
        academicYearId,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Student already has an active admission for this course in this academic year',
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

  async findAllAdmin(
    tenantId: string,
    query: AdminAdmissionQueryDto,
  ): Promise<PaginatedResult<any>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      tenantId,
      deletedAt: null,
    };

    if (query.status && query.status !== 'ALL') {
      where.admissionStatus = query.status;
    }
    if (query.courseId) {
      where.courseId = query.courseId;
    }
    if (query.branchId) {
      where.branchId = query.branchId;
    }
    if (query.academicYearId) {
      where.academicYearId = query.academicYearId;
    }
    if (query.studentProfileId) {
      // Find the student profile by userId
      const profile = await this.prisma.studentProfiles.findFirst({
        where: {
          tenantId,
          userId: query.studentProfileId,
        },
      });
      if (profile) {
        where.studentProfileId = profile.userId;
      } else {
        where.studentProfileId = query.studentProfileId;
      }
    }
    if (query.search) {
      where.OR = [
        { admissionNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, admissions] = await Promise.all([
      this.prisma.studentAdmissions.count({ where }),
      this.prisma.studentAdmissions.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const enriched = await Promise.all(
      admissions.map(async (adm: any) => {
        const [user, course, branch, academicYear] = await Promise.all([
          this.prisma.users.findFirst({
            where: { id: adm.studentProfileId, tenantId },
            select: { firstName: true, lastName: true, email: true },
          }),
          this.prisma.courses.findFirst({
            where: { id: adm.courseId, tenantId },
            select: { name: true },
          }),
          this.prisma.branches.findFirst({
            where: { id: adm.branchId, tenantId },
            select: { name: true },
          }),
          this.prisma.academicYears.findFirst({
            where: { id: adm.academicYearId, tenantId },
            select: { name: true },
          }),
        ]);

        // Fetch enrollment and batch name
        let batchName = '';
        const enrollment = await this.prisma.studentBatchEnrollments.findFirst({
          where: { studentAdmissionId: adm.id, tenantId, deletedAt: null },
          select: { batchId: true },
        });
        if (enrollment) {
          const batch = await this.prisma.batches.findFirst({
            where: { id: enrollment.batchId, tenantId },
            select: { name: true },
          });
          if (batch) batchName = batch.name;
        }

        return {
          id: adm.id,
          admissionNumber: adm.admissionNumber,
          studentId: adm.studentProfileId,
          studentName: user
            ? `${user.firstName} ${user.lastName || ''}`.trim()
            : 'Student',
          studentEmail: user?.email || '',
          courseId: adm.courseId,
          courseName: course?.name || '',
          batchId: enrollment?.batchId || null,
          batchName,
          branchId: adm.branchId,
          branchName: branch?.name || '',
          academicYearName: academicYear?.name || '',
          admissionStatus: adm.admissionStatus,
          admissionDate: adm.admissionDate,
          createdAt: adm.createdAt,
          updatedAt: adm.updatedAt,
        };
      }),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: enriched,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getStats(tenantId: string) {
    const where = { tenantId, deletedAt: null };
    const [total, active, inactive] = await Promise.all([
      this.prisma.studentAdmissions.count({ where }),
      this.prisma.studentAdmissions.count({
        where: { ...where, admissionStatus: AdmissionStatusEnum.ACTIVE },
      }),
      this.prisma.studentAdmissions.count({
        where: { ...where, admissionStatus: AdmissionStatusEnum.INACTIVE },
      }),
    ]);

    return { total, active, inactive, changeFromLastMonth: 0 };
  }

  async findOneEnriched(admissionId: string, tenantId: string) {
    const admission = await this.prisma.studentAdmissions.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { id: admissionId }),
    });

    if (!admission) {
      throw new NotFoundException('Admission not found');
    }

    const [user, course, branch, academicYear, historyCount] =
      await Promise.all([
        this.prisma.users.findFirst({
          where: { id: admission.studentProfileId, tenantId },
          select: { firstName: true, lastName: true, email: true },
        }),
        this.prisma.courses.findFirst({
          where: { id: admission.courseId, tenantId },
          select: { id: true, name: true, code: true },
        }),
        this.prisma.branches.findFirst({
          where: { id: admission.branchId, tenantId },
          select: { id: true, name: true, code: true },
        }),
        this.prisma.academicYears.findFirst({
          where: { id: admission.academicYearId, tenantId },
          select: { id: true, name: true },
        }),
        this.prisma.admissionStatusHistory.count({
          where: { admissionId, tenantId },
        }),
      ]);

    return {
      ...this.toResponse(admission),
      studentName: user
        ? `${user.firstName} ${user.lastName || ''}`.trim()
        : 'Student',
      studentEmail: user?.email || '',
      student: user
        ? {
            id: admission.studentProfileId,
            firstName: user.firstName,
            lastName: user.lastName || '',
            email: user.email,
            phone: '',
          }
        : null,
      course: course
        ? { id: course.id, name: course.name, code: course.code }
        : null,
      branch: branch
        ? { id: branch.id, name: branch.name, code: branch.code }
        : null,
      academicYear: academicYear
        ? { id: academicYear.id, name: academicYear.name }
        : null,
      courseName: course?.name || '',
      branchName: branch?.name || '',
      academicYearName: academicYear?.name || '',
      historyCount,
    };
  }
}
