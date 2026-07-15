import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { resolve } from 'path';
import appConfig from '../../config/app.config';
import databaseConfig from '../../config/database.config';
import redisConfig from '../../config/redis.config';
import jwtConfig from '../../config/jwt.config';
import mailConfig from '../../config/mail.config';
import storageConfig from '../../config/storage.config';
import queueConfig from '../../config/queue.config';
import swaggerConfig from '../../config/swagger.config';
import { validate } from '../../config/env.validation';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(__dirname, '..', '..', '..', '..', '..', '..', '.env'),
        resolve(__dirname, '..', '..', '..', '..', '..', '.env'),
        '.env',
      ],
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        jwtConfig,
        mailConfig,
        storageConfig,
        queueConfig,
        swaggerConfig,
      ],
      validate,
      cache: true,
    }),
  ],
})
export class ConfigModule {}
