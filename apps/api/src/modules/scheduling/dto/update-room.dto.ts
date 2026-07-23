import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsBoolean,
  Min,
} from 'class-validator';
import { RoomTypeEnum } from '@prisma/client';

export class UpdateRoomDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsEnum(RoomTypeEnum)
  @IsOptional()
  roomType?: RoomTypeEnum;

  @IsInt()
  @IsOptional()
  @Min(1)
  capacity?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
