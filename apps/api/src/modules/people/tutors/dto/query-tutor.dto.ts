import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryParamsDto } from '../../../../common/dto/query-params.dto';

export class QueryTutorDto extends QueryParamsDto {
  @ApiPropertyOptional({ description: 'Filter by subject ID' })
  @IsOptional()
  @IsUUID('4')
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsOptional()
  @IsUUID('4')
  branchId?: string;

  @ApiPropertyOptional({
    description: 'Filter by status (ACTIVE, INACTIVE, PENDING, SUSPENDED)',
  })
  @IsOptional()
  @IsString()
  tutorStatus?: string;
}
