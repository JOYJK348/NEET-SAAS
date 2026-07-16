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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import type { AuthenticatedRequestUser } from '../auth/auth.types';
import { QueryParamsDto } from '../../common/dto/query-params.dto';
import { PaginatedResult } from '../../common/dto/query-params.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { AdmissionsService } from './admissions.service';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { AdmissionResponseDto } from './dto/admission-response.dto';

@ApiTags('Admissions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'students/:studentId/admissions', version: '1' })
export class AdmissionsStudentController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new student admission' })
  @ApiResponse({
    status: 201,
    description: 'Admission created',
    type: AdmissionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({
    status: 404,
    description: 'Student, Academic Year, Course, or Branch not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Duplicate active admission for this academic year',
  })
  create(
    @Param('studentId') studentId: string,
    @Body() dto: CreateAdmissionDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ): Promise<AdmissionResponseDto> {
    return this.admissionsService.create(
      studentId,
      dto,
      user.tenantId!,
      user.sub,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all admissions for a student (newest first)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'sortBy', required: false, example: 'createdAt' })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated admission list',
    type: PaginatedResponseDto<AdmissionResponseDto>,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  findAll(
    @Param('studentId') studentId: string,
    @Query() query: QueryParamsDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ): Promise<PaginatedResult<AdmissionResponseDto>> {
    return this.admissionsService.findAll(studentId, user.tenantId!, query);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current active admission for a student' })
  @ApiResponse({
    status: 200,
    description: 'Current admission found',
    type: AdmissionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'No current active admission found',
  })
  findCurrent(
    @Param('studentId') studentId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ): Promise<AdmissionResponseDto> {
    return this.admissionsService.findCurrent(studentId, user.tenantId!);
  }
}
