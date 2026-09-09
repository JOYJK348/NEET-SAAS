import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserTypeEnum } from '@prisma/client';

@Injectable()
export class PlatformDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformDashboardMetrics() {
    const [
      totalTenants,
      activeTenants,
      inactiveTenants,
      suspendedTenants,
      totalStudents,
      totalStaff,
      totalTenantAdmins,
      recentAuditLogs,
    ] = await Promise.all([
      this.prisma.institutes.count({ where: { deletedAt: null } }),
      this.prisma.institutes.count({
        where: { status: 'ACTIVE', deletedAt: null },
      }),
      this.prisma.institutes.count({
        where: { status: 'INACTIVE', deletedAt: null },
      }),
      this.prisma.institutes.count({
        where: { status: 'SUSPENDED', deletedAt: null },
      }),
      this.prisma.users.count({
        where: { userType: UserTypeEnum.STUDENT, deletedAt: null },
      }),
      this.prisma.users.count({
        where: {
          userType: { in: [UserTypeEnum.TUTOR, UserTypeEnum.STAFF] },
          deletedAt: null,
        },
      }),
      this.prisma.users.count({
        where: { userType: ('TENANT_ADMIN' as any), deletedAt: null },
      }),
      this.prisma.platformAuditLogs.findMany({
        take: 10,
        orderBy: { occurredAt: 'desc' },
        include: {
          tenant: { select: { id: true, name: true, code: true } },
          triggeredByusers: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    return {
      metrics: {
        tenants: {
          total: totalTenants,
          active: activeTenants,
          inactive: inactiveTenants,
          suspended: suspendedTenants,
        },
        users: {
          students: totalStudents,
          staff: totalStaff,
          tenantAdmins: totalTenantAdmins,
          totalUsers: totalStudents + totalStaff + totalTenantAdmins,
        },
      },
      recentAuditLogs: recentAuditLogs.map((log) => ({
        id: log.id,
        eventType: log.eventType,
        description: log.description,
        payload: log.payload,
        occurredAt: log.occurredAt,
        tenantName: log.tenant?.name ?? 'Global Platform',
        tenantCode: log.tenant?.code ?? null,
        triggeredBy: log.triggeredByusers
          ? `${log.triggeredByusers.firstName} ${log.triggeredByusers.lastName}`.trim()
          : 'System Administrator',
      })),
    };
  }
}
