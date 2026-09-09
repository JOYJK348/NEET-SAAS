import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { PasswordService } from '../auth/password.service';
import { InviteTenantAdminDto } from './dto/platform-dtos';
import { PlatformAuditEventEnum, UserTypeEnum } from '@prisma/client';

@Injectable()
export class PlatformTenantAdminsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly passwordService: PasswordService,
  ) {}

  async getTenantAdmins(query: {
    page?: number;
    limit?: number;
    tenantId?: string;
    search?: string;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {
      userType: ('TENANT_ADMIN' as any),
      deletedAt: null,
    };

    if (query.tenantId && query.tenantId !== 'ALL') {
      where.tenantId = query.tenantId;
    }

    if (query.search && query.search.trim().length > 0) {
      const search = query.search.trim();
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.users.count({ where }),
      this.prisma.users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: { select: { id: true, name: true, code: true, status: true } },
        },
      }),
    ]);

    return {
      items: items.map((user) => ({
        id: user.id,
        tenantId: user.tenantId,
        tenantName: user.tenant?.name ?? 'Unknown Institute',
        tenantCode: user.tenant?.code ?? 'N/A',
        tenantStatus: user.tenant?.status ?? 'INACTIVE',
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        status: user.status,
        forcePasswordChange: user.forcePasswordChange,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async inviteTenantAdmin(
    tenantId: string,
    dto: InviteTenantAdminDto,
    triggeredById: string,
  ) {
    const tenant = await this.prisma.institutes.findFirst({
      where: { id: tenantId, deletedAt: null },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${tenantId}' was not found`);
    }

    const adminEmail = dto.adminEmail.trim().toLowerCase();

    const existingUser = await this.prisma.users.findFirst({
      where: { email: adminEmail, deletedAt: null },
    });

    if (existingUser) {
      throw new ConflictException(
        `User with email '${adminEmail}' already exists in the system.`,
      );
    }

    const tempRandomPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = await this.passwordService.hashPassword(tempRandomPassword);

    const result = await this.prisma.$transaction(async (tx) => {
      const adminUser = await tx.users.create({
        data: {
          tenantId: tenant.id,
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

      const roleCode = `TENANT_ADMIN_${tenant.code || tenant.id.slice(0, 8)}`;
      let tenantRole = await tx.roles.findFirst({
        where: {
          OR: [
            { tenantId: tenant.id, code: 'TENANT_ADMIN' },
            { tenantId: tenant.id, code: roleCode },
            { code: roleCode },
          ],
          deletedAt: null,
        },
      });

      if (!tenantRole) {
        tenantRole = await tx.roles.create({
          data: {
            tenantId: tenant.id,
            code: roleCode,
            name: `${tenant.name} Administrator`,
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

      await tx.userRoles.create({
        data: {
          tenantId: tenant.id,
          userId: adminUser.id,
          roleId: tenantRole.id,
          effectiveFrom: new Date(),
          effectiveTo: new Date('2099-12-31'),
          assignedBy: triggeredById,
          assignmentReason: 'Tenant Administrator account added by platform admin',
          revokedBy: '',
          revokedReason: '',
          metadata: {},
          createdBy: triggeredById,
          updatedBy: triggeredById,
        },
      });

      const rawInvitationToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(rawInvitationToken)
        .digest('hex');

      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      await tx.passwordResetTokens.create({
        data: {
          tenantId: tenant.id,
          userId: adminUser.id,
          email: adminUser.email,
          hashedToken,
          expiresAt,
        },
      });

      await tx.platformAuditLogs.create({
        data: {
          tenantId: tenant.id,
          eventType: PlatformAuditEventEnum.TENANT_ADMIN_CREATED,
          description: `Tenant Admin account '${adminUser.email}' created for institute '${tenant.name}' (${tenant.code})`,
          payload: {
            tenantId: tenant.id,
            adminUserId: adminUser.id,
            adminEmail: adminUser.email,
          },
          triggeredBy: triggeredById,
          createdBy: triggeredById,
          updatedBy: triggeredById,
        },
      });

      return { adminUser, rawInvitationToken };
    });

    const frontendAppUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const setPasswordUrl = `${frontendAppUrl}/auth/reset-password?token=${result.rawInvitationToken}`;
    const adminFullName = `${result.adminUser.firstName} ${result.adminUser.lastName}`.trim();

    setImmediate(() => {
      this.mailService
        .sendPasswordResetEmail(result.adminUser.email, adminFullName, setPasswordUrl)
        .catch(() => {});
    });

    return {
      message: `Tenant Administrator invited successfully. Set-password email dispatched to ${result.adminUser.email}.`,
      admin: {
        id: result.adminUser.id,
        email: result.adminUser.email,
        name: adminFullName,
        tenantId: tenant.id,
      },
    };
  }
}
