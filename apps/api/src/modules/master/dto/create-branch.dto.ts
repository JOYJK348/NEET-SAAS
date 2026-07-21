import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BranchType {
  HEAD_OFFICE = 'HEAD_OFFICE',
  CAMPUS = 'CAMPUS',
  FRANCHISE = 'FRANCHISE',
  ONLINE = 'ONLINE',
}

export class CreateBranchDto {
  @ApiProperty({ example: 'CHN-MAIN' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'chn-main' })
  @IsString()
  @MaxLength(100)
  slug: string;

  @ApiProperty({ example: 'Chennai Main Campus' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'Chennai Main Campus' })
  @IsString()
  @MaxLength(255)
  displayName: string;

  @ApiProperty({ example: 'branch@neetacademy.com' })
  @IsString()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: '+91-9876543210' })
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiProperty({ enum: BranchType, example: BranchType.CAMPUS })
  @IsEnum(BranchType)
  branchType: BranchType;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string = 'ACTIVE';

  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
  @IsOptional()
  @IsString()
  timezone?: string = 'Asia/Kolkata';

  @ApiPropertyOptional({
    description: 'Academic Year ID this branch is associated with',
  })
  @IsOptional()
  @IsString()
  academicYearId?: string;
}
