import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PyqService } from './pyq.service';
import { CreatePyqDto } from './dto/create-pyq.dto';
import { VerifyPyqPaymentDto } from './dto/verify-pyq-payment.dto';

import { Public } from '../../common/decorators/public.decorator';

@ApiTags('PYQ (Previous Year Question Papers)')
@Controller({ path: 'pyq', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PyqController {
  constructor(private readonly pyqService: PyqService) {}

  @Get()
  @ApiOperation({ summary: 'List Previous Year Question Papers (Subject & Year filterable)' })
  @ApiQuery({ name: 'subjectId', required: false, type: String })
  @ApiQuery({ name: 'year', required: false, type: Number })
  async findAll(
    @Req() req: any,
    @Query('subjectId') subjectId?: string,
    @Query('year') year?: number,
  ) {
    const tenantId = req.user?.tenantId || 'review-academy';
    const userRole = req.user?.roleCode || 'STUDENT';
    const userId = req.user?.sub || req.user?.id;

    return this.pyqService.findAll(tenantId, {
      subjectId,
      year: year ? Number(year) : undefined,
      userRole,
      userId,
    });
  }

  @Public()
  @Get(':id/file')
  @ApiOperation({ summary: 'Stream Question Paper PDF directly to browser (Zero Expiration / No JWT Error)' })
  async streamPaperFile(
    @Req() req: any,
    @Param('id') id: string,
    @Res() res: any,
  ) {
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.roleCode || 'STUDENT';
    const userId = req.user?.sub || req.user?.id;

    const { buffer, mimeType, fileName } = await this.pyqService.getPaperFileBuffer(tenantId, userId, userRole, id, 'PAPER');

    res.setHeader('Content-Type', mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('Cache-Control', 'private, max-age=86400');
    return res.send(buffer);
  }

  @Public()
  @Get(':id/solution')
  @ApiOperation({ summary: 'Stream Solution PDF directly to browser (Zero Expiration / No JWT Error)' })
  async streamSolutionFile(
    @Req() req: any,
    @Param('id') id: string,
    @Res() res: any,
  ) {
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.roleCode || 'STUDENT';
    const userId = req.user?.sub || req.user?.id;

    const { buffer, mimeType, fileName } = await this.pyqService.getPaperFileBuffer(tenantId, userId, userRole, id, 'SOLUTION');

    res.setHeader('Content-Type', mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('Cache-Control', 'private, max-age=86400');
    return res.send(buffer);
  }

  @Post()
  @ApiOperation({ summary: 'Upload a Previous Year Question Paper (Tenant Admin)' })
  async createPyq(@Req() req: any, @Body() dto: CreatePyqDto) {
    const tenantId = req.user?.tenantId || 'review-academy';
    const userId = req.user?.sub || req.user?.id;

    return this.pyqService.createPyq(tenantId, userId, dto);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle Active/Inactive status for Question Paper (Tenant Admin)' })
  async toggleStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('isActive') isActive?: boolean,
  ) {
    const tenantId = req.user?.tenantId || 'review-academy';

    return this.pyqService.toggleStatus(tenantId, id, isActive);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Question Paper (Tenant Admin)' })
  async deletePyq(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || 'review-academy';

    return this.pyqService.deletePyq(tenantId, id);
  }

  @Post(':id/checkout')
  @ApiOperation({ summary: 'Create Razorpay order to unlock paid PYQ (Student)' })
  async createCheckoutOrder(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || 'review-academy';
    const userId = req.user?.sub || req.user?.id;

    return this.pyqService.createCheckoutOrder(tenantId, userId, id);
  }

  @Post(':id/verify-payment')
  @ApiOperation({ summary: 'Verify Razorpay payment signature & unlock PYQ (Student)' })
  async verifyPayment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: VerifyPyqPaymentDto,
  ) {
    const tenantId = req.user?.tenantId || 'review-academy';
    const userId = req.user?.sub || req.user?.id;

    return this.pyqService.verifyPayment(tenantId, userId, id, dto);
  }
}
