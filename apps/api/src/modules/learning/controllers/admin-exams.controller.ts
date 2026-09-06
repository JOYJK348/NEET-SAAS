import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
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
import { AdminExamsService } from '../services/admin-exams.service';
import { ExamApprovalService } from '../services/exam-approval.service';
import { ExamAnalyticsService } from '../services/exam-analytics.service';
import { CreateExamDto } from '../dto/create-exam.dto';
import { UpdateExamDto } from '../dto/update-exam.dto';
import { QueryExamsDto } from '../dto/query-exams.dto';

type MulterFile = Express.Multer.File;

@ApiTags('Admin Exams')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(
  'TENANT_ADMIN',
  'SUPER_ADMIN',
  'ADMIN',
  'ADMINISTRATOR',
  'ACADEMIC_ADMIN',
  'BRANCH_ADMIN',
  'OWNER',
)
@Controller({ path: 'admin/exams', version: '1' })
export class AdminExamsController {
  constructor(
    private readonly adminExamsService: AdminExamsService,
    private readonly examApprovalService: ExamApprovalService,
    private readonly examAnalyticsService: ExamAnalyticsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create new exam with scheduling configuration' })
  @ApiResponse({ status: 201, description: 'Exam created successfully' })
  createExam(
    @Body() dto: CreateExamDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.adminExamsService.createExam(user.tenantId!, user.sub, dto);
  }

  @Post('check-conflict')
  @ApiOperation({ summary: 'Check exam schedule conflict with existing exams & class timetables' })
  @ApiResponse({ status: 200, description: 'Conflict check result' })
  checkConflict(
    @Body() dto: Record<string, any>,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.adminExamsService.checkConflictPublic(user.tenantId!, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List and filter exams for current tenant' })
  @ApiResponse({ status: 200, description: 'Paginated exams list' })
  findAllExams(
    @Query() query: QueryExamsDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.adminExamsService.findAllExams(user.tenantId!, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get exam details with signed paper/key URLs' })
  @ApiResponse({ status: 200, description: 'Exam details object' })
  findExamById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.adminExamsService.findExamById(user.tenantId!, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update draft exam configuration' })
  @ApiResponse({ status: 200, description: 'Exam updated' })
  updateExam(
    @Param('id') id: string,
    @Body() dto: UpdateExamDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.adminExamsService.updateExam(user.tenantId!, user.sub, id, dto);
  }

  @Post(':id/question-paper')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload Question Paper PDF for exam' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  uploadQuestionPaper(
    @Param('id') id: string,
    @UploadedFile() file: MulterFile,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.adminExamsService.uploadQuestionPaper(
      user.tenantId!,
      user.sub,
      id,
      file,
    );
  }

  @Post(':id/answer-key')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload Answer Key document for exam' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  uploadAnswerKey(
    @Param('id') id: string,
    @UploadedFile() file: MulterFile,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.adminExamsService.uploadAnswerKey(
      user.tenantId!,
      user.sub,
      id,
      file,
    );
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish exam to render it visible to students' })
  @ApiResponse({ status: 200, description: 'Exam published' })
  publishExam(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.adminExamsService.publishExam(user.tenantId!, user.sub, id);
  }

  @Post(':id/close')
  @ApiOperation({
    summary: 'Manually trigger exam closure and ABSENT generation',
  })
  @ApiResponse({ status: 200, description: 'Exam closed' })
  closeExam(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.adminExamsService.closeExam(user.tenantId!, user.sub, id);
  }

  @Post(':id/lock-submissions')
  @ApiOperation({ summary: 'Manually lock student uploads for exam' })
  @ApiResponse({ status: 200, description: 'Submissions locked' })
  lockSubmissions(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.adminExamsService.lockSubmissions(user.tenantId!, user.sub, id);
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Get exam progress widget statistics for admin dashboard',
  })
  @ApiResponse({ status: 200, description: 'Progress statistics metrics' })
  getExamStats(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.adminExamsService.getExamStats(user.tenantId!, id);
  }

  @Get(':id/live-dashboard')
  @ApiOperation({
    summary: 'Real-time live monitoring dashboard for active exam',
  })
  @ApiResponse({ status: 200, description: 'Live monitoring metrics' })
  getLiveDashboard(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.examAnalyticsService.getLiveDashboard(user.tenantId!, id);
  }

  @Get(':id/live-status')
  @ApiOperation({ summary: 'Real-time live status widget (alias)' })
  @ApiResponse({ status: 200, description: 'Live status widget metrics' })
  getLiveStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.examAnalyticsService.getLiveDashboard(user.tenantId!, id);
  }

  @Get(':id/analytics')
  @ApiOperation({
    summary: 'Post-publish comprehensive marks and attendance analytics',
  })
  @ApiResponse({ status: 200, description: 'Post-publish analytics metrics' })
  getPostPublishAnalytics(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.examAnalyticsService.getPostPublishAnalytics(
      user.tenantId!,
      id,
    );
  }

  @Get(':id/section-analytics')
  @ApiOperation({ summary: 'Section-wise average marks breakdown' })
  @ApiResponse({ status: 200, description: 'Section-wise analytics breakdown' })
  getSectionAnalytics(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.examAnalyticsService.getSectionAnalytics(user.tenantId!, id);
  }

  @Get(':id/top-students')
  @ApiOperation({ summary: 'Top N performing students list' })
  @ApiResponse({ status: 200, description: 'Top performing students list' })
  getTopStudents(
    @Param('id') id: string,
    @Query('limit') limit: number = 10,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.examAnalyticsService.getTopStudents(
      user.tenantId!,
      id,
      Number(limit) || 10,
    );
  }

  @Get(':id/bottom-students')
  @ApiOperation({ summary: 'Bottom N performing students list' })
  @ApiResponse({ status: 200, description: 'Bottom performing students list' })
  getBottomStudents(
    @Param('id') id: string,
    @Query('limit') limit: number = 10,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.examAnalyticsService.getBottomStudents(
      user.tenantId!,
      id,
      Number(limit) || 10,
    );
  }

  @Get(':id/review')
  @ApiOperation({
    summary: 'Get evaluation review summary for tenant admin review queue',
  })
  @ApiResponse({ status: 200, description: 'Evaluation review summary' })
  getReviewSummary(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.examApprovalService.getReviewSummary(user.tenantId!, id);
  }

  @Post(':id/submissions/:sid/approve')
  @ApiOperation({ summary: 'Approve a single student evaluation' })
  @ApiResponse({ status: 200, description: 'Evaluation approved' })
  approveSubmission(
    @Param('id') id: string,
    @Param('sid') sid: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.examApprovalService.approveSubmission(
      user.tenantId!,
      id,
      sid,
      user.sub,
    );
  }

  @Post(':id/submissions/:sid/reject')
  @ApiOperation({
    summary: 'Reject and return evaluation to tutor with mandatory reason',
  })
  @ApiResponse({ status: 200, description: 'Evaluation returned to tutor' })
  rejectSubmission(
    @Param('id') id: string,
    @Param('sid') sid: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.examApprovalService.rejectSubmission(
      user.tenantId!,
      id,
      sid,
      user.sub,
      reason,
    );
  }

  @Post(':id/submissions/approve-all')
  @ApiOperation({
    summary:
      'Bulk approve all evaluated submissions and auto-lock evaluation phase',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk approved and evaluation locked',
  })
  approveAll(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.examApprovalService.approveAll(user.tenantId!, id, user.sub);
  }

  @Get(':id/publish-checklist')
  @ApiOperation({
    summary: 'Run pre-flight publish safety checklist verification',
  })
  @ApiResponse({ status: 200, description: 'Publish checklist results' })
  getPublishChecklist(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.examApprovalService.getPublishChecklist(user.tenantId!, id);
  }

  @Post(':id/publish-results')
  @ApiOperation({
    summary:
      'Atomically calculate ranks, publish results, and transition status to RESULT_PUBLISHED',
  })
  @ApiResponse({ status: 200, description: 'Results published' })
  publishResults(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.adminExamsService.publishResults(user.tenantId!, user.sub, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete an exam' })
  @ApiResponse({ status: 200, description: 'Exam deleted successfully' })
  deleteExam(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.adminExamsService.deleteExam(user.tenantId!, id);
  }
}
