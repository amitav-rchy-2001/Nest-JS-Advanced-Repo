import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { APP_EVENTS } from '../app-event.constants';
import type { AppEvent, EmailSendRequestedPayload } from '../app-event.types';
import { QueueDispatchService } from '../../queue/queue-dispatch.service';

@Injectable()
export class EmailEventHandler {
  private readonly logger = new Logger(EmailEventHandler.name);

  constructor(private readonly queueDispatchService: QueueDispatchService) {}

  @OnEvent(APP_EVENTS.EMAIL.SEND_REQUESTED)
  async handleEmailSendRequested(
    event: AppEvent<EmailSendRequestedPayload>,
  ): Promise<void> {
    await this.queueDispatchService.addEmailJob(
      'send-email',
      event.payload as unknown as Record<string, unknown>,
    );

    this.logger.log(`Email job queued for: ${event.payload.to}`);
  }
}
