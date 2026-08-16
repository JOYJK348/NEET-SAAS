import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '../../auth/auth.types';
import { PaymentService } from './payment.service';
import { CollectManualPaymentDto } from '../dto/payment.dto';

@ApiTags('Billing – Payments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'billing/payments', version: '1' })
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('collect')
  @ApiOperation({ summary: 'Collect manual offline payment (Cash, UPI, Bank Transfer)' })
  @ApiResponse({ status: 201, description: 'Payment collected & receipt generated' })
  collectManualPayment(
    @Body() dto: CollectManualPaymentDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.paymentService.collectPayment(user.tenantId!, user.sub, {
      studentFeeInstallmentId: dto.studentFeeInstallmentId,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      referenceNumber: dto.referenceNumber,
      remarks: dto.remarks,
    });
  }

  @Get('receipts/:paymentId')
  @ApiOperation({ summary: 'Get digital receipt data for payment' })
  @ApiResponse({ status: 200, description: 'Receipt data retrieved' })
  getReceipt(
    @Param('paymentId') paymentId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.paymentService.getPaymentReceipt(paymentId, user.tenantId!);
  }
}
