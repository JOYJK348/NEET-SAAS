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
import { ChapterService } from '../services/chapter.service';
import { CreateChapterDto } from '../dto/create-chapter.dto';
import { UpdateChapterDto } from '../dto/update-chapter.dto';

@ApiTags('Master — Chapters')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'master/chapters', version: '1' })
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) {}

  @Post()
  @ApiOperation({ summary: 'Create a chapter' })
  create(
    @Body() dto: CreateChapterDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.chapterService.create(dto, user.tenantId!, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List chapters with pagination' })
  @ApiQuery({
    name: 'courseSubjectId',
    required: false,
    description: 'Filter by course-subject mapping',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  findAll(
    @Query() query: QueryParamsDto & { courseSubjectId?: string },
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.chapterService.findAll(
      user.tenantId!,
      query,
      query.courseSubjectId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a chapter by ID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.chapterService.findOne(id, user.tenantId!);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a chapter' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateChapterDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.chapterService.update(id, dto, user.tenantId!, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a chapter' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    await this.chapterService.remove(id, user.tenantId!, user.sub);
  }
}
