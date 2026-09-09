import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PlatformRbacService } from './platform-rbac.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/platform-dtos';
import type { AuthenticatedRequest } from '../auth/guards/auth-guard.types';

@Controller('platform-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN')
export class PlatformRbacController {
  constructor(private readonly rbacService: PlatformRbacService) {}

  @Get('roles')
  async getRoles() {
    return this.rbacService.getRoles();
  }

  @Post('roles')
  async createRole(
    @Body() dto: CreateRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const triggeredById = req.user?.sub || 'SYSTEM';
    return this.rbacService.createRole(dto, triggeredById);
  }

  @Put('roles/:id')
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const triggeredById = req.user?.sub || 'SYSTEM';
    return this.rbacService.updateRole(id, dto, triggeredById);
  }

  @Get('permissions')
  async getPermissions() {
    return this.rbacService.getPermissions();
  }
}
