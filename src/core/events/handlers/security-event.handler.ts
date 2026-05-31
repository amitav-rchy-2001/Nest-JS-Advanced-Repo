import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { APP_EVENTS } from '../app-event.constants';
import type { AppEvent, SecurityEventPayload } from '../app-event.types';
import { AuditService } from '../../audit/audit.service';
import { SystemAlertService } from '../../system-alert/system-alert.service';

@Injectable()
export class SecurityEventHandler {
  private readonly logger = new Logger(SecurityEventHandler.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly systemAlertService: SystemAlertService,
  ) {}

  @OnEvent(APP_EVENTS.SECURITY.LOGIN_SUCCESS)
  async handleLoginSuccess(
    event: AppEvent<SecurityEventPayload>,
  ): Promise<void> {
    await this.auditService.create({
      action: 'LOGIN_SUCCESS',
      entity: 'User',
      entityId: event.payload.userId,
      userId: event.payload.userId,
      ipAddress: event.payload.ipAddress,
      userAgent: event.payload.userAgent,
      metadata: event.payload.metadata,
    });

    this.logger.log(`Login success tracked: ${event.payload.userId}`);
  }

  @OnEvent(APP_EVENTS.SECURITY.LOGIN_FAILED)
  async handleLoginFailed(
    event: AppEvent<SecurityEventPayload>,
  ): Promise<void> {
    await this.auditService.create({
      action: 'LOGIN_FAILED',
      entity: 'Auth',
      userId: event.payload.userId,
      ipAddress: event.payload.ipAddress,
      userAgent: event.payload.userAgent,
      metadata: {
        email: event.payload.email,
        ...event.payload.metadata,
      },
    });

    this.logger.warn(`Login failed tracked: ${event.payload.email}`);
  }

  @OnEvent(APP_EVENTS.SECURITY.SUSPICIOUS_ACTIVITY)
  async handleSuspiciousActivity(
    event: AppEvent<SecurityEventPayload>,
  ): Promise<void> {
    await this.systemAlertService.create({
      title: 'Suspicious Activity Detected',
      message: event.payload.action,
      severity: 'HIGH',
      metadata: {
        userId: event.payload.userId,
        email: event.payload.email,
        ipAddress: event.payload.ipAddress,
        userAgent: event.payload.userAgent,
        ...event.payload.metadata,
      },
    });

    await this.auditService.create({
      action: 'SUSPICIOUS_ACTIVITY',
      entity: 'Security',
      userId: event.payload.userId,
      ipAddress: event.payload.ipAddress,
      userAgent: event.payload.userAgent,
      metadata: event.payload.metadata,
    });
  }

  @OnEvent(APP_EVENTS.SECURITY.PASSWORD_CHANGED)
  async handlePasswordChanged(
    event: AppEvent<SecurityEventPayload>,
  ): Promise<void> {
    await this.auditService.create({
      action: 'PASSWORD_CHANGED',
      entity: 'User',
      entityId: event.payload.userId,
      userId: event.payload.userId,
      ipAddress: event.payload.ipAddress,
      userAgent: event.payload.userAgent,
      metadata: event.payload.metadata,
    });
  }

  @OnEvent(APP_EVENTS.SECURITY.ROLE_CHANGED)
  async handleRoleChanged(
    event: AppEvent<SecurityEventPayload>,
  ): Promise<void> {
    await this.auditService.create({
      action: 'ROLE_CHANGED',
      entity: 'User',
      entityId: event.payload.userId,
      userId: event.payload.userId,
      metadata: event.payload.metadata,
    });
  }

  @OnEvent(APP_EVENTS.SECURITY.PERMISSION_CHANGED)
  async handlePermissionChanged(
    event: AppEvent<SecurityEventPayload>,
  ): Promise<void> {
    await this.auditService.create({
      action: 'PERMISSION_CHANGED',
      entity: 'Permission',
      userId: event.payload.userId,
      metadata: event.payload.metadata,
    });
  }
}
