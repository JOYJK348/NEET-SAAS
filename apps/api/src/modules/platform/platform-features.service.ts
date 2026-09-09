import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ToggleFeatureFlagDto } from './dto/platform-dtos';
import { PlatformAuditEventEnum } from '@prisma/client';

@Injectable()
export class PlatformFeaturesService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenantFeatures(tenantId: string) {
    const tenant = await this.prisma.institutes.findFirst({
      where: { id: tenantId, deletedAt: null },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${tenantId}' was not found`);
    }

    const featureFlags = await this.prisma.featureFlags.findMany({
      where: { tenantId },
      orderBy: { featureKey: 'asc' },
    });

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        code: tenant.code,
      },
      featureFlags: featureFlags.map((flag) => ({
        id: flag.id,
        featureKey: flag.featureKey,
        enabled: flag.enabled,
        rolloutPercentage: flag.rolloutPercentage,
        planRequired: flag.planRequired,
        description: flag.description,
        updatedAt: flag.updatedAt,
      })),
    };
  }

  async toggleTenantFeature(
    tenantId: string,
    dto: ToggleFeatureFlagDto,
    triggeredById: string,
  ) {
    const tenant = await this.prisma.institutes.findFirst({
      where: { id: tenantId, deletedAt: null },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${tenantId}' was not found`);
    }

    const eventType = dto.enabled
      ? PlatformAuditEventEnum.FEATURE_ENABLED
      : PlatformAuditEventEnum.FEATURE_DISABLED;

    const featureFlag = await this.prisma.$transaction(async (tx) => {
      const flag = await tx.featureFlags.upsert({
        where: {
          tenantId_featureKey: {
            tenantId,
            featureKey: dto.featureKey,
          },
        },
        update: {
          enabled: dto.enabled,
          updatedBy: triggeredById,
          updatedAt: new Date(),
        },
        create: {
          tenantId,
          featureKey: dto.featureKey,
          enabled: dto.enabled,
          rolloutPercentage: 100,
          planRequired: 'ENTERPRISE',
          description: `Feature flag toggle for ${dto.featureKey}`,
          metadata: {},
          createdBy: triggeredById,
          updatedBy: triggeredById,
        },
      });

      await tx.platformAuditLogs.create({
        data: {
          tenantId,
          eventType,
          description: `Feature flag '${dto.featureKey}' set to ${dto.enabled ? 'ENABLED' : 'DISABLED'} for tenant '${tenant.name}' (${tenant.code})`,
          payload: {
            featureKey: dto.featureKey,
            enabled: dto.enabled,
            tenantCode: tenant.code,
          },
          triggeredBy: triggeredById,
          createdBy: triggeredById,
          updatedBy: triggeredById,
        },
      });

      return flag;
    });

    return {
      message: `Feature '${dto.featureKey}' ${dto.enabled ? 'enabled' : 'disabled'} successfully.`,
      featureFlag,
    };
  }
}
