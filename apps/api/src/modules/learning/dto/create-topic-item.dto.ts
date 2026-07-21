import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsObject,
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
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'JSON content for TEXT type' })
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Storage URL for PDF/VIDEO' })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({ description: 'External URL for LINK/VIDEO' })
  @IsOptional()
  @IsString()
  externalUrl?: string;

  @ApiPropertyOptional({ description: 'Metadata JSON' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  displayOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMins?: number;
}
