import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { AppEventPublisher } from '../../core/events/app-event.publisher';
import { APP_EVENTS } from '../../core/events/app-event.constants';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly eventPublisher: AppEventPublisher,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Check server health status' })
  checkHealth() {
    return this.healthService.checkHealth();
  }

  @Get('event-test')
  @ApiOperation({ summary: 'Test all event-driven systems' })
  async testEvents() {
    await this.eventPublisher.publish(
      APP_EVENTS.AUDIT.LOG_REQUESTED,
      {
        action: 'EVENT_TEST',
        entity: 'Health',
        entityId: 'event-test',
        metadata: { message: 'Testing audit event' },
      },
      { source: 'system' },
    );

    await this.eventPublisher.publish(
      APP_EVENTS.ACTIVITY.LOG_REQUESTED,
      {
        title: 'Event test executed',
        description: 'Testing activity event',
        entity: 'Health',
        entityId: 'event-test',
      },
      { source: 'system' },
    );

    await this.eventPublisher.publish(
      APP_EVENTS.EMAIL.SEND_REQUESTED,
      {
        to: 'test@example.com',
        subject: 'Event Test Email',
        text: 'This is an event-driven email test.',
      },
      { source: 'system' },
    );

    await this.eventPublisher.publish(
      APP_EVENTS.NOTIFICATION.CREATE_REQUESTED,
      {
        userId: 'test-user-id',
        title: 'Event Test Notification',
        message: 'This notification was created from event system.',
        channels: ['IN_APP', 'SOCKET'],
      },
      { source: 'system' },
    );

    await this.eventPublisher.publish(
      APP_EVENTS.WEBSOCKET.EMIT_REQUESTED,
      {
        room: 'user:test-user-id',
        event: 'test.event',
        data: {
          message: 'Hello from event-driven websocket',
        },
      },
      { source: 'system' },
    );

    await this.eventPublisher.publish(
      APP_EVENTS.FILE.PROCESS_REQUESTED,
      {
        fileId: 'test-file-id',
        filePath: '/uploads/test.csv',
        mimeType: 'text/csv',
        action: 'CSV_IMPORT',
        metadata: {
          source: 'health-test',
        },
      },
      { source: 'system' },
    );

    await this.eventPublisher.publish(
      APP_EVENTS.SEARCH.INDEX_REQUESTED,
      {
        indexName: 'users',
        entity: 'User',
        entityId: 'test-user-id',
        data: {
          name: 'Test User',
          email: 'test@example.com',
        },
      },
      { source: 'system' },
    );

    await this.eventPublisher.publish(
      APP_EVENTS.REMINDER.SCHEDULE_REQUESTED,
      {
        userId: 'test-user-id',
        title: 'Test Reminder',
        message: 'This is a scheduled reminder test.',
        remindAt: new Date(Date.now() + 60_000).toISOString(),
        channels: ['IN_APP', 'SOCKET'],
      },
      { source: 'system' },
    );

    await this.eventPublisher.publish(
      APP_EVENTS.SYSTEM_ALERT.ALERT_REQUESTED,
      {
        title: 'Test System Alert',
        message: 'System alert event test executed.',
        severity: 'LOW',
      },
      { source: 'system' },
    );

    await this.eventPublisher.publish(
      APP_EVENTS.CACHE.INVALIDATE_REQUESTED,
      {
        key: 'test:key',
      },
      { source: 'system' },
    );

    return {
      message: 'Event test completed',
      data: {
        status: 'ok',
      },
    };
  }
}