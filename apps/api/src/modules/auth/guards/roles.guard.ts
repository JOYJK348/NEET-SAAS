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

    const roles = await this.prismaService.userRoles.findMany({
      where: {
        userId: user.sub,
        ...(user.tenantId ? { tenantId: user.tenantId } : {}),
        effectiveFrom: { lte: new Date() },
        effectiveTo: { gte: new Date() },
      },
      include: { roleIdroles: true },
    });

    const userRoleCodes = new Set(
      roles
        .map((role) => role.roleIdroles?.code)
        .filter((roleCode): roleCode is string => Boolean(roleCode)),
    );

    if (requiredRoles.some((role) => userRoleCodes.has(role))) {
      return true;
    }

    throw new ForbiddenException('Insufficient role');
  }
}
