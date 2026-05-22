import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FileProcessRequestedPayload } from '../events/app-event.types';

@Injectable()
export class FileProcessingService {
  constructor(private readonly prisma: PrismaService) {}

  async createJob(payload: FileProcessRequestedPayload) {
    return this.prisma.fileProcessingJob.create({
      data: {
        fileId: payload.fileId,
        filePath: payload.filePath,
        mimeType: payload.mimeType,
        action: payload.action,
        status: 'PENDING',
        metadata: payload.metadata as any,
      },
    });
  }

  async markProcessing(jobId: string) {
    return this.prisma.fileProcessingJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    });
  }

  async process(jobId: string, payload: FileProcessRequestedPayload) {
    await this.markProcessing(jobId);

    const result = await this.runAction(payload);

    return this.prisma.fileProcessingJob.update({
      where: { id: jobId },
      data: {
        status: 'PROCESSED',
        metadata: {
          ...(payload.metadata ?? {}),
          result,
        } as any,
        processedAt: new Date(),
      },
    });
  }

  async markFailed(jobId: string, error: string) {
    return this.prisma.fileProcessingJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error,
      },
    });
  }

  private async runAction(payload: FileProcessRequestedPayload) {
    switch (payload.action) {
      case 'IMAGE_RESIZE':
        return {
          action: payload.action,
          message: 'Image resize action executed. Add sharp package for real resizing.',
        };

      case 'CSV_IMPORT':
        return {
          action: payload.action,
          message: 'CSV import action executed. Add csv-parser based importer for real import.',
        };

      case 'PDF_PARSE':
        return {
          action: payload.action,
          message: 'PDF parse action executed. Add pdf parser based implementation.',
        };

      case 'VIDEO_THUMBNAIL':
        return {
          action: payload.action,
          message: 'Video thumbnail action executed. Add ffmpeg implementation.',
        };

      case 'VIRUS_SCAN':
        return {
          action: payload.action,
          message: 'Virus scan action executed. Add ClamAV/external scan integration.',
        };

      default:
        return {
          action: payload.action,
          message: 'Unknown file action.',
        };
    }
  }
}