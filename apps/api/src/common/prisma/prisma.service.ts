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
    const maxRetries = 5;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Successfully connected to database');
        return;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Database connection attempt ${attempt}/${maxRetries} failed: ${errMsg}`,
        );
        if (attempt === maxRetries) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }
}
