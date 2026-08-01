import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ParentDashboardController } from './parent-dashboard.controller';
import { ParentDashboardService } from './parent-dashboard.service';
import { ParentGuard } from './guards/parent.guard';

@Module({
  imports: [PrismaModule],
  controllers: [ParentDashboardController],
  providers: [ParentDashboardService, ParentGuard],
  exports: [ParentDashboardService],
})
export class ParentDashboardModule {}
