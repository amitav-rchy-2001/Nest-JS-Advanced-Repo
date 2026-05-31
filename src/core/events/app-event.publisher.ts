import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { AppEvent, PublishEventOptions } from './app-event.types';

@Injectable()
export class AppEventPublisher {
  private readonly logger = new Logger(AppEventPublisher.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async publish<TPayload>(
    name: string,
    payload: TPayload,
    options: PublishEventOptions = {},
  ): Promise<AppEvent<TPayload>> {
    const event: AppEvent<TPayload> = {
      id: randomUUID(),
      name,
      payload,
      source: options.source ?? 'unknown',
      actorId: options.actorId,
      requestId: options.requestId,
      occurredAt: new Date().toISOString(),
    };

    this.logger.debug(`Publishing event: ${name}`);

    await this.eventEmitter.emitAsync(name, event);

    return event;
  }

  publishSync<TPayload>(
    name: string,
    payload: TPayload,
    options: PublishEventOptions = {},
  ): AppEvent<TPayload> {
    const event: AppEvent<TPayload> = {
      id: randomUUID(),
      name,
      payload,
      source: options.source ?? 'unknown',
      actorId: options.actorId,
      requestId: options.requestId,
      occurredAt: new Date().toISOString(),
    };

    this.logger.debug(`Publishing sync event: ${name}`);

    this.eventEmitter.emit(name, event);

    return event;
  }
}
