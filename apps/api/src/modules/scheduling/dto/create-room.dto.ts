import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';
import { RoomTypeEnum } from '@prisma/client';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsEnum(RoomTypeEnum)
  roomType: RoomTypeEnum;

  @IsInt()
  @IsOptional()
  @Min(1)
  capacity?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
