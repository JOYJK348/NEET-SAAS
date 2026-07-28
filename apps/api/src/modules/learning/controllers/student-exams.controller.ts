import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
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
import { StudentExamsService } from '../services/student-exams.service';

type MulterFile = Express.Multer.File;

@ApiTags('Student Exams')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles('STUDENT', 'TENANT_ADMIN', 'SUPER_ADMIN')
@Controller({ path: 'student/exams', version: '1' })
export class StudentExamsController {
  constructor(private readonly studentExamsService: StudentExamsService) {}

  @Get()
  @ApiOperation({
    summary:
      'Get list of published exams for student batch with derived statuses',
  })
  @ApiResponse({
    status: 200,
    description: 'List of student exams with countdown timers',
  })
  getMyExams(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.studentExamsService.getMyExams(
      user.tenantId!,
      user.sub,
      page,
      limit,
    );
  }

  @Post(':id/start')
  @ApiOperation({
    summary:
      'Click Ready to Start to initialize per-student exam timer session',
  })
  @ApiResponse({ status: 200, description: 'Student exam session started' })
  startExam(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.studentExamsService.startExam(user.tenantId!, user.sub, id);
  }

  @Get(':id/question-paper')
  @ApiOperation({
    summary: 'Get Question Paper signed URL (Guarded: must start exam first)',
  })
  @ApiResponse({ status: 200, description: 'Question Paper signed URL' })
  getQuestionPaperUrl(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.studentExamsService.getQuestionPaperUrl(
      user.tenantId!,
      user.sub,
      id,
    );
  }

  @Patch(':id/heartbeat')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Send 30s heartbeat ping to keep active session alive',
  })
  @ApiResponse({ status: 200, description: 'Heartbeat recorded' })
  heartbeat(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.studentExamsService.heartbeat(user.tenantId!, user.sub, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student exam details + submission details' })
  @ApiResponse({ status: 200, description: 'Student exam details' })
  getExamDetail(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.studentExamsService.getExamDetail(user.tenantId!, user.sub, id);
  }

  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload or replace student answer sheet PDF' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  uploadAnswerSheet(
    @Param('id') id: string,
    @UploadedFile() file: MulterFile,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.studentExamsService.uploadAnswerSheet(
      user.tenantId!,
      user.sub,
      id,
      file,
    );
  }

  @Get(':id/result')
  @ApiOperation({
    summary: 'Get published marks breakdown, rank, and scorecard for exam',
  })
  @ApiResponse({ status: 200, description: 'Student exam result scorecard' })
  getResult(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.studentExamsService.getResult(user.tenantId!, user.sub, id);
  }
}
