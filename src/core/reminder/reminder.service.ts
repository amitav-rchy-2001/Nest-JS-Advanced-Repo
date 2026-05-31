import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ReminderScheduleRequestedPayload } from '../events/app-event.types';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ReminderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(payload: ReminderScheduleRequestedPayload) {
    return this.prisma.reminder.create({
      data: {
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        remindAt: new Date(payload.remindAt),
        channels: payload.channels ?? ['IN_APP'],
        status: 'SCHEDULED',
        metadata: payload.metadata as any,
      },
    });
  }

  async send(reminderId: string) {
    const reminder = await this.prisma.reminder.findUnique({
      where: { id: reminderId },
    });

    if (!reminder || reminder.status !== 'SCHEDULED') {
      return null;
    }

    await this.notificationService.create({
      userId: reminder.userId,
      title: reminder.title,
      message: reminder.message,
      channels: reminder.channels as any,
      metadata: reminder.metadata as any,
    });

    return this.prisma.reminder.update({
      where: { id: reminderId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });
  }

  calculateDelay(remindAt: string) {
    const targetTime = new Date(remindAt).getTime();
    const now = Date.now();

    return Math.max(targetTime - now, 0);
  }
}
