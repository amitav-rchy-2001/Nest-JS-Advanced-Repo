import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppEventPublisher } from './app-event.publisher';

import { QueueModule } from '../queue/queue.module';
import { RedisModule } from '../redis/redis.module';
import { AuditModule } from '../audit/audit.module';
import { ActivityModule } from '../activity/activity.module';
import { MailModule } from '../mail/mail.module';
import { RealtimeModule } from '../websocket/realtime.module';
import { WebhookModule } from '../webhook/webhook.module';
import { FileProcessingModule } from '../file-processing/file-processing.module';
import { SearchModule } from '../search/search.module';
import { ReminderModule } from '../reminder/reminder.module';
import { SystemAlertModule } from '../system-alert/system-alert.module';

import { EmailEventHandler } from './handlers/email-event.handler';
import { NotificationEventHandler } from './handlers/notification-event.handler';
import { MessageEventHandler } from './handlers/message-event.handler';

import { AuditEventHandler } from './handlers/audit-event.handler';
import { ActivityEventHandler } from './handlers/activity-event.handler';
import { QueueEventHandler } from './handlers/queue-event.handler';
import { WebsocketEventHandler } from './handlers/websocket-event.handler';
import { WebhookEventHandler } from './handlers/webhook-event.handler';
import { FileEventHandler } from './handlers/file-event.handler';
import { SecurityEventHandler } from './handlers/security-event.handler';
import { SystemAlertEventHandler } from './handlers/system-alert-event.handler';
import { CacheEventHandler } from './handlers/cache-event.handler';
import { SearchEventHandler } from './handlers/search-event.handler';
import { ReminderEventHandler } from './handlers/reminder-event.handler';

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 50,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),

    QueueModule,
    RedisModule,
    AuditModule,
    ActivityModule,
    MailModule,
    RealtimeModule,
    WebhookModule,
    FileProcessingModule,
    SearchModule,
    ReminderModule,
    SystemAlertModule
  ],
  providers: [
    AppEventPublisher,
    EmailEventHandler,
    NotificationEventHandler,
    MessageEventHandler,
    AuditEventHandler,
    ActivityEventHandler,
    QueueEventHandler,
    WebsocketEventHandler,
    WebhookEventHandler,
    FileEventHandler,
    SecurityEventHandler,
    SystemAlertEventHandler,
    CacheEventHandler,
    SearchEventHandler,
    ReminderEventHandler,
  ],
  exports: [AppEventPublisher],
})
export class AppEventModule {}