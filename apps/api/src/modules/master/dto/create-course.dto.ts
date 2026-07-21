import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ example: 'NEET-DROPPER' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'NEET Dropper Course' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'NEET Dropper Course' })
  @IsString()
  @MaxLength(255)
  displayName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'REGULAR' })
  @IsOptional()
  @IsString()
  courseType?: string = 'REGULAR';

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  durationMonths?: number = 12;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  displayOrder?: number = 1;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;
}
