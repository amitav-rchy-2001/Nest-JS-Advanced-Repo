import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { APP_EVENTS, QUEUE_NAMES } from '../app-event.constants';
import type { AppEvent, QueueJobRequestedPayload } from '../app-event.types';
import { QueueDispatchService } from '../../queue/queue-dispatch.service';

@Injectable()
export class QueueEventHandler {
  private readonly logger = new Logger(QueueEventHandler.name);

  constructor(private readonly queueDispatchService: QueueDispatchService) {}

  @OnEvent(APP_EVENTS.QUEUE.JOB_REQUESTED)
  async handleQueueJobRequested(
    event: AppEvent<QueueJobRequestedPayload>,
  ): Promise<void> {
    const payload = event.payload;

    const options = {
      delay: payload.delay,
      attempts: payload.attempts,
    };

    if (payload.queueName === QUEUE_NAMES.EMAIL) {
      await this.queueDispatchService.addEmailJob(
        payload.jobName,
        payload.data,
        options,
      );
    } else if (payload.queueName === QUEUE_NAMES.WEBSOCKET) {
      await this.queueDispatchService.addWebsocketJob(
        payload.jobName,
        payload.data,
        options,
      );
    } else if (payload.queueName === QUEUE_NAMES.WEBHOOK) {
      await this.queueDispatchService.addWebhookJob(
        payload.jobName,
        payload.data,
        options,
      );
    } else if (payload.queueName === QUEUE_NAMES.FILE_PROCESSING) {
      await this.queueDispatchService.addFileProcessingJob(
        payload.jobName,
        payload.data,
        options,
      );
    } else if (payload.queueName === QUEUE_NAMES.SEARCH) {
      await this.queueDispatchService.addSearchJob(
        payload.jobName,
        payload.data,
        options,
      );
    } else if (payload.queueName === QUEUE_NAMES.REMINDER) {
      await this.queueDispatchService.addReminderJob(
        payload.jobName,
        payload.data,
        options,
      );
    } else {
      throw new Error(`Unknown queue name: ${payload.queueName}`);
    }

    this.logger.log(
      `Generic queue job added: ${payload.queueName}/${payload.jobName}`,
    );
  }
}
