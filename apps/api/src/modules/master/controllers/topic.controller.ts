import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { QueryParamsDto } from '../../../common/dto/query-params.dto';
import { TopicService } from '../services/topic.service';
import { CreateTopicDto } from '../dto/create-topic.dto';
import { UpdateTopicDto } from '../dto/update-topic.dto';
import { ReorderTopicsDto } from '../dto/reorder.dto';

@ApiTags('Master — Topics')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'master/topics', version: '1' })
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Post()
  @ApiOperation({ summary: 'Create a topic' })
  create(
    @Body() dto: CreateTopicDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.topicService.create(dto, user.tenantId!, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List topics with pagination' })
  @ApiQuery({
    name: 'chapterId',
    required: false,
    description: 'Filter by chapter',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  findAll(
    @Query() query: QueryParamsDto & { chapterId?: string },
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.topicService.findAll(user.tenantId!, query, query.chapterId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a topic by ID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.topicService.findOne(id, user.tenantId!);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a topic' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTopicDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.topicService.update(id, dto, user.tenantId!, user.sub);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder topics within a chapter' })
  reorder(
    @Body() dto: ReorderTopicsDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.topicService.reorder(dto, user.tenantId!, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a topic' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    await this.topicService.remove(id, user.tenantId!, user.sub);
  }
}
