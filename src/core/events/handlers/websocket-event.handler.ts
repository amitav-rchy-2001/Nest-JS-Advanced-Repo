import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { APP_EVENTS } from '../app-event.constants';
import type { AppEvent, WebsocketEmitRequestedPayload } from '../app-event.types';
import { QueueDispatchService } from '../../queue/queue-dispatch.service';

@Injectable()
export class WebsocketEventHandler {
  private readonly logger = new Logger(WebsocketEventHandler.name);

  constructor(private readonly queueDispatchService: QueueDispatchService) {}

  @OnEvent(APP_EVENTS.WEBSOCKET.EMIT_REQUESTED)
  async handleWebsocketEmitRequested(
    event: AppEvent<WebsocketEmitRequestedPayload>,
  ): Promise<void> {
    await this.queueDispatchService.addWebsocketJob(
      'emit',
      event.payload as unknown as Record<string, unknown>,
    );

    this.logger.log(
      `WebSocket emit queued. Room: ${event.payload.room}, Event: ${event.payload.event}`,
    );
  }
}