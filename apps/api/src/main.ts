import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import {
  ValidationPipe,
  BadRequestException,
  VersioningType,
} from '@nestjs/common';
import { RequestContextService } from './common/middleware/request-context.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Set pino logger
  app.useLogger(app.get(Logger));

  // Enable trust proxy for headers like X-Forwarded-For
  const httpAdapter = app.getHttpAdapter();
  /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
  if (
    typeof httpAdapter.getInstance === 'function' &&
    typeof httpAdapter.getInstance().set === 'function'
  ) {
    httpAdapter.getInstance().set('trust proxy', 1);
  }
  /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

  // Security Middlewares
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production' ? undefined : false,
    }),
  );
  app.use(cookieParser());
  app.use(compression());

  // Body limits
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  // Configure CORS
  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Accept, Authorization, X-Requested-With, x-request-id, x-correlation-id, x-tenant-id, x-branch-id, x-academic-year-id',
  });

  // Global prefixes and versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Setup Swagger API documentation
  // We place this *after* prefix and versioning so it reflects global prefix routing

  const { setupSwagger } = await import('./common/swagger/swagger.setup.js');
  setupSwagger(app);

  const requestContextService = app.get(RequestContextService);
  app.useGlobalFilters(new GlobalExceptionFilter(requestContextService));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (validationErrors = []) => {
        return new BadRequestException(
          validationErrors.map((error) => ({
            field: error.property,
            message: Object.values(error.constraints || {}).join(', '),
          })),
        );
      },
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
