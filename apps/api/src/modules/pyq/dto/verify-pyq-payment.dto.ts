import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPyqPaymentDto {
  @ApiProperty({ example: 'order_9A33XvNp22' })
  @IsString()
  @IsNotEmpty()
  razorpayOrderId: string;

  @ApiProperty({ example: 'pay_293849102' })
  @IsString()
  @IsNotEmpty()
  razorpayPaymentId: string;

  @ApiProperty({ example: 'a89102c91823901283...' })
  @IsString()
  @IsNotEmpty()
  razorpaySignature: string;
}
