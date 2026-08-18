import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';
import { MailService } from '../mail/mail.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type {
  LoginRequestContext,
  LoginResponse,
  LoginTenantOption,
  RefreshResponse,
  AuthenticatedRequestUser,
  AuthSessionResponse,
  AuthSuccessResponse,
} from './auth.types';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;
const PLATFORM_ROLE_CODES = new Set(['PLATFORM_ADMIN', 'PLATFORM_OWNER']);

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
  ) {}

  async login(
    dto: LoginDto,
    context: LoginRequestContext,
    response: Response,
  ): Promise<LoginResponse> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.findLoginUser(email, dto.tenantId);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    this.assertUserCanLogin(user);

    const passwordMatches = await this.passwordService.comparePassword(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      await this.recordFailedLogin(user.id, user.failedAttempts);
      throw new UnauthorizedException('Invalid email or password');
    }

    const roleContext = await this.resolveRoleContext(user.id, dto.tenantId);

    if (roleContext.tenantSelectionRequired) {
      await this.resetLoginState(user.id);
      return roleContext;
    }

    const refreshToken = this.tokenService.generateRefreshToken();
    const refreshTokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const refreshTokenExpiresAt = this.tokenService.getRefreshTokenExpiresAt();

    const { session, accessToken } = await this.prismaService.$transaction(
      async (prisma) => {
        await prisma.users.update({
          where: { id: user.id },
          data: {
            failedAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        });

        const createdSession = await this.sessionService.createLoginSession(
          {
            userId: user.id,
            tenantId: roleContext.tenantId,
            refreshTokenHash,
            expiresAt: refreshTokenExpiresAt,
            ipAddress: context.ipAddress,
            rawUserAgent: context.rawUserAgent,
            deviceId: dto.deviceId,
            deviceName: dto.deviceName,
          },
          prisma,
        );

        const createdAccessToken = await this.tokenService.generateAccessToken({
          sub: user.id,
          sessionId: createdSession.id,
          tenantId: roleContext.tenantId,
          roleCode: roleContext.roleCode,
          forcePasswordChange: user.forcePasswordChange,
        });

        return { session: createdSession, accessToken: createdAccessToken };
      },
    );

    this.tokenService.setRefreshCookie(response, refreshToken);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.tokenService.getAccessTokenExpiresInSeconds(),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: session.tenantId,
        roleCode: roleContext.roleCode,
        forcePasswordChange: user.forcePasswordChange,
      },
    };
  }

  async refresh(
    refreshToken: string | undefined,
    response: Response,
  ): Promise<RefreshResponse> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token cookie is missing');
    }

    const refreshTokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const session =
      await this.sessionService.validateRefreshToken(refreshTokenHash);

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.isRevoked || session.status !== 'ACTIVE') {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const user = session.userIdusers;

    if (!user) {
      throw new UnauthorizedException('Session user was not found');
    }

    this.assertUserCanLogin(user);

    const roleContext = await this.resolveRoleContext(
      user.id,
      session.tenantId ?? undefined,
    );

    if (roleContext.tenantSelectionRequired) {
      throw new ForbiddenException('Tenant context is required');
    }

    const nextRefreshToken = this.tokenService.generateRefreshToken();
    const nextRefreshTokenHash =
      this.tokenService.hashRefreshToken(nextRefreshToken);
    const nextRefreshTokenExpiresAt =
      this.tokenService.getRefreshTokenExpiresAt();

    const accessToken = await this.prismaService.$transaction(
      async (prisma) => {
        const rotationResult = await this.sessionService.rotateRefreshToken(
          {
            sessionId: session.id,
            currentRefreshTokenHash: refreshTokenHash,
            refreshTokenHash: nextRefreshTokenHash,
            expiresAt: nextRefreshTokenExpiresAt,
          },
          prisma,
        );

        if (rotationResult.count !== 1) {
          throw new UnauthorizedException('Refresh token has already rotated');
        }

        return this.tokenService.generateAccessToken({
          sub: user.id,
          sessionId: session.id,
          tenantId: session.tenantId,
          roleCode: roleContext.roleCode,
          forcePasswordChange: user.forcePasswordChange,
        });
      },
    );

    this.tokenService.setRefreshCookie(response, nextRefreshToken);

    return {
      accessToken,
      expiresIn: this.tokenService.getAccessTokenExpiresInSeconds(),
    };
  }

  getRefreshCookieName(): string {
    return this.tokenService.getRefreshCookieName();
  }

  async logout(
    currentUser: AuthenticatedRequestUser,
    response: Response,
  ): Promise<AuthSuccessResponse> {
    await this.sessionService.revokeSession(currentUser.sessionId);
    this.tokenService.clearRefreshCookie(response);

    return { success: true };
  }

  async logoutAll(
    currentUser: AuthenticatedRequestUser,
    response: Response,
  ): Promise<AuthSuccessResponse> {
    await this.sessionService.revokeAllSessions(currentUser.sub);
    this.tokenService.clearRefreshCookie(response);

    return { success: true };
  }

  async sessions(
    currentUser: AuthenticatedRequestUser,
  ): Promise<AuthSessionResponse[]> {
    const sessions = await this.sessionService.getUserSessions(currentUser.sub);

    return sessions.map((session) => ({
      sessionId: session.id,
      deviceName: session.deviceName,
      browserName: session.browserName,
      ipAddress: session.ipAddress,
      lastActiveAt: session.lastActiveAt,
      expiresAt: session.expiresAt,
      isCurrentSession: session.id === currentUser.sessionId,
    }));
  }

  async me(currentUser: AuthenticatedRequestUser): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: string;
    tenantId: string | null;
    roleCode: string;
    forcePasswordChange: boolean;
    staffProfile: Record<string, unknown> | null;
  }> {
    const user = await this.prismaService.users.findFirst({
      where: {
        id: currentUser.sub,
        tenantId: currentUser.tenantId ?? undefined,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        tenantId: true,
        forcePasswordChange: true,
        staff_profiless: {
          where: { deletedAt: null },
          select: {
            userId: true,
            employeeCode: true,
            employmentType: true,
            employmentStatus: true,
            designationId: true,
            staff_subjectss: {
              where: { deletedAt: null },
              select: { subjectId: true },
            },
            staff_departmentss: {
              where: { deletedAt: null },
              select: { branchId: true, departmentId: true },
            },
            staff_batch_assignmentss: {
              where: { deletedAt: null, isActive: true },
              select: { batchId: true, subjectId: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Fetch the user's active roles
    const userRole = await this.prismaService.userRoles.findFirst({
      where: {
        userId: user.id,
        ...(currentUser.tenantId ? { tenantId: currentUser.tenantId } : {}),
        effectiveFrom: { lte: new Date() },
        effectiveTo: { gte: new Date() },
      },
      include: {
        roleIdroles: { select: { code: true } },
      },
      orderBy: { roleIdroles: { priority: 'desc' } },
    });

    const profile = user.staff_profiless?.[0]
      ? (user.staff_profiless[0] as {
          userId: string;
          employeeCode: string | null;
          employmentType: string | null;
          employmentStatus: string | null;
          staff_subjectss: { subjectId: string }[];
          staff_departmentss: { branchId: string }[];
          staff_batch_assignmentss: { batchId: string; subjectId: string }[];
        })
      : null;

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      tenantId: user.tenantId,
      roleCode: userRole?.roleIdroles?.code ?? currentUser.roleCode,
      forcePasswordChange: user.forcePasswordChange,
      staffProfile: profile
        ? {
            userId: profile.userId,
            employeeCode: profile.employeeCode,
            employmentType: profile.employmentType,
            employmentStatus: profile.employmentStatus,
            subjects: profile.staff_subjectss.map((s) => s.subjectId),
            branches: profile.staff_departmentss.map((d) => d.branchId),
            batchAssignments: profile.staff_batch_assignmentss,
          }
        : null,
    };
  }

  private async findLoginUser(email: string, tenantId?: string) {
    const users = await this.prismaService.users.findMany({
      where: {
        email,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        student_profiless: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return users[0] ?? null;
  }

  private assertUserCanLogin(user: {
    status: string;
    lockedUntil: Date | null;
    student_profiless?: { academicStatus: string } | null;
  }): void {
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Account is not active');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new HttpException('Account is locked', HttpStatus.LOCKED);
    }

    if (
      user.student_profiless &&
      user.student_profiless.academicStatus !== 'ACTIVE'
    ) {
      throw new ForbiddenException('Account is not active');
    }
  }

  private async recordFailedLogin(
    userId: string,
    currentFailedAttempts: number,
  ): Promise<void> {
    const failedAttempts = currentFailedAttempts + 1;
    const lockedUntil =
      failedAttempts >= MAX_FAILED_ATTEMPTS ? this.getLockedUntil() : undefined;

    await this.prismaService.users.update({
      where: { id: userId },
      data: {
        failedAttempts,
        ...(lockedUntil ? { lockedUntil } : {}),
      },
    });
  }

  private async resetLoginState(userId: string): Promise<void> {
    await this.prismaService.users.update({
      where: { id: userId },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  private getLockedUntil(): Date {
    const lockedUntil = new Date();
    lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCK_DURATION_MINUTES);
    return lockedUntil;
  }

  private async resolveRoleContext(userId: string, tenantId?: string) {
    const now = new Date();
    const userRoles = await this.prismaService.userRoles.findMany({
      where: {
        userId,
        ...(tenantId ? { tenantId } : {}),
        effectiveFrom: { lte: now },
        effectiveTo: { gte: now },
      },
      include: { roleIdroles: true },
      orderBy: [{ tenantId: 'asc' }, { roleIdroles: { priority: 'desc' } }],
    });

    const roleContexts = userRoles
      .filter((userRole) => userRole.roleIdroles)
      .map((userRole) => ({
        tenantId: userRole.tenantId,
        roleCode: userRole.roleIdroles?.code || '',
      }));

    const platformRole = roleContexts.find((role) =>
      PLATFORM_ROLE_CODES.has(role.roleCode),
    );

    if (platformRole) {
      return {
        tenantSelectionRequired: false as const,
        tenantId: null,
        roleCode: platformRole.roleCode,
      };
    }

    if (roleContexts.length === 0) {
      const user = await this.prismaService.users.findUnique({
        where: { id: userId },
      });

      if (user && user.userType && user.tenantId) {
        const targetRoleCode = user.userType.toUpperCase();
        let role = await this.prismaService.roles.findFirst({
          where: { code: targetRoleCode, deletedAt: null },
        });

        if (!role) {
          role = await this.prismaService.roles.create({
            data: {
              tenantId: user.tenantId,
              code: targetRoleCode,
              name: user.userType,
              roleType: 'SYSTEM',
              isDefault: true,
              isEditable: false,
              isDeletable: false,
              priority: 1,
              metadata: {},
              createdBy: 'system',
              updatedBy: 'system',
            },
          });
        }

        if (role) {
          await this.prismaService.userRoles
            .create({
              data: {
                tenantId: user.tenantId,
                userId: user.id,
                roleId: role.id,
                effectiveFrom: new Date(),
                effectiveTo: new Date('2099-12-31'),
                revokedBy: '',
                revokedReason: '',
                assignedBy: 'system',
                assignmentReason: 'Auto-healing role allocation on login',
                metadata: {},
                createdBy: 'system',
                updatedBy: 'system',
              },
            })
            .catch(() => {});

          return {
            tenantSelectionRequired: false as const,
            tenantId: user.tenantId,
            roleCode: targetRoleCode,
          };
        }
      }

      throw new ForbiddenException('No active role assigned');
    }

    const tenants = this.getTenantOptions(roleContexts);

    if (!tenantId && tenants.length > 1) {
      return {
        tenantSelectionRequired: true as const,
        tenants,
      };
    }

    return {
      tenantSelectionRequired: false as const,
      tenantId: tenants[0].tenantId,
      roleCode: tenants[0].roleCode,
    };
  }

  private getTenantOptions(
    roleContexts: Array<{ tenantId: string; roleCode: string }>,
  ): LoginTenantOption[] {
    const tenantOptions = new Map<string, LoginTenantOption>();

    for (const roleContext of roleContexts) {
      if (!tenantOptions.has(roleContext.tenantId)) {
        tenantOptions.set(roleContext.tenantId, roleContext);
      }
    }

    return [...tenantOptions.values()];
  }

  /**
   * Enterprise Forgot Password Workflow with Anti-Enumeration & SHA-256 Hashed Tokens
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const email = dto.email.trim().toLowerCase();
    const genericResponse = {
      message:
        'If the email is registered, you will receive a password reset link.',
    };

    try {
      const user = await this.prismaService.users.findFirst({
        where: { email, deletedAt: null },
        orderBy: { createdAt: 'asc' },
      });

      if (!user) {
        return genericResponse;
      }

      // Generate 32-byte crypto-random token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

      // Save token hash in PasswordResetTokens table
      await this.prismaService.passwordResetTokens.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          email: user.email,
          hashedToken,
          expiresAt,
        },
      });

      const frontendAppUrl =
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
      const resetLink = `${frontendAppUrl}/auth/reset-password?token=${rawToken}`;
      const fullName = `${user.firstName} ${user.lastName}`.trim() || 'User';

      // Send email asynchronously (non-blocking)
      setImmediate(() => {
        this.mailService
          .sendPasswordResetEmail(user.email, fullName, resetLink)
          .catch(() => {});
      });
    } catch {
      // Catch any unexpected DB error and still return generic anti-enumeration response
    }

    return genericResponse;
  }

  /**
   * Enterprise Reset Password Workflow with Session Invalidation & Token Usage
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = dto;

    if (!token || token.trim().length === 0) {
      throw new BadRequestException('Reset token is required');
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token.trim())
      .digest('hex');

    const resetRecord = await this.prismaService.passwordResetTokens.findFirst({
      where: {
        hashedToken,
        usedAt: null,
        expiresAt: { gte: new Date() },
      },
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid or expired password reset link');
    }

    const newPasswordHash = await this.passwordService.hashPassword(
      newPassword,
    );

    await this.prismaService.$transaction(async (tx) => {
      // 1. Update user password
      await tx.users.update({
        where: { id: resetRecord.userId },
        data: {
          passwordHash: newPasswordHash,
          passwordChangedAt: new Date(),
          forcePasswordChange: false,
          failedAttempts: 0,
          lockedUntil: null,
        },
      });

      // 2. Mark reset token as USED
      await tx.passwordResetTokens.update({
        where: { id: resetRecord.id },
        data: {
          usedAt: new Date(),
        },
      });
    });

    // 3. Invalidate ALL existing active user sessions for zero-trust security
    await this.sessionService.revokeAllSessions(resetRecord.userId);

    return {
      message:
        'Password reset successfully. Please sign in with your new password.',
    };
  }
}
