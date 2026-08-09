import { IsString, IsNotEmpty, IsUUID, IsDateString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScheduleLiveClassDto {
  @ApiProperty({ description: 'Course ID' })
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ description: 'Batch ID' })
  @IsUUID()
  @IsNotEmpty()
  batchId: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ description: 'Chapter ID' })
  @IsUUID()
  @IsNotEmpty()
  chapterId: string;

  @ApiProperty({ description: 'Topic ID' })
  @IsUUID()
  @IsNotEmpty()
  topicId: string;

  @ApiProperty({ description: 'Primary teacher staff profile ID' })
  @IsUUID()
  @IsNotEmpty()
  teacherStaffProfileId: string;

  @ApiProperty({ description: 'Class title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Class subtitle' })
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiPropertyOptional({ description: 'Class description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Scheduled start (ISO 8601)' })
  @IsDateString()
  scheduledStart: string;

  @ApiProperty({ description: 'Scheduled end (ISO 8601)' })
  @IsDateString()
  scheduledEnd: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  recordingEnabled?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  whiteboardEnabled?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  chatEnabled?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  screenShareEnabled?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  waitingRoomEnabled?: boolean;
}
