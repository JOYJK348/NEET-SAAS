import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
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
import { BatchEnrollmentsService } from './batch-enrollments.service';

@ApiTags('Batch Enrollments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'batch-enrollments', version: '1' })
export class BatchEnrollmentItemController {
  constructor(
    private readonly batchEnrollmentsService: BatchEnrollmentsService,
  ) {}

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a batch enrollment (soft delete)' })
  @ApiResponse({ status: 204, description: 'Enrollment removed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ): Promise<void> {
    await this.batchEnrollmentsService.remove(id, user.tenantId!, user.sub);
  }
}
