import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { APP_EVENTS } from '../app-event.constants';
import type { AppEvent, WebhookDispatchRequestedPayload } from '../app-event.types';
import { WebhookService } from '../../webhook/webhook.service';
import { QueueDispatchService } from '../../queue/queue-dispatch.service';

@Injectable()
export class WebhookEventHandler {
  private readonly logger = new Logger(WebhookEventHandler.name);

  constructor(
    private readonly webhookService: WebhookService,
    private readonly queueDispatchService: QueueDispatchService,
  ) {}

  @OnEvent(APP_EVENTS.WEBHOOK.DISPATCH_REQUESTED)
  async handleWebhookDispatchRequested(
    event: AppEvent<WebhookDispatchRequestedPayload>,
  ): Promise<void> {
    const delivery = await this.webhookService.createDelivery(event.payload);

    await this.queueDispatchService.addWebhookJob('dispatch-webhook', {
      ...event.payload,
      deliveryId: delivery.id,
    });

    this.logger.log(`Webhook delivery queued: ${delivery.id}`);
  }
}
