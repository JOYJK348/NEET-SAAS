import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { RequestContextService } from '../middleware/request-context.service';
import { RequestContextModule } from '../middleware/request-context.module';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [RequestContextModule],
      inject: [RequestContextService],
      useFactory: (requestContextService: RequestContextService) => ({
        pinoHttp: {
          customProps: () => {
            const ctx = requestContextService.get();
            return {
              requestId: ctx?.requestId,
              correlationId: ctx?.correlationId,
              tenantId: ctx?.tenantId,
              branchId: ctx?.branchId,
              academicYearId: ctx?.academicYearId,
              userId: ctx?.userId,
            };
          },
          transport:
            process.env.NODE_ENV !== 'production'
              ? {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    colorize: true,
                    translateTime: 'UTC:yyyy-mm-dd HH:MM:ss.l',
                  },
                }
              : undefined,
          autoLogging: true,
          serializers: {
            req: (req) => ({
              method: req.method,
              url: req.url,
              ip: req.ip,
            }),
            res: (res) => ({
              statusCode: res.statusCode,
            }),
          },
        },
      }),
    }),
  ],
})
export class LoggerModule {}
