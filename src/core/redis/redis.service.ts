import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    });

    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (error) => this.logger.error(error.message));
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