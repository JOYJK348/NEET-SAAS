import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import type { AuthenticatedRequestUser } from '../auth/auth.types';
import { AdmissionsService } from './admissions.service';
import { AdmissionResponseDto } from './dto/admission-response.dto';
import { UpdateAdmissionStatusDto } from './dto/update-admission-status.dto';
import { AdmissionHistoryResponseDto } from './dto/admission-history-response.dto';
import { AdminAdmissionQueryDto } from './dto/admin-admission-query.dto';

@ApiTags('Admissions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'admissions', version: '1' })
export class AdmissionItemController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all admissions (admin view)' })
  @ApiResponse({ status: 200, description: 'Paginated admission list' })
  findAllAdmin(
    @Query() query: AdminAdmissionQueryDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.admissionsService.findAllAdmin(user.tenantId!, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get admission statistics' })
  @ApiResponse({ status: 200, description: 'Admission stats' })
  getStats(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.admissionsService.getStats(user.tenantId!);
  }

  @Get(':admissionId')
  @ApiOperation({ summary: 'Get full admission details (enriched)' })
  @ApiResponse({
    status: 200,
    description: 'Admission found',
    type: AdmissionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
  findOne(
    @Param('admissionId') admissionId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.admissionsService.findOneEnriched(admissionId, user.tenantId!);
  }

  @Patch(':admissionId/status')
  @ApiOperation({ summary: 'Update admission status' })
  @ApiResponse({
    status: 200,
    description: 'Status updated',
    type: AdmissionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid transition or duplicate status',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
  @ApiResponse({ status: 409, description: 'Admission is soft-deleted' })
  updateStatus(
    @Param('admissionId') admissionId: string,
    @Body() dto: UpdateAdmissionStatusDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ): Promise<AdmissionResponseDto> {
    return this.admissionsService.updateStatus(
      admissionId,
      dto,
      user.tenantId!,
      user.sub,
    );
  }

  @Patch(':admissionId/batch')
  @ApiOperation({ summary: 'Update admission batch enrollment' })
  @ApiResponse({
    status: 200,
    description: 'Batch updated',
    type: AdmissionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Admission or Batch not found' })
  updateBatch(
    @Param('admissionId') admissionId: string,
    @Body() dto: { batchId: string },
    @CurrentUser() user: AuthenticatedRequestUser,
  ): Promise<AdmissionResponseDto> {
    return this.admissionsService.updateBatch(
      admissionId,
      dto,
      user.tenantId!,
      user.sub,
    );
  }

  @Get(':admissionId/history')
  @ApiOperation({
    summary: 'Get admission status change history (oldest first)',
  })
  @ApiResponse({
    status: 200,
    description: 'History retrieved',
    type: [AdmissionHistoryResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
  getHistory(
    @Param('admissionId') admissionId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ): Promise<AdmissionHistoryResponseDto[]> {
    return this.admissionsService.getHistory(admissionId, user.tenantId!);
  }
}
