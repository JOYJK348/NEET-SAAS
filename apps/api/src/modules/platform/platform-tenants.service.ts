import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { PasswordService } from '../auth/password.service';
import { CreateTenantDto, UpdateTenantStatusDto } from './dto/platform-dtos';
import { PlatformAuditEventEnum } from '@prisma/client';

const DEFAULT_FEATURE_KEYS = [
  'ONLINE_CBT_EXAMS',
  'AI_TUTOR_BOT',
  'FEE_COLLECTION',
  'LIVE_CLASSES',
  'ANALYTICS_REPORTS',
  'WHATSAPP_ALERTS',
];

@Injectable()
export class PlatformTenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly passwordService: PasswordService,
  ) {}

  async getTenants(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Record<string, any> = { deletedAt: null };

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query.search && query.search.trim().length > 0) {
      const search = query.search.trim();
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.institutes.count({ where }),
      this.prisma.institutes.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          userss: {
            where: { userType: ('TENANT_ADMIN' as any), deletedAt: null },
            select: { id: true, email: true, firstName: true, lastName: true },
            take: 1,
          },
          _count: {
            select: {
              userss: { where: { deletedAt: null } },
              branchess: { where: { deletedAt: null } },
              coursess: { where: { deletedAt: null } },
            },
          },
        },
      }),
    ]);

    return {
      items: items.map((tenant: any) => ({
        id: tenant.id,
        code: tenant.code,
        slug: tenant.slug,
        name: tenant.name,
        displayName: tenant.displayName,
        email: tenant.email,
        phone: tenant.phone,
        website: tenant.website,
        status: tenant.status,
        timezone: tenant.timezone,
        currency: tenant.currency,
        createdAt: tenant.createdAt,
        primaryAdmin: tenant.userss?.[0]
          ? {
              id: tenant.userss[0].id,
              name: `${tenant.userss[0].firstName} ${tenant.userss[0].lastName}`.trim(),
              email: tenant.userss[0].email,
            }
          : null,
        metrics: {
          totalUsers: tenant._count?.userss ?? 0,
          branchesCount: tenant._count?.branchess ?? 0,
          coursesCount: tenant._count?.coursess ?? 0,
        },
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTenantById(id: string) {
    const tenant: any = await this.prisma.institutes.findFirst({
      where: { id, deletedAt: null },
      include: {
        userss: {
          where: { userType: ('TENANT_ADMIN' as any), deletedAt: null },
          select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
        },
        _count: {
          select: {
            userss: { where: { deletedAt: null } },
            branchess: { where: { deletedAt: null } },
            coursess: { where: { deletedAt: null } },
            batchess: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${id}' was not found`);
    }

    const [
      studentsRaw,
      tutorsRaw,
      parentsRaw,
      studentParentsRaw,
      branchesRaw,
      featureFlags,
    ] = await Promise.all([
      // 1. Students
      this.prisma.users.findMany({
        where: { tenantId: id, userType: 'STUDENT' as any, deletedAt: null },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          createdAt: true,
          student_profiless: {
            select: { studentCode: true, gender: true, academicStatus: true },
          },
        },
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
      // 2. Tutors & Staff
      this.prisma.users.findMany({
        where: { tenantId: id, userType: { in: ['TUTOR', 'STAFF'] as any }, deletedAt: null },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          userType: true,
          status: true,
          createdAt: true,
        },
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
      // 3. Parents
      this.prisma.users.findMany({
        where: { tenantId: id, userType: 'PARENT' as any, deletedAt: null },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          createdAt: true,
          parent_profiless: {
            select: { occupation: true, educationLevel: true },
          },
        },
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
      // 4. Student Parent Links
      this.prisma.studentParents.findMany({
        where: { tenantId: id, deletedAt: null },
        include: {
          studentProfileIstudent_profile: {
            include: {
              userIdusers: {
                select: { id: true, firstName: true, lastName: true, email: true },
              },
            },
          },
          parentProfileIdparent_profiles: {
            include: {
              userIdusers: {
                select: { id: true, firstName: true, lastName: true, email: true },
              },
            },
          },
        },
        take: 100,
      }),
      // 5. Branches
      this.prisma.branches.findMany({
        where: { tenantId: id, deletedAt: null },
        select: { id: true, code: true, name: true, displayName: true, email: true, phone: true, branchType: true, status: true, createdAt: true },
      }),
      // 6. Feature Flags
      this.prisma.featureFlags.findMany({
        where: { tenantId: id },
        select: { id: true, featureKey: true, enabled: true, description: true },
      }),
    ]);

    const students = studentsRaw.map((s: any) => ({
      id: s.id,
      name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.email,
      email: s.email,
      phone: 'N/A',
      status: s.status,
      createdAt: s.createdAt,
      studentCode: s.student_profiless?.studentCode || 'N/A',
      gender: s.student_profiless?.gender || 'N/A',
      academicStatus: s.student_profiless?.academicStatus || 'ACTIVE',
    }));

    const tutors = tutorsRaw.map((t: any) => ({
      id: t.id,
      name: `${t.firstName || ''} ${t.lastName || ''}`.trim() || t.email,
      email: t.email,
      phone: 'N/A',
      role: t.userType,
      status: t.status,
      createdAt: t.createdAt,
    }));

    const parents = parentsRaw.map((p: any) => ({
      id: p.id,
      name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email,
      email: p.email,
      phone: 'N/A',
      status: p.status,
      createdAt: p.createdAt,
      occupation: p.parent_profiless?.occupation || 'N/A',
      educationLevel: p.parent_profiless?.educationLevel || 'N/A',
    }));

    const studentParentLinks = studentParentsRaw.map((sp: any) => {
      const studentUser = sp.studentProfileIstudent_profile?.userIdusers;
      const parentUser = sp.parentProfileIdparent_profiles?.userIdusers;
      return {
        id: `${sp.studentProfileId}-${sp.parentProfileId}`,
        studentId: sp.studentProfileId,
        studentName: studentUser ? `${studentUser.firstName || ''} ${studentUser.lastName || ''}`.trim() : 'N/A',
        studentEmail: studentUser?.email || 'N/A',
        parentId: sp.parentProfileId,
        parentName: parentUser ? `${parentUser.firstName || ''} ${parentUser.lastName || ''}`.trim() : 'N/A',
        parentEmail: parentUser?.email || 'N/A',
        relationshipType: sp.relationshipType,
        isPrimaryGuardian: sp.isPrimaryGuardian,
      };
    });

    return {
      tenant: {
        id: tenant.id,
        code: tenant.code,
        slug: tenant.slug,
        name: tenant.name,
        displayName: tenant.displayName,
        email: tenant.email,
        phone: tenant.phone,
        website: tenant.website,
        status: tenant.status,
        timezone: tenant.timezone,
        currency: tenant.currency,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      },
      primaryAdmin: tenant.userss?.[0] ?? null,
      admins: tenant.userss ?? [],
      metrics: {
        totalUsers: tenant._count?.userss ?? 0,
        totalStudents: students.length,
        totalTutors: tutors.length,
        totalParents: parents.length,
        studentParentLinksCount: studentParentLinks.length,
        branchesCount: tenant._count?.branchess ?? 0,
        coursesCount: tenant._count?.coursess ?? 0,
        batchesCount: tenant._count?.batchess ?? 0,
      },
      students,
      tutors,
      parents,
      studentParentLinks,
      branches: branchesRaw,
      featureFlags,
    };
  }

  async createTenant(dto: CreateTenantDto, triggeredById: string) {
    let code = (dto.code || 'INST').trim().toUpperCase();
    let slug = code.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const email = dto.email.trim().toLowerCase();
    const adminEmail = dto.adminEmail.trim().toLowerCase();

    // 1. Ensure Institute Code & Slug are 100% unique (Auto-resolve duplicates)
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      attempts++;
      const existing = await this.prisma.institutes.findFirst({
        where: { OR: [{ code }, { slug }] },
      });
      if (existing) {
        const randSuffix = Math.floor(1000 + Math.random() * 9000);
        code = `${dto.code.trim().toUpperCase()}-${randSuffix}`;
        slug = code.toLowerCase().replace(/[^a-z0-9-]/g, '');
      } else {
        isUnique = true;
      }
    }

    // Check duplicate email
    const existingEmail = await this.prisma.institutes.findFirst({
      where: { email },
    });
    if (existingEmail) {
      throw new ConflictException(
        `Institute Contact Email '${email}' is already registered. Please enter a different official email.`,
      );
    }

    // 2. Check duplicate admin email (across ALL system users)
    const existingAdminUser = await this.prisma.users.findFirst({
      where: { email: adminEmail },
    });

    if (existingAdminUser) {
      throw new ConflictException(
        `Admin Login Email '${adminEmail}' is already registered to a user account. Please use a unique Admin Email address.`,
      );
    }

    // Generate initial password in format Admin@<last4PhoneDigits>
    const phoneDigits = (dto.phone || '').replace(/\D/g, '');
    const last4Digits = phoneDigits.length >= 4 ? phoneDigits.slice(-4) : '1234';
    const initialPassword = `Admin@${last4Digits}`;
    const passwordHash = await this.passwordService.hashPassword(initialPassword);

    const initialFeatureList = dto.initialFeatures || DEFAULT_FEATURE_KEYS;

    // Transactional registration
    const result = await this.prisma.$transaction(
      async (tx) => {
      // Create Institute
      const institute = await tx.institutes.create({
        data: {
          code,
          slug,
          name: dto.name.trim(),
          displayName: dto.displayName.trim(),
          email,
          phone: dto.phone.trim(),
          website: dto.website?.trim() || '',
          logoFileId: '',
          status: 'ACTIVE',
          timezone: dto.timezone || 'Asia/Kolkata',
          currency: dto.currency || 'INR',
          createdBy: triggeredById,
          updatedBy: triggeredById,
        },
      });

      // Create Primary Admin User
      const adminUser = await tx.users.create({
        data: {
          tenantId: institute.id,
          branchId: '',
          email: adminEmail,
          firstName: dto.adminFirstName.trim(),
          lastName: dto.adminLastName.trim(),
          userType: ('TENANT_ADMIN' as any),
          status: 'ACTIVE',
          passwordHash,
          forcePasswordChange: true,
          createdBy: triggeredById,
          updatedBy: triggeredById,
        },
      });

      // Find or create TENANT_ADMIN role for this tenant
      const roleCode = `TENANT_ADMIN_${code}`;
      let tenantRole = await tx.roles.findFirst({
        where: {
          OR: [
            { tenantId: institute.id, code: 'TENANT_ADMIN' },
            { tenantId: institute.id, code: roleCode },
            { code: roleCode },
          ],
          deletedAt: null,
        },
      });

      if (!tenantRole) {
        tenantRole = await tx.roles.create({
          data: {
            tenantId: institute.id,
            code: roleCode,
            name: `${dto.name.trim()} Administrator`,
            roleType: 'SYSTEM',
            isDefault: true,
            isEditable: false,
            isDeletable: false,
            priority: 10,
            metadata: {},
            createdBy: triggeredById,
            updatedBy: triggeredById,
          },
        });
      }

      // Assign UserRole
      await tx.userRoles.create({
        data: {
          tenantId: institute.id,
          userId: adminUser.id,
          roleId: tenantRole.id,
          effectiveFrom: new Date(),
          effectiveTo: new Date('2099-12-31'),
          assignedBy: triggeredById,
          assignmentReason: 'Primary Tenant Administrator allocation upon institute registration',
          revokedBy: '',
          revokedReason: '',
          metadata: {},
          createdBy: triggeredById,
          updatedBy: triggeredById,
        },
      });

      // Seed Feature Flags
      const featureFlagCreates = DEFAULT_FEATURE_KEYS.map((key) => ({
        tenantId: institute.id,
        featureKey: key,
        enabled: initialFeatureList.includes(key),
        rolloutPercentage: 100,
        planRequired: 'ENTERPRISE',
        description: `Tenant feature flag for ${key}`,
        createdBy: triggeredById,
        updatedBy: triggeredById,
        metadata: {},
      }));

      for (const flag of featureFlagCreates) {
        await tx.featureFlags.create({ data: flag });
      }

      // Generate Set-Password / Invitation Token
      const rawInvitationToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(rawInvitationToken)
        .digest('hex');

      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hrs

      await tx.passwordResetTokens.create({
        data: {
          tenantId: institute.id,
          userId: adminUser.id,
          email: adminUser.email,
          hashedToken,
          expiresAt,
        },
      });

      // Audit Log (Safely wrapped so audit log errors never interrupt tenant creation)
      try {
        const validTriggeredUser = await tx.users.findFirst({
          where: { id: triggeredById },
          select: { id: true },
        });
        const actorId = validTriggeredUser?.id || adminUser.id;

        await tx.platformAuditLogs.create({
          data: {
            tenantId: institute.id,
            eventType: PlatformAuditEventEnum.TENANT_CREATED,
            description: `Tenant '${institute.name}' (${institute.code}) registered with primary admin ${adminUser.email}`,
            payload: {
              instituteId: institute.id,
              code: institute.code,
              adminEmail: adminUser.email,
              initialFeatures: initialFeatureList,
            },
            triggeredBy: actorId,
            createdBy: actorId,
            updatedBy: actorId,
          },
        });
      } catch {
        // Audit log failure shouldn't abort tenant registration
      }

      return { institute, adminUser, rawInvitationToken };
    }, { timeout: 15000 });

    // Send Welcome Credentials Email to Admin (Non-blocking background)
    const frontendAppUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const loginUrl = `${frontendAppUrl}/auth/login`;
    const adminFullName = `${result.adminUser.firstName} ${result.adminUser.lastName}`.trim();

    setImmediate(() => {
      this.mailService
        .sendWelcomeCredentials({
          to: result.adminUser.email,
          name: adminFullName,
          role: 'ADMIN',
          password: initialPassword,
          loginUrl,
        })
        .catch(() => {});
    });

    return {
      message: 'Tenant registered successfully. Welcome credentials email sent to primary tenant admin.',
      institute: {
        id: result.institute.id,
        code: result.institute.code,
        slug: result.institute.slug,
        name: result.institute.name,
        email: result.institute.email,
        phone: result.institute.phone,
        status: result.institute.status,
      },
      adminUser: {
        id: result.adminUser.id,
        email: result.adminUser.email,
        name: adminFullName,
        initialPassword,
      },
      rawInvitationToken: result.rawInvitationToken,
    };
  }

  async updateTenantStatus(
    id: string,
    dto: UpdateTenantStatusDto,
    triggeredById: string,
  ) {
    const tenant = await this.prisma.institutes.findFirst({
      where: { id, deletedAt: null },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${id}' was not found`);
    }

    if (tenant.status === dto.status) {
      return { message: `Tenant is already in state '${dto.status}'`, tenant };
    }

    let eventType: PlatformAuditEventEnum;
    if (dto.status === 'ACTIVE') {
      eventType = PlatformAuditEventEnum.TENANT_ACTIVATED;
    } else if (dto.status === 'SUSPENDED') {
      eventType = PlatformAuditEventEnum.TENANT_SUSPENDED;
    } else {
      eventType = PlatformAuditEventEnum.TENANT_DEACTIVATED;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.institutes.update({
        where: { id },
        data: {
          status: dto.status,
          updatedBy: triggeredById,
          updatedAt: new Date(),
        },
      });

      try {
        await tx.platformAuditLogs.create({
          data: {
            tenantId: id,
            eventType,
            description: `Tenant '${tenant.name}' status transitioned from ${tenant.status} to ${dto.status}. Reason: ${dto.reason || 'N/A'}`,
            payload: {
              previousStatus: tenant.status,
              newStatus: dto.status,
              reason: dto.reason || null,
            },
            triggeredBy: triggeredById,
            createdBy: triggeredById,
            updatedBy: triggeredById,
          },
        });
      } catch (logErr: any) {
        console.warn('Failed to write platform audit log on status change:', logErr?.message || logErr);
      }

      return res;
    });

    return {
      message: `Tenant status updated to '${dto.status}' successfully.`,
      tenant: updated,
    };
  }

  async deleteTenant(id: string, triggeredById: string) {
    const tenant = await this.prisma.institutes.findFirst({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${id}' was not found`);
    }

    const actorId =
      triggeredById &&
      triggeredById !== 'SYSTEM' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(triggeredById)
        ? triggeredById
        : '00000000-0000-0000-0000-000000000001';

    await this.prisma.$transaction(async (tx) => {
      // 1. Temporarily disable foreign key constraints for this PostgreSQL transaction session
      await tx.$executeRawUnsafe(`SET LOCAL session_replication_role = 'replica';`);

      // 2. Write Platform Audit Log before purging
      try {
        await tx.platformAuditLogs.create({
          data: {
            tenantId: id,
            eventType: PlatformAuditEventEnum.TENANT_DEACTIVATED,
            description: `Tenant '${tenant.name}' (${tenant.code}) was permanently deleted and purged from database by Platform Admin.`,
            payload: {
              tenantId: id,
              code: tenant.code,
              name: tenant.name,
              deletedAt: new Date(),
            },
            triggeredBy: actorId,
            createdBy: actorId,
            updatedBy: actorId,
          },
        });
      } catch (logErr: any) {
        console.warn('Failed to write platform audit log on tenant delete:', logErr?.message || logErr);
      }

      // 3. Dynamic hard-delete from all tables referencing this tenantId or instituteId (excluding Institutes)
      await tx.$executeRawUnsafe(`
        DO $$
        DECLARE
          r RECORD;
        BEGIN
          FOR r IN 
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND column_name IN ('tenantId', 'tenant_id', 'instituteId', 'institute_id')
              AND table_name NOT IN ('Institutes')
          LOOP
            EXECUTE format('DELETE FROM %I WHERE %I = %L', r.table_name, r.column_name, '${id}');
          END LOOP;
        END $$;
      `);

      // 4. Hard delete the institute record itself from Institutes
      await tx.$executeRawUnsafe(`DELETE FROM "Institutes" WHERE "id" = '${id}';`);

      // 5. Restore foreign key constraint checking
      await tx.$executeRawUnsafe(`SET LOCAL session_replication_role = 'origin';`);
    });

    return {
      message: `Tenant '${tenant.name}' (${tenant.code}) deleted and purged permanently from database.`,
    };
  }
}
