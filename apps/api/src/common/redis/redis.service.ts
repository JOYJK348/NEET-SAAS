import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient!: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    if (!this.configService.get<boolean>('redis.enabled')) {
      this.logger.warn('Redis is disabled — skipping connection');
      return;
    }

    const host = this.configService.get<string>('redis.host') || '';
    const port = this.configService.get<number>('redis.port') || 6379;
    const password = this.configService.get<string>('redis.password');

    this.redisClient = new Redis({
      host,
      port,
      password,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: () => null,
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Successfully connected to Redis');
    });

    this.redisClient.on('error', () => {});

    this.redisClient.connect().catch((err) => {
      this.logger.error('Failed to initiate Redis connection:', String(err));
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.log('Disconnected from Redis');
    }
  }

  /**
   * Get raw ioredis client instance for advanced features (locks, hashes, transactions).
   */
  get client(): Redis {
    return this.redisClient;
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redisClient.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async ttl(key: string): Promise<number> {
    return this.redisClient.ttl(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.redisClient.keys(pattern);
  }
}
