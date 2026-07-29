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

    const tokenRole = user.roleCode;
    if (tokenRole === 'TENANT_ADMIN' || tokenRole === 'SUPER_ADMIN') {
      return true;
    }

    const roles = await this.prismaService.userRoles.findMany({
      where: {
        userId: user.sub,
        ...(user.tenantId ? { tenantId: user.tenantId } : {}),
        deletedAt: null,
      },
      include: { roleIdroles: true },
    });

    const userRoleCodes = new Set<string>();
    if (tokenRole) {
      userRoleCodes.add(tokenRole);
    }

    roles.forEach((r) => {
      if (r.roleIdroles?.code) {
        userRoleCodes.add(r.roleIdroles.code);
      }
    });

    const hasRole = requiredRoles.some((reqRole) => {
      if (userRoleCodes.has(reqRole)) return true;
      if (
        reqRole === 'TUTOR' &&
        (userRoleCodes.has('TEACHER') ||
          userRoleCodes.has('FACULTY') ||
          userRoleCodes.has('INSTRUCTOR') ||
          userRoleCodes.has('STAFF') ||
          userRoleCodes.has('TENANT_ADMIN') ||
          userRoleCodes.has('SUPER_ADMIN'))
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
