import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { RoomTypeEnum } from '@prisma/client';

export class QueryRoomDto {
  @IsString()
  @IsOptional()
  branchId?: string;

  @IsEnum(RoomTypeEnum)
  @IsOptional()
  roomType?: RoomTypeEnum;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  search?: string;
}
