import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import type { AuthenticatedRequestUser } from '../auth/auth.types';
import { ParentGuard } from './guards/parent.guard';
import { ParentDashboardService } from './parent-dashboard.service';

@ApiTags('Parent Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard, ParentGuard)
@Controller({ path: 'parent-dashboard', version: '1' })
export class ParentDashboardController {
  constructor(
    private readonly parentDashboardService: ParentDashboardService,
  ) {}

  @Get('students')
  @ApiOperation({ summary: 'List all linked children for the authenticated parent' })
  getLinkedStudents(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.parentDashboardService.getLinkedStudents(
      user.tenantId!,
      user.sub,
    );
  }

  @Get('students/:sid/overview')
  @ApiOperation({ summary: 'Get overview dashboard data for a linked student' })
  getOverview(
    @Param('sid') studentId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.parentDashboardService.getOverview(
      user.tenantId!,
      user.sub,
      studentId,
    );
  }

  @Get('students/:sid/academics')
  @ApiOperation({ summary: 'Get subject-wise performance for a student' })
  getAcademics(
    @Param('sid') studentId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.parentDashboardService.getAcademics(
      user.tenantId!,
      user.sub,
      studentId,
    );
  }

  @Get('students/:sid/exams')
  @ApiOperation({ summary: 'Get upcoming and completed exams for a student' })
  getExams(
    @Param('sid') studentId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.parentDashboardService.getExams(
      user.tenantId!,
      user.sub,
      studentId,
    );
  }

  @Get('students/:sid/exams/:eid/result')
  @ApiOperation({ summary: 'Get detailed result for a specific exam' })
  getExamResult(
    @Param('sid') studentId: string,
    @Param('eid') examId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.parentDashboardService.getExamResult(
      user.tenantId!,
      user.sub,
      studentId,
      examId,
    );
  }

  @Get('students/:sid/attendance')
  @ApiOperation({ summary: 'Get monthly attendance summary and history' })
  getAttendance(
    @Param('sid') studentId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.parentDashboardService.getAttendance(
      user.tenantId!,
      user.sub,
      studentId,
    );
  }

  @Get('students/:sid/fees')
  @ApiOperation({ summary: 'Get fee installment status and payments' })
  getFees(
    @Param('sid') studentId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.parentDashboardService.getFees(
      user.tenantId!,
      user.sub,
      studentId,
    );
  }

  @Get('students/:sid/notifications')
  @ApiOperation({ summary: 'Get recent announcements and notifications' })
  getNotifications(
    @Param('sid') studentId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.parentDashboardService.getNotifications(
      user.tenantId!,
      user.sub,
      studentId,
    );
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get parent profile details' })
  getProfile(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.parentDashboardService.getProfile(user.tenantId!, user.sub);
  }
}
