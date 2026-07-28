import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import {
  FileCategoryEnum,
  FileModuleEnum,
  BucketTypeEnum,
} from '@prisma/client';

export class UploadFileDto {
  @ApiProperty({
    enum: FileCategoryEnum,
    description: 'Category of the file being uploaded',
  })
  @IsEnum(FileCategoryEnum)
  fileType: FileCategoryEnum;

  @ApiProperty({
    enum: FileModuleEnum,
    description: 'Target system module code',
  })
  @IsEnum(FileModuleEnum)
  moduleCode: FileModuleEnum;

  @ApiPropertyOptional({
    enum: BucketTypeEnum,
    description: 'Target storage bucket type',
  })
  @IsOptional()
  @IsEnum(BucketTypeEnum)
  bucket?: BucketTypeEnum;

  @ApiPropertyOptional({
    description: 'Arbitrary JSON metadata string or object',
  })
  @IsOptional()
  metadata?: string | Record<string, unknown>;
}
