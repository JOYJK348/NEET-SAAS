/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ForbiddenException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ForcePasswordChangeGuard } from './force-password-change.guard';
import { PermissionsGuard } from './permissions.guard';
import { RolesGuard } from './roles.guard';
import { TenantGuard } from './tenant.guard';

describe('RBAC Guards', () => {
  const user = {
    sub: 'user-1',
    sessionId: 'session-1',
    tenantId: 'tenant-1',
    roleCode: 'TENANT_ADMIN',
    forcePasswordChange: false,
  };

  function createContext(request: Record<string, unknown>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  }

  function createReflector(metadata: Record<string, string[]>): Reflector {
    return {
      getAllAndOverride: jest.fn((key: string) => metadata[key]),
    } as unknown as Reflector;
  }

  it('allows valid role', async () => {
    const prismaService = {
      userRoles: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ roleIdroles: { code: 'TENANT_ADMIN' } }]),
      },
    };
    const guard = new RolesGuard(
      createReflector({ [ROLES_KEY]: ['TENANT_ADMIN'] }),
      prismaService as any,
    );

    await expect(guard.canActivate(createContext({ user }))).resolves.toBe(
      true,
    );
  });

  it('rejects invalid role', async () => {
    const prismaService = {
      userRoles: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ roleIdroles: { code: 'FACULTY' } }]),
      },
    };
    const guard = new RolesGuard(
      createReflector({ [ROLES_KEY]: ['TENANT_ADMIN'] }),
      prismaService as any,
    );

    await expect(
      guard.canActivate(createContext({ user })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects unauthorized role checks', async () => {
    const guard = new RolesGuard(
      createReflector({ [ROLES_KEY]: ['TENANT_ADMIN'] }),
      { userRoles: { findMany: jest.fn() } } as any,
    );

    await expect(guard.canActivate(createContext({}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('allows valid permission', async () => {
    const prismaService = {
      rolePermissions: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { permissionIdpermissions: { permissionKey: 'users.read' } },
            { permissionIdpermissions: { permissionKey: 'users.create' } },
          ]),
      },
    };
    const guard = new PermissionsGuard(
      createReflector({ [PERMISSIONS_KEY]: ['users.read'] }),
      prismaService as any,
    );

    await expect(guard.canActivate(createContext({ user }))).resolves.toBe(
      true,
    );
  });

  it('rejects invalid permission', async () => {
    const prismaService = {
      rolePermissions: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { permissionIdpermissions: { permissionKey: 'users.read' } },
          ]),
      },
    };
    const guard = new PermissionsGuard(
      createReflector({ [PERMISSIONS_KEY]: ['users.delete'] }),
      prismaService as any,
    );

    await expect(
      guard.canActivate(createContext({ user })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows platform admin without tenant context', async () => {
    const guard = new TenantGuard({
      userRoles: { findFirst: jest.fn() },
    } as any);

    await expect(
      guard.canActivate(
        createContext({
          user: { ...user, tenantId: null, roleCode: 'PLATFORM_ADMIN' },
          headers: {},
        }),
      ),
    ).resolves.toBe(true);
  });

  it('rejects tenant mismatch', async () => {
    const guard = new TenantGuard({
      userRoles: { findFirst: jest.fn() },
    } as any);

    await expect(
      guard.canActivate(
        createContext({
          user,
          headers: { 'x-tenant-id': 'tenant-2' },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows valid tenant membership', async () => {
    const prismaService = {
      userRoles: {
        findFirst: jest.fn().mockResolvedValue({ id: 'user-role-1' }),
      },
    };
    const guard = new TenantGuard(prismaService as any);

    await expect(
      guard.canActivate(
        createContext({
          user,
          headers: { 'x-tenant-id': 'tenant-1' },
        }),
      ),
    ).resolves.toBe(true);
  });

  it('restricts forced password change users', () => {
    const guard = new ForcePasswordChangeGuard();

    expect(() =>
      guard.canActivate(
        createContext({
          user: { ...user, forcePasswordChange: true },
          method: 'GET',
          path: '/api/v1/auth/sessions',
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows change-password when password change is forced', () => {
    const guard = new ForcePasswordChangeGuard();

    expect(
      guard.canActivate(
        createContext({
          user: { ...user, forcePasswordChange: true },
          method: 'POST',
          path: '/api/v1/auth/change-password',
        }),
      ),
    ).toBe(true);
  });
});
