import { Module } from '@nestjs/common';
import { RoomController } from './controllers/room.controller';
import { ScheduleController } from './controllers/schedule.controller';
import { SessionController } from './controllers/session.controller';
import { RoomService } from './services/room.service';
import { ScheduleService } from './services/schedule.service';
import { SessionGeneratorService } from './services/session-generator.service';
import { SessionService } from './services/session.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RoomController, ScheduleController, SessionController],
  providers: [
    RoomService,
    ScheduleService,
    SessionGeneratorService,
    SessionService,
  ],
  exports: [ScheduleService, SessionGeneratorService, SessionService],
})
export class SchedulingModule {}
