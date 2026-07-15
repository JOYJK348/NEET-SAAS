import { Injectable, NotFoundException } from '@nestjs/common';
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
import { randomUUID } from 'node:crypto';
import { hashSync } from 'bcrypt';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
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
  ) {}

  async create(
    dto: CreateStudentDto,
    tenantId: string,
    userId: string,
  ): Promise<StudentResponseDto> {
    const placeholderHash = hashSync(randomUUID(), 8);

    const user = await this.prisma.users.create({
      data: {
        email: dto.email.trim().toLowerCase(),
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

    const profile = await this.prisma.studentProfiles.create({
      data: {
        userId: user.id,
        tenantId,
        studentCode: dto.studentCode,
        dateOfBirth: new Date(dto.dateOfBirth),
        gender: dto.gender,
        bloodGroup: dto.bloodGroup,
        academicStatus: dto.academicStatus,
        createdBy: userId,
        updatedBy: userId,
      },
      include: { userIdusers: true },
    });

    return this.toResponse(profile);
  }

  async findAll(
    tenantId: string,
    query: QueryParamsDto,
  ): Promise<PaginatedResult<StudentResponseDto>> {
    const where = {
      ...this.tenantScoped.buildWhere(tenantId),
      ...(query.search
        ? buildPrismaSearch(query.search, STUDENT_SEARCH_FIELDS)
        : {}),
    };

    const orderBy = buildPrismaOrderBy(query.sortBy, query.sortOrder);

    return paginateAndMap(
      this.prisma.studentProfiles,
      { where, orderBy, include: { userIdusers: true } },
      query,
      tenantId,
      (profile: any) => this.toResponse(profile),
    );
  }

  async findOne(id: string, tenantId: string): Promise<StudentResponseDto> {
    const profile = await this.prisma.studentProfiles.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { userId: id }),
      include: { userIdusers: true },
    });

    if (!profile) {
      throw new NotFoundException('Student not found');
    }

    return this.toResponse(profile);
  }

  async update(
    id: string,
    dto: UpdateStudentDto,
    tenantId: string,
    userId: string,
  ): Promise<StudentResponseDto> {
    const existing = await this.prisma.studentProfiles.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { userId: id }),
    });

    if (!existing) {
      throw new NotFoundException('Student not found');
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

    return this.toResponse(profile);
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

  async findByCode(
    code: string,
    tenantId: string,
  ): Promise<StudentResponseDto | null> {
    const profile = await this.prisma.studentProfiles.findFirst({
      where: this.tenantScoped.buildWhere(tenantId, { studentCode: code }),
      include: { userIdusers: true },
    });

    return profile ? this.toResponse(profile) : null;
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
}
