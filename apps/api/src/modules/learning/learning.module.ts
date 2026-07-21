import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { TenantScopedPrisma } from '../../common/utils/tenant-scoped-prisma';
import { TopicItemController } from './controllers/topic-item.controller';
import { TopicItemService } from './services/topic-item.service';

@Module({
  imports: [PrismaModule],
  controllers: [TopicItemController],
  providers: [TenantScopedPrisma, TopicItemService],
  exports: [TopicItemService],
})
export class LearningModule {}
