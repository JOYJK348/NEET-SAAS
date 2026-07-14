import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    const dbUrl = configService.get<string>('database.url');
    super({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
      log:
        process.env.NODE_ENV !== 'production'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'stdout', level: 'info' },
              { emit: 'stdout', level: 'warn' },
              { emit: 'stdout', level: 'error' },
            ]
          : [{ emit: 'stdout', level: 'error' }],
    });

    if (process.env.NODE_ENV !== 'production') {
      // Bind query telemetry logging
      /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
      (this as any).$on('query', (e: any) => {
        this.logger.debug(
          `Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`,
        );
      });
      /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
    }
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Successfully connected to database');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }
}
