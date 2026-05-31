import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { APP_EVENTS } from '../app-event.constants';
import type { AppEvent, SearchIndexRequestedPayload } from '../app-event.types';
import { SearchService } from '../../search/search.service';
import { QueueDispatchService } from '../../queue/queue-dispatch.service';

@Injectable()
export class SearchEventHandler {
  private readonly logger = new Logger(SearchEventHandler.name);

  constructor(
    private readonly searchService: SearchService,
    private readonly queueDispatchService: QueueDispatchService,
  ) {}

  @OnEvent(APP_EVENTS.SEARCH.INDEX_REQUESTED)
  async handleSearchIndexRequested(
    event: AppEvent<SearchIndexRequestedPayload>,
  ): Promise<void> {
    const job = await this.searchService.createJob({
      ...event.payload,
      operation: 'INDEX',
    });

    await this.queueDispatchService.addSearchJob('search-index', {
      ...event.payload,
      operation: 'INDEX',
      searchJobId: job.id,
    });

    this.logger.log(`Search index job queued: ${job.id}`);
  }

  @OnEvent(APP_EVENTS.SEARCH.UPDATE_REQUESTED)
  async handleSearchUpdateRequested(
    event: AppEvent<SearchIndexRequestedPayload>,
  ): Promise<void> {
    const job = await this.searchService.createJob({
      ...event.payload,
      operation: 'UPDATE',
    });

    await this.queueDispatchService.addSearchJob('search-update', {
      ...event.payload,
      operation: 'UPDATE',
      searchJobId: job.id,
    });

    this.logger.log(`Search update job queued: ${job.id}`);
  }

  @OnEvent(APP_EVENTS.SEARCH.DELETE_REQUESTED)
  async handleSearchDeleteRequested(
    event: AppEvent<SearchIndexRequestedPayload>,
  ): Promise<void> {
    const job = await this.searchService.createJob({
      ...event.payload,
      operation: 'DELETE',
    });

    await this.queueDispatchService.addSearchJob('search-delete', {
      ...event.payload,
      operation: 'DELETE',
      searchJobId: job.id,
    });

    this.logger.log(`Search delete job queued: ${job.id}`);
  }
}
