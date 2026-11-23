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
import livekitConfig from '../../config/livekit.config';
import { validate } from '../../config/env.validation';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(process.cwd(), '.env'),
        resolve(process.cwd(), '.env.development'),
        resolve(process.cwd(), '..', '..', '.env'),
        resolve(process.cwd(), '..', '..', '.env.development'),
        '.env',
        '.env.development',
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
        livekitConfig,
      ],
      validate,
      cache: true,
    }),
  ],
})
export class ConfigModule {}
