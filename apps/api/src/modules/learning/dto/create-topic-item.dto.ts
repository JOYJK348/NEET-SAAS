import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsObject,
  ValidateIf,
} from 'class-validator';
import { TopicItemType } from '@prisma/client';

export class CreateTopicItemDto {
  @ApiProperty({ description: 'Topic ID this item belongs to' })
  @IsString()
  @IsNotEmpty()
  topicId: string;

  @ApiProperty({ enum: TopicItemType })
  @IsEnum(TopicItemType)
  type: TopicItemType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ description: 'JSON content for TEXT type' })
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsObject()
  content?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: 'Storage URL for PDF/VIDEO' })
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsString()
  fileUrl?: string | null;

  @ApiPropertyOptional({ description: 'External URL for LINK/VIDEO' })
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsString()
  externalUrl?: string | null;

  @ApiPropertyOptional({ description: 'Metadata JSON' })
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsObject()
  metadata?: Record<string, unknown> | null;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsInt()
  @Min(0)
  displayOrder?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsInt()
  @Min(0)
  durationMins?: number | null;
}
