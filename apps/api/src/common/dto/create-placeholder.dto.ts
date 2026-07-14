import { IsString, IsNotEmpty, IsUUID, IsEmail } from 'class-validator';

export class CreatePlaceholderDto {
  @IsUUID()
  @IsNotEmpty()
  readonly id: string;

  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsEmail()
  @IsNotEmpty()
  readonly email: string;
}
