import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PlatformFeaturesService } from './platform-features.service';
import { ToggleFeatureFlagDto } from './dto/platform-dtos';
import type { AuthenticatedRequest } from '../auth/guards/auth-guard.types';

@Controller('platform-admin/tenants/:id/features')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN')
export class PlatformFeaturesController {
  constructor(private readonly featuresService: PlatformFeaturesService) {}

  @Get()
  async getTenantFeatures(@Param('id') tenantId: string) {
    return this.featuresService.getTenantFeatures(tenantId);
  }

  @Patch()
  async toggleTenantFeature(
    @Param('id') tenantId: string,
    @Body() dto: ToggleFeatureFlagDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const triggeredById = req.user?.sub || 'SYSTEM';
    return this.featuresService.toggleTenantFeature(
      tenantId,
      dto,
      triggeredById,
    );
  }
}
