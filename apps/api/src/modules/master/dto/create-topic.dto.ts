import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTopicDto {
  @ApiProperty()
  @IsString()
  chapterId: string;

  @ApiProperty({ example: 'PHY-CH01-T01' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Units & Dimensions' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  learningObjectives?: string;

  @ApiPropertyOptional({ example: 'MEDIUM' })
  @IsOptional()
  @IsString()
  difficultyLevel?: string = 'MEDIUM';

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  plannedHours?: number = 4;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  plannedSessions?: number = 3;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  displayOrder?: number = 1;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
