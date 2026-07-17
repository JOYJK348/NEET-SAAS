import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
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

@ApiTags('Admissions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'admissions', version: '1' })
export class AdmissionItemController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  @Get(':admissionId')
  @ApiOperation({ summary: 'Get full admission details' })
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
  ): Promise<AdmissionResponseDto> {
    return this.admissionsService.findOne(admissionId, user.tenantId!);
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
