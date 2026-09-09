import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PlatformTenantsService } from './platform-tenants.service';
import { CreateTenantDto, UpdateTenantStatusDto } from './dto/platform-dtos';
import type { AuthenticatedRequest } from '../auth/guards/auth-guard.types';

@Controller('platform-admin/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN')
export class PlatformTenantsController {
  constructor(private readonly tenantsService: PlatformTenantsService) {}

  @Get()
  async getTenants(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.tenantsService.getTenants({ page, limit, search, status });
  }

  @Post()
  async createTenant(
    @Body() dto: CreateTenantDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const triggeredById = req.user?.sub || 'SYSTEM';
    return this.tenantsService.createTenant(dto, triggeredById);
  }

  @Get(':id')
  async getTenantById(@Param('id') id: string) {
    return this.tenantsService.getTenantById(id);
  }

  @Patch(':id/status')
  async updateTenantStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTenantStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const triggeredById = req.user?.sub || 'SYSTEM';
    return this.tenantsService.updateTenantStatus(id, dto, triggeredById);
  }

  @Delete(':id')
  async deleteTenant(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const triggeredById = req.user?.sub || 'SYSTEM';
    return this.tenantsService.deleteTenant(id, triggeredById);
  }
}
