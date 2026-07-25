import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TenantScopedPrisma } from '../../common/utils/tenant-scoped-prisma';
import { TutorDashboardController } from './tutor-dashboard.controller';
import { TutorDashboardService } from './tutor-dashboard.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TutorDashboardController],
  providers: [TenantScopedPrisma, TutorDashboardService],
  exports: [TutorDashboardService],
})
export class TutorDashboardModule {}
