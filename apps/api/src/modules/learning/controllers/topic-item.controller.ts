import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import type { AuthenticatedRequestUser } from '../../auth/auth.types';
import { TopicItemService } from '../services/topic-item.service';
import { CreateTopicItemDto } from '../dto/create-topic-item.dto';
import { UpdateTopicItemDto } from '../dto/update-topic-item.dto';
import { ReorderTopicItemsDto } from '../dto/reorder-topic-items.dto';

@ApiTags('Learning — Topic Items')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'learning/topic-items', version: '1' })
export class TopicItemController {
  constructor(private readonly topicItemService: TopicItemService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new topic item' })
  create(
    @Body() dto: CreateTopicItemDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.topicItemService.create(dto, user.tenantId!, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List topic items by topic' })
  @ApiQuery({ name: 'topicId', required: true })
  findByTopic(
    @Query('topicId') topicId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.topicItemService.findByTopic(topicId, user.tenantId!);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get topic item by ID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.topicItemService.findOne(id, user.tenantId!);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update topic item' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTopicItemDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.topicItemService.update(id, dto, user.tenantId!, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete topic item' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.topicItemService.remove(id, user.tenantId!, user.sub);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder topic items within a topic' })
  reorder(
    @Body() dto: ReorderTopicItemsDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.topicItemService.reorder(dto, user.tenantId!, user.sub);
  }
}
