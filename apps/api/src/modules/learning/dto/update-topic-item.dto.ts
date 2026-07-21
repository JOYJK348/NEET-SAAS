import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { TopicItemStatusType, CompletionRuleType } from '@prisma/client';

export class UpdateTopicItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: TopicItemStatusType })
  @IsOptional()
  @IsEnum(TopicItemStatusType)
  status?: TopicItemStatusType;

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

  @ApiPropertyOptional({ enum: CompletionRuleType })
  @IsOptional()
  @IsEnum(CompletionRuleType)
  completionRule?: CompletionRuleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
