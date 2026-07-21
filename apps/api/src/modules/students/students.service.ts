import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenantScopedPrisma } from '../../common/utils/tenant-scoped-prisma';
import {
  paginateAndMap,
  buildPrismaOrderBy,
  buildPrismaSearch,
} from '../../common/utils/prisma-paginator';
import {
  PaginatedResult,
  QueryParamsDto,
} from '../../common/dto/query-params.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentResponseDto } from './dto/student-response.dto';
import {
  validateAge,
  validateAcademicStatusTransition,
} from './students.validation';
import { AdmissionNumberGenerator } from '../admissions/utils/admission-number-generator';
import { randomUUID } from 'node:crypto';
import { hashSync } from 'bcrypt';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
const STUDENT_SEARCH_FIELDS = [
  'studentCode',
  'userIdusers.email',
  'userIdusers.firstName',
  'userIdusers.lastName',
];

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScoped: TenantScopedPrisma,
    private readonly admissionNumberGenerator: AdmissionNumberGenerator,
  ) {}

  async create(
    dto: CreateStudentDto,
    tenantId: string,
    userId: string,
  ): Promise<StudentResponseDto> {
    const studentCode =
      dto.studentCode?.trim() ||
      `STU-${Date.now().toString().slice(-6)}-${Math.floor(100000 + Math.random() * 900000)}`;
    const bloodGroup = dto.bloodGroup || 'O_POS';
    const academicStatus = dto.academicStatus || 'ACTIVE';
    const email = dto.email.trim().toLowerCase();

    await this.checkDuplicateEmail(email, tenantId);
    await this.checkDuplicateStudentCode(studentCode, tenantId);
    validateAge(new Date(dto.dateOfBirth));

    const placeholderHash = hashSync(randomUUID(), 8);

    const profile = await this.prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          userType: 'STUDENT',
          status: 'ACTIVE',
          tenantId,
          branchId: '',
          passwordHash: placeholderHash,
          forcePasswordChange: true,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      const studentProfile = await tx.studentProfiles.create({
        data: {
          userId: user.id,
          tenantId,
          studentCode,
          dateOfBirth: new Date(dto.dateOfBirth),
          gender: dto.gender,
          bloodGroup,
          academicStatus,
          createdBy: userId,
          updatedBy: userId,
        },
        include: { userIdusers: true },
      });

      // Save student contact phone inside EmergencyContacts
      // Use an internal placeholder email — real email is on Users; EmergencyContacts has unique(tenantId, email)
      if (dto.phone) {
        await tx.emergencyContacts.create({
          data: {
            tenantId,
            studentProfileId: user.id,
            name: `${dto.firstName} ${dto.lastName}`,
            relationship: 'Self',
            phone: dto.phone,
            email: `self.${user.id}@noreply.internal`,
            isPrimary: true,
            createdBy: userId,
            updatedBy: userId,
          },
        });
      }

      // Save student address inside EmergencyContacts (encode address|city|state in name, pincode in phone)
      if (dto.address) {
        await tx.emergencyContacts.create({
          data: {
            tenantId,
            studentProfileId: user.id,
            name: `${dto.address}|${dto.city || ''}|${dto.state || ''}`,
            relationship: 'Address',
            phone: dto.pincode || '',
            email: `addr.${user.id}@noreply.internal`,
            isPrimary: false,
            createdBy: userId,
            updatedBy: userId,
          },
        });
      }

      // Save parent contact inside EmergencyContacts
      if (dto.parentPhone || dto.parentName) {
        await tx.emergencyContacts.create({
          data: {
            tenantId,
            studentProfileId: user.id,
            name: dto.parentName || 'Parent',
            relationship: 'Parent',
            phone: dto.parentPhone || '',
            email:
              dto.parentEmail && dto.parentEmail.trim()
                ? dto.parentEmail.trim()
                : `parent.${user.id}@noreply.internal`,
            isPrimary: false,
            createdBy: userId,
            updatedBy: userId,
          },
        });
      }

      // Save emergency contact
      if (dto.emergencyContact) {
        await tx.emergencyContacts.create({
          data: {
            tenantId,
            studentProfileId: user.id,
            name: 'Emergency Contact',
            relationship: 'Emergency',
            phone: dto.emergencyContact,
            email: `emerg.${user.id}@noreply.internal`,
            isPrimary: false,
            createdBy: userId,
            updatedBy: userId,
          },
        });
      }

      // Create StudentAdmission + StudentBatchEnrollment if courseId/batchId provided
      if (dto.courseId) {
        // Use provided academicYearId or fallback to the latest academic year for this tenant
        const academicYear = dto.academicYearId
          ? await tx.academicYears.findFirst({
              where: { id: dto.academicYearId, tenantId, deletedAt: null },
            })
          : await tx.academicYears.findFirst({
              where: { tenantId, deletedAt: null },
              orderBy: { createdAt: 'desc' },
            });

        // Use provided branchId or fallback to the first branch for this tenant
        const branch = dto.branchId
          ? await tx.branches.findFirst({
              where: { id: dto.branchId, tenantId, deletedAt: null },
            })
          : await tx.branches.findFirst({
              where: { tenantId, deletedAt: null },
            });

        if (academicYear && branch) {
          const admissionNumber = await this.admissionNumberGenerator.generate(
            tenantId,
            academicYear.id,
          );

          const admission = await tx.studentAdmissions.create({
            data: {
              tenantId,
              studentProfileId: user.id,
              admissionNumber,
              academicYearId: academicYear.id,
              courseId: dto.courseId,
              branchId: branch.id,
              admissionDate: dto.admissionDate
                ? new Date(dto.admissionDate)
                : new Date(),
              admissionStatus: 'ACTIVE',
              createdBy: userId,
              updatedBy: userId,
            },
          });

          if (dto.batchId) {
            await tx.studentBatchEnrollments.create({
              data: {
                tenantId,
                studentAdmissionId: admission.id,
                batchId: dto.batchId,
                joinedAt: dto.admissionDate
                  ? new Date(dto.admissionDate)
                  : new Date(),
                leftAt: new Date('2099-12-31'),
                status: 'ACTIVE',
                isPrimary: true,
                createdBy: userId,
                updatedBy: userId,
              },
            });
          }
        }
      }

      return studentProfile;
    });

    return this.toResponseAsync(profile);
  }

  async findAll(
    tenantId: string,
    query: QueryParamsDto,
    academicStatus?: string,
  ): Promise<PaginatedResult<any>> {
    const where: Record<string, unknown> = {
      ...this.tenantScoped.buildWhere(tenantId),
      ...(query.search
        ? buildPrismaSearch(query.search, STUDENT_SEARCH_FIELDS)
        : {}),
      ...(academicStatus ? { academicStatus } : {}),
    };

    let orderBy: any;
    if (query.sortBy === 'name') {
      orderBy = {
        userIdusers: {
          firstName: query.sortOrder || 'desc',
        },
      };
    } else {
      orderBy = buildPrismaOrderBy(query.sortBy, query.sortOrder);
    }

    const paginated = await paginateAndMap(
      this.prisma.studentProfiles,
      { where, orderBy, include: { userIdusers: true } },
      query,
      tenantId,
      (profile: any) => profile,
    );

    const mappedData = await Promise.all(
      paginated.data.map((profile) => this.toResponseAsync(profile)),
    );

    return {
      data: mappedData,
      meta: paginated.meta,
    };
  }

  async findOne(id: string, tenantId: string): Promise<any> {
    const profile = await this.prisma.studentProfiles.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { userId: id }),
      include: { userIdusers: true },
    });

    if (!profile) {
      throw new NotFoundException('Student not found');
    }

    return this.toResponseAsync(profile);
  }

  private async toResponseAsync(profile: any): Promise<any> {
    // 1. Fetch contact details from EmergencyContacts
    const contacts = await this.prisma.emergencyContacts.findMany({
      where: { studentProfileId: profile.userId, tenantId: profile.tenantId },
    });

    const selfContact = contacts.find((c) => c.relationship === 'Self');
    const parentContact = contacts.find((c) => c.relationship === 'Parent');
    const emergencyContact = contacts.find(
      (c) => c.relationship === 'Emergency',
    );
    const addressContact = contacts.find((c) => c.relationship === 'Address');

    // 2. Fetch current admission, course, and batch names
    const admission = await this.prisma.studentAdmissions.findFirst({
      where: { studentProfileId: profile.userId, tenantId: profile.tenantId },
      orderBy: { createdAt: 'desc' },
    });

    let courseName = 'Not provided';
    let batchName = 'Not provided';
    let admissionDate: Date | null = null;
    let courseId = '';
    let batchId = '';

    if (admission) {
      admissionDate = admission.admissionDate;
      courseId = admission.courseId;
      const course = await this.prisma.courses.findFirst({
        where: { id: admission.courseId, tenantId: profile.tenantId },
      });
      if (course) courseName = course.name;

      const enrollment = await this.prisma.studentBatchEnrollments.findFirst({
        where: { studentAdmissionId: admission.id, tenantId: profile.tenantId },
      });
      if (enrollment) {
        batchId = enrollment.batchId;
        const batch = await this.prisma.batches.findFirst({
          where: { id: enrollment.batchId, tenantId: profile.tenantId },
        });
        if (batch) batchName = batch.name;
      }
    }

    let address = 'Not provided';
    let city = 'Not provided';
    let state = 'Not provided';
    let pincode = 'Not provided';

    if (addressContact) {
      // name stores "address|city|state", phone stores pincode
      const nameParts = (addressContact.name || '').split('|');
      address = nameParts[0] || 'Not provided';
      city = nameParts[1] || 'Not provided';
      state = nameParts[2] || 'Not provided';
      pincode = addressContact.phone || 'Not provided';
    }

    return {
      id: profile.userId,
      tenantId: profile.tenantId,
      studentCode: profile.studentCode,
      email: profile.userIdusers?.email ?? '',
      firstName: profile.userIdusers?.firstName ?? '',
      lastName: profile.userIdusers?.lastName ?? '',
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,
      bloodGroup: profile.bloodGroup,
      academicStatus: profile.academicStatus,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      createdBy: profile.createdBy,
      updatedBy: profile.updatedBy,

      // Contacts mapping
      phone: selfContact?.phone ?? 'Not provided',
      parentName: parentContact?.name ?? 'Not provided',
      parentPhone: parentContact?.phone ?? 'Not provided',
      parentEmail:
        parentContact?.email &&
        !parentContact.email.includes('@noreply.internal')
          ? parentContact.email
          : 'Not provided',
      emergencyContact: emergencyContact?.phone ?? 'Not provided',

      // Address mapping
      address,
      city,
      state,
      pincode,

      // Academics
      courseId,
      courseName,
      batchId,
      batchName,
      admissionDate,
    };
  }

  async update(
    id: string,
    dto: UpdateStudentDto,
    tenantId: string,
    userId: string,
  ): Promise<any> {
    const existing = await this.prisma.studentProfiles.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { userId: id }),
    });

    if (!existing) {
      throw new NotFoundException('Student not found');
    }

    if (
      dto.studentCode !== undefined &&
      dto.studentCode !== (existing as any).studentCode
    ) {
      await this.checkDuplicateStudentCode(dto.studentCode, tenantId, id);
    }

    if (dto.dateOfBirth !== undefined) {
      validateAge(new Date(dto.dateOfBirth));
    }

    if (dto.academicStatus !== undefined) {
      validateAcademicStatusTransition(
        (existing as any).academicStatus,
        dto.academicStatus,
      );
    }

    const userData: Record<string, unknown> = {};
    if (dto.firstName !== undefined) userData.firstName = dto.firstName;
    if (dto.lastName !== undefined) userData.lastName = dto.lastName;
    if (Object.keys(userData).length > 0) {
      userData.updatedBy = userId;
      await this.prisma.users.update({ where: { id }, data: userData });
    }

    const profileData: Record<string, unknown> = { updatedBy: userId };
    if (dto.studentCode !== undefined)
      profileData.studentCode = dto.studentCode;
    if (dto.dateOfBirth !== undefined)
      profileData.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.gender !== undefined) profileData.gender = dto.gender;
    if (dto.bloodGroup !== undefined) profileData.bloodGroup = dto.bloodGroup;
    if (dto.academicStatus !== undefined)
      profileData.academicStatus = dto.academicStatus;

    const profile = await this.prisma.studentProfiles.update({
      where: { userId: id },
      data: profileData,
      include: { userIdusers: true },
    });

    return this.toResponseAsync(profile);
  }

  async remove(id: string, tenantId: string, userId: string): Promise<void> {
    const existing = await this.prisma.studentProfiles.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { userId: id }),
    });

    if (!existing) {
      throw new NotFoundException('Student not found');
    }

    await this.prisma.studentProfiles.update({
      where: { userId: id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  async findByCode(code: string, tenantId: string): Promise<any> {
    const profile = await this.prisma.studentProfiles.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { studentCode: code }),
      include: { userIdusers: true },
    });

    return profile ? this.toResponseAsync(profile) : null;
  }

  private async checkDuplicateEmail(
    email: string,
    tenantId: string,
    excludeUserId?: string,
  ): Promise<void> {
    const existing = await this.prisma.users.findFirst({
      where: {
        email,
        tenantId,
        deletedAt: null,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
    });

    if (existing) {
      throw new ConflictException(
        'A student with this email already exists in this tenant',
      );
    }
  }

  private async checkDuplicateStudentCode(
    studentCode: string,
    tenantId: string,
    excludeUserId?: string,
  ): Promise<void> {
    const existing = await this.prisma.studentProfiles.findFirst({
      where: {
        studentCode,
        tenantId,
        deletedAt: null,
        ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
      },
    });

    if (existing) {
      throw new ConflictException(
        'A student with this code already exists in this tenant',
      );
    }
  }

  private toResponse(profile: any): StudentResponseDto {
    return {
      id: profile.userId,
      tenantId: profile.tenantId,
      studentCode: profile.studentCode,
      email: profile.userIdusers?.email ?? '',
      firstName: profile.userIdusers?.firstName ?? '',
      lastName: profile.userIdusers?.lastName ?? '',
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,
      bloodGroup: profile.bloodGroup,
      academicStatus: profile.academicStatus,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      createdBy: profile.createdBy,
      updatedBy: profile.updatedBy,
    };
  }

  async getStats(tenantId: string) {
    const baseWhere = { tenantId, deletedAt: null };
    const [total, enquiry, active, suspended, withdrawn, alumni] =
      await Promise.all([
        this.prisma.studentProfiles.count({ where: baseWhere }),
        this.prisma.studentProfiles.count({
          where: { ...baseWhere, academicStatus: 'ENQUIRY' },
        }),
        this.prisma.studentProfiles.count({
          where: { ...baseWhere, academicStatus: 'ACTIVE' },
        }),
        this.prisma.studentProfiles.count({
          where: { ...baseWhere, academicStatus: 'SUSPENDED' },
        }),
        this.prisma.studentProfiles.count({
          where: { ...baseWhere, academicStatus: 'WITHDRAWN' },
        }),
        this.prisma.studentProfiles.count({
          where: { ...baseWhere, academicStatus: 'ALUMNI' },
        }),
      ]);

    return {
      total,
      enquiry,
      active,
      suspended,
      withdrawn,
      alumni,
      // Support frontend expected structure with fallbacks
      inactive: suspended,
      graduated: alumni,
      droppedOut: withdrawn,
      pending: enquiry,
    };
  }
}
