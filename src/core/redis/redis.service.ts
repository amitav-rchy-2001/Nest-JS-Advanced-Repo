import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private hasLoggedConnectionError = false;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      maxRetriesPerRequest: 1,
      retryStrategy: (attempt) => Math.min(attempt * 200, 2_000),
    });

    this.client.on('connect', () => {
      this.hasLoggedConnectionError = false;
      this.logger.log('Redis connected');
    });
    this.client.on('error', (error) => {
      if (this.hasLoggedConnectionError) {
        return;
      }

      this.hasLoggedConnectionError = true;
      this.logger.error(
        `${error.message}. Start Redis or update REDIS_HOST/REDIS_PORT.`,
      );
    });
  }

  getClient() {
    return this.client;
  }

  async set(key: string, value: unknown, ttlSeconds?: number) {
    const serialized = JSON.stringify(value);

    if (ttlSeconds) {
      await this.client.set(key, serialized, 'EX', ttlSeconds);
      return;
    }

    await this.client.set(key, serialized);
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const value = await this.client.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  }

  async del(key: string) {
    return this.client.del(key);
  }

  async deleteByPattern(pattern: string) {
    const keys = await this.client.keys(pattern);

    if (!keys.length) {
      return 0;
    }

    return this.client.del(...keys);
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
