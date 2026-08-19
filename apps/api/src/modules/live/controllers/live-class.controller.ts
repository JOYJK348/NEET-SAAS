import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '../../auth/auth.types';
import { LiveClassService } from '../services/live-class.service';
import { LiveRecordingsService } from '../services/live-recordings.service';
import { ScheduleLiveClassDto } from '../dto/schedule-live-class.dto';
import { UpdateLiveClassDto } from '../dto/update-live-class.dto';

@ApiTags('Live Classes')
@ApiBearerAuth()
@Controller('live-classes')
export class LiveClassController {
  constructor(
    private readonly liveClassService: LiveClassService,
    private readonly recordingsService: LiveRecordingsService,
  ) {}

  // ─── Schedule ─────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tenant Admin: Schedule a new live class' })
  async schedule(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() dto: ScheduleLiveClassDto,
  ) {
    return this.liveClassService.scheduleLiveClass(
      user.tenantId!,
      user.sub,
      dto,
    );
  }

  // ─── Start Class (Teacher) ──────────────────────────────────────────────────

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Teacher: Start class (Creates LiveKit room & returns host token)' })
  async startClass(@Param('id') id: string) {
    return this.liveClassService.startClass(id);
  }

  // ─── Join Class (Student / Participant) ────────────────────────────────────

  @Get(':id/join-token')
  @ApiOperation({ summary: 'Get LiveKit join token for classroom' })
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'role', required: false, description: 'host | student' })
  async getJoinToken(
    @Param('id') id: string,
    @Query('name') name?: string,
    @Query('role') role?: string,
  ) {
    return this.liveClassService.getJoinToken(id, name, role);
  }

  // ─── End Class (Teacher) ───────────────────────────────────────────────────

  @Post(':id/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Teacher: End live class (Deletes LiveKit room)' })
  async endClass(@Param('id') id: string) {
    return this.liveClassService.endClass(id);
  }

  // ─── Upload Recording Video (Teacher Studio Live Recording) ───────────────

  @Post(':id/upload-recording')
  @UseInterceptors(FileInterceptor('video'))
  @ApiOperation({ summary: 'Teacher: Upload live recorded class video' })
  async uploadRecording(
    @Param('id') id: string,
    @UploadedFile() file?: any,
    @Body() body?: any,
    @Query('durationSeconds') durationQuery?: string,
    @Query('topicCovered') topicQuery?: string,
  ) {
    const durationSeconds = durationQuery || body?.durationSeconds;
    const topicCovered = topicQuery || body?.topicCovered;
    return this.liveClassService.saveUploadedRecording(id, file, { ...body, durationSeconds, topicCovered });
  }

  // ─── Stream Recording Video ───────────────────────────────────────────────

  @Public()
  @Get(':id/video')
  @ApiOperation({ summary: 'Stream recorded class video with range headers' })
  async streamRecordingVideo(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: any,
  ) {
    return this.liveClassService.streamRecordingVideo(id, req, res);
  }

  // ─── Get upcoming ──────────────────────────────────────────────────────────

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming scheduled classes' })
  @ApiQuery({ name: 'batchId', required: false })
  async upcoming(@Query('batchId') batchId?: string) {
    return this.liveClassService.getUpcomingClasses(batchId);
  }

  // ─── Get completed / recorded ──────────────────────────────────────────────

  @Get('recorded')
  @ApiOperation({ summary: 'Get completed classes (recordings available)' })
  @ApiQuery({ name: 'batchId', required: false })
  @ApiQuery({ name: 'subjectId', required: false })
  async recorded(
    @Query('batchId') batchId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.liveClassService.getCompletedClasses(batchId, subjectId);
  }

  // ─── Get one ───────────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get a single live class by ID' })
  async getOne(@Param('id') id: string) {
    return this.liveClassService.getOne(id);
  }

  // ─── Get participants ──────────────────────────────────────────────────────

  @Get(':id/participants')
  @ApiOperation({ summary: 'Get participant list and count for a live class' })
  async getParticipants(@Param('id') id: string) {
    return this.liveClassService.getParticipants(id);
  }

  // ─── Join Requests (Cross-Device Waiting Room) ────────────────────────────

  /** Student: Register intent to join (called on page load) */
  @Public()
  @Post(':id/join-request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Student: Register join request for tutor approval' })
  async registerJoinRequest(
    @Param('id') id: string,
    @Body() body: { studentId: string; studentName: string },
  ) {
    await this.liveClassService.registerJoinRequest(id, body.studentId || 'unknown', body.studentName || 'Student');
    return { success: true };
  }

  /** Tutor: Poll pending join requests (every 2s) */
  @Public()
  @Get(':id/join-requests')
  @ApiOperation({ summary: 'Tutor: Get pending join requests for a class' })
  async listJoinRequests(@Param('id') id: string) {
    const requests = await this.liveClassService.listJoinRequests(id);
    return { requests };
  }

  /** Student: Poll join request approval status */
  @Public()
  @Get(':id/join-status')
  @ApiOperation({ summary: 'Student: Check if tutor approved join request' })
  async checkJoinStatus(
    @Param('id') id: string,
    @Query('studentId') studentId: string,
  ) {
    return this.liveClassService.checkJoinStatus(id, studentId || 'unknown');
  }

  /** Tutor: Remove/admit a specific student */
  @Public()
  @Delete(':id/join-requests/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tutor: Remove student from waiting room (after admit/deny)' })
  async removeJoinRequest(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Query('action') action?: 'admit' | 'deny',
  ) {
    await this.liveClassService.removeJoinRequest(id, studentId, action || 'admit');
    return { success: true };
  }

  // ─── Recording status (studio / timetable chip) ──────────────────────────


  @Get(':id/recording')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get recording status for a live class (Processing/Ready/Failed or null)',
  })
  async getRecordingStatus(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
  ) {
    return this.recordingsService.getStatusForClass(user.tenantId!, id);
  }

  // ─── Extend Class Duration ───────────────────────────────────────────────

  @Post(':id/extend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Teacher / Admin: Extend live class duration' })
  async extend(
    @Param('id') id: string,
    @Body('extendMinutes') extendMinutes?: number,
  ) {
    return this.liveClassService.extendClass(id, extendMinutes || 15);
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  @Patch(':id')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({ summary: 'Tenant Admin: Update a scheduled live class' })
  async update(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateLiveClassDto,
  ) {
    return this.liveClassService.updateLiveClass(id, dto, user.tenantId!, user.sub);
  }

  // ─── Cancel ────────────────────────────────────────────────────────────────

  @Delete(':id/cancel')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tenant Admin: Cancel a live class' })
  async cancel(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
    @Query('reason') reason?: string,
  ) {
    return this.liveClassService.cancelLiveClass(
      id,
      reason,
      user.tenantId!,
      user.sub,
    );
  }

  // ─── Attendance ────────────────────────────────────────────────────────────

  @Get(':id/attendance')
  @ApiOperation({ summary: 'Teacher Studio: Get enrolled students attendance sheet for live class' })
  async getLiveClassAttendance(
    @Param('id') id: string,
    @Query('sessionType') sessionType?: string,
    @Query('studentAdmissionId') studentAdmissionId?: string,
    @Query('studentName') studentName?: string,
  ) {
    return this.liveClassService.getLiveClassAttendance(id, { sessionType, studentAdmissionId, studentName });
  }

  @Post(':id/attendance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Teacher Studio: Save manual attendance marked during live class' })
  async markLiveClassAttendance(
    @Param('id') id: string,
    @Body() body: { records: { studentAdmissionId: string; attendanceStatus: string; remarks?: string }[] },
  ) {
    return this.liveClassService.markLiveClassAttendance(id, body.records || []);
  }
}
