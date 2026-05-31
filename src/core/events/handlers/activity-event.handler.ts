import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { APP_EVENTS } from '../app-event.constants';
import { ActivityService } from '../../activity/activity.service';
import type { ActivityLogRequestedPayload, AppEvent } from '../app-event.types';

@Injectable()
export class ActivityEventHandler {
  private readonly logger = new Logger(ActivityEventHandler.name);

  constructor(private readonly activityService: ActivityService) {}

  @OnEvent(APP_EVENTS.ACTIVITY.LOG_REQUESTED)
  async handleActivityLogRequested(
    event: AppEvent<ActivityLogRequestedPayload>,
  ): Promise<void> {
    const activity = await this.activityService.create(event.payload);
    this.logger.log(`Activity log created: ${activity.id}`);
  }
}
