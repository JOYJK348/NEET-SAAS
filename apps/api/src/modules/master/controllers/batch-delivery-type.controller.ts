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
import { BatchDeliveryTypeService } from '../services/batch-delivery-type.service';
import { CreateBatchDeliveryTypeDto } from '../dto/create-batch-delivery-type.dto';

@ApiTags('Master — Batch Delivery Types')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'master/batch-delivery-types', version: '1' })
export class BatchDeliveryTypeController {
  constructor(
    private readonly batchDeliveryTypeService: BatchDeliveryTypeService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a batch delivery type' })
  create(
    @Body() dto: CreateBatchDeliveryTypeDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.batchDeliveryTypeService.create(dto, user.tenantId!, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List batch delivery types with pagination' })
  findAll(
    @Query() query: QueryParamsDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.batchDeliveryTypeService.findAll(user.tenantId!, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a batch delivery type by ID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.batchDeliveryTypeService.findOne(id, user.tenantId!);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a batch delivery type' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateBatchDeliveryTypeDto>,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.batchDeliveryTypeService.update(
      id,
      dto,
      user.tenantId!,
      user.sub,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a batch delivery type' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    await this.batchDeliveryTypeService.remove(id, user.tenantId!, user.sub);
  }
}
