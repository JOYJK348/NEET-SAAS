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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import type { AuthenticatedRequestUser } from '../../auth/auth.types';
import { QueryParamsDto } from '../../../common/dto/query-params.dto';
import { SubjectService } from '../services/subject.service';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { UpdateSubjectDto } from '../dto/update-subject.dto';

@ApiTags('Master — Subjects')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'master/subjects', version: '1' })
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  @ApiOperation({ summary: 'Create a subject' })
  create(
    @Body() dto: CreateSubjectDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.subjectService.create(dto, user.tenantId!, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List subjects with pagination' })
  findAll(
    @Query() query: QueryParamsDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.subjectService.findAll(user.tenantId!, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subject by ID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.subjectService.findOne(id, user.tenantId!);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a subject' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSubjectDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.subjectService.update(id, dto, user.tenantId!, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a subject' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    await this.subjectService.remove(id, user.tenantId!, user.sub);
  }
}
