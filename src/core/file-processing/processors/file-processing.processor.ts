import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../../events/app-event.constants';
import { FileProcessRequestedPayload } from '../../events/app-event.types';
import { FileProcessingService } from '../file-processing.service';

type FileProcessingJobData = FileProcessRequestedPayload & {
  processingJobId: string;
};

@Processor(QUEUE_NAMES.FILE_PROCESSING)
export class FileProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(FileProcessingProcessor.name);

  constructor(private readonly fileProcessingService: FileProcessingService) {
    super();
  }

  async process(job: Job<FileProcessingJobData>): Promise<void> {
    this.logger.log(`Processing file job: ${job.id}`);

    try {
      await this.fileProcessingService.process(
        job.data.processingJobId,
        job.data,
      );
    } catch (error) {
      await this.fileProcessingService.markFailed(
        job.data.processingJobId,
        error instanceof Error ? error.message : 'Unknown error',
      );

      throw error;
    }
  }
}
