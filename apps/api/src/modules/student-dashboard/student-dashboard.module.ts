import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TenantScopedPrisma } from '../../common/utils/tenant-scoped-prisma';
import { StudentDashboardController } from './student-dashboard.controller';
import { StudentDashboardService } from './student-dashboard.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [StudentDashboardController],
  providers: [TenantScopedPrisma, StudentDashboardService],
  exports: [StudentDashboardService],
})
export class StudentDashboardModule {}
