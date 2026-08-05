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
import { paginateAndMap } from '../../../common/utils/prisma-paginator';
import type { PaginatedResult } from '../../../common/dto/query-params.dto';
import { CreateTutorDto } from './dto/create-tutor.dto';
import { UpdateTutorDto } from './dto/update-tutor.dto';
import { QueryTutorDto } from './dto/query-tutor.dto';
import XLSX from 'xlsx';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

const TUTOR_LOGIN_PASSWORD_PREFIX = 'Tut@';

function generatePasswordFromPhone(phone?: string): string {
  if (phone) {
    const digits = phone.replace(/\D/g, '');
    const last4 = digits.slice(-4);
    if (last4.length === 4) return `${TUTOR_LOGIN_PASSWORD_PREFIX}${last4}`;
  }
  const fallback = String(1000 + Math.floor(Math.random() * 9000));
  return `${TUTOR_LOGIN_PASSWORD_PREFIX}${fallback}`;
}

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

    let employeeCode = dto.employeeCode;
    if (!employeeCode || !employeeCode.trim()) {
      const count = await this.prisma.staffProfiles.count({ where: { tenantId } });
      employeeCode = `FAC-${String(count + 1001).padStart(4, '0')}`;
    }

    const existingCode = await this.prisma.staffProfiles.findFirst({
      where: { tenantId, employeeCode, deletedAt: null },
    });
    if (existingCode) {
      employeeCode = `FAC-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    let rawPassword: string | null = null;

    if (dto.createLogin) {
      rawPassword = generatePasswordFromPhone(dto.phone);
    }

    const passwordHash = rawPassword
      ? hashSync(rawPassword, 10)
      : hashSync(randomUUID(), 8);

    const result = await this.prisma.$transaction(
      async (tx) => {
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
            passwordHash,
            forcePasswordChange: false,
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
              certificatesMetadata: { specialization: dto.specialization || '' },
              createdBy: userId,
              updatedBy: userId,
            },
          });
        }

        if (dto.subjectIds && dto.subjectIds.length > 0) {
          await Promise.all(
            dto.subjectIds.map((subjectId) =>
              tx.staffSubjects
                .create({
                  data: {
                    staffProfileId: user.id,
                    subjectId,
                    tenantId,
                    createdBy: userId,
                    updatedBy: userId,
                  },
                })
                .catch(() => {}),
            ),
          );
        }

        if (dto.branchIds && dto.branchIds.length > 0) {
          await Promise.all(
            dto.branchIds.map((branchId) => {
              const deptId = randomUUID();
              return tx.$executeRaw`
                INSERT INTO public."StaffDepartments" ("staffProfileId", "branchId", "departmentId", "tenantId", "createdBy", "updatedBy")
                VALUES (${user.id}::uuid, ${branchId}::uuid, ${deptId}, ${tenantId}::uuid, ${userId}::uuid, ${userId}::uuid)
                ON CONFLICT ("staffProfileId", "branchId", "departmentId") DO UPDATE SET "deletedAt" = NULL, "updatedAt" = now(), "updatedBy" = ${userId}::uuid
              `;
            }),
          );
        }

        if (dto.batchIds && dto.batchIds.length > 0) {
          for (const batchId of dto.batchIds) {
            const batch = await tx.batches.findFirst({
              where: { id: batchId, tenantId },
              select: { courseId: true },
            });

            let assignedSubjectId: string | null = null;

            if (batch?.courseId) {
              const tutorCourseSubject = await tx.courseSubjects.findFirst({
                where: {
                  tenantId,
                  courseId: batch.courseId,
                  subjectId: { in: dto.subjectIds || [] },
                },
                select: { subjectId: true },
              });
              if (tutorCourseSubject) {
                assignedSubjectId = tutorCourseSubject.subjectId;
              } else {
                const fallbackCourseSubject = await tx.courseSubjects.findFirst({
                  where: { tenantId, courseId: batch.courseId },
                  select: { subjectId: true },
                });
                if (fallbackCourseSubject) {
                  assignedSubjectId = fallbackCourseSubject.subjectId;
                }
              }
            }

            if (
              !assignedSubjectId &&
              dto.subjectIds &&
              dto.subjectIds.length > 0
            ) {
              assignedSubjectId = dto.subjectIds[0];
            }

            if (assignedSubjectId) {
              await tx.staffBatchAssignments
                .create({
                  data: {
                    staffProfileId: user.id,
                    batchId,
                    subjectId: assignedSubjectId,
                    tenantId,
                    effectiveFrom: new Date(),
                    effectiveTo: new Date('2099-12-31'),
                    isActive: true,
                    createdBy: userId,
                    updatedBy: userId,
                  },
                })
                .catch(() => {
                  // Ignore conflict
                });
            }
          }
        }

        // Assign TUTOR role for login access
        const tutorRole = await tx.roles.findFirst({
          where: { tenantId, code: 'TUTOR' },
        });
        if (tutorRole) {
          await tx.userRoles
            .create({
              data: {
                tenantId,
                userId: user.id,
                roleId: tutorRole.id,
                effectiveFrom: new Date(),
                effectiveTo: new Date('2099-12-31'),
                assignedBy: userId,
                assignmentReason: 'Tutor account creation',
                revokedBy: '',
                revokedReason: '',
                metadata: {},
                createdBy: userId,
                updatedBy: userId,
              },
            })
            .catch(() => {});
        }

        return this.findOneInTx(tx, user.id, tenantId);
      },
      { maxWait: 15000, timeout: 30000 },
    );

    if (rawPassword) {
      return {
        ...(result as Record<string, unknown>),
        generatedPassword: rawPassword,
      };
    }

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

    return paginateAndMap(
      this.prisma.users,
      {
        where,
        orderBy: { createdAt: 'desc' },
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
      },
      query,
      tenantId,
      async (user) => await this.formatTutor(user),
    );
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.users.findFirst({
      where: { tenantId, id, userType: 'TUTOR', deletedAt: null },
      include: this.findOneInclude(),
    });

    if (!user) throw new NotFoundException('Tutor not found');

    return await this.formatTutor(user);
  }

  private async findOneInTx(tx: any, id: string, tenantId: string) {
    const user = await tx.users.findFirst({
      where: { tenantId, id, userType: 'TUTOR', deletedAt: null },
      include: this.findOneInclude(),
    });

    if (!user) throw new NotFoundException('Tutor not found');

    return await this.formatTutor(user);
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
      if (dto.status) userUpdate.status = dto.status;
      if (Object.keys(userUpdate).length > 1) {
        await tx.users.update({
          where: { tenantId_id: { tenantId, id } },
          data: userUpdate as any,
        });
      }

      // Update StaffProfile
      if (dto.employeeCode || dto.designation || dto.phone !== undefined) {
        const profileUpdate: Record<string, unknown> = { updatedBy: userId };
        if (dto.employeeCode) profileUpdate.employeeCode = dto.employeeCode;
        if (dto.phone !== undefined) profileUpdate.workPhone = dto.phone;
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
        dto.specialization !== undefined ||
        dto.yearsOfExperience !== undefined ||
        dto.previousInstitution
      ) {
        const existingQual = await tx.staffQualifications.findFirst({
          where: { staffProfileId: id, deletedAt: null },
        });
        const qualData: Record<string, unknown> = { updatedBy: userId };
        if (dto.qualification) qualData.degree = dto.qualification;
        if (dto.specialization !== undefined) {
          const existingMeta = (existingQual?.certificatesMetadata as Record<string, any>) || {};
          qualData.certificatesMetadata = { ...existingMeta, specialization: dto.specialization };
        }
        if (dto.previousInstitution)
          qualData.institution = dto.previousInstitution;
        if (dto.yearsOfExperience !== undefined)
          qualData.experienceMonths = dto.yearsOfExperience * 12;

        if (existingQual) {
          await tx.staffQualifications.update({
            where: { id: existingQual.id },
            data: qualData as any,
          });
        } else {
          await tx.staffQualifications.create({
            data: {
              staffProfileId: id,
              tenantId,
              degree: dto.qualification || '',
              institution: dto.previousInstitution || '',
              yearCompleted: new Date().getFullYear(),
              experienceMonths: (dto.yearsOfExperience || 0) * 12,
              certificatesMetadata: { specialization: dto.specialization || '' },
              createdBy: userId,
              updatedBy: userId,
            },
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
            INSERT INTO public."StaffSubjects" ("staffProfileId", "subjectId", "tenantId", "createdBy", "updatedBy")
            VALUES (${id}::uuid, ${subjectId}::uuid, ${tenantId}::uuid, ${userId}::uuid, ${userId}::uuid)
            ON CONFLICT ("staffProfileId", "subjectId") DO UPDATE SET "deletedAt" = NULL, "updatedAt" = now(), "updatedBy" = ${userId}::uuid
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
          const deptId = randomUUID();
          await tx.$executeRaw`
            INSERT INTO public."StaffDepartments" ("staffProfileId", "branchId", "departmentId", "tenantId", "createdBy", "updatedBy")
            VALUES (${id}::uuid, ${branchId}::uuid, ${deptId}, ${tenantId}::uuid, ${userId}::uuid, ${userId}::uuid)
            ON CONFLICT ("staffProfileId", "branchId", "departmentId") DO UPDATE SET "deletedAt" = NULL, "updatedAt" = now(), "updatedBy" = ${userId}::uuid
          `;
        }
      }

      // Update StaffBatchAssignments
      if (dto.batchIds) {
        await tx.staffBatchAssignments.updateMany({
          where: { staffProfileId: id, tenantId },
          data: { deletedAt: now, deletedBy: userId, isActive: false },
        });

        for (const batchId of dto.batchIds) {
          const batch = await tx.batches.findFirst({
            where: { id: batchId, tenantId },
            select: { courseId: true },
          });

          let assignedSubjectId: string | null = null;

          if (batch?.courseId) {
            const tutorCourseSubject = await tx.courseSubjects.findFirst({
              where: {
                tenantId,
                courseId: batch.courseId,
                subjectId: {
                  in:
                    dto.subjectIds ||
                    existing.subjects?.map((s: any) => s.subjectId) ||
                    [],
                },
              },
              select: { subjectId: true },
            });
            if (tutorCourseSubject) {
              assignedSubjectId = tutorCourseSubject.subjectId;
            } else {
              const fallbackCourseSubject = await tx.courseSubjects.findFirst({
                where: { tenantId, courseId: batch.courseId },
                select: { subjectId: true },
              });
              if (fallbackCourseSubject) {
                assignedSubjectId = fallbackCourseSubject.subjectId;
              }
            }
          }

          if (
            !assignedSubjectId &&
            dto.subjectIds &&
            dto.subjectIds.length > 0
          ) {
            assignedSubjectId = dto.subjectIds[0];
          } else if (
            !assignedSubjectId &&
            existing.subjects &&
            existing.subjects.length > 0
          ) {
            assignedSubjectId = existing.subjects[0].subjectId;
          }

          if (assignedSubjectId) {
            await tx.staffBatchAssignments
              .create({
                data: {
                  staffProfileId: id,
                  batchId,
                  subjectId: assignedSubjectId,
                  tenantId,
                  effectiveFrom: new Date(),
                  effectiveTo: new Date('2099-12-31'),
                  isActive: true,
                  createdBy: userId,
                  updatedBy: userId,
                },
              })
              .catch(() => {
                // Ignore conflict
              });
          }
        }
      }
    }, { maxWait: 15000, timeout: 30000 });

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
    // First: try to find existing designation
    const existing = await tx.designations.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { name: designationName },
          { code: designationName.toUpperCase().substring(0, 10).replace(/\s+/g, '_') },
        ],
      },
      select: { id: true },
    });
    if (existing) return existing.id;

    const newId = randomUUID();
    const code = designationName
      .toUpperCase()
      .substring(0, 10)
      .replace(/\s+/g, '_');

    // Use INSERT ... ON CONFLICT DO NOTHING to avoid aborting the transaction
    // on a race condition where another concurrent request created the same designation
    await tx.$executeRaw`
      INSERT INTO public."Designations" (id, "tenantId", code, name, description, "isActive", "isSystem", "createdBy", "updatedBy")
      VALUES (${newId}::uuid, ${tenantId}::uuid, ${code}, ${designationName}, '', true, false, ${SYSTEM_USER_ID}::uuid, ${SYSTEM_USER_ID}::uuid)
      ON CONFLICT (code) DO NOTHING
    `;

    // After safe insert, fetch the actual id (could be the newId or an existing one)
    const resolved = await tx.designations.findFirst({
      where: { tenantId, code, deletedAt: null },
      select: { id: true },
    });

    return resolved?.id ?? newId;
  }

  private async resolveDesignation(
    designationName: string,
    tenantId: string,
  ): Promise<string> {
    const existing = await this.prisma.designations.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { name: designationName },
          { code: designationName.toUpperCase().substring(0, 10) },
        ],
      },
      select: { id: true },
    });

    if (existing) return existing.id;

    const code = designationName
      .toUpperCase()
      .substring(0, 10)
      .replace(/\s+/g, '_');

    const created = await this.prisma.designations.create({
      data: {
        tenantId,
        code,
        name: designationName,
        description: '',
        isActive: true,
        isSystem: false,
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
      },
    });

    return created.id;
  }

  private async formatTutor(user: any) {
    const profile = user.staff_profiless?.[0] || user.staff_profiless || {};
    const subjects = profile.staff_subjectss || [];
    const branches = profile.staff_departmentss || [];
    const qualifications = profile.staff_qualificationss || [];
    const batchAssignments = profile.staff_batch_assignmentss || [];
    const qual = qualifications[0] || {};

    let designationName: string | null =
      profile.designations?.name || profile.designation?.name || (typeof profile.designation === 'string' ? profile.designation : null);

    if (!designationName && profile.designationId) {
      try {
        const des = await this.prisma.designations.findFirst({
          where: { id: profile.designationId },
          select: { name: true },
        });
        if (des) designationName = des.name;
      } catch {
        // Fallback silently if query fails
      }
    }

    let meta: any = qual.certificatesMetadata;
    if (typeof meta === 'string') {
      try {
        meta = JSON.parse(meta);
      } catch {
        meta = {};
      }
    }

    const specialization =
      qual.specialization ||
      meta?.specialization ||
      null;

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: profile.workPhone || user.phone || null,
      status: user.status,
      employeeCode: profile.employeeCode || null,
      designation: designationName,
      qualification: qual.degree || null,
      specialization,
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
        batch: ba.batches || ba.batch || null,
      })),
      createdAt: user.createdAt,
    };
  }

  async generateBulkImportTemplate(tenantId: string): Promise<Buffer> {
    // 1. Fetch active subjects reference data

    // 1. Fetch active subjects reference data
    const subjects = await this.prisma.subjects.findMany({
      where: { tenantId, deletedAt: null },
      select: { code: true, name: true },
    });

    // 2. Prepare main instructions/input sheet headers for tutors
    const headers = [
      'First Name *',
      'Last Name',
      'Email *',
      'Phone',
      'Gender (MALE/FEMALE/OTHER)',
      'Employee Code',
      'Designation (e.g. Faculty)',
      'Highest Qualification',
      'Specialization',
      'Years of Experience',
      'Previous Institution',
      'Bio',
      'Subject Code (Copy from next sheet)',
    ];

    const sampleRow = [
      'Ganesh',
      'Arumugam',
      'ganesh.faculty@example.com',
      '+919876543209',
      'MALE',
      'TUT-001',
      'Senior Physics Faculty',
      'M.Sc Physics',
      'Mechanics, Electrodynamics',
      '8',
      'Previous Institute',
      'Experienced physics educator',
      subjects[0]?.code || 'PHY-11',
    ];

    // 3. Create Workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Main data input template
    const wsInput = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    XLSX.utils.book_append_sheet(wb, wsInput, 'Import Tutors');

    // Sheet 2: Available Subjects helper sheet
    const referenceData = [['Subject Code', 'Subject Name']];
    for (const sub of subjects) {
      referenceData.push([sub.code, sub.name]);
    }
    const wsRef = XLSX.utils.aoa_to_sheet(referenceData);
    XLSX.utils.book_append_sheet(wb, wsRef, 'Available Subjects');

    // 4. Return as binary buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return buf;
  }

  async bulkImport(
    fileBuffer: Buffer,
    tenantId: string,
    userId: string,
    academicYearId?: string,
    branchId?: string,
    courseId?: string,
    batchIds?: string[],
    createLogin?: boolean,
    subjectIds?: string[],
  ): Promise<{
    importedCount: number;
    errors: string[];
    loginCredentials?: Array<{ email: string; password: string }>;
  }> {
    const wb = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[];

    const errors: string[] = [];
    const loginCredentials: Array<{ email: string; password: string }> = [];
    let importedCount = 0;

    const defaultDeletedAt = new Date('2099-12-31T00:00:00.000Z');

    // Get TUTOR/FACULTY role with auto-creation fallback
    let tutorRole = await this.prisma.roles.findFirst({
      where: {
        code: { in: ['FACULTY', 'TUTOR'] },
        deletedAt: null,
      },
    });

    if (!tutorRole) {
      tutorRole = await this.prisma.roles.create({
        data: {
          tenantId,
          code: 'TUTOR',
          name: 'Tutor',
          roleType: 'SYSTEM',
          isDefault: true,
          isEditable: false,
          isDeletable: false,
          priority: 1,
          metadata: {},
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }

    // Run each import cleanly
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNum = i + 2; // header is line 1

      // Pick headers safely
      const firstName = (row['First Name *'] || row['firstName'] || '')
        .toString()
        .trim();
      const lastName = (row['Last Name'] || row['lastName'] || '')
        .toString()
        .trim();
      const email = (row['Email *'] || row['email'] || '')
        .toString()
        .trim()
        .toLowerCase();
      const phone = (row['Phone'] || row['phone'] || '').toString().trim();

      const designationName = (row['Designation (e.g. Faculty)'] || 'Faculty')
        .toString()
        .trim();
      const empType = (
        row['Employment Type (FULL_TIME/PART_TIME)'] || 'FULL_TIME'
      )
        .toString()
        .trim()
        .toUpperCase();
      const qualification = (
        row['Highest Qualification'] ||
        row['Qualification (e.g. PhD)'] ||
        row['qualification'] ||
        ''
      )
        .toString()
        .trim();
      const yearsOfExpRaw =
        parseInt(
          (
            row['Years of Experience'] ||
            row['Years of Experience (Number)'] ||
            row['yearsOfExperience'] ||
            '0'
          )
            .toString()
            .trim(),
          10,
        ) || 0;
      const parsedSubjectCode = (
        row['Subject Code (Copy from next sheet)'] ||
        row['Subject Code'] ||
        row['subjectCode'] ||
        ''
      )
        .toString()
        .trim()
        .toUpperCase();

      // Additional Professional details
      const sheetEmpCode = (row['Employee Code'] || row['employeeCode'] || '')
        .toString()
        .trim();
      const specialization = (
        row['Specialization'] ||
        row['specialization'] ||
        ''
      )
        .toString()
        .trim();
      const previousInstitution = (
        row['Previous Institution'] ||
        row['previousInstitution'] ||
        ''
      )
        .toString()
        .trim();
      const bio = (row['Bio'] || row['bio'] || '').toString().trim();

      if (!firstName || !email) {
        errors.push(`Row ${lineNum}: Missing required Name or Email.`);
        continue;
      }

      const identifier = `${firstName} (${email})`;

      // Check if email already exists
      const emailExists = await this.prisma.users.findFirst({
        where: { email, tenantId, deletedAt: null },
      });
      if (emailExists) {
        errors.push(
          `Row ${lineNum} [Tutor: ${identifier}]: Email '${email}' already exists.`,
        );
        continue;
      }

      // Check if Subject Code is valid
      let mappedSubject: any = null;
      if (parsedSubjectCode) {
        mappedSubject = await this.prisma.subjects.findFirst({
          where: { tenantId, code: parsedSubjectCode, deletedAt: null },
        });
        if (!mappedSubject) {
          errors.push(
            `Row ${lineNum} [Tutor: ${identifier}]: Subject Code '${parsedSubjectCode}' is invalid.`,
          );
          continue;
        }
      }

      const employeeCode = `TUT-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

      try {
        await this.prisma.$transaction(async (tx) => {
          // Resolve Designation
          const designationId = await this.resolveDesignationInTx(
            tx,
            designationName,
            tenantId,
          );

          // Generate password for login access
          const rowRawPassword = generatePasswordFromPhone(phone);
          const rowPasswordHash = hashSync(rowRawPassword, 10);

          // 1. Create User
          const user = await tx.users.create({
            data: {
              email,
              firstName,
              lastName,
              userType: 'TUTOR',
              status: 'ACTIVE',
              tenantId,
              branchId: branchId || '',
              passwordHash: rowPasswordHash,
              forcePasswordChange: false,
              createdBy: userId,
              updatedBy: userId,
            },
          });

          if (rowRawPassword) {
            loginCredentials.push({ email, password: rowRawPassword });
          }

          // 2. Create Staff Profile
          await tx.staffProfiles.create({
            data: {
              userId: user.id,
              tenantId,
              employeeCode: sheetEmpCode || employeeCode,
              designationId,
              employmentType:
                empType === 'PART_TIME' ? 'PART_TIME' : 'FULL_TIME',
              employmentStatus: 'ACTIVE',
              joinedAt: new Date(),
              resignedAt: new Date('2099-12-31'),
              officialEmail: email,
              workPhone: phone,
              createdBy: userId,
              updatedBy: userId,
            },
          });

          // 3. Assign FACULTY/TUTOR role
          if (tutorRole) {
            await tx.userRoles.create({
              data: {
                tenantId,
                userId: user.id,
                roleId: tutorRole.id,
                effectiveFrom: new Date(),
                effectiveTo: defaultDeletedAt,
                revokedBy: '',
                revokedReason: '',
                assignedBy: userId,
                assignmentReason: 'Bulk Import Auto Allocation',
                metadata: {},
                createdBy: userId,
                updatedBy: userId,
              },
            });
          }

          // 4. Save qualifications if any
          if (qualification || specialization || previousInstitution || bio) {
            await tx.staffQualifications.create({
              data: {
                staffProfileId: user.id,
                tenantId,
                degree: qualification || 'Imported',
                institution: previousInstitution || 'Bulk Imported',
                yearCompleted: new Date().getFullYear(),
                experienceMonths: yearsOfExpRaw * 12,
                certificatesMetadata: {
                  specialization: specialization || null,
                  previousInstitution: previousInstitution || null,
                  bio: bio || null,
                },
                createdBy: userId,
                updatedBy: userId,
              },
            });
          }

          // 5. Map Branch to StaffDepartments
          if (branchId) {
            const deptId = randomUUID();
            await tx.$executeRaw`
              INSERT INTO public."StaffDepartments" ("staffProfileId", "branchId", "departmentId", "tenantId", "createdBy", "updatedBy")
              VALUES (${user.id}::uuid, ${branchId}::uuid, ${deptId}, ${tenantId}::uuid, ${userId}::uuid, ${userId}::uuid)
              ON CONFLICT ("staffProfileId", "branchId", "departmentId") DO NOTHING
            `;
          }

          // 6. Map Selected Batches & Subjects
          // Priority: UI-selected subjectIds > sheet subject code > course first subject
          const effectiveSubjectIds: string[] = [];

          // If UI-selected subjects are passed, use them
          if (subjectIds && subjectIds.length > 0) {
            effectiveSubjectIds.push(...subjectIds);
          } else if (mappedSubject?.id) {
            // Fall back to sheet-parsed subject code
            effectiveSubjectIds.push(mappedSubject.id);
          } else if (courseId) {
            // Fall back to first subject of the course
            const firstCourseSubject = await tx.courseSubjects.findFirst({
              where: { tenantId, courseId },
              select: { subjectId: true },
            });
            if (firstCourseSubject?.subjectId) {
              effectiveSubjectIds.push(firstCourseSubject.subjectId);
            }
          }

          // Assign each subject
          for (const subjectId of effectiveSubjectIds) {
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
              .catch(() => {});

            // Assign all batches for this subject
            if (batchIds && batchIds.length > 0) {
              for (const batchId of batchIds) {
                await tx.$executeRaw`
                  INSERT INTO public."StaffBatchAssignments" (id, "staffProfileId", "batchId", "subjectId", "tenantId", "isActive", "effectiveFrom", "effectiveTo", "createdBy", "updatedBy")
                  VALUES (${randomUUID()}::uuid, ${user.id}::uuid, ${batchId}::uuid, ${subjectId}::uuid, ${tenantId}::uuid, true, now(), ${defaultDeletedAt}, ${userId}::uuid, ${userId}::uuid)
                  ON CONFLICT DO NOTHING
                `;
              }
            }
          }
        });

        importedCount++;
      } catch (err: any) {
        errors.push(
          `Row ${lineNum} [Tutor: ${identifier}]: ${err?.message || err}`,
        );
      }
    }

    return {
      importedCount,
      errors,
      ...(loginCredentials.length > 0 ? { loginCredentials } : {}),
    };
  }
}
