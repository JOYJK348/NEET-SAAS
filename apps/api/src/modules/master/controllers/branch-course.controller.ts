import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import type { AuthenticatedRequestUser } from '../../auth/auth.types';
import { BranchCourseService } from '../services/branch-course.service';
import { MapBranchCourseDto } from '../dto/map-branch-course.dto';

@ApiTags('Master — Branch Courses')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'master/branch-courses', version: '1' })
export class BranchCourseController {
  constructor(private readonly branchCourseService: BranchCourseService) {}

  @Post()
  @ApiOperation({ summary: 'Map a course to a branch' })
  create(
    @Body() dto: MapBranchCourseDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.branchCourseService.create(dto, user.tenantId!, user.sub);
  }

  @Get('by-branch/:branchId')
  @ApiOperation({ summary: 'List courses mapped to a branch' })
  findByBranch(
    @Param('branchId') branchId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.branchCourseService.findByBranch(branchId, user.tenantId!);
  }

  @Get()
  @ApiOperation({ summary: 'List all branch courses mappings' })
  findAll(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.branchCourseService.findAll(user.tenantId!);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a course mapping from a branch' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    await this.branchCourseService.remove(id, user.tenantId!, user.sub);
  }
}
