import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { EncryptionService } from '../../../common/security/encryption.service';
import { GoogleAuthService } from './google-auth.service';
import { GoogleCalendarService } from './google-calendar.service';
import { CalendarSyncService } from './calendar-sync.service';
import { GoogleCalendarController } from './google-calendar.controller';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [GoogleCalendarController],
  providers: [
    EncryptionService,
    GoogleAuthService,
    GoogleCalendarService,
    CalendarSyncService,
  ],
  exports: [GoogleAuthService, GoogleCalendarService, CalendarSyncService],
})
export class GoogleCalendarModule {}
