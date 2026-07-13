import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { ConfigModule } from './common/config/config.module';

@Module({
  imports: [ConfigModule, HealthModule],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}

