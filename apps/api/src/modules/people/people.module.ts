import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TenantScopedPrisma } from '../../common/utils/tenant-scoped-prisma';
import { TutorController } from './tutors/tutor.controller';
import { TutorService } from './tutors/tutor.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TutorController],
  providers: [TenantScopedPrisma, TutorService],
  exports: [TenantScopedPrisma, TutorService],
})
export class PeopleModule {}
