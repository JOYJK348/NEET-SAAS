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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LiveClassService } from '../services/live-class.service';
import { ScheduleLiveClassDto } from '../dto/schedule-live-class.dto';
import { UpdateLiveClassDto } from '../dto/update-live-class.dto';

@ApiTags('Live Classes')
@ApiBearerAuth()
@Controller('live-classes')
export class LiveClassController {
  constructor(private readonly liveClassService: LiveClassService) {}

  // ─── Schedule ─────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tenant Admin: Schedule a new live class' })
  async schedule(@Body() dto: ScheduleLiveClassDto) {
    return this.liveClassService.scheduleLiveClass(dto);
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
  @ApiOperation({ summary: 'Tenant Admin: Update a scheduled live class' })
  async update(@Param('id') id: string, @Body() dto: UpdateLiveClassDto) {
    return this.liveClassService.updateLiveClass(id, dto);
  }

  // ─── Cancel ────────────────────────────────────────────────────────────────

  @Delete(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tenant Admin: Cancel a live class' })
  async cancel(
    @Param('id') id: string,
    @Query('reason') reason?: string,
  ) {
    return this.liveClassService.cancelLiveClass(id, reason);
  }
}
