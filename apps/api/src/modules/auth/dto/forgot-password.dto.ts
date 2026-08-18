import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address associated with the user account',
  })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;
}
