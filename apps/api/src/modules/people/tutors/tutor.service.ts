/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { hashSync } from 'bcrypt';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { TenantScopedPrisma } from '../../../common/utils/tenant-scoped-prisma';
import { paginate } from '../../../common/utils/prisma-paginator';
import type { PaginatedResult } from '../../../common/dto/query-params.dto';
import { CreateTutorDto } from './dto/create-tutor.dto';
import { UpdateTutorDto } from './dto/update-tutor.dto';
import { QueryTutorDto } from './dto/query-tutor.dto';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class TutorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantScoped: TenantScopedPrisma,
  ) {}

  async create(dto: CreateTutorDto, tenantId: string, userId: string) {
    const existing = await this.prisma.users.findFirst({
      where: { tenantId, email: dto.email, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException(
        `User with email "${dto.email}" already exists in this tenant`,
      );
    }

    const employeeCode =
      dto.employeeCode || `TUT-${Date.now().toString(36).toUpperCase()}`;
    const placeholderHash = hashSync(randomUUID(), 8);

    const result = await this.prisma.$transaction(async (tx) => {
      const designationId = await this.resolveDesignationInTx(
        tx,
        dto.designation || 'Faculty',
        tenantId,
      );
      const user = await tx.users.create({
        data: {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          userType: 'TUTOR',
          status: 'ACTIVE',
          tenantId,
          branchId: '',
          passwordHash: placeholderHash,
          forcePasswordChange: !dto.createLogin,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      await tx.staffProfiles.create({
        data: {
          userId: user.id,
          tenantId,
          employeeCode,
          designationId,
          employmentType: 'FULL_TIME',
          employmentStatus: 'ACTIVE',
          joinedAt: new Date(),
          resignedAt: new Date('2099-12-31'),
          officialEmail: dto.email,
          workPhone: dto.phone || '',
          createdBy: userId,
          updatedBy: userId,
        },
      });

      if (
        dto.qualification ||
        dto.specialization ||
        dto.yearsOfExperience ||
        dto.previousInstitution
      ) {
        await tx.staffQualifications.create({
          data: {
            staffProfileId: user.id,
            tenantId,
            degree: dto.qualification || '',
            institution: dto.previousInstitution || '',
            yearCompleted: new Date().getFullYear(),
            experienceMonths: (dto.yearsOfExperience || 0) * 12,
            certificatesMetadata: {},
            createdBy: userId,
            updatedBy: userId,
          },
        });
      }

      if (dto.subjectIds && dto.subjectIds.length > 0) {
        for (const subjectId of dto.subjectIds) {
          await tx.staffSubjects
            .create({
              data: {
                staffProfileId: user.id,
                subjectId,
                tenantId,
                createdBy: userId,
                updatedBy: userId,
              },
            })
            .catch(() => {
              // ON CONFLICT DO NOTHING equivalent
            });
        }
      }

      if (dto.branchIds && dto.branchIds.length > 0) {
        for (const branchId of dto.branchIds) {
          await tx.staffDepartments
            .create({
              data: {
                staffProfileId: user.id,
                branchId,
                departmentId: '',
                tenantId,
                createdBy: userId,
                updatedBy: userId,
              },
            })
            .catch(() => {
              // ON CONFLICT DO NOTHING equivalent
            });
        }
      }

      return this.findOneInTx(tx, user.id, tenantId);
    });

    return result;
  }

  async findAll(
    tenantId: string,
    query: QueryTutorDto,
  ): Promise<PaginatedResult<any>> {
    const where: any = this.tenantScoped.buildWhere(tenantId);
    where.userType = 'TUTOR';
    where.deletedAt = null;

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.tutorStatus) {
      where.status = query.tutorStatus;
    }

    // Subject filter — find users whose staff profile has the given subject
    if (query.subjectId) {
      const staffIds = await this.prisma.staffSubjects.findMany({
        where: { tenantId, subjectId: query.subjectId, deletedAt: null },
        select: { staffProfileId: true },
      });
      where.id = { in: staffIds.map((s) => s.staffProfileId) };
    }

    // Branch filter
    if (query.branchId) {
      const staffIds = await this.prisma.staffDepartments.findMany({
        where: { tenantId, branchId: query.branchId, deletedAt: null },
        select: { staffProfileId: true },
      });
      const branchFilteredIds = staffIds.map((s) => s.staffProfileId);
      if (where.id) {
        where.id = {
          in: where.id.in.filter((id: string) =>
            branchFilteredIds.includes(id),
          ),
        };
      } else {
        where.id = { in: branchFilteredIds };
      }
    }

    return paginate({
      model: this.prisma.users,
      where,
      orderBy: { createdAt: 'desc' },
      query: { page: query.page, limit: query.limit },
      tenantId,
      include: {
        staff_profiless: {
          include: {
            staff_subjectss: { where: { deletedAt: null } },
            staff_departmentss: { where: { deletedAt: null } },
            staff_qualificationss: { where: { deletedAt: null }, take: 1 },
            staff_batch_assignmentss: {
              where: { deletedAt: null, isActive: true },
            },
          },
        },
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.users.findFirst({
      where: { tenantId, id, userType: 'TUTOR', deletedAt: null },
      include: this.findOneInclude(),
    });

    if (!user) throw new NotFoundException('Tutor not found');

    return this.formatTutor(user);
  }

  private async findOneInTx(tx: any, id: string, tenantId: string) {
    const user = await tx.users.findFirst({
      where: { tenantId, id, userType: 'TUTOR', deletedAt: null },
      include: this.findOneInclude(),
    });

    if (!user) throw new NotFoundException('Tutor not found');

    return this.formatTutor(user);
  }

  private findOneInclude() {
    return {
      staff_profiless: {
        include: {
          staff_subjectss: { where: { deletedAt: null } },
          staff_departmentss: { where: { deletedAt: null } },
          staff_qualificationss: { where: { deletedAt: null }, take: 1 },
          staff_batch_assignmentss: {
            where: { deletedAt: null, isActive: true },
          },
        },
      },
    };
  }

  async update(
    id: string,
    dto: UpdateTutorDto,
    tenantId: string,
    userId: string,
  ) {
    const existing = await this.findOne(id, tenantId);
    if (!existing) throw new NotFoundException('Tutor not found');

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // Update User
      const userUpdate: Record<string, unknown> = { updatedBy: userId };
      if (dto.firstName) userUpdate.firstName = dto.firstName;
      if (dto.lastName) userUpdate.lastName = dto.lastName;
      if (dto.email) userUpdate.email = dto.email;
      if (Object.keys(userUpdate).length > 1) {
        await tx.users.update({
          where: { tenantId_id: { tenantId, id } },
          data: userUpdate as any,
        });
      }

      // Update StaffProfile
      if (dto.employeeCode || dto.designation) {
        const profileUpdate: Record<string, unknown> = { updatedBy: userId };
        if (dto.employeeCode) profileUpdate.employeeCode = dto.employeeCode;
        if (dto.designation) {
          profileUpdate.designationId = await this.resolveDesignation(
            dto.designation,
            tenantId,
          );
        }
        if (Object.keys(profileUpdate).length > 1) {
          await tx.staffProfiles.update({
            where: { userId: id },
            data: profileUpdate as any,
          });
        }
      }

      // Update StaffQualifications
      if (
        dto.qualification ||
        dto.specialization ||
        dto.yearsOfExperience !== undefined
      ) {
        const existingQual = await tx.staffQualifications.findFirst({
          where: { staffProfileId: id, deletedAt: null },
        });
        const qualData: Record<string, unknown> = { updatedBy: userId };
        if (dto.qualification) qualData.degree = dto.qualification;
        if (dto.previousInstitution)
          qualData.institution = dto.previousInstitution;
        if (dto.yearsOfExperience !== undefined)
          qualData.experienceMonths = dto.yearsOfExperience * 12;

        if (existingQual) {
          await tx.staffQualifications.update({
            where: { id: existingQual.id },
            data: qualData as any,
          });
        }
      }

      // Update StaffSubjects
      if (dto.subjectIds) {
        await tx.staffSubjects.updateMany({
          where: { staffProfileId: id, tenantId },
          data: { deletedAt: now, deletedBy: userId },
        });
        for (const subjectId of dto.subjectIds) {
          await tx.$executeRaw`
            INSERT INTO public.staff_subjects (staff_profile_id, subject_id, tenant_id, created_by, updated_by)
            VALUES (${id}::uuid, ${subjectId}::uuid, ${tenantId}::uuid, ${userId}::uuid, ${userId}::uuid)
            ON CONFLICT (staff_profile_id, subject_id) DO UPDATE SET deleted_at = NULL, updated_at = now(), updated_by = ${userId}::uuid
          `;
        }
      }

      // Update StaffDepartments (branches)
      if (dto.branchIds) {
        await tx.staffDepartments.updateMany({
          where: { staffProfileId: id, tenantId },
          data: { deletedAt: now, deletedBy: userId },
        });
        for (const branchId of dto.branchIds) {
          await tx.$executeRaw`
            INSERT INTO public.staff_departments (staff_profile_id, branch_id, department_id, tenant_id, created_by, updated_by)
            VALUES (${id}::uuid, ${branchId}::uuid, ${null}, ${tenantId}::uuid, ${userId}::uuid, ${userId}::uuid)
            ON CONFLICT (staff_profile_id, branch_id, department_id) DO UPDATE SET deleted_at = NULL, updated_at = now(), updated_by = ${userId}::uuid
          `;
        }
      }
    });

    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string, userId: string) {
    const existing = await this.findOne(id, tenantId);
    if (!existing) throw new NotFoundException('Tutor not found');

    await this.tenantScoped.softDelete(this.prisma.users, id, tenantId, userId);

    // Soft delete related staff profile
    await this.prisma.staffProfiles.update({
      where: { userId: id },
      data: { deletedAt: new Date(), deletedBy: userId, updatedBy: userId },
    });

    return { success: true };
  }

  private async resolveDesignationInTx(
    tx: any,
    designationName: string,
    tenantId: string,
  ): Promise<string> {
    const designation = await tx.designations.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { name: designationName },
          { code: designationName.toUpperCase().substring(0, 10) },
        ],
      },
    });
    if (designation) return designation.id;

    const newId = randomUUID();
    const code = designationName
      .toUpperCase()
      .substring(0, 10)
      .replace(/\s+/g, '_');
    await tx.designations
      .create({
        data: {
          id: newId,
          tenantId,
          code,
          name: designationName,
          description: '',
          isActive: true,
          isSystem: false,
          createdBy: SYSTEM_USER_ID,
          updatedBy: SYSTEM_USER_ID,
        },
      })
      .catch(() => {});
    return newId;
  }

  private async resolveDesignation(
    designationName: string,
    tenantId: string,
  ): Promise<string> {
    const result = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM public.designations WHERE tenant_id = $1::uuid AND (name = $2 OR code = $2) AND deleted_at IS NULL LIMIT 1`,
      tenantId,
      designationName.toUpperCase().substring(0, 10),
    );

    if (result && result.length > 0) {
      return result[0].id;
    }

    // Create default designation
    const newId = randomUUID();
    const code = designationName
      .toUpperCase()
      .substring(0, 10)
      .replace(/\s+/g, '_');
    await this.prisma.$executeRaw`
      INSERT INTO public.designations (id, tenant_id, code, name, is_active, is_system)
      VALUES (${newId}::uuid, ${tenantId}::uuid, ${code}, ${designationName}, true, false)
      ON CONFLICT (tenant_id, id) DO NOTHING
    `;

    return newId;
  }

  private formatTutor(user: any) {
    const profile = user.staff_profiless?.[0] || user.staff_profiless || {};
    const subjects = profile.staff_subjectss || [];
    const branches = profile.staff_departmentss || [];
    const qualifications = profile.staff_qualificationss || [];
    const batchAssignments = profile.staff_batch_assignmentss || [];
    const qual = qualifications[0] || {};

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || null,
      status: user.status,
      employeeCode: profile.employeeCode || null,
      designation: null,
      qualification: qual.degree || null,
      specialization: qual.specialization || null,
      yearsOfExperience: qual.experienceMonths
        ? Math.floor(qual.experienceMonths / 12)
        : 0,
      previousInstitution: qual.institution || null,
      bio: qual.bio || null,
      createdLogin: !user.forcePasswordChange,
      subjects: subjects.map((s: any) => ({
        id: s.subjectId,
        subjectId: s.subjectId,
      })),
      branches: branches.map((b: any) => ({
        id: b.branchId,
        branchId: b.branchId,
        departmentId: b.departmentId,
      })),
      batchCount: batchAssignments.length,
      batchAssignments: batchAssignments.map((ba: any) => ({
        id: ba.id,
        batchId: ba.batchId,
        subjectId: ba.subjectId,
        isActive: ba.isActive,
        effectiveFrom: ba.effectiveFrom,
        effectiveTo: ba.effectiveTo,
      })),
      createdAt: user.createdAt,
    };
  }
}
