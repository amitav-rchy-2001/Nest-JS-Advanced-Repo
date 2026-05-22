import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../../events/app-event.constants';
import { WebhookDispatchRequestedPayload } from '../../events/app-event.types';
import { WebhookService } from '../webhook.service';

type WebhookJobData = WebhookDispatchRequestedPayload & {
  deliveryId: string;
};

@Processor(QUEUE_NAMES.WEBHOOK)
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private readonly webhookService: WebhookService) {
    super();
  }

  async process(job: Job<WebhookJobData>): Promise<void> {
    this.logger.log(`Processing webhook job: ${job.id}`);

    await this.webhookService.dispatch(job.data.deliveryId, job.data);
  }
}