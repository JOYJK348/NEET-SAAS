import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import type { AuthenticatedRequestUser } from '../../auth/auth.types';
import { ScheduleService } from '../services/schedule.service';
import { SessionGeneratorService } from '../services/session-generator.service';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { UpdateScheduleDto } from '../dto/update-schedule.dto';
import { QueryScheduleDto } from '../dto/query-schedule.dto';
import { CheckConflictsDto } from '../dto/check-conflicts.dto';

@ApiTags('Scheduling — Schedules')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('scheduling/schedules')
export class ScheduleController {
  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly sessionGenerator: SessionGeneratorService,
  ) {}

  /**
   * Conflict-check only — no data is saved.
   * Frontend calls this on "Check Conflicts" button click.
   * Must be BEFORE `:id` route to avoid route shadowing.
   */
  @Post('check-conflicts')
  @HttpCode(HttpStatus.OK)
  checkConflicts(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() dto: CheckConflictsDto,
  ) {
    return this.scheduleService.checkConflicts(user.tenantId!, dto);
  }

  /**
   * Weekly grid view — schedules grouped by day of week.
   */
  @Get('weekly-view')
  getWeeklyView(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query() query: QueryScheduleDto,
  ) {
    return this.scheduleService.getWeeklyView(user.tenantId!, query);
  }

  @Get('check-enrollment-conflict')
  checkEnrollmentConflict(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query('studentProfileId') studentProfileId: string,
    @Query('newBatchId') newBatchId: string,
    @Query('excludeAdmissionId') excludeAdmissionId?: string,
  ) {
    return this.scheduleService.checkEnrollmentConflict(
      user.tenantId!,
      studentProfileId,
      newBatchId,
      excludeAdmissionId,
    );
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query() query: QueryScheduleDto,
  ) {
    return this.scheduleService.findAll(user.tenantId!, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
  ) {
    return this.scheduleService.findOne(user.tenantId!, id);
  }

  /**
   * Create schedule.
   * Automatically runs conflict detection — returns HTTP 409 with ConflictResult if conflict found.
   * On success, triggers 30-day session generation.
   */
  @Post()
  async create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() dto: CreateScheduleDto,
  ) {
    const schedule = await this.scheduleService.create(
      user.tenantId!,
      user.sub,
      dto,
    );

    // Generate sessions for the next 30 days (non-blocking)
    this.sessionGenerator
      .generateForSchedule(schedule.id, 30, user.sub)
      .catch(() => {
        /* session generation failure doesn't fail the create response */
      });

    return schedule;
  }

  /**
   * Update schedule — re-runs conflict check on timing/tutor/batch/room changes.
   */
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.scheduleService.update(user.tenantId!, id, user.sub, dto);
  }

  /**
   * Soft-delete (sets status → CANCELLED).
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
  ) {
    return this.scheduleService.remove(user.tenantId!, id, user.sub);
  }
}
