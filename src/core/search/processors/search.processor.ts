import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../../events/app-event.constants';
import { SearchIndexRequestedPayload } from '../../events/app-event.types';
import { SearchService } from '../search.service';

type SearchJobData = SearchIndexRequestedPayload & {
  searchJobId: string;
};

@Processor(QUEUE_NAMES.SEARCH)
export class SearchProcessor extends WorkerHost {
  private readonly logger = new Logger(SearchProcessor.name);

  constructor(private readonly searchService: SearchService) {
    super();
  }

  async process(job: Job<SearchJobData>): Promise<void> {
    try {
      await this.searchService.process(job.data.searchJobId, job.data);
      this.logger.log(`Search job completed: ${job.data.searchJobId}`);
    } catch (error) {
      await this.searchService.markFailed(
        job.data.searchJobId,
        error instanceof Error ? error.message : 'Unknown error',
      );

      throw error;
    }
  }
}
