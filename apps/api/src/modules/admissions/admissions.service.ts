import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenantScopedPrisma } from '../../common/utils/tenant-scoped-prisma';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { AdmissionResponseDto } from './dto/admission-response.dto';
import { AdmissionNumberGenerator } from './utils/admission-number-generator';
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
    };
  }
}
