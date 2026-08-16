import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '../../auth/auth.types';
import { FeeLedgerService } from './ledger.service';

@ApiTags('Billing – Ledger & Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'billing/ledger', version: '1' })
export class FeeLedgerController {
  constructor(private readonly ledgerService: FeeLedgerService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'Get billing dashboard KPI summary' })
  @ApiResponse({ status: 200, description: 'KPI summary retrieved' })
  getKpis(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.ledgerService.getBillingDashboardKpis(user.tenantId!);
  }

  @Get('outstanding')
  @ApiOperation({ summary: 'Get due and overdue student installment report' })
  @ApiResponse({ status: 200, description: 'Outstanding report retrieved' })
  getOutstanding(
    @Query('status') status?: 'OVERDUE' | 'UNPAID' | 'PARTIALLY_PAID',
    @CurrentUser() user?: AuthenticatedRequestUser,
  ) {
    return this.ledgerService.getOutstandingReport(user!.tenantId!, { status });
  }

  @Get('collection')
  @ApiOperation({ summary: 'Get collection summary by payment method' })
  @ApiResponse({ status: 200, description: 'Collection report retrieved' })
  getCollection(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.ledgerService.getCollectionReport(user.tenantId!);
  }
}
