import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '../../auth/auth.types';
import { RazorpayService } from './razorpay.service';
import { CreateRazorpayOrderDto } from '../dto/payment.dto';

@ApiTags('Billing – Razorpay')
@Controller({ path: 'billing/payments/razorpay', version: '1' })
export class RazorpayController {
  constructor(private readonly razorpayService: RazorpayService) {}

  @Post('create-order')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({ summary: 'Create Razorpay Order for an installment (Payment Intent Anchor)' })
  @ApiResponse({ status: 201, description: 'Order created with Razorpay orderId & paymentIntentId' })
  createOrder(
    @Body() dto: CreateRazorpayOrderDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.razorpayService.createRazorpayOrder(
      dto.studentFeeInstallmentId,
      user.tenantId!,
      user.sub,
    );
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Razorpay Webhook receiver (Source of Truth with 3-layer idempotency)' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(
    @Req() req: any,
    @Body() payload: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const isProduction = process.env.NODE_ENV === 'production';

    // P0 Requirement: Signature header is strictly required
    if (!signature) {
      throw new UnauthorizedException('Missing x-razorpay-signature header');
    }

    // P0 Requirement: Enforce webhook secret presence in production
    if (isProduction && !webhookSecret) {
      throw new UnauthorizedException(
        'RAZORPAY_WEBHOOK_SECRET is not configured on the production server',
      );
    }

    // Use raw request body buffer if available for exact HMAC verification
    const rawPayload =
      req.rawBody ||
      (req.rawBodyBuffer ? req.rawBodyBuffer.toString('utf8') : null);

    if (isProduction && !rawPayload) {
      throw new BadRequestException(
        'Raw request body buffer missing for HMAC-SHA256 signature verification',
      );
    }

    const payloadToVerify = rawPayload || JSON.stringify(payload);

    // Verify HMAC signature if secret is configured (mandatory in production)
    if (webhookSecret) {
      const isValid = this.razorpayService.verifyWebhookSignature(
        payloadToVerify,
        signature,
      );
      if (!isValid) {
        throw new UnauthorizedException('Invalid Razorpay webhook HMAC signature');
      }
    }

    return this.razorpayService.processRazorpayWebhook(payload);
  }

  @Post('verify-payment')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({ summary: 'Client-side Razorpay payment verification & instant processing' })
  @ApiResponse({ status: 200, description: 'Payment verified & installment updated' })
  verifyPayment(
    @Body()
    dto: {
      studentFeeInstallmentId: string;
      razorpayPaymentId: string;
      razorpayOrderId: string;
      razorpaySignature?: string;
    },
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.razorpayService.verifyAndProcessPayment(dto, user.tenantId!, user.sub);
  }

  @Post('create-full-order')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({ summary: 'Create Razorpay order to pay total outstanding course fee at once' })
  createFullOrder(
    @Body() dto: { studentAdmissionId: string },
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.razorpayService.createFullFeeRazorpayOrder(
      dto.studentAdmissionId,
      user.tenantId!,
      user.sub,
    );
  }

  @Post('verify-full-payment')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiOperation({ summary: 'Verify & clear all remaining course fee installments at once' })
  verifyFullPayment(
    @Body()
    dto: {
      studentAdmissionId: string;
      razorpayPaymentId: string;
      razorpayOrderId: string;
    },
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.razorpayService.verifyAndProcessFullFeePayment(dto, user.tenantId!, user.sub);
  }
}
