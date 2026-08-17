import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePyqDto {
  @ApiProperty({ example: 'NEET 2024 Physics Question Paper' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 2024 })
  @IsNumber()
  @IsNotEmpty()
  year: number;

  @ApiProperty({ example: 'subj_physics_123' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ example: 'Physics' })
  @IsString()
  @IsNotEmpty()
  subjectName: string;

  @ApiPropertyOptional({ example: 'course_123' })
  @IsString()
  @IsOptional()
  courseId?: string;

  @ApiPropertyOptional({ example: 'NEET 2027 Crash Course' })
  @IsString()
  @IsOptional()
  courseName?: string;

  @ApiPropertyOptional({ example: 'batch_456' })
  @IsString()
  @IsOptional()
  batchId?: string;

  @ApiPropertyOptional({ example: 'Batch A - Morning' })
  @IsString()
  @IsOptional()
  batchName?: string;

  @ApiPropertyOptional({ example: 'NEET' })
  @IsString()
  @IsOptional()
  examType?: string;

  @ApiProperty({ example: 'https://storage.example.com/neet-2024-physics.pdf' })
  @IsString()
  @IsNotEmpty()
  paperUrl: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/neet-2024-physics-solutions.pdf' })
  @IsString()
  @IsOptional()
  solutionUrl?: string;

  @ApiPropertyOptional({ example: 99.0 })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'Complete NEET 2024 Physics question paper with step-by-step solutions.' })
  @IsString()
  @IsOptional()
  description?: string;
}
