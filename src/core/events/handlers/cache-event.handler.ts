import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { APP_EVENTS } from '../app-event.constants';
import type { AppEvent, CacheInvalidateRequestedPayload } from '../app-event.types';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class CacheEventHandler {
  private readonly logger = new Logger(CacheEventHandler.name);

  constructor(private readonly redisService: RedisService) {}

  @OnEvent(APP_EVENTS.CACHE.INVALIDATE_REQUESTED)
  async handleCacheInvalidateRequested(
    event: AppEvent<CacheInvalidateRequestedPayload>,
  ): Promise<void> {
    const payload = event.payload;

    if (payload.key) {
      await this.redisService.del(payload.key);
      this.logger.log(`Cache key deleted: ${payload.key}`);
    }

    if (payload.pattern) {
      const deleted = await this.redisService.deleteByPattern(payload.pattern);
      this.logger.log(`Cache pattern deleted: ${payload.pattern}, count: ${deleted}`);
    }

    if (payload.tags?.length) {
      for (const tag of payload.tags) {
        const deleted = await this.redisService.deleteByPattern(`tag:${tag}:*`);
        this.logger.log(`Cache tag deleted: ${tag}, count: ${deleted}`);
      }
    }
  }
}