import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { LiveClassController } from './controllers/live-class.controller';
import { LiveClassWebhookController } from './controllers/live-class-webhook.controller';
import { LiveRecordingsController } from './controllers/live-recordings.controller';
import { LiveClassService } from './services/live-class.service';
import { LiveKitService } from './services/livekit.service';
import { LiveClassWebhookService } from './services/live-class-webhook.service';
import { LiveRecordingsService } from './services/live-recordings.service';

import { GoogleCalendarModule } from '../integrations/google-calendar/google-calendar.module';

@Module({
  imports: [
    GoogleCalendarModule,
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
  ],
  exports: [LiveClassService, LiveKitService],
})
export class LiveModule {}
