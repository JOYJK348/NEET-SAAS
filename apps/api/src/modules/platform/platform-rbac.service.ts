import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/platform-dtos';
import { PlatformAuditEventEnum } from '@prisma/client';

@Injectable()
export class PlatformRbacService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoles() {
    const roles = await this.prisma.roles.findMany({
      where: { deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { priority: 'desc' }],
      include: {
        _count: {
          select: {
            role_permissionss: { where: { deletedAt: null } },
            user_roless: { where: { deletedAt: null } },
          },
        },
      },
    });

    return {
      roles: roles.map((r) => ({
        id: r.id,
        tenantId: r.tenantId,
        name: r.name,
        code: r.code,
        roleType: r.roleType,
        isDefault: r.isDefault,
        isEditable: r.isEditable,
        isDeletable: r.isDeletable,
        priority: r.priority,
        permissionCount: r._count.role_permissionss,
        assignedUserCount: r._count.user_roless,
        createdAt: r.createdAt,
      })),
    };
  }

  async createRole(dto: CreateRoleDto, triggeredById: string) {
    const code = dto.code.trim().toUpperCase();

    const existingRole = await this.prisma.roles.findFirst({
      where: { code, deletedAt: null },
    });

    if (existingRole) {
      throw new ConflictException(`Role with code '${code}' already exists`);
    }

    const tenantId = dto.tenantId || 'GLOBAL';

    const newRole = await this.prisma.$transaction(async (tx) => {
      const role = await tx.roles.create({
        data: {
          tenantId,
          code,
          name: dto.name.trim(),
          roleType: 'CUSTOM',
          isDefault: false,
          isEditable: true,
          isDeletable: true,
          priority: 1,
          metadata: {},
          createdBy: triggeredById,
          updatedBy: triggeredById,
        },
      });

      if (dto.permissionIds && dto.permissionIds.length > 0) {
        const rolePermissionsData = dto.permissionIds.map((pId) => ({
          tenantId,
          roleId: role.id,
          permissionId: pId,
          metadata: {},
          createdBy: triggeredById,
          updatedBy: triggeredById,
        }));
        await tx.rolePermissions.createMany({ data: rolePermissionsData });
      }

      await tx.platformAuditLogs.create({
        data: {
          tenantId: tenantId === 'GLOBAL' ? '' : tenantId,
          eventType: PlatformAuditEventEnum.ROLE_CREATED,
          description: `Custom role '${role.name}' (${role.code}) created with ${dto.permissionIds?.length || 0} permissions`,
          payload: {
            roleId: role.id,
            code: role.code,
            name: role.name,
            permissionCount: dto.permissionIds?.length || 0,
          },
          triggeredBy: triggeredById,
          createdBy: triggeredById,
          updatedBy: triggeredById,
        },
      });

      return role;
    });

    return {
      message: 'Role created successfully',
      role: newRole,
    };
  }

  async updateRole(id: string, dto: UpdateRoleDto, triggeredById: string) {
    const role = await this.prisma.roles.findFirst({
      where: { id, deletedAt: null },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${id}' was not found`);
    }

    const updatedRole = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.roles.update({
        where: { id },
        data: {
          ...(dto.name ? { name: dto.name.trim() } : {}),
          updatedBy: triggeredById,
          updatedAt: new Date(),
        },
      });

      if (dto.permissionIds !== undefined) {
        // Delete existing role permissions
        await tx.rolePermissions.deleteMany({
          where: { roleId: id },
        });

        // Add new permissions
        if (dto.permissionIds.length > 0) {
          const rolePermissionsData = dto.permissionIds.map((pId) => ({
            tenantId: role.tenantId,
            roleId: id,
            permissionId: pId,
            metadata: {},
            createdBy: triggeredById,
            updatedBy: triggeredById,
          }));
          await tx.rolePermissions.createMany({ data: rolePermissionsData });
        }
      }

      await tx.platformAuditLogs.create({
        data: {
          tenantId: role.tenantId === 'GLOBAL' ? '' : role.tenantId,
          eventType: PlatformAuditEventEnum.ROLE_UPDATED,
          description: `Role '${role.name}' (${role.code}) updated`,
          payload: {
            roleId: role.id,
            updatedName: dto.name || role.name,
            newPermissionCount: dto.permissionIds?.length,
          },
          triggeredBy: triggeredById,
          createdBy: triggeredById,
          updatedBy: triggeredById,
        },
      });

      return updated;
    });

    return {
      message: 'Role permissions updated successfully',
      role: updatedRole,
    };
  }

  async getPermissions() {
    const permissions = await this.prisma.permissions.findMany({
      where: { deletedAt: null },
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    // Group by resource / domain
    const grouped: Record<string, typeof permissions> = {};
    permissions.forEach((p) => {
      const groupKey = p.resource || 'GENERAL';
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(p);
    });

    return {
      permissions,
      groupedPermissions: grouped,
    };
  }
}
