import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { APP_EVENTS } from '../app-event.constants';
import type { AppEvent, FileProcessRequestedPayload } from '../app-event.types';
import { FileProcessingService } from '../../file-processing/file-processing.service';
import { QueueDispatchService } from '../../queue/queue-dispatch.service';

@Injectable()
export class FileEventHandler {
  private readonly logger = new Logger(FileEventHandler.name);

  constructor(
    private readonly fileProcessingService: FileProcessingService,
    private readonly queueDispatchService: QueueDispatchService,
  ) {}

  @OnEvent(APP_EVENTS.FILE.PROCESS_REQUESTED)
  async handleFileProcessRequested(
    event: AppEvent<FileProcessRequestedPayload>,
  ): Promise<void> {
    const processingJob = await this.fileProcessingService.createJob(event.payload);

    await this.queueDispatchService.addFileProcessingJob(event.payload.action, {
      ...event.payload,
      processingJobId: processingJob.id,
    });

    this.logger.log(`File processing job queued: ${processingJob.id}`);
  }
}