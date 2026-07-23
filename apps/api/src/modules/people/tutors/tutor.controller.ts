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
import { TutorService } from './tutor.service';
import { CreateTutorDto } from './dto/create-tutor.dto';
import { UpdateTutorDto } from './dto/update-tutor.dto';
import { QueryTutorDto } from './dto/query-tutor.dto';

@ApiTags('People — Tutors')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'people/tutors', version: '1' })
export class TutorController {
  constructor(private readonly tutorService: TutorService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a tutor (User + StaffProfile + Subjects + Qualifications)',
  })
  create(
    @Body() dto: CreateTutorDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.tutorService.create(dto, user.tenantId!, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List tutors with pagination, search, and filters' })
  findAll(
    @Query() query: QueryTutorDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.tutorService.findAll(user.tenantId!, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tutor detail' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.tutorService.findOne(id, user.tenantId!);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tutor profile' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTutorDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.tutorService.update(id, dto, user.tenantId!, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a tutor' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    await this.tutorService.remove(id, user.tenantId!, user.sub);
    return { success: true };
  }
}
