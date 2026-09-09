import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PlatformAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async getAuditLogs(query: {
    page?: number;
    limit?: number;
    search?: string;
    eventType?: string;
    tenantId?: string;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const where: Record<string, any> = { deletedAt: null };

    if (query.eventType && query.eventType !== 'ALL') {
      where.eventType = query.eventType;
    }

    if (query.tenantId && query.tenantId !== 'ALL') {
      where.tenantId = query.tenantId;
    }

    if (query.search && query.search.trim().length > 0) {
      const search = query.search.trim();
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { triggeredBy: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.platformAuditLogs.count({ where }),
      this.prisma.platformAuditLogs.findMany({
        where,
        skip,
        take: limit,
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
      items: items.map((log) => ({
        id: log.id,
        tenantId: log.tenantId,
        tenantName: log.tenant?.name ?? 'Global Platform',
        tenantCode: log.tenant?.code ?? null,
        eventType: log.eventType,
        description: log.description,
        payload: log.payload,
        occurredAt: log.occurredAt,
        triggeredBy: log.triggeredByusers
          ? `${log.triggeredByusers.firstName} ${log.triggeredByusers.lastName}`.trim()
          : 'System Administrator',
        triggeredByEmail: log.triggeredByusers?.email ?? null,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
