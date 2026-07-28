import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class BatchSignedUrlsDto {
  @ApiProperty({
    type: [String],
    description: 'Array of FileUpload record IDs',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsString({ each: true })
  fileUploadIds: string[];

  @ApiPropertyOptional({ description: 'Custom expiration time in seconds' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? Number(value) : undefined))
  expiresInSeconds?: number;

  @ApiPropertyOptional({
    description: 'Set true to enable attachment download Content-Disposition',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  download?: boolean;
}
