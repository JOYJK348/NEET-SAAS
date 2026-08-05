import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '../auth/auth.types';
import { TenantDashboardService } from './tenant-dashboard.service';

@ApiTags('Tenant Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'tenant-dashboard', version: '1' })
export class TenantDashboardController {
  constructor(private readonly dashboardService: TenantDashboardService) {}

  @Get('overview')
  @Roles('TENANT_ADMIN', 'SUPER_ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get real-time tenant dashboard stats and overview' })
  @ApiResponse({ status: 200, description: 'Tenant dashboard overview fetched successfully' })
  async getOverview(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.dashboardService.getOverview(user.tenantId!);
  }
}
