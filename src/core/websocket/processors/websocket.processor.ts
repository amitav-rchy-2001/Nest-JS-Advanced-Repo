import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../../events/app-event.constants';
import { WebsocketEmitRequestedPayload } from '../../events/app-event.types';
import { RealtimeService } from '../realtime.service';

@Processor(QUEUE_NAMES.WEBSOCKET)
export class WebsocketProcessor extends WorkerHost {
  private readonly logger = new Logger(WebsocketProcessor.name);

  constructor(private readonly realtimeService: RealtimeService) {
    super();
  }

  async process(job: Job<WebsocketEmitRequestedPayload>): Promise<void> {
    this.logger.log(`Processing websocket job: ${job.name}`);

    this.realtimeService.emitToRoom(
      job.data.room,
      job.data.event,
      job.data.data,
    );
  }
}