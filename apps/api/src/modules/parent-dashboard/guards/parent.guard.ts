import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { AuthenticatedRequestUser } from '../../auth/auth.types';

@Injectable()
export class ParentGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedRequestUser = request.user;
    const studentId = request.params.sid || request.params.studentId;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const parentUser = await this.prisma.users.findFirst({
      where: { id: user.sub, deletedAt: null },
    });

    if (!parentUser) {
      throw new ForbiddenException('User not found');
    }

    if (user.roleCode !== 'PARENT' && parentUser.userType !== 'PARENT') {
      throw new ForbiddenException('Access denied: Parent role required');
    }

    if (parentUser.status === 'INACTIVE') {
      throw new ForbiddenException('Parent Portal access is currently disabled for this account.');
    }

    // If endpoint has a studentId parameter, validate mapping in StudentParents
    if (studentId) {
      const mapping = await this.prisma.studentParents.findFirst({
        where: {
          parentProfileId: user.sub,
          studentProfileId: studentId,
          tenantId: user.tenantId ?? undefined,
          deletedAt: null,
        },
      });

      if (!mapping) {
        const contact = parentUser.email
          ? await this.prisma.emergencyContacts.findFirst({
              where: {
                studentProfileId: studentId,
                email: parentUser.email.toLowerCase(),
                relationship: 'Parent',
                deletedAt: null,
              },
            })
          : null;

        if (!contact) {
          throw new ForbiddenException(
            'Access denied: You are not linked as a parent to this student',
          );
        }
      }
    }

    return true;
  }
}
