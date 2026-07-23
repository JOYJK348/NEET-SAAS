import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import type { AuthenticatedRequestUser } from '../../auth/auth.types';
import { SessionService } from '../services/session.service';
import { OverrideSessionDto } from '../dto/override-session.dto';
import { CreateExtraSessionDto } from '../dto/create-extra-session.dto';

@ApiTags('Scheduling — Sessions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('scheduling/sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  /**
   * Get a single session's audit timeline / history.
   */
  @Get(':id/history')
  getHistory(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
  ) {
    return this.sessionService.getHistory(user.tenantId!, id);
  }

  /**
   * Get a single session detail.
   */
  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
  ) {
    return this.sessionService.findOne(user.tenantId!, id);
  }

  /**
   * Override a session:
   * - Change Tutor
   * - Reschedule (date / time)
   * - Cancel
   * Scope: ONLY_THIS | THIS_AND_FUTURE | ENTIRE_SERIES
   */
  @Patch(':id/override')
  @HttpCode(HttpStatus.OK)
  override(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
    @Body() dto: OverrideSessionDto,
  ) {
    return this.sessionService.override(user.tenantId!, id, user.sub, dto);
  }

  /**
   * Create an ad-hoc extra / makeup class that is not part of the recurring schedule.
   */
  @Post('extra')
  @HttpCode(HttpStatus.CREATED)
  createExtra(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() dto: CreateExtraSessionDto,
  ) {
    return this.sessionService.createExtra(user.tenantId!, user.sub, dto);
  }
}
