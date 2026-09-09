import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PlatformTenantAdminsService } from './platform-tenant-admins.service';
import { InviteTenantAdminDto } from './dto/platform-dtos';
import type { AuthenticatedRequest } from '../auth/guards/auth-guard.types';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN')
export class PlatformTenantAdminsController {
  constructor(
    private readonly tenantAdminsService: PlatformTenantAdminsService,
  ) {}

  @Get('platform-admin/tenant-admins')
  async getTenantAdmins(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('tenantId') tenantId?: string,
    @Query('search') search?: string,
  ) {
    return this.tenantAdminsService.getTenantAdmins({
      page,
      limit,
      tenantId,
      search,
    });
  }

  @Post('platform-admin/tenants/:id/admins')
  async inviteTenantAdmin(
    @Param('id') tenantId: string,
    @Body() dto: InviteTenantAdminDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const triggeredById = req.user?.sub || 'SYSTEM';
    return this.tenantAdminsService.inviteTenantAdmin(
      tenantId,
      dto,
      triggeredById,
    );
  }
}
