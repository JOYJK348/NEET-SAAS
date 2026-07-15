/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */

import { generateKeyPairSync } from 'crypto';
import * as cookieParser from 'cookie-parser';

if (!process.env.JWT_PRIVATE_KEY_BASE64) {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  process.env.JWT_PRIVATE_KEY_BASE64 =
    Buffer.from(privateKey).toString('base64');
  process.env.JWT_PUBLIC_KEY_BASE64 = Buffer.from(publicKey).toString('base64');
}
process.env.NODE_ENV = 'test';

import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { RedisService } from '../../src/common/redis/redis.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { JwtAuthGuard } from '../../src/modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../src/modules/auth/guards/tenant.guard';
import { ForcePasswordChangeGuard } from '../../src/modules/auth/guards/force-password-change.guard';
import { RolesGuard } from '../../src/modules/auth/guards/roles.guard';
import { PermissionsGuard } from '../../src/modules/auth/guards/permissions.guard';
import { Roles } from '../../src/modules/auth/decorators/roles.decorator';
import { Permissions } from '../../src/modules/auth/decorators/permissions.decorator';
import { CurrentUser } from '../../src/modules/auth/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '../../src/modules/auth/auth.types';
import { sign } from 'jsonwebtoken';

@Controller('test-rbac')
class TestRbacController {
  @Get('any-authenticated')
  @UseGuards(JwtAuthGuard, TenantGuard, ForcePasswordChangeGuard)
  anyAuth(@CurrentUser() _user: AuthenticatedRequestUser) {
    return { ok: true, role: _user.roleCode };
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, TenantGuard, ForcePasswordChangeGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  adminOnly() {
    return { ok: true };
  }

  @Get('tenant-admin-only')
  @UseGuards(JwtAuthGuard, TenantGuard, ForcePasswordChangeGuard, RolesGuard)
  @Roles('TENANT_ADMIN')
  tenantAdminOnly() {
    return { ok: true };
  }

  @Get('student-only')
  @UseGuards(JwtAuthGuard, TenantGuard, ForcePasswordChangeGuard, RolesGuard)
  @Roles('STUDENT')
  studentOnly() {
    return { ok: true };
  }

  @Get('perm-users-read')
  @UseGuards(
    JwtAuthGuard,
    TenantGuard,
    ForcePasswordChangeGuard,
    PermissionsGuard,
  )
  @Permissions('users.read')
  permUsersRead() {
    return { ok: true };
  }

  @Get('perm-platform-settings')
  @UseGuards(
    JwtAuthGuard,
    TenantGuard,
    ForcePasswordChangeGuard,
    PermissionsGuard,
  )
  @Permissions('platform.settings')
  permPlatformSettings() {
    return { ok: true };
  }

  @Get('perm-nonexistent')
  @UseGuards(
    JwtAuthGuard,
    TenantGuard,
    ForcePasswordChangeGuard,
    PermissionsGuard,
  )
  @Permissions('nonexistent.capability')
  permNonexistent() {
    return { ok: true };
  }

  @Get('force-password-guard')
  @UseGuards(JwtAuthGuard, TenantGuard, ForcePasswordChangeGuard)
  forcePasswordGuard() {
    return { ok: true };
  }
}

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_PLATFORM_ADMIN_USER_ID = '00000000-0000-0000-0000-000000000003';
const DEMO_TENANT_ADMIN_USER_ID = '00000000-0000-0000-0000-000000000004';
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
const CROSS_TENANT_ID = '00000000-0000-0000-0000-000000000099';
const PLATFORM_ADMIN_EMAIL = 'admin@neetplatform.com';
const TENANT_ADMIN_EMAIL = 'tenant@demo.com';
const DEFAULT_PASSWORD = 'Admin@123';
const API_PREFIX = '/api/v1';
const REFRESH_COOKIE_NAME = 'refresh_token';

let app: INestApplication;
let prisma: PrismaService;
let httpServer: unknown;

function unwrap(res: request.Response): any {
  const b = res.body;
  return b?.data ?? b;
}

function extractSetCookie(res: request.Response): Map<string, string> {
  const cookies = new Map<string, string>();
  const setCookie = res.headers['set-cookie'] as string | string[] | undefined;
  if (!setCookie) return cookies;
  const arr: string[] = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const entry of arr) {
    const [nameValue] = entry.split(';');
    const eqIdx = nameValue.indexOf('=');
    if (eqIdx > 0) {
      cookies.set(nameValue.slice(0, eqIdx), nameValue.slice(eqIdx + 1));
    }
  }
  return cookies;
}

function parseCookieAttributes(
  setCookieHeader: string,
): Record<string, string> {
  const attrs: Record<string, string> = {};
  const parts = setCookieHeader.split(';').map((s) => s.trim());
  for (let i = 1; i < parts.length; i++) {
    const eqIdx = parts[i].indexOf('=');
    if (eqIdx > 0) {
      attrs[parts[i].slice(0, eqIdx).toLowerCase()] = parts[i].slice(eqIdx + 1);
    } else {
      attrs[parts[i].toLowerCase()] = 'true';
    }
  }
  return attrs;
}

async function cleanupTestData(): Promise<void> {
  await prisma.userSessions.deleteMany({});
  await prisma.users.updateMany({
    data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: null },
  });
  await prisma.userRoles.deleteMany({
    where: {
      userId: {
        notIn: [DEMO_PLATFORM_ADMIN_USER_ID, DEMO_TENANT_ADMIN_USER_ID],
      },
    },
  });
  await prisma.institutes.deleteMany({
    where: { id: { notIn: [DEMO_TENANT_ID] } },
  });
}

beforeAll(async () => {
  const mockRedis = {
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    ttl: jest.fn().mockResolvedValue(-1),
    keys: jest.fn().mockResolvedValue([]),
    client: { ping: jest.fn().mockResolvedValue('PONG') },
  };

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
    controllers: [TestRbacController],
  })
    .overrideProvider(RedisService)
    .useValue(mockRedis)
    .compile();

  app = moduleFixture.createNestApplication();
  app.use(cookieParser.default());
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();
  httpServer = app.getHttpServer();
  prisma = app.get(PrismaService);
});

afterAll(async () => {
  await cleanupTestData();
  await app.close();
});

beforeEach(async () => {
  await cleanupTestData();
});

function login(
  email: string,
  password: string,
  extra?: Record<string, unknown>,
) {
  return request(httpServer as any)
    .post(`${API_PREFIX}/auth/login`)
    .send({ email, password, ...extra });
}

function refresh(cookieValue: string) {
  return request(httpServer as any)
    .post(`${API_PREFIX}/auth/refresh`)
    .set('Cookie', `${REFRESH_COOKIE_NAME}=${cookieValue}`);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Auth Integration', () => {
  describe('POST /api/v1/auth/login — valid login', () => {
    it('should return 200 with access token and set refresh cookie', async () => {
      const res = await login(PLATFORM_ADMIN_EMAIL, DEFAULT_PASSWORD);
      const d = unwrap(res);

      expect(res.status).toBe(201);
      expect(d.accessToken).toBeDefined();
      expect(typeof d.accessToken).toBe('string');
      expect(d.tokenType).toBe('Bearer');
      expect(d.expiresIn).toBeGreaterThan(0);
      expect(d.user).toBeDefined();
      expect(d.user.email).toBe(PLATFORM_ADMIN_EMAIL);
      expect(d.user.roleCode).toBe('PLATFORM_ADMIN');
      expect(d.user.forcePasswordChange).toBe(false);

      const cookies = extractSetCookie(res);
      expect(cookies.has(REFRESH_COOKIE_NAME)).toBe(true);
      expect(d).not.toHaveProperty(REFRESH_COOKIE_NAME);
    });

    it('should create a session in the database', async () => {
      await login(PLATFORM_ADMIN_EMAIL, DEFAULT_PASSWORD);

      const sessions = await prisma.userSessions.findMany({
        where: { userId: DEMO_PLATFORM_ADMIN_USER_ID },
      });
      expect(sessions.length).toBe(1);
      expect(sessions[0].isRevoked).toBe(false);
      expect(sessions[0].status).toBe('ACTIVE');
      expect(sessions[0].refreshTokenHash).toBeDefined();
    });

    it('should update lastLoginAt and reset failedAttempts', async () => {
      const before = await prisma.users.findUnique({
        where: { id: DEMO_PLATFORM_ADMIN_USER_ID },
        select: { lastLoginAt: true, failedAttempts: true },
      });
      expect(before?.lastLoginAt).toBeNull();
      expect(before?.failedAttempts).toBe(0);

      await login(PLATFORM_ADMIN_EMAIL, DEFAULT_PASSWORD);

      const after = await prisma.users.findUnique({
        where: { id: DEMO_PLATFORM_ADMIN_USER_ID },
        select: { lastLoginAt: true, failedAttempts: true },
      });
      expect(after?.lastLoginAt).toBeInstanceOf(Date);
      expect(after?.failedAttempts).toBe(0);
    });

    it('should refresh token NEVER be returned in JSON body', async () => {
      const res = await login(PLATFORM_ADMIN_EMAIL, DEFAULT_PASSWORD);
      const d = unwrap(res);
      expect(d).not.toHaveProperty('refreshToken');
      expect(d).not.toHaveProperty(REFRESH_COOKIE_NAME);
    });
  });

  describe('POST /api/v1/auth/login — invalid credentials', () => {
    it('should return 401 for wrong password', async () => {
      const res = await login(PLATFORM_ADMIN_EMAIL, 'wrongpassword');
      expect(res.status).toBe(401);
      expect(unwrap(res).accessToken).toBeUndefined();
      const cookies = extractSetCookie(res);
      expect(cookies.has(REFRESH_COOKIE_NAME)).toBe(false);
    });

    it('should increment failedAttempts on wrong password', async () => {
      await login(PLATFORM_ADMIN_EMAIL, 'wrong1');

      const user = await prisma.users.findUnique({
        where: { id: DEMO_PLATFORM_ADMIN_USER_ID },
        select: { failedAttempts: true },
      });
      expect(user!.failedAttempts).toBeGreaterThan(0);
    });

    it('should return 401 for non-existent email', async () => {
      const res = await login('nobody@example.com', DEFAULT_PASSWORD);
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/login — account lock', () => {
    it('should lock account after 5 failed attempts and reject correct password', async () => {
      for (let i = 0; i < 5; i++) {
        await login(TENANT_ADMIN_EMAIL, 'wrong');
      }

      const user = await prisma.users.findUnique({
        where: { id: DEMO_TENANT_ADMIN_USER_ID },
        select: { failedAttempts: true, lockedUntil: true },
      });
      expect(user!.failedAttempts).toBeGreaterThanOrEqual(5);
      expect(user!.lockedUntil).toBeInstanceOf(Date);
      expect(user!.lockedUntil!.getTime()).toBeGreaterThan(Date.now());

      const res = await login(TENANT_ADMIN_EMAIL, DEFAULT_PASSWORD);
      expect(res.status).toBe(423);
    });

    it('should allow login after lock expires', async () => {
      for (let i = 0; i < 5; i++) {
        await login(TENANT_ADMIN_EMAIL, 'wrong');
      }

      await prisma.users.update({
        where: { id: DEMO_TENANT_ADMIN_USER_ID },
        data: { lockedUntil: new Date(Date.now() - 60000), failedAttempts: 0 },
      });

      const res = await login(TENANT_ADMIN_EMAIL, DEFAULT_PASSWORD);
      expect(res.status).toBe(201);
      expect(unwrap(res).accessToken).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/refresh — valid refresh', () => {
    it('should return 200 with new access token and rotate refresh token', async () => {
      const loginRes = await login(TENANT_ADMIN_EMAIL, DEFAULT_PASSWORD);
      const loginData = unwrap(loginRes);

      const cookies = extractSetCookie(loginRes);
      const refreshToken = cookies.get(REFRESH_COOKIE_NAME)!;
      expect(refreshToken).toBeDefined();

      const sessionsBefore = await prisma.userSessions.findMany({
        where: { userId: DEMO_TENANT_ADMIN_USER_ID, isRevoked: false },
        select: { id: true, refreshTokenHash: true },
      });
      const oldHash = sessionsBefore[0].refreshTokenHash;

      const refreshRes = await refresh(refreshToken);
      expect(refreshRes.status).toBe(201);
      const refreshData = unwrap(refreshRes);

      expect(refreshData.accessToken).toBeDefined();
      expect(refreshData.accessToken).not.toBe(loginData.accessToken);
      expect(refreshData.expiresIn).toBeGreaterThan(0);

      const sessionsAfter = await prisma.userSessions.findMany({
        where: { userId: DEMO_TENANT_ADMIN_USER_ID, isRevoked: false },
        select: { id: true, refreshTokenHash: true },
      });
      expect(sessionsAfter[0].refreshTokenHash).not.toBe(oldHash);

      const refreshCookies = extractSetCookie(refreshRes);
      expect(refreshCookies.has(REFRESH_COOKIE_NAME)).toBe(true);
      expect(refreshData).not.toHaveProperty('refreshToken');
      expect(refreshData).not.toHaveProperty(REFRESH_COOKIE_NAME);
    });

    it('should invalidate old refresh token after rotation', async () => {
      const loginRes = await login(TENANT_ADMIN_EMAIL, DEFAULT_PASSWORD);
      const oldRefreshToken =
        extractSetCookie(loginRes).get(REFRESH_COOKIE_NAME)!;

      await refresh(oldRefreshToken);
      const secondRes = await refresh(oldRefreshToken);
      expect(secondRes.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/refresh — invalid / missing', () => {
    it('should return 401 when cookie is missing', async () => {
      const res = await request(httpServer as any).post(
        `${API_PREFIX}/auth/refresh`,
      );
      expect(res.status).toBe(401);
    });

    it('should return 401 for tampered refresh token', async () => {
      const res = await refresh('tamperedtoken');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should revoke session and clear cookie', async () => {
      const loginRes = await login(TENANT_ADMIN_EMAIL, DEFAULT_PASSWORD);
      const accessToken = unwrap(loginRes).accessToken as string;
      const refreshToken = extractSetCookie(loginRes).get(REFRESH_COOKIE_NAME)!;

      const logoutRes = await request(httpServer as any)
        .post(`${API_PREFIX}/auth/logout`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(logoutRes.status).toBe(201);
      expect(unwrap(logoutRes).success).toBe(true);

      const sessions = await prisma.userSessions.findMany({
        where: { userId: DEMO_TENANT_ADMIN_USER_ID },
      });
      expect(sessions.some((s) => s.isRevoked === true)).toBe(true);

      const refreshRes = await refresh(refreshToken);
      expect(refreshRes.status).toBe(401);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(httpServer as any).post(
        `${API_PREFIX}/auth/logout`,
      );
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout-all', () => {
    it('should revoke all sessions for the user', async () => {
      const loginRes1 = await login(TENANT_ADMIN_EMAIL, DEFAULT_PASSWORD);
      const token1 = unwrap(loginRes1).accessToken as string;
      const refresh1 = extractSetCookie(loginRes1).get(REFRESH_COOKIE_NAME)!;

      const loginRes2 = await login(TENANT_ADMIN_EMAIL, DEFAULT_PASSWORD);
      const refresh2 = extractSetCookie(loginRes2).get(REFRESH_COOKIE_NAME)!;

      const logoutRes = await request(httpServer as any)
        .post(`${API_PREFIX}/auth/logout-all`)
        .set('Authorization', `Bearer ${token1}`);

      expect(logoutRes.status).toBe(201);
      expect(unwrap(logoutRes).success).toBe(true);

      const activeSessions = await prisma.userSessions.findMany({
        where: {
          userId: DEMO_TENANT_ADMIN_USER_ID,
          isRevoked: false,
          status: 'ACTIVE',
        },
      });
      expect(activeSessions.length).toBe(0);

      expect((await refresh(refresh1)).status).toBe(401);
      expect((await refresh(refresh2)).status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/sessions', () => {
    it('should return active sessions with metadata', async () => {
      const loginRes = await login(TENANT_ADMIN_EMAIL, DEFAULT_PASSWORD);
      const accessToken = unwrap(loginRes).accessToken as string;

      const res = await request(httpServer as any)
        .get(`${API_PREFIX}/auth/sessions`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      const sessions = unwrap(res) as any[];
      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions.length).toBeGreaterThanOrEqual(1);

      const session = sessions[0];
      expect(session.sessionId).toBeDefined();
      expect(session.deviceName).toBeDefined();
      expect(session.ipAddress).toBeDefined();
      expect(session.lastActiveAt).toBeDefined();
      expect(session.expiresAt).toBeDefined();
      expect(session).not.toHaveProperty('refreshTokenHash');
    });

    it('should mark the current session correctly', async () => {
      const loginRes = await login(TENANT_ADMIN_EMAIL, DEFAULT_PASSWORD);
      const tokenA = unwrap(loginRes).accessToken as string;

      await login(TENANT_ADMIN_EMAIL, DEFAULT_PASSWORD);

      const res = await request(httpServer as any)
        .get(`${API_PREFIX}/auth/sessions`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const sessions = unwrap(res) as any[];
      const current = sessions.find((s: any) => s.isCurrentSession === true);
      expect(current).toBeDefined();
    });
  });

  describe('JWT Authentication guards', () => {
    it('should return 401 without JWT', async () => {
      const res = await request(httpServer as any).get(
        `${API_PREFIX}/auth/sessions`,
      );
      expect(res.status).toBe(401);
    });

    it('should return 401 with malformed JWT', async () => {
      const res = await request(httpServer as any)
        .get(`${API_PREFIX}/auth/sessions`)
        .set('Authorization', 'Bearer this.is.not.a.jwt');
      expect(res.status).toBe(401);
    });

    it('should return 401 with an expired JWT', async () => {
      const pem = Buffer.from(
        process.env.JWT_PRIVATE_KEY_BASE64!,
        'base64',
      ).toString('utf8');
      const expired = sign(
        {
          sub: DEMO_PLATFORM_ADMIN_USER_ID,
          sessionId: 'fake',
          roleCode: 'PLATFORM_ADMIN',
          tenantId: null,
          forcePasswordChange: false,
          exp: Math.floor(Date.now() / 1000) - 3600,
        },
        pem,
        { algorithm: 'RS256' },
      );
      const res = await request(httpServer as any)
        .get(`${API_PREFIX}/auth/sessions`)
        .set('Authorization', `Bearer ${expired}`);
      expect(res.status).toBe(401);
    });

    it('should return 200 with valid JWT', async () => {
      const loginRes = await login(TENANT_ADMIN_EMAIL, DEFAULT_PASSWORD);
      const token = unwrap(loginRes).accessToken as string;

      const res = await request(httpServer as any)
        .get(`${API_PREFIX}/auth/sessions`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe('RBAC — RolesGuard', () => {
    it('should allow platform admin on admin-only endpoint', async () => {
      const loginRes = await login(PLATFORM_ADMIN_EMAIL, DEFAULT_PASSWORD);
      const token = unwrap(loginRes).accessToken as string;

      const res = await request(httpServer as any)
        .get(`${API_PREFIX}/test-rbac/admin-only`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('should allow tenant admin on tenant-admin-only endpoint', async () => {
      const loginRes = await login(TENANT_ADMIN_EMAIL, DEFAULT_PASSWORD);
      const token = unwrap(loginRes).accessToken as string;

      const res = await request(httpServer as any)
        .get(`${API_PREFIX}/test-rbac/tenant-admin-only`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('should deny student access to admin endpoint', async () => {
      const pem = Buffer.from(
        process.env.JWT_PRIVATE_KEY_BASE64!,
        'base64',
      ).toString('utf8');
      const token = sign(
        {
          sub: DEMO_TENANT_ADMIN_USER_ID,
          sessionId: 's',
          tenantId: DEMO_TENANT_ID,
          roleCode: 'STUDENT',
          forcePasswordChange: false,
        },
        pem,
        { algorithm: 'RS256', expiresIn: '1h' },
      );
      const res = await request(httpServer as any)
        .get(`${API_PREFIX}/test-rbac/admin-only`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Permissions — PermissionsGuard', () => {
    it('should allow access when user has the required permission', async () => {
      const pem = Buffer.from(
        process.env.JWT_PRIVATE_KEY_BASE64!,
        'base64',
      ).toString('utf8');
      const token = sign(
        {
          sub: DEMO_TENANT_ADMIN_USER_ID,
          sessionId: 'p1',
          tenantId: DEMO_TENANT_ID,
          roleCode: 'TENANT_ADMIN',
          forcePasswordChange: false,
        },
        pem,
        { algorithm: 'RS256', expiresIn: '1h' },
      );
      const res = await request(httpServer as any)
        .get(`${API_PREFIX}/test-rbac/perm-users-read`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('should deny access when user lacks required permission', async () => {
      const pem = Buffer.from(
        process.env.JWT_PRIVATE_KEY_BASE64!,
        'base64',
      ).toString('utf8');
      const token = sign(
        {
          sub: DEMO_TENANT_ADMIN_USER_ID,
          sessionId: 'p2',
          tenantId: DEMO_TENANT_ID,
          roleCode: 'TENANT_ADMIN',
          forcePasswordChange: false,
        },
        pem,
        { algorithm: 'RS256', expiresIn: '1h' },
      );
      const res = await request(httpServer as any)
        .get(`${API_PREFIX}/test-rbac/perm-nonexistent`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Tenant Isolation', () => {
    it('should deny cross-tenant access via x-tenant-id header', async () => {
      await prisma.institutes.upsert({
        where: { id: CROSS_TENANT_ID },
        update: {},
        create: {
          id: CROSS_TENANT_ID,
          code: 'CROSS',
          slug: 'cross-tenant',
          name: 'Cross Tenant',
          displayName: 'Cross Tenant',
          email: 'cross@tenant.com',
          phone: '',
          website: '',
          logoFileId: '',
          status: 'ACTIVE',
          timezone: 'UTC',
          currency: 'USD',
          createdBy: SYSTEM_USER_ID,
          updatedBy: SYSTEM_USER_ID,
          deletedAt: new Date('2099-12-31'),
          deletedBy: SYSTEM_USER_ID,
        },
      });

      const loginRes = await login(TENANT_ADMIN_EMAIL, DEFAULT_PASSWORD);
      const token = unwrap(loginRes).accessToken as string;

      const res = await request(httpServer as any)
        .get(`${API_PREFIX}/auth/sessions`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-tenant-id', CROSS_TENANT_ID);
      expect(res.status).toBe(403);
    });

    it('should allow platform admin regardless of tenant header', async () => {
      const loginRes = await login(PLATFORM_ADMIN_EMAIL, DEFAULT_PASSWORD);
      const token = unwrap(loginRes).accessToken as string;

      const res = await request(httpServer as any)
        .get(`${API_PREFIX}/auth/sessions`)
        .set('Authorization', `Bearer ${token}`)
        .set('x-tenant-id', CROSS_TENANT_ID);
      expect(res.status).toBe(200);
    });
  });

  describe('Force Password Change', () => {
    it('should allow login when forcePasswordChange is true', async () => {
      await prisma.users.update({
        where: { id: DEMO_TENANT_ADMIN_USER_ID },
        data: { forcePasswordChange: true },
      });

      const res = await login(TENANT_ADMIN_EMAIL, DEFAULT_PASSWORD);
      expect(res.status).toBe(201);
      expect(unwrap(res).user.forcePasswordChange).toBe(true);

      await prisma.users.update({
        where: { id: DEMO_TENANT_ADMIN_USER_ID },
        data: { forcePasswordChange: false },
      });
    });

    it('should reject protected endpoints when forcePasswordChange is true', async () => {
      await prisma.users.update({
        where: { id: DEMO_PLATFORM_ADMIN_USER_ID },
        data: { forcePasswordChange: true },
      });

      const loginRes = await login(PLATFORM_ADMIN_EMAIL, DEFAULT_PASSWORD);
      const token = unwrap(loginRes).accessToken as string;

      const res = await request(httpServer as any)
        .get(`${API_PREFIX}/auth/sessions`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);

      await prisma.users.update({
        where: { id: DEMO_PLATFORM_ADMIN_USER_ID },
        data: { forcePasswordChange: false },
      });
    });
  });

  describe('Cookie Validation', () => {
    it('should set HttpOnly flag on refresh cookie', async () => {
      const res = await login(PLATFORM_ADMIN_EMAIL, DEFAULT_PASSWORD);
      const setCookie = res.headers['set-cookie'];
      const entries = Array.isArray(setCookie) ? setCookie : [setCookie];
      const entry = entries.find((c: string) =>
        c.startsWith(`${REFRESH_COOKIE_NAME}=`),
      );
      expect(entry).toBeDefined();
      expect(entry!.toLowerCase()).toContain('httponly');
    });

    it('should set Path=/api/v1/auth/refresh', async () => {
      const res = await login(PLATFORM_ADMIN_EMAIL, DEFAULT_PASSWORD);
      const setCookie = res.headers['set-cookie'];
      const entries = Array.isArray(setCookie) ? setCookie : [setCookie];
      const entry = entries.find((c: string) =>
        c.startsWith(`${REFRESH_COOKIE_NAME}=`),
      );
      const attrs = parseCookieAttributes(entry);
      expect(attrs.path).toBe('/api/v1/auth/refresh');
    });

    it('should set Expires on refresh cookie', async () => {
      const res = await login(PLATFORM_ADMIN_EMAIL, DEFAULT_PASSWORD);
      const setCookie = res.headers['set-cookie'];
      const entries = Array.isArray(setCookie) ? setCookie : [setCookie];
      const entry = entries.find((c: string) =>
        c.startsWith(`${REFRESH_COOKIE_NAME}=`),
      );
      expect(entry!.toLowerCase()).toContain('expires=');
    });

    it('should refresh token NEVER appear in JSON body', async () => {
      const res = await login(PLATFORM_ADMIN_EMAIL, DEFAULT_PASSWORD);
      const bodyStr = JSON.stringify(unwrap(res));
      expect(bodyStr).not.toContain(REFRESH_COOKIE_NAME);
    });
  });

  describe('Database State Assertions', () => {
    it('should have UserSessions row after login', async () => {
      await login(TENANT_ADMIN_EMAIL, DEFAULT_PASSWORD);
      const count = await prisma.userSessions.count({
        where: { userId: DEMO_TENANT_ADMIN_USER_ID },
      });
      expect(count).toBe(1);
    });

    it('should rotate refreshTokenHash in DB after refresh', async () => {
      const loginRes = await login(TENANT_ADMIN_EMAIL, DEFAULT_PASSWORD);
      const rt = extractSetCookie(loginRes).get(REFRESH_COOKIE_NAME)!;

      const before = await prisma.userSessions.findFirst({
        where: { userId: DEMO_TENANT_ADMIN_USER_ID, isRevoked: false },
        select: { refreshTokenHash: true },
      });

      await refresh(rt);

      const after = await prisma.userSessions.findFirst({
        where: { userId: DEMO_TENANT_ADMIN_USER_ID, isRevoked: false },
        select: { refreshTokenHash: true },
      });
      expect(after!.refreshTokenHash).not.toBe(before!.refreshTokenHash);
    });

    it('should revoke session in DB after logout', async () => {
      const loginRes = await login(TENANT_ADMIN_EMAIL, DEFAULT_PASSWORD);
      const token = unwrap(loginRes).accessToken as string;

      await request(httpServer as any)
        .post(`${API_PREFIX}/auth/logout`)
        .set('Authorization', `Bearer ${token}`);

      const sessions = await prisma.userSessions.findMany({
        where: { userId: DEMO_TENANT_ADMIN_USER_ID },
      });
      expect(sessions.every((s) => s.isRevoked === true)).toBe(true);
    });

    it('should revoke all sessions in DB after logout-all', async () => {
      await login(TENANT_ADMIN_EMAIL, DEFAULT_PASSWORD);
      await login(TENANT_ADMIN_EMAIL, DEFAULT_PASSWORD);

      const loginRes = await login(TENANT_ADMIN_EMAIL, DEFAULT_PASSWORD);
      const token = unwrap(loginRes).accessToken as string;

      await request(httpServer as any)
        .post(`${API_PREFIX}/auth/logout-all`)
        .set('Authorization', `Bearer ${token}`);

      const active = await prisma.userSessions.findMany({
        where: {
          userId: DEMO_TENANT_ADMIN_USER_ID,
          isRevoked: false,
          status: 'ACTIVE',
        },
      });
      expect(active.length).toBe(0);
    });
  });

  describe('Negative Scenarios', () => {
    it('should reject malformed JWT', async () => {
      const res = await request(httpServer as any)
        .get(`${API_PREFIX}/auth/sessions`)
        .set('Authorization', 'Bearer not-a-valid-jwt');
      expect(res.status).toBe(401);
    });

    it('should accept JWT with non-existent user (stateless JWT)', async () => {
      const pem = Buffer.from(
        process.env.JWT_PRIVATE_KEY_BASE64!,
        'base64',
      ).toString('utf8');
      const token = sign(
        {
          sub: '00000000-0000-0000-0000-000000009999',
          sessionId: 'f',
          roleCode: 'PLATFORM_ADMIN',
          tenantId: null,
          forcePasswordChange: false,
        },
        pem,
        { algorithm: 'RS256', expiresIn: '1h' },
      );
      const res = await request(httpServer as any)
        .get(`${API_PREFIX}/auth/sessions`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('should reject JWT without tenant context for tenant-only endpoints', async () => {
      const pem = Buffer.from(
        process.env.JWT_PRIVATE_KEY_BASE64!,
        'base64',
      ).toString('utf8');
      const token = sign(
        {
          sub: DEMO_TENANT_ADMIN_USER_ID,
          sessionId: 'f',
          roleCode: 'TENANT_ADMIN',
          tenantId: null,
          forcePasswordChange: false,
        },
        pem,
        { algorithm: 'RS256', expiresIn: '1h' },
      );
      const res = await request(httpServer as any)
        .get(`${API_PREFIX}/auth/sessions`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('should reject login for inactive user', async () => {
      await prisma.users.update({
        where: { id: DEMO_PLATFORM_ADMIN_USER_ID },
        data: { status: 'INACTIVE' as any },
      });
      const res = await login(PLATFORM_ADMIN_EMAIL, DEFAULT_PASSWORD);
      expect(res.status).toBe(403);
      await prisma.users.update({
        where: { id: DEMO_PLATFORM_ADMIN_USER_ID },
        data: { status: 'ACTIVE' as any },
      });
    });

    it('should reject login with missing password', async () => {
      const res = await request(httpServer as any)
        .post(`${API_PREFIX}/auth/login`)
        .send({ email: PLATFORM_ADMIN_EMAIL });
      expect(res.status).toBe(400);
    });

    it('should reject login with invalid email', async () => {
      const res = await request(httpServer as any)
        .post(`${API_PREFIX}/auth/login`)
        .send({ email: 'not-an-email', password: DEFAULT_PASSWORD });
      expect(res.status).toBe(400);
    });
  });
});
