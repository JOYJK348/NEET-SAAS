import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { RequestContextService } from './common/middleware/request-context.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

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
