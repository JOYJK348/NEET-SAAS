import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
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
import { QuestionImportService } from '../services/question-import.service';
import { OnlineCbtService, AutosaveAnswerDto } from '../services/online-cbt.service';
import type { ParsedQuestionItem } from '../services/structured-question-parser.service';

@ApiTags('Online CBT Exams')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller({ path: 'online-exams', version: '1' })
export class OnlineCbtController {
  constructor(
    private readonly importService: QuestionImportService,
    private readonly cbtService: OnlineCbtService,
  ) {}

  // ─── ADMIN BULK IMPORT ENDPOINTS ───────────────────────────────────────────

  @Post('parse-preview')
  @Roles('TENANT_ADMIN', 'SUPER_ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Instant document extraction & question parser preview for file uploads' })
  async parseDocumentPreview(
    @UploadedFile() file: any,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.importService.processDocumentImport(
      user.tenantId!,
      'temp-exam',
      user.sub,
      file.originalname,
      file.buffer,
      file.mimetype,
    );
  }

  @Post(':examId/import/upload')
  @Roles('TENANT_ADMIN', 'SUPER_ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload PDF/DOCX document and extract/parse questions asynchronously' })
  async uploadAndParseQuestions(
    @Param('examId') examId: string,
    @UploadedFile() file: any,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.importService.processDocumentImport(
      user.tenantId!,
      examId,
      user.sub,
      file.originalname,
      file.buffer,
      file.mimetype,
    );
  }

  @Get(':examId/import/status/:jobId')
  @Roles('TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get import job status and normalized validation preview payload' })
  async getImportJobStatus(
    @Param('examId') examId: string,
    @Param('jobId') jobId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.importService.getImportJobDetail(user.tenantId!, examId, jobId);
  }

  @Post(':examId/import/commit')
  @Roles('TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Commit all validated questions in a single batch transaction' })
  async commitImportJob(
    @Param('examId') examId: string,
    @Body() body: { jobId: string; questions?: any[] },
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.importService.commitImportJob(
      user.tenantId!,
      examId,
      user.sub,
      body.jobId,
      body.questions as ParsedQuestionItem[],
    );
  }

  // ─── STUDENT CBT TEST EXECUTION ENDPOINTS ──────────────────────────────────

  @Post(':examId/start')
  @Roles('STUDENT', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Start or resume an Online CBT exam attempt for student' })
  async startExamAttempt(
    @Param('examId') examId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.cbtService.startExamAttempt(user.tenantId!, user.sub, examId);
  }

  @Put('attempt/:attemptId/answer')
  @Roles('STUDENT', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Realtime debounced answer autosave' })
  async autosaveAnswer(
    @Param('attemptId') attemptId: string,
    @Body() dto: any,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.cbtService.autosaveAnswer(user.tenantId!, user.sub, attemptId, dto);
  }

  @Post('attempt/:attemptId/submit')
  @Roles('STUDENT', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Finalize CBT attempt, evaluate answers and generate result' })
  async submitExamAttempt(
    @Param('attemptId') attemptId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.cbtService.submitExamAttempt(user.tenantId!, user.sub, attemptId);
  }

  @Get(':examId/result')
  @Roles('STUDENT', 'PARENT', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get student exam result & scorecard' })
  async getExamResult(
    @Param('examId') examId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.cbtService.getExamResult(user.tenantId!, examId, user.sub);
  }
}
