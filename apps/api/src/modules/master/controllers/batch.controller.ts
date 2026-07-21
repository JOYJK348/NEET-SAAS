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
import { BatchService } from '../services/batch.service';
import { CreateBatchDto } from '../dto/create-batch.dto';
import { UpdateBatchDto } from '../dto/update-batch.dto';
import { QueryBatchDto } from '../dto/query-batch.dto';

@ApiTags('Master — Batches')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'master/batches', version: '1' })
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Post()
  @ApiOperation({ summary: 'Create a batch' })
  create(
    @Body() dto: CreateBatchDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.batchService.create(dto, user.tenantId!, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List batches with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'academicYearId', required: false })
  @ApiQuery({ name: 'deliveryTypeId', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @Query()
    query: QueryBatchDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.batchService.findAll(user.tenantId!, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get batch utilization stats' })
  getStats(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.batchService.getStats(user.tenantId!);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a batch by ID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.batchService.findOne(id, user.tenantId!);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get timeline events for a batch' })
  getTimelineEvents(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.batchService.getTimelineEvents(id, user.tenantId!);
  }

  @Get(':id/students')
  @ApiOperation({ summary: 'Get enrolled students for a batch' })
  getBatchStudents(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.batchService.getBatchStudents(id, user.tenantId!);
  }

  @Get(':id/staff')
  @ApiOperation({ summary: 'Get staff assignments for a batch' })
  getBatchStaffAssignments(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.batchService.getBatchStaffAssignments(id, user.tenantId!);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a batch' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBatchDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.batchService.update(id, dto, user.tenantId!, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a batch' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    await this.batchService.remove(id, user.tenantId!, user.sub);
  }
}
