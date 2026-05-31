import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { APP_EVENTS } from '../app-event.constants';
import type {
  AppEvent,
  MessageReadPayload,
  MessageSentPayload,
} from '../app-event.types';
import { NotificationService } from '../../notification/notification.service';
import { QueueDispatchService } from '../../queue/queue-dispatch.service';

@Injectable()
export class MessageEventHandler {
  private readonly logger = new Logger(MessageEventHandler.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly queueDispatchService: QueueDispatchService,
  ) {}

  @OnEvent(APP_EVENTS.MESSAGE.SENT)
  async handleMessageSent(event: AppEvent<MessageSentPayload>): Promise<void> {
    const payload = event.payload;

    for (const receiverId of payload.receiverIds) {
      await this.notificationService.create({
        userId: receiverId,
        title: 'New message',
        message: payload.content ?? 'You received a new message.',
        type: 'MESSAGE',
        channels: ['IN_APP', 'SOCKET'],
        metadata: {
          conversationId: payload.conversationId,
          messageId: payload.messageId,
          senderId: payload.senderId,
        },
      });
    }

    await this.queueDispatchService.addWebsocketJob('emit', {
      room: `conversation:${payload.conversationId}`,
      event: 'message.sent',
      data: payload,
    });

    this.logger.log(`Message event processed: ${payload.messageId}`);
  }

  @OnEvent(APP_EVENTS.MESSAGE.READ)
  async handleMessageRead(event: AppEvent<MessageReadPayload>): Promise<void> {
    await this.queueDispatchService.addWebsocketJob('emit', {
      room: `conversation:${event.payload.conversationId}`,
      event: 'message.read',
      data: event.payload,
    });

    this.logger.log(`Message read event processed: ${event.payload.messageId}`);
  }
}
