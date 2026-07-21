import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class ReorderItem {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  displayOrder: number;
}

export class ReorderTopicItemsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  topicId: string;

  @ApiProperty({ type: [ReorderItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItem)
  items: ReorderItem[];
}
