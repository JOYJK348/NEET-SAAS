import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';
import { StudentDashboardModule } from '../student-dashboard/student-dashboard.module';
import { ParentDashboardController } from './parent-dashboard.controller';
import { ParentDashboardService } from './parent-dashboard.service';
import { ParentGuard } from './guards/parent.guard';

@Module({
  imports: [PrismaModule, BillingModule, StudentDashboardModule],
  controllers: [ParentDashboardController],
  providers: [ParentDashboardService, ParentGuard],
  exports: [ParentDashboardService],
})
export class ParentDashboardModule {}
