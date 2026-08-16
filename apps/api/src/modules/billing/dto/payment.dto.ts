import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum PaymentMethodEnum {
  CASH = 'CASH',
  CARD = 'CARD',
  UPI = 'UPI',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  ONLINE_GATEWAY = 'ONLINE_GATEWAY',
}

export class CollectManualPaymentDto {
  @ApiProperty({ example: 'student-fee-installment-uuid' })
  @IsString()
  @IsNotEmpty()
  studentFeeInstallmentId: string;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ enum: PaymentMethodEnum, example: PaymentMethodEnum.CASH })
  @IsEnum(PaymentMethodEnum)
  paymentMethod: PaymentMethodEnum;

  @ApiProperty({ example: 'CHQ-982131 / UPI-89123' })
  @IsString()
  @IsNotEmpty()
  referenceNumber: string;

  @ApiPropertyOptional({ example: 'Handed over cash at branch office' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateRazorpayOrderDto {
  @ApiProperty({ example: 'student-fee-installment-uuid' })
  @IsString()
  @IsNotEmpty()
  studentFeeInstallmentId: string;
}
