import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { ConfigModule } from './common/config/config.module';
import { RequestContextModule } from './common/middleware/request-context.module';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { LoggerModule } from './common/logger/logger.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { PeopleModule } from './modules/people/people.module';
import { StudentsModule } from './modules/students/students.module';
import { AdmissionsModule } from './modules/admissions/admissions.module';

@Module({
  imports: [
    ConfigModule,
    RequestContextModule,
    LoggerModule,
    PrismaModule,
    RedisModule,
    AuthModule,
    PeopleModule,
    StudentsModule,
    AdmissionsModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
