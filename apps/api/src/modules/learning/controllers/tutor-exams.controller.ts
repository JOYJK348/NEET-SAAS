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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { AuthenticatedRequestUser } from '../../auth/auth.types';
import { TutorExamsService } from '../services/tutor-exams.service';
import { EvaluateSubmissionDto } from '../dto/evaluate-submission.dto';

@ApiTags('Tutor Exams')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles('TUTOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
@Controller({ path: 'tutor/exams', version: '1' })
export class TutorExamsController {
  constructor(private readonly tutorExamsService: TutorExamsService) {}

  @Get()
  @ApiOperation({
    summary:
      'Get list of exams assigned to tutor with pending evaluation counts',
  })
  @ApiResponse({ status: 200, description: 'List of tutor assigned exams' })
  getMyAssignedExams(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.tutorExamsService.getMyAssignedExams(
      user.tenantId!,
      user.sub,
      page,
      limit,
    );
  }

  @Get(':id/submissions')
  @ApiOperation({
    summary:
      "Get submission workload buckets (Today's Pending, Overdue, Completed, Absent)",
  })
  @ApiResponse({ status: 200, description: 'Submission buckets object' })
  getExamSubmissionsBuckets(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.tutorExamsService.getExamSubmissionsBuckets(
      user.tenantId!,
      user.sub,
      id,
    );
  }

  @Get(':id/submissions/:sid')
  @ApiOperation({
    summary:
      'Get submission detail + answer sheet signed URL for inline PDF viewing',
  })
  @ApiResponse({ status: 200, description: 'Submission detail object' })
  getSubmissionDetail(
    @Param('id') id: string,
    @Param('sid') sid: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.tutorExamsService.getSubmissionDetail(
      user.tenantId!,
      user.sub,
      id,
      sid,
    );
  }

  @Post(':id/submissions/:sid/evaluate')
  @ApiOperation({
    summary:
      'Save evaluation marks, section breakdown, and notes with audit trail',
  })
  @ApiResponse({ status: 200, description: 'Evaluation saved' })
  evaluateSubmission(
    @Param('id') id: string,
    @Param('sid') sid: string,
    @Body() dto: EvaluateSubmissionDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.tutorExamsService.evaluateSubmission(
      user.tenantId!,
      user.sub,
      id,
      sid,
      dto,
    );
  }
}
