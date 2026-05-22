import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SearchIndexRequestedPayload } from '../events/app-event.types';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createJob(payload: SearchIndexRequestedPayload) {
    return this.prisma.searchIndexJob.create({
      data: {
        indexName: payload.indexName,
        entity: payload.entity,
        entityId: payload.entityId,
        operation: payload.operation ?? 'INDEX',
        data: payload.data as any,
        status: 'PENDING',
      },
    });
  }

  async process(jobId: string, payload: SearchIndexRequestedPayload) {
    this.logger.log(
      `Search ${payload.operation ?? 'INDEX'}: ${payload.indexName}/${payload.entityId}`,
    );

    return this.prisma.searchIndexJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
      },
    });
  }

  async markFailed(jobId: string, error: string) {
    return this.prisma.searchIndexJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error,
      },
    });
  }
}