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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedRequestUser } from '../../auth/auth.types';
import { QueryParamsDto } from '../../../common/dto/query-params.dto';
import { BranchService } from '../services/branch.service';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';

@ApiTags('Master — Branches')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'master/branches', version: '1' })
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('branches.create')
  @ApiOperation({ summary: 'Create a branch' })
  @ApiResponse({ status: 201, description: 'Branch created' })
  create(
    @Body() dto: CreateBranchDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.branchService.create(dto, user.tenantId!, user.sub);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions('branches.read')
  @ApiOperation({ summary: 'List branches with pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortBy', required: false, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  findAll(
    @Query() query: QueryParamsDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.branchService.findAll(user.tenantId!, query);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('branches.read')
  @ApiOperation({ summary: 'Get a branch by ID' })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.branchService.findOne(id, user.tenantId!);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('branches.update')
  @ApiOperation({ summary: 'Update a branch' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.branchService.update(id, dto, user.tenantId!, user.sub);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('branches.delete')
  @ApiOperation({ summary: 'Soft-delete a branch' })
  @ApiResponse({ status: 204, description: 'Branch deleted' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    await this.branchService.remove(id, user.tenantId!, user.sub);
  }
}
