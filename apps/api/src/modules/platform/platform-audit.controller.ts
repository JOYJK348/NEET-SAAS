import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PlatformAuditService } from './platform-audit.service';

@Controller('platform-admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN')
export class PlatformAuditController {
  constructor(private readonly auditService: PlatformAuditService) {}

  @Get()
  async getAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('eventType') eventType?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.auditService.getAuditLogs({
      page,
      limit,
      search,
      eventType,
      tenantId,
    });
  }
}
