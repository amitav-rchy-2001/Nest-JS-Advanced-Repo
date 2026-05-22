import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../../events/app-event.constants';
import { ReminderService } from '../reminder.service';

type ReminderJobData = {
  reminderId: string;
};

@Processor(QUEUE_NAMES.REMINDER)
export class ReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(ReminderProcessor.name);

  constructor(private readonly reminderService: ReminderService) {
    super();
  }

  async process(job: Job<ReminderJobData>): Promise<void> {
    await this.reminderService.send(job.data.reminderId);
    this.logger.log(`Reminder sent: ${job.data.reminderId}`);
  }
}