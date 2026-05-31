import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { APP_EVENTS } from '../app-event.constants';
import type {
  AppEvent,
  ReminderScheduleRequestedPayload,
} from '../app-event.types';
import { ReminderService } from '../../reminder/reminder.service';
import { QueueDispatchService } from '../../queue/queue-dispatch.service';

@Injectable()
export class ReminderEventHandler {
  private readonly logger = new Logger(ReminderEventHandler.name);

  constructor(
    private readonly reminderService: ReminderService,
    private readonly queueDispatchService: QueueDispatchService,
  ) {}

  @OnEvent(APP_EVENTS.REMINDER.SCHEDULE_REQUESTED)
  async handleReminderScheduleRequested(
    event: AppEvent<ReminderScheduleRequestedPayload>,
  ): Promise<void> {
    const reminder = await this.reminderService.create(event.payload);
    const delay = this.reminderService.calculateDelay(event.payload.remindAt);

    await this.queueDispatchService.addReminderJob(
      'send-reminder',
      {
        reminderId: reminder.id,
      },
      {
        delay,
      },
    );

    this.logger.log(`Reminder scheduled: ${reminder.id}`);
  }
}
