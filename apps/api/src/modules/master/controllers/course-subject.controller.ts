/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import type { AuthenticatedRequestUser } from '../../auth/auth.types';
import { CourseSubjectService } from '../services/course-subject.service';
import { CreateCourseSubjectDto } from '../dto/create-course-subject.dto';

@ApiTags('Master — Course Subjects')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'master/course-subjects', version: '1' })
export class CourseSubjectController {
  constructor(private readonly courseSubjectService: CourseSubjectService) {}

  @Post()
  @ApiOperation({ summary: 'Map a subject to a course' })
  create(
    @Body() dto: CreateCourseSubjectDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.courseSubjectService.create(dto, user.tenantId!, user.sub);
  }

  @Get('by-course/:courseId')
  @ApiOperation({ summary: 'List subjects for a course' })
  findByCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.courseSubjectService.findByCourse(courseId, user.tenantId!);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a subject from a course' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    await this.courseSubjectService.remove(id, user.tenantId!, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update mapped course subject' })
  async update(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.courseSubjectService.update(id, dto, user.tenantId!, user.sub);
  }
}
