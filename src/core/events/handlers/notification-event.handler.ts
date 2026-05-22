import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { APP_EVENTS } from '../app-event.constants';
import type { AppEvent, NotificationCreateRequestedPayload } from '../app-event.types';
import { NotificationService } from '../../notification/notification.service';

@Injectable()
export class NotificationEventHandler {
  private readonly logger = new Logger(NotificationEventHandler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(APP_EVENTS.NOTIFICATION.CREATE_REQUESTED)
  async handleNotificationCreateRequested(
    event: AppEvent<NotificationCreateRequestedPayload>,
  ): Promise<void> {
    const notification = await this.notificationService.create(event.payload);
    this.logger.log(`Notification created: ${notification.id}`);
  }
}