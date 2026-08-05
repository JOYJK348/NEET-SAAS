import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedRequest } from './auth-guard.types';

const ADMIN_ROLES = new Set([
  'TENANT_ADMIN',
  'SUPER_ADMIN',
  'ADMIN',
  'ADMINISTRATOR',
  'OWNER',
  'ACADEMIC_ADMIN',
  'BRANCH_ADMIN',
  'INSTITUTE_ADMIN',
  'SYSTEM_ADMIN',
  'TENANT_ADMINISTRATOR',
]);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication is required');
    }

    const tokenRole = (user.roleCode || '').toUpperCase();
    if (
      ADMIN_ROLES.has(tokenRole) ||
      tokenRole.startsWith('TENANT_ADMIN') ||
      tokenRole.startsWith('SUPER_ADMIN') ||
      tokenRole.includes('ADMIN') ||
      tokenRole.includes('OWNER')
    ) {
      return true;
    }

    const [dbUser, roles] = await Promise.all([
      this.prismaService.users.findUnique({
        where: { id: user.sub },
        select: { userType: true },
      }),
      this.prismaService.userRoles.findMany({
        where: {
          userId: user.sub,
          ...(user.tenantId ? { tenantId: user.tenantId } : {}),
          deletedAt: null,
        },
        include: { roleIdroles: true },
      }),
    ]);

    const userRoleCodes = new Set<string>();
    if (tokenRole) {
      userRoleCodes.add(tokenRole);
    }
    if (dbUser?.userType) {
      userRoleCodes.add(dbUser.userType.toUpperCase());
    }

    roles.forEach((r) => {
      if (r.roleIdroles?.code) {
        userRoleCodes.add(r.roleIdroles.code.toUpperCase());
      }
    });

    // Any Admin role grants full access across endpoints
    const isAdmin = Array.from(userRoleCodes).some(
      (code) =>
        ADMIN_ROLES.has(code) ||
        code.startsWith('TENANT_ADMIN') ||
        code.startsWith('SUPER_ADMIN') ||
        code.includes('ADMIN') ||
        code.includes('OWNER'),
    );

    if (isAdmin) {
      return true;
    }

    const hasRole = requiredRoles.some((req) => {
      const reqRole = req.toUpperCase();
      if (userRoleCodes.has(reqRole)) return true;

      if (ADMIN_ROLES.has(reqRole) && isAdmin) {
        return true;
      }

      if (
        reqRole === 'TUTOR' &&
        (userRoleCodes.has('TEACHER') ||
          userRoleCodes.has('FACULTY') ||
          userRoleCodes.has('INSTRUCTOR') ||
          userRoleCodes.has('STAFF') ||
          isAdmin)
      ) {
        return true;
      }
      return false;
    });

    if (hasRole) {
      return true;
    }

    throw new ForbiddenException('Insufficient role');
  }
}
