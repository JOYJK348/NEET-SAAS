import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SectionMarkItemDto {
  @ApiProperty({ description: 'Section ID or Code' })
  @IsString()
  sectionId: string;

  @ApiProperty({ description: 'Section Name (e.g. Physics Section A)' })
  @IsString()
  sectionName: string;

  @ApiProperty({ description: 'Marks obtained in section' })
  @IsNumber()
  @Min(0)
  obtainedMarks: number;

  @ApiProperty({ description: 'Maximum marks for section' })
  @IsNumber()
  @Min(0)
  maxMarks: number;
}

export class EvaluateSubmissionDto {
  @ApiProperty({ description: 'Total obtained marks across all sections' })
  @IsNumber()
  @Min(0)
  obtainedMarks: number;

  @ApiPropertyOptional({
    type: [SectionMarkItemDto],
    description: 'Detailed breakdown of marks per section',
  })
  @IsOptional()
  @IsArray()
  marksBreakdown?: SectionMarkItemDto[];

  @ApiPropertyOptional({ description: 'Tutor feedback and evaluation notes' })
  @IsOptional()
  @IsString()
  tutorNotes?: string;

  @ApiPropertyOptional({ description: 'Reason for mark edit or re-evaluation' })
  @IsOptional()
  @IsString()
  reason?: string;
}
