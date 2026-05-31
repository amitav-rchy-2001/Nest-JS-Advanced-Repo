import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../../events/app-event.constants';
import { EmailSendRequestedPayload } from '../../events/app-event.types';
import { MailService } from '../mail.service';

@Processor(QUEUE_NAMES.EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<EmailSendRequestedPayload>): Promise<void> {
    this.logger.log(`Processing email job: ${job.name}`);

    await this.mailService.send(job.data);

    this.logger.log(`Email job completed: ${job.id}`);
  }
}
