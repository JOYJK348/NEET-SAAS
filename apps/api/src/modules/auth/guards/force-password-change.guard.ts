import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from './auth-guard.types';

@Injectable()
export class ForcePasswordChangeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication is required');
    }

    if (!user.forcePasswordChange) {
      return true;
    }

    if (
      request.method === 'POST' &&
      request.path.endsWith('/auth/change-password')
    ) {
      return true;
    }

    throw new ForbiddenException('Password change is required');
  }
}
