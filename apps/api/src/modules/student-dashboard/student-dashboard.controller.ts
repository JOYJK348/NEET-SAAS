import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import type { AuthenticatedRequestUser } from '../auth/auth.types';
import { StudentDashboardService } from './student-dashboard.service';

@ApiTags('Student Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'student-dashboard', version: '1' })
export class StudentDashboardController {
  constructor(
    private readonly studentDashboardService: StudentDashboardService,
  ) {}

  // ─── Phase 2: Overview ──────────────────────────────────────────────────

  @Get('overview')
  @ApiOperation({
    summary: 'Student dashboard overview',
    description:
      "Returns real stats (today's classes, active batches, real attendance rate from AttendanceRecords) " +
      "and today's schedule with liveStatus per session. meetingLink is NEVER returned here.",
  })
  getOverview(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.studentDashboardService.getOverview(user.tenantId!, user.sub);
  }

  // ─── Phase 3: Timetable ─────────────────────────────────────────────────

  @Get('timetable')
  @ApiOperation({
    summary: 'Student weekly timetable',
    description:
      'Returns class schedule grouped by day across all active batch enrollments. ' +
      'Sessions are deduplicated by AttendanceSession.id. ' +
      'Includes canJoin boolean and liveStatus. meetingLink is NEVER included here.',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    description: 'YYYY-MM-DD',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    description: 'YYYY-MM-DD',
  })
  getTimetable(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.studentDashboardService.getTimetable(
      user.tenantId!,
      user.sub,
      dateFrom,
      dateTo,
    );
  }

  // ─── Phase 3: Join Session (6-point validated) ──────────────────────────

  @Get('sessions/:sessionId/join')
  @ApiOperation({
    summary: 'Join a live class session',
    description:
      '6-point validated endpoint: checks JWT, active enrollment, not cancelled, joinable window, ' +
      'deliveryMode is ONLINE/HYBRID, and meetingLink exists. ' +
      'Only returns { sessionId, joinUrl, provider, expiresAt } — never exposed in timetable list.',
  })
  joinSession(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('sessionId') sessionId: string,
  ) {
    return this.studentDashboardService.joinSession(
      user.tenantId!,
      user.sub,
      sessionId,
    );
  }

  // ─── Phase 4: My Batches ─────────────────────────────────────────────────

  @Get('batches')
  @ApiOperation({
    summary: 'Student active batch enrollments',
    description:
      'Returns all ACTIVE StudentBatchEnrollments for the authenticated student. ' +
      'Includes batch details: course, branch, academic year, delivery type, total enrolled count.',
  })
  getBatches(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.studentDashboardService.getBatches(user.tenantId!, user.sub);
  }

  // ─── Phase 5: Attendance History ────────────────────────────────────────────

  @Get('attendance')
  @ApiOperation({
    summary: 'Student attendance history',
    description:
      'Returns overall attendance summary (total/present/absent/rate), ' +
      'subject-wise breakdown, and full record list from real AttendanceRecords table. ' +
      'No fake percentages — null rate is returned if no records exist yet.',
  })
  getAttendance(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.studentDashboardService.getAttendance(user.tenantId!, user.sub);
  }

  // ─── Phase 6: My Courses & Syllabus Tree ────────────────────────────────────

  @Get('courses')
  @ApiOperation({
    summary: 'Student course syllabus tree',
    description:
      'Returns course hierarchy (Course → Subject → Chapter → Topic) for all enrolled batches. ' +
      'Topics include publishedItemCount (published TopicItems only). ' +
      'Access is enrollment-driven — student can only see courses from their active batches.',
  })
  getCourses(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.studentDashboardService.getCourses(user.tenantId!, user.sub);
  }
}
