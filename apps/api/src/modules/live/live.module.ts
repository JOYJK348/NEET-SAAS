import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { LiveClassController } from './controllers/live-class.controller';
import { LiveClassWebhookController } from './controllers/live-class-webhook.controller';
import { LiveRecordingsController } from './controllers/live-recordings.controller';
import { LiveClassService } from './services/live-class.service';
import { LiveKitService } from './services/livekit.service';
import { LiveClassWebhookService } from './services/live-class-webhook.service';
import { LiveRecordingsService } from './services/live-recordings.service';
import { RecordedClassAiWorkerService } from './services/recorded-class-ai-worker.service';
import { RecordedClassNotesService } from './services/recorded-class-notes.service';

import { GoogleCalendarModule } from '../integrations/google-calendar/google-calendar.module';
import { NotionModule } from '../integrations/notion/notion.module';
import { LearningModule } from '../learning/learning.module';

@Module({
  imports: [
    GoogleCalendarModule,
    NotionModule,
    LearningModule,
    MulterModule.register({
      limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max video file upload
    }),
  ],
  controllers: [
    LiveClassController,
    LiveClassWebhookController,
    LiveRecordingsController,
  ],
  providers: [
    LiveClassService,
    LiveKitService,
    LiveClassWebhookService,
    LiveRecordingsService,
    RecordedClassAiWorkerService,
    RecordedClassNotesService,
  ],
  exports: [
    LiveClassService,
    LiveKitService,
    RecordedClassAiWorkerService,
    RecordedClassNotesService,
  ],
})
export class LiveModule {}
