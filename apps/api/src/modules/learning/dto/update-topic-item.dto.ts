import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsBoolean,
  IsObject,
  ValidateIf,
} from 'class-validator';
import { TopicItemStatusType, CompletionRuleType } from '@prisma/client';

export class UpdateTopicItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsString()
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsObject()
  content?: Record<string, unknown> | null;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsString()
  fileUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsString()
  externalUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsObject()
  metadata?: Record<string, unknown> | null;

  @ApiPropertyOptional({ enum: TopicItemStatusType })
  @IsOptional()
  @IsEnum(TopicItemStatusType)
  status?: TopicItemStatusType;

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

  @ApiPropertyOptional({ enum: CompletionRuleType })
  @IsOptional()
  @IsEnum(CompletionRuleType)
  completionRule?: CompletionRuleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
