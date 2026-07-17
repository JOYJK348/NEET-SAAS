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
import { BatchEnrollmentsService } from './batch-enrollments.service';
import { CreateBatchEnrollmentDto } from './dto/create-batch-enrollment.dto';
import { BatchEnrollmentResponseDto } from './dto/batch-enrollment-response.dto';

@ApiTags('Batch Enrollments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'admissions/:admissionId/batches', version: '1' })
export class BatchEnrollmentAdmissionController {
  constructor(
    private readonly batchEnrollmentsService: BatchEnrollmentsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Enroll a student into a batch' })
  @ApiResponse({
    status: 201,
    description: 'Enrolled successfully',
    type: BatchEnrollmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Admission or Batch not found' })
  @ApiResponse({
    status: 409,
    description: 'Duplicate enrollment or capacity full',
  })
  create(
    @Param('admissionId') admissionId: string,
    @Body() dto: CreateBatchEnrollmentDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ): Promise<BatchEnrollmentResponseDto> {
    return this.batchEnrollmentsService.create(
      admissionId,
      dto,
      user.tenantId!,
      user.sub,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all batch enrollments for an admission' })
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
    description: 'Paginated enrollment list',
    type: PaginatedResponseDto<BatchEnrollmentResponseDto>,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
  findAll(
    @Param('admissionId') admissionId: string,
    @Query() query: QueryParamsDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ): Promise<PaginatedResult<BatchEnrollmentResponseDto>> {
    return this.batchEnrollmentsService.findAll(
      admissionId,
      user.tenantId!,
      query,
    );
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current primary batch enrollment' })
  @ApiResponse({
    status: 200,
    description: 'Current batch enrollment found',
    type: BatchEnrollmentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'No primary batch enrollment found',
  })
  findCurrent(
    @Param('admissionId') admissionId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ): Promise<BatchEnrollmentResponseDto> {
    return this.batchEnrollmentsService.findCurrent(
      admissionId,
      user.tenantId!,
    );
  }
}
