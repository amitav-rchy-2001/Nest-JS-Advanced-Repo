import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { APP_EVENTS } from '../app-event.constants';
import type { AppEvent, AuditLogRequestedPayload } from '../app-event.types';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class AuditEventHandler {
  private readonly logger = new Logger(AuditEventHandler.name);

  constructor(private readonly auditService: AuditService) {}

  @OnEvent(APP_EVENTS.AUDIT.LOG_REQUESTED)
  async handleAuditLogRequested(
    event: AppEvent<AuditLogRequestedPayload>,
  ): Promise<void> {
    const log = await this.auditService.create(event.payload);
    this.logger.log(`Audit log created: ${log.id}`);
  }
}