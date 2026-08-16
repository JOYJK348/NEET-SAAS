import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '../../auth/auth.types';
import { FeeAssignmentService } from './assignment.service';
import { AssignStudentFeeDto } from '../dto/fee-assignment.dto';

@ApiTags('Billing – Fee Assignments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'billing/fee-assignments', version: '1' })
export class FeeAssignmentController {
  constructor(private readonly feeAssignmentService: FeeAssignmentService) {}

  @Post()
  @ApiOperation({ summary: 'Assign fee plan to student (materialises installments & snapshot)' })
  @ApiResponse({ status: 201, description: 'Fee plan assigned to student successfully' })
  assignFee(
    @Body() dto: AssignStudentFeeDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.feeAssignmentService.assignFeeToStudent(user.tenantId!, user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all student fee accounts & ledger summaries' })
  @ApiResponse({ status: 200, description: 'Student fee accounts list retrieved' })
  listAllFeeAccounts(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.feeAssignmentService.listAllFeeAccounts(user.tenantId!);
  }

  @Get(':studentAdmissionId')
  @ApiOperation({ summary: 'Get student full fee account & installment schedule' })
  @ApiResponse({ status: 200, description: 'Student fee account retrieved' })
  getStudentAccount(
    @Param('studentAdmissionId') studentAdmissionId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.feeAssignmentService.getStudentFeeAccount(studentAdmissionId, user.tenantId!);
  }
}
