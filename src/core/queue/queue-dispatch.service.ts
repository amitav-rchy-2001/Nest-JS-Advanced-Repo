import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, JobsOptions } from 'bullmq';
import { QUEUE_NAMES } from '../events/app-event.constants';

@Injectable()
export class QueueDispatchService {
  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL)
    private readonly emailQueue: Queue,

    @InjectQueue(QUEUE_NAMES.WEBSOCKET)
    private readonly websocketQueue: Queue,

    @InjectQueue(QUEUE_NAMES.WEBHOOK)
    private readonly webhookQueue: Queue,

    @InjectQueue(QUEUE_NAMES.FILE_PROCESSING)
    private readonly fileProcessingQueue: Queue,

    @InjectQueue(QUEUE_NAMES.SEARCH)
    private readonly searchQueue: Queue,

    @InjectQueue(QUEUE_NAMES.REMINDER)
    private readonly reminderQueue: Queue,
  ) {}

  async addEmailJob(jobName: string, data: Record<string, unknown>, options?: JobsOptions) {
    return this.emailQueue.add(jobName, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: true,
      removeOnFail: false,
      ...options,
    });
  }

  async addWebsocketJob(jobName: string, data: Record<string, unknown>, options?: JobsOptions) {
    return this.websocketQueue.add(jobName, data, {
      attempts: 2,
      removeOnComplete: true,
      removeOnFail: false,
      ...options,
    });
  }

  async addWebhookJob(jobName: string, data: Record<string, unknown>, options?: JobsOptions) {
    return this.webhookQueue.add(jobName, data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
      ...options,
    });
  }

  async addFileProcessingJob(jobName: string, data: Record<string, unknown>, options?: JobsOptions) {
    return this.fileProcessingQueue.add(jobName, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: true,
      removeOnFail: false,
      ...options,
    });
  }

  async addSearchJob(jobName: string, data: Record<string, unknown>, options?: JobsOptions) {
    return this.searchQueue.add(jobName, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: true,
      removeOnFail: false,
      ...options,
    });
  }

  async addReminderJob(jobName: string, data: Record<string, unknown>, options?: JobsOptions) {
    return this.reminderQueue.add(jobName, data, {
      attempts: 3,
      removeOnComplete: true,
      removeOnFail: false,
      ...options,
    });
  }
}