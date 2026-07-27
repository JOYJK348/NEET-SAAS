import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import type { AuthenticatedRequestUser } from '../auth/auth.types';
import { TutorDashboardService } from './tutor-dashboard.service';
import { BulkAttendanceRequestDto } from './dto/tutor-dashboard-response.dto';

@ApiTags('Tutor Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'tutor-dashboard', version: '1' })
export class TutorDashboardController {
  constructor(private readonly tutorDashboardService: TutorDashboardService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Get tutor dashboard overview',
    description:
      "Returns real stats (today's classes, upcoming classes, assigned batches, total students) " +
      "and today's schedule + upcoming schedule for the authenticated tutor.",
  })
  getOverview(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.tutorDashboardService.getOverview(user.tenantId!, user.sub);
  }

  @Get('courses')
  @ApiOperation({
    summary: "Get tutor's assigned courses with full hierarchy",
    description:
      'Returns all courses linked to the batches where the tutor is assigned. ' +
      'Each course includes subjects, chapters, and topics (with topic item count).',
  })
  getCourses(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.tutorDashboardService.getCourses(user.tenantId!, user.sub);
  }

  @Get('timetable')
  @ApiOperation({
    summary: 'Get tutor timetable',
    description:
      "Returns the tutor's class schedule grouped by day for a given week. " +
      'Defaults to current week if no date range specified.',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description: 'Start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: 'End date (YYYY-MM-DD)',
  })
  getTimetable(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.tutorDashboardService.getTimetable(
      user.tenantId!,
      user.sub,
      dateFrom,
      dateTo,
    );
  }

  @Get('batches')
  @ApiOperation({
    summary: "Get tutor's assigned batches",
    description:
      'Returns all batches where the authenticated tutor is actively assigned via StaffBatchAssignments. ' +
      'Includes student count, course, branch, academic year, and delivery type.',
  })
  getBatches(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.tutorDashboardService.getBatches(user.tenantId!, user.sub);
  }

  @Get('batches/:batchId/students')
  @ApiOperation({
    summary: 'Get students in a batch',
    description:
      'Returns all active students enrolled in a specific batch. ' +
      'Verifies the tutor is actually assigned to this batch before returning data.',
  })
  getBatchStudents(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('batchId') batchId: string,
  ) {
    return this.tutorDashboardService.getBatchStudents(
      user.tenantId!,
      user.sub,
      batchId,
    );
  }

  @Get('sessions/:sessionId')
  @ApiOperation({
    summary: 'Get session details with attendance',
    description:
      'Returns detailed information about a specific attendance session including ' +
      'batch, subject, room, schedule info, and full attendance records. ' +
      'Verifies the session belongs to the authenticated tutor.',
  })
  getSessionDetails(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('sessionId') sessionId: string,
  ) {
    return this.tutorDashboardService.getSessionDetails(
      user.tenantId!,
      user.sub,
      sessionId,
    );
  }

  @Post('sessions/:sessionId/attendance/bulk')
  @ApiOperation({
    summary: 'Bulk mark attendance for a session',
    description:
      'Upserts attendance records for students in a session. ' +
      "Verifies the tutor owns the session and all student admissions belong to the session's batch. " +
      'Uses a transaction for atomicity. Re-submitting updates existing records.',
  })
  markAttendance(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('sessionId') sessionId: string,
    @Body() dto: BulkAttendanceRequestDto,
  ) {
    return this.tutorDashboardService.markAttendance(
      user.tenantId!,
      user.sub,
      sessionId,
      dto,
    );
  }

  @Post('sessions/:sessionId/join')
  @ApiOperation({
    summary: 'Join live class session',
    description:
      'Returns the online meeting link (Zoom, Google Meet, etc) for a scheduled session. ' +
      'Verifies the tutor owns the session, class is online/hybrid, and session time is active.',
  })
  joinSession(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('sessionId') sessionId: string,
  ) {
    return this.tutorDashboardService.joinSession(
      user.tenantId!,
      user.sub,
      sessionId,
    );
  }
}
