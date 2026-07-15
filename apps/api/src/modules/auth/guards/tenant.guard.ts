import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  PLATFORM_ROLE_CODES,
  type AuthenticatedRequest,
} from './auth-guard.types';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication is required');
    }

    if (PLATFORM_ROLE_CODES.has(user.roleCode) && user.tenantId === null) {
      return true;
    }

    if (!user.tenantId) {
      throw new ForbiddenException('Tenant context is required');
    }

    const requestedTenantId = this.getRequestedTenantId(request);

    if (requestedTenantId && requestedTenantId !== user.tenantId) {
      throw new ForbiddenException('Tenant access denied');
    }

    const activeMembership = await this.prismaService.userRoles.findFirst({
      where: {
        userId: user.sub,
        tenantId: user.tenantId,
        effectiveFrom: { lte: new Date() },
        effectiveTo: { gte: new Date() },
      },
      select: { id: true },
    });

    if (!activeMembership) {
      throw new ForbiddenException('Tenant access denied');
    }

    return true;
  }

  private getRequestedTenantId(
    request: AuthenticatedRequest,
  ): string | undefined {
    const tenantIdHeader = request.headers['x-tenant-id'];

    if (Array.isArray(tenantIdHeader)) {
      return tenantIdHeader[0];
    }

    return tenantIdHeader;
  }
}
