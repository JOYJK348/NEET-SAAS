import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import type { AuthenticatedRequestUser } from '../auth/auth.types';
import { AttendanceService } from './attendance.service';

@ApiTags('Attendance')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'attendance/admin', version: '1' })
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Admin attendance overview with batch summaries' })
  async getOverview(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.attendanceService.getOverview(user.tenantId!);
  }

  @Get('batches')
  @ApiOperation({ summary: 'List all batches with attendance stats' })
  async getBatches(@CurrentUser() user: AuthenticatedRequestUser) {
    const data = await this.attendanceService.getOverview(user.tenantId!);
    return data.batches;
  }

  @Get('batches/:batchId')
  @ApiOperation({ summary: 'Batch attendance detail with per-student stats' })
  async getBatchDetail(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('batchId') batchId: string,
  ) {
    return this.attendanceService.getBatchDetail(user.tenantId!, batchId);
  }

  @Get('students/:studentAdmissionId')
  @ApiOperation({ summary: 'Individual student attendance records' })
  async getStudentDetail(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('studentAdmissionId') studentAdmissionId: string,
  ) {
    return this.attendanceService.getStudentDetail(
      user.tenantId!,
      studentAdmissionId,
    );
  }
}
