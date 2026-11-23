import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '../../auth/auth.types';
import { NotionIntegrationService } from './notion-integration.service';
import { ConnectNotionDto, NotionConnectionStatusDto } from './notion.types';

@ApiTags('Integrations - Notion')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'integrations/notion', version: '1' })
export class NotionController {
  constructor(private readonly notionIntegrationService: NotionIntegrationService) {}

  @Post('connect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connect and configure Notion integration for tenant (Admin only)' })
  @ApiResponse({ status: 200, description: 'Connected successfully' })
  async connect(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() dto: ConnectNotionDto,
  ): Promise<NotionConnectionStatusDto> {
    this.assertAdminUser(user);
    const tenantId = this.assertTenantId(user);
    const userId = user.sub || (user as any).id || 'system';
    return this.notionIntegrationService.connect(tenantId, dto, userId);
  }

  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current Notion connection status for tenant (Faculty and Admin)' })
  @ApiResponse({ status: 200, description: 'Connection status' })
  async getStatus(
    @CurrentUser() user: AuthenticatedRequestUser,
  ): Promise<NotionConnectionStatusDto> {
    this.assertStaffOrAdminUser(user);
    const tenantId = this.assertTenantId(user);
    return this.notionIntegrationService.getStatus(tenantId);
  }

  @Post('disconnect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disconnect Notion integration for tenant (Admin only)' })
  @ApiResponse({ status: 200, description: 'Disconnected successfully' })
  async disconnect(
    @CurrentUser() user: AuthenticatedRequestUser,
  ): Promise<{ success: boolean }> {
    this.assertAdminUser(user);
    const tenantId = this.assertTenantId(user);
    const userId = user.sub || (user as any).id || 'system';
    return this.notionIntegrationService.disconnect(tenantId, userId);
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test stored Notion connection (Faculty and Admin)' })
  @ApiResponse({ status: 200, description: 'Test result' })
  async testConnection(
    @CurrentUser() user: AuthenticatedRequestUser,
  ): Promise<{ success: boolean; message: string; workspaceName?: string; pageTitle?: string }> {
    this.assertStaffOrAdminUser(user);
    const tenantId = this.assertTenantId(user);
    return this.notionIntegrationService.testConnection(tenantId);
  }

  /**
   * Only institute administrators, directors, and system admins can connect or disconnect
   * tenant-wide Notion workspace credentials in TenantSettings.
   */
  private assertAdminUser(user: AuthenticatedRequestUser): void {
    const adminRoles = new Set([
      'SUPER_ADMIN',
      'ADMIN',
      'TENANT_ADMIN',
      'DIRECTOR',
      'SYSTEM_ADMIN',
      'TENANT_ADMINISTRATOR',
    ]);
    if (!user.roleCode || !adminRoles.has(user.roleCode.toUpperCase())) {
      throw new ForbiddenException(
        'Only institute administrators and directors are authorized to configure tenant Notion integration',
      );
    }
  }

  /**
   * Faculty and administrators can inspect connection status and test connectivity.
   * Students and parents are blocked.
   */
  private assertStaffOrAdminUser(user: AuthenticatedRequestUser): void {
    const blockedRoles = new Set(['STUDENT', 'PARENT']);
    if (!user.roleCode || blockedRoles.has(user.roleCode.toUpperCase())) {
      throw new ForbiddenException(
        'Students and parents are not authorized to view Notion integration status',
      );
    }
  }

  private assertTenantId(user: AuthenticatedRequestUser): string {
    if (!user.tenantId) {
      throw new BadRequestException('Tenant ID is missing from user session');
    }
    return user.tenantId;
  }
}
