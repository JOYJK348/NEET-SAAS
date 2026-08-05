import { Module } from '@nestjs/common';
import { TenantDashboardController } from './tenant-dashboard.controller';
import { TenantDashboardService } from './tenant-dashboard.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TenantDashboardController],
  providers: [TenantDashboardService],
  exports: [TenantDashboardService],
})
export class TenantDashboardModule {}
