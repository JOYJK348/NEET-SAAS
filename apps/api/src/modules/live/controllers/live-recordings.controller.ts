import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '../../auth/auth.types';
import { LiveRecordingsService } from '../services/live-recordings.service';
import { ListRecordingsQueryDto } from '../dto/list-recordings-query.dto';

@ApiTags('Recordings (Recorded Classes)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'recordings', version: '1' })
export class LiveRecordingsController {
  constructor(
    private readonly recordingsService: LiveRecordingsService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List recordings (role-scoped: admin all · tutor own · student enrolled READY)',
    description:
      'Supports curriculum filters (courseId/subjectId/chapterId/topicId/batchId), ' +
      'status (processing|ready|failed), search in title/subtitle, and pagination.',
  })
  list(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query() q: ListRecordingsQueryDto,
  ) {
    return this.recordingsService.list({
      tenantId: user.tenantId!,
      userId: user.sub,
      roleCode: user.roleCode,
      status: q.status,
      courseId: q.courseId,
      subjectId: q.subjectId,
      chapterId: q.chapterId,
      topicId: q.topicId,
      batchId: q.batchId,
      search: q.search,
      page: q.page,
      limit: q.limit,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recording detail + short-lived signed playback URL (visibility-checked)',
  })
  getDetail(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
  ) {
    return this.recordingsService.getDetail(
      user.tenantId!,
      user.sub,
      user.roleCode,
      id,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tenant Admin: delete a recording (soft-delete + best-effort storage removal)',
  })
  remove(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
  ) {
    return this.recordingsService.remove(
      user.tenantId!,
      user.sub,
      user.roleCode,
      id,
    );
  }
}
