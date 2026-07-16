import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
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
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { AdmissionResponseDto } from './dto/admission-response.dto';

@ApiTags('Admissions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'students/:studentId/admissions', version: '1' })
export class AdmissionsController {
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
}
