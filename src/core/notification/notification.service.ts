import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  NotificationCreateRequestedPayload,
  NotificationChannel,
} from '../events/app-event.types';
import { QueueDispatchService } from '../queue/queue-dispatch.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueDispatchService: QueueDispatchService,
  ) {}

  async create(payload: NotificationCreateRequestedPayload) {
    const channels: NotificationChannel[] = payload.channels ?? ['IN_APP'];

    const notification = await this.prisma.notification.create({
      data: {
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        channels,
        metadata: payload.metadata as any,
      },
    });

    if (channels.includes('EMAIL')) {
      await this.queueDispatchService.addEmailJob('send-notification-email', {
        to: payload.metadata?.email as string,
        subject: payload.title,
        template: 'notification',
        data: {
          title: payload.title,
          message: payload.message,
        },
      });
    }

    if (channels.includes('SOCKET')) {
      await this.queueDispatchService.addWebsocketJob('emit', {
        room: `user:${payload.userId}`,
        event: 'notification.created',
        data: notification,
      });
    }

    return notification;
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async findUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
