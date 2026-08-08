import { Module } from '@nestjs/common';
import { LiveClassController } from './controllers/live-class.controller';
import { LiveClassService } from './services/live-class.service';
import { LiveKitService } from './services/livekit.service';

@Module({
  controllers: [LiveClassController],
  providers: [LiveClassService, LiveKitService],
  exports: [LiveClassService, LiveKitService],
})
export class LiveModule {}
