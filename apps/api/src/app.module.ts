import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { ConfigModule } from './common/config/config.module';
import { RequestContextModule } from './common/middleware/request-context.module';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';

@Module({
  imports: [ConfigModule, RequestContextModule, HealthModule],
  controllers: [],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}


