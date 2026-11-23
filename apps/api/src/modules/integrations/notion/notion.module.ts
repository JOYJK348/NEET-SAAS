import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { RedisModule } from '../../../common/redis/redis.module';
import { EncryptionService } from '../../../common/security/encryption.service';
import { NotionClientService } from './notion-client.service';
import { NotionBlockBuilderService } from './notion-block-builder.service';
import { NotionIntegrationService } from './notion-integration.service';
import { NotionSyncWorkerService } from './notion-sync-worker.service';
import { NotionController } from './notion.controller';

@Module({
  imports: [PrismaModule, ConfigModule, RedisModule],
  controllers: [NotionController],
  providers: [
    EncryptionService,
    NotionClientService,
    NotionBlockBuilderService,
    NotionIntegrationService,
    NotionSyncWorkerService,
  ],
  exports: [
    NotionClientService,
    NotionBlockBuilderService,
    NotionIntegrationService,
    NotionSyncWorkerService,
  ],
})
export class NotionModule {}

