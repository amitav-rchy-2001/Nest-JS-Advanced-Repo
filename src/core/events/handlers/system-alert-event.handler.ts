import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { APP_EVENTS } from '../app-event.constants';
import type { AppEvent, SystemAlertPayload } from '../app-event.types';
import { SystemAlertService } from '../../system-alert/system-alert.service';

@Injectable()
export class SystemAlertEventHandler {
  private readonly logger = new Logger(SystemAlertEventHandler.name);

  constructor(private readonly systemAlertService: SystemAlertService) {}

  @OnEvent(APP_EVENTS.SYSTEM_ALERT.ALERT_REQUESTED)
  async handleSystemAlertRequested(
    event: AppEvent<SystemAlertPayload>,
  ): Promise<void> {
    const alert = await this.systemAlertService.create(event.payload);
    this.logger.warn(`System alert created: ${alert.id}`);
  }

  @OnEvent(APP_EVENTS.SYSTEM_ALERT.ERROR_OCCURRED)
  async handleSystemErrorOccurred(
    event: AppEvent<SystemAlertPayload>,
  ): Promise<void> {
    const alert = await this.systemAlertService.create(event.payload);
    this.logger.error(`System error alert created: ${alert.id}`);
  }

  @OnEvent(APP_EVENTS.SYSTEM_ALERT.QUEUE_FAILED)
  async handleQueueFailed(event: AppEvent<SystemAlertPayload>): Promise<void> {
    const alert = await this.systemAlertService.create(event.payload);
    this.logger.error(`Queue failure alert created: ${alert.id}`);
  }
}
