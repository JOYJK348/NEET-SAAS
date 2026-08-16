import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from '../../auth/auth.types';
import { FeePlanService } from './fee-plan.service';
import { CreateFeePlanDto, CreateInstallmentPlanDto, UpdateFeePlanDto } from '../dto/fee-plan.dto';

@ApiTags('Billing – Fee Plans')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'billing/fee-plans', version: '1' })
export class FeePlanController {
  constructor(private readonly feePlanService: FeePlanService) {}

  @Get()
  @ApiOperation({ summary: 'List all fee plans with items and installment plans' })
  @ApiResponse({ status: 200, description: 'Fee plans retrieved successfully' })
  findAll(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.feePlanService.findAllFeePlans(user.tenantId!);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single fee plan with line items and installment plans' })
  @ApiResponse({ status: 200, description: 'Fee plan retrieved' })
  @ApiResponse({ status: 404, description: 'Fee plan not found' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.feePlanService.findOneFeePlan(id, user.tenantId!);
  }

  @Post()
  @ApiOperation({ summary: 'Create new fee plan (FeeStructure + FeeStructureItems)' })
  @ApiResponse({ status: 201, description: 'Fee plan created successfully' })
  create(
    @Body() dto: CreateFeePlanDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.feePlanService.createFeePlan(user.tenantId!, user.sub, dto);
  }

  @Post(':id/installment-plans')
  @ApiOperation({ summary: 'Add installment plan to fee structure' })
  @ApiResponse({ status: 201, description: 'Installment plan created' })
  createInstallmentPlan(
    @Param('id') id: string,
    @Body() dto: CreateInstallmentPlanDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.feePlanService.createInstallmentPlan(id, user.tenantId!, user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update existing fee plan' })
  @ApiResponse({ status: 200, description: 'Fee plan updated' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFeePlanDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.feePlanService.updateFeePlan(id, user.tenantId!, user.sub, dto);
  }
}
