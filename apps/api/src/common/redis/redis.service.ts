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
  private redisClient: Redis | null = null;

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
      password: password || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: () => null,
    });

    this.redisClient.on('connect', () => {
      this.logger.log(`Successfully connected to Redis instance at ${host}:${port}`);
    });

    this.redisClient.on('error', (err) => {
      this.logger.debug(`Redis connection event error: ${this.sanitizeError(err)}`);
    });

    this.redisClient.connect().catch((err) => {
      this.logger.error(`Failed to initiate Redis connection to ${host}:${port}: ${this.sanitizeError(err)}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        this.logger.log('Disconnected from Redis');
      } catch {
        // Ignore disconnect errors during teardown
      }
    }
  }

  /**
   * Safely checks if Redis client is instantiated and ready to process commands.
   */
  public isAvailable(): boolean {
    return (
      this.redisClient !== null &&
      (this.redisClient.status === 'ready' || this.redisClient.status === 'connecting')
    );
  }

  /**
   * Get raw ioredis client instance for advanced features (locks, hashes, transactions).
   */
  get client(): Redis | null {
    return this.redisClient;
  }

  async get(key: string): Promise<string | null> {
    if (!this.isAvailable() || !this.redisClient) return null;
    try {
      return await this.redisClient.get(key);
    } catch (err) {
      this.logger.warn(`Redis GET failed for key "${key}": ${this.sanitizeError(err)}`);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isAvailable() || !this.redisClient) return;
    try {
      if (ttlSeconds) {
        await this.redisClient.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.redisClient.set(key, value);
      }
    } catch (err) {
      this.logger.warn(`Redis SET failed for key "${key}": ${this.sanitizeError(err)}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isAvailable() || !this.redisClient) return;
    try {
      await this.redisClient.del(key);
    } catch (err) {
      this.logger.warn(`Redis DEL failed for key "${key}": ${this.sanitizeError(err)}`);
    }
  }

  async ttl(key: string): Promise<number> {
    if (!this.isAvailable() || !this.redisClient) return -1;
    try {
      return await this.redisClient.ttl(key);
    } catch (err) {
      this.logger.warn(`Redis TTL failed for key "${key}": ${this.sanitizeError(err)}`);
      return -1;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.isAvailable() || !this.redisClient) return [];
    try {
      return await this.redisClient.keys(pattern);
    } catch (err) {
      this.logger.warn(`Redis KEYS failed for pattern "${pattern}": ${this.sanitizeError(err)}`);
      return [];
    }
  }

  /**
   * Sanitizes error messages to ensure passwords, URLs, or secrets are never printed in logs.
   */
  private sanitizeError(err: unknown): string {
    if (!err) return 'Unknown error';
    const message = err instanceof Error ? err.message : String(err);
    // Mask passwords or connection URIs if present in error message string
    return message
      .replace(/:[^:@\s]+@/g, ':****@')
      .replace(/password=[^\s&]+/gi, 'password=****');
  }
}
