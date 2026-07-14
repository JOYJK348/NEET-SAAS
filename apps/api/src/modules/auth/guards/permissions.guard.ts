import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import type { AuthenticatedRequest } from './auth-guard.types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication is required');
    }

    const rolePermissions = await this.prismaService.rolePermissions.findMany({
      where: {
        tenantId: user.tenantId ?? undefined,
        roleIdroles: {
          user_roless: {
            some: {
              userId: user.sub,
              ...(user.tenantId ? { tenantId: user.tenantId } : {}),
              effectiveFrom: { lte: new Date() },
              effectiveTo: { gte: new Date() },
            },
          },
        },
      },
      include: { permissionIdpermissions: true },
    });

    const userPermissions = new Set(
      rolePermissions
        .map(
          (rolePermission) =>
            rolePermission.permissionIdpermissions?.permissionKey,
        )
        .filter((permissionKey): permissionKey is string =>
          Boolean(permissionKey),
        ),
    );

    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.has(permission),
    );

    if (hasAllPermissions) {
      return true;
    }

    throw new ForbiddenException('Insufficient permission');
  }
}
