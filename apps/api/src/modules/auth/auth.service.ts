import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';
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

  me(): never {
    throw new NotImplementedException('Me endpoint will be implemented later');
  }

  private async findLoginUser(email: string, tenantId?: string) {
    const users = await this.prismaService.users.findMany({
      where: {
        email,
        ...(tenantId ? { tenantId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    return users[0] ?? null;
  }

  private assertUserCanLogin(user: {
    status: string;
    lockedUntil: Date | null;
  }): void {
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Account is not active');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new HttpException('Account is locked', HttpStatus.LOCKED);
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
}
