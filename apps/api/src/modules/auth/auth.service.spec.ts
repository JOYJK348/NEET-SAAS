/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import {
  ForbiddenException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const response = { cookie: jest.fn() } as any;
  const context = {
    ipAddress: '127.0.0.1',
    rawUserAgent: 'Mozilla/5.0 Chrome/120.0 Windows',
  };

  const user = {
    id: 'user-1',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    email: 'joy@example.com',
    firstName: 'Joy',
    lastName: 'JK',
    userType: 'STAFF',
    status: 'ACTIVE',
    isSuperAdmin: false,
    passwordHash: 'hash',
    forcePasswordChange: false,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    passwordChangedAt: null,
    createdAt: new Date(),
    createdBy: 'system',
    updatedAt: new Date(),
    updatedBy: 'system',
    deletedAt: new Date(),
    deletedBy: 'system',
    version: 1,
  };

  const activeRole = {
    id: 'user-role-1',
    tenantId: 'tenant-1',
    userId: user.id,
    roleId: 'role-1',
    effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
    effectiveTo: new Date('2027-01-01T00:00:00.000Z'),
    assignedBy: 'system',
    assignmentReason: 'seed',
    revokedBy: '',
    revokedReason: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system',
    deletedAt: new Date(),
    deletedBy: 'system',
    version: 1,
    metadata: {},
    roleIdroles: {
      id: 'role-1',
      tenantId: 'tenant-1',
      name: 'Tenant Admin',
      code: 'TENANT_ADMIN',
      roleType: 'SYSTEM',
      isDefault: false,
      isEditable: false,
      isDeletable: false,
      priority: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      updatedBy: 'system',
      deletedAt: new Date(),
      deletedBy: 'system',
      version: 1,
      metadata: {},
    },
  };

  let prismaService: any;
  let passwordService: any;
  let sessionService: any;
  let tokenService: any;
  let service: AuthService;

  beforeEach(() => {
    prismaService = {
      users: {
        findMany: jest.fn().mockResolvedValue([user]),
        update: jest.fn().mockResolvedValue(user),
      },
      userRoles: {
        findMany: jest.fn().mockResolvedValue([activeRole]),
      },
      $transaction: jest.fn((callback) => callback(prismaService)),
    };
    passwordService = {
      comparePassword: jest.fn().mockResolvedValue(true),
    };
    sessionService = {
      createLoginSession: jest.fn().mockResolvedValue({
        id: 'session-1',
        tenantId: 'tenant-1',
      }),
    };
    tokenService = {
      generateRefreshToken: jest.fn().mockReturnValue('refresh-token'),
      hashRefreshToken: jest.fn().mockReturnValue('refresh-token-hash'),
      getRefreshTokenExpiresAt: jest
        .fn()
        .mockReturnValue(new Date('2026-07-21T00:00:00.000Z')),
      generateAccessToken: jest.fn().mockResolvedValue('access-token'),
      setRefreshCookie: jest.fn(),
      getAccessTokenExpiresInSeconds: jest.fn().mockReturnValue(900),
    };

    service = new AuthService(
      prismaService,
      passwordService,
      sessionService,
      tokenService,
    );
    response.cookie.mockClear();
  });

  it('logs in successfully and sets refresh cookie', async () => {
    const result = await service.login(
      { email: user.email, password: 'Password@123' },
      context,
      response,
    );

    expect(result).toEqual({
      accessToken: 'access-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: 'tenant-1',
        roleCode: 'TENANT_ADMIN',
        forcePasswordChange: false,
      },
    });
    expect(prismaService.users.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: expect.objectContaining({
        failedAttempts: 0,
        lockedUntil: null,
        lastLoginAt: expect.any(Date),
      }),
    });
    expect(sessionService.createLoginSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        tenantId: 'tenant-1',
        refreshTokenHash: 'refresh-token-hash',
      }),
      prismaService,
    );
    expect(tokenService.setRefreshCookie).toHaveBeenCalledWith(
      response,
      'refresh-token',
    );
  });

  it('increments failed attempts on invalid password', async () => {
    passwordService.comparePassword.mockResolvedValue(false);

    await expect(
      service.login(
        { email: user.email, password: 'wrong' },
        context,
        response,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prismaService.users.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { failedAttempts: 1 },
    });
  });

  it('locks the account after 5 failed attempts', async () => {
    prismaService.users.findMany.mockResolvedValue([
      { ...user, failedAttempts: 4 },
    ]);
    passwordService.comparePassword.mockResolvedValue(false);

    await expect(
      service.login(
        { email: user.email, password: 'wrong' },
        context,
        response,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prismaService.users.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: {
        failedAttempts: 5,
        lockedUntil: expect.any(Date),
      },
    });
  });

  it('rejects inactive accounts', async () => {
    prismaService.users.findMany.mockResolvedValue([
      { ...user, status: 'INACTIVE' },
    ]);

    await expect(
      service.login(
        { email: user.email, password: 'Password@123' },
        context,
        response,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects locked accounts', async () => {
    const lockedUntil = new Date();
    lockedUntil.setMinutes(lockedUntil.getMinutes() + 30);
    prismaService.users.findMany.mockResolvedValue([{ ...user, lockedUntil }]);

    await expect(
      service.login(
        { email: user.email, password: 'Password@123' },
        context,
        response,
      ),
    ).rejects.toBeInstanceOf(HttpException);
  });
});
