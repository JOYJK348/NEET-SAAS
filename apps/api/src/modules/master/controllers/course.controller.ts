import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import type { AuthenticatedRequestUser } from '../../auth/auth.types';
import { QueryParamsDto } from '../../../common/dto/query-params.dto';
import { CourseService } from '../services/course.service';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';

@ApiTags('Master — Courses')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'master/courses', version: '1' })
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @ApiOperation({ summary: 'Create a course' })
  create(
    @Body() dto: CreateCourseDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.courseService.create(dto, user.tenantId!, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List courses with pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query() query: QueryParamsDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.courseService.findAll(user.tenantId!, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a course by ID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.courseService.findOne(id, user.tenantId!);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a course' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.courseService.update(id, dto, user.tenantId!, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a course' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    await this.courseService.remove(id, user.tenantId!, user.sub);
  }
}
