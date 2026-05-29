# Event Driven NestJS Backend Template

A production-ready NestJS backend template built around an event-driven core. Use this as a starting point for APIs that need background jobs, notifications, audit trails, realtime events, webhooks, file processing, reminders, search indexing, Redis caching, and clean module boundaries.

## What This Template Gives You

- NestJS 11 with TypeScript
- Prisma 7 with PostgreSQL
- Redis with BullMQ queues
- EventEmitter based in-process domain events
- Global event publisher service
- Queue-backed workers for email, websocket, webhook, file processing, search, and reminders
- Audit log, activity log, notifications, system alerts, webhook delivery tracking
- Socket.IO realtime gateway
- Swagger API docs
- Global response interceptor, exception filter, validation pipe, CORS, compression, helmet, cookie parser
- Docker Compose for PostgreSQL and Redis

## Architecture

The application has three main layers:

```text
src/
  app.module.ts
  main.ts

  config/
    env.validation.ts

  common/
    filters/
    interceptors/
    templates/

  core/
    events/
      app-event.constants.ts
      app-event.types.ts
      app-event.publisher.ts
      handlers/
    queue/
    redis/
    database/
    audit/
    activity/
    notification/
    mail/
    websocket/
    webhook/
    file-processing/
    search/
    reminder/
    system-alert/

  modules/
    health/
```

### Request And Event Flow

Typical flow:

```text
Controller or Service
  -> AppEventPublisher.publish(...)
    -> Event Handler
      -> Database write and/or QueueDispatchService
        -> BullMQ processor
          -> External side effect
```

Example:

```text
User sends a message
  -> publish APP_EVENTS.MESSAGE.SENT
    -> MessageEventHandler creates notifications
    -> MessageEventHandler queues websocket job
      -> WebsocketProcessor emits message.sent to room
```

Use events when the main business action should not directly know all side effects. For example, a signup service should create the user, then publish an event. Email, notification, audit, and analytics logic should live in event handlers.

## Requirements

- Node.js 20 or newer is recommended
- npm
- Docker and Docker Compose
- PostgreSQL
- Redis

PostgreSQL and Redis can be started from `docker-compose.yml`.

## Environment Variables

Copy the example env file:

```bash
cp .env.example .env
```

Default `.env.example`:

```env
NODE_ENV=development
PORT=5000

DATABASE_URL=postgresql://postgres:postgres@localhost:5434/backend_template

JWT_ACCESS_SECRET=access_secret
JWT_REFRESH_SECRET=refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

BCRYPT_SALT_ROUNDS=12

REDIS_HOST=localhost
REDIS_PORT=6379
```

Mail is supported by `MailService`, but SMTP variables are optional in the validation schema. Add these when you want real email delivery:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASS=your_password
MAIL_FROM="Your App <no-reply@yourapp.com>"
```

For production, never use the example JWT secrets.

## Local Setup

Install dependencies:

```bash
npm install
```

Start PostgreSQL and Redis:

```bash
docker compose up -d
```

Generate Prisma client:

```bash
npm run generate
```

Run migrations:

```bash
npx prisma migrate dev
```

Start the app:

```bash
npm run start:dev
```

Open:

- Home: `http://localhost:5000/`
- Health page: `http://localhost:5000/health`
- API base: `http://localhost:5000/api/v1`
- Swagger docs: `http://localhost:5000/api/v1/docs`

## Useful Commands

```bash
npm run start          # start once
npm run start:dev      # start in watch mode
npm run build          # generate Prisma client and compile
npm run start:prod     # run compiled app from dist
npm run lint           # eslint with auto-fix
npm run format         # prettier
npm run test           # unit tests
npm run test:e2e       # e2e tests
npm run test:cov       # coverage
npm run generate       # prisma generate
```

## Event System

### Main Files

- `src/core/events/app-event.constants.ts`: all event names and queue names
- `src/core/events/app-event.types.ts`: event envelope and payload types
- `src/core/events/app-event.publisher.ts`: service used to publish events
- `src/core/events/handlers/*.handler.ts`: event handlers
- `src/core/events/app-event.module.ts`: registers EventEmitter, handlers, and core modules

`AppEventModule` is global, so `AppEventPublisher` can be injected anywhere without importing the event module again.

### Event Envelope

Every event is wrapped in this shape:

```ts
export interface AppEvent<TPayload = unknown> {
  id: string;
  name: string;
  payload: TPayload;
  source: EventSource;
  actorId?: string;
  requestId?: string;
  occurredAt: string;
}
```

This gives every event metadata for tracing, auditing, and debugging.

### Publishing An Event

Inject `AppEventPublisher` into any service:

```ts
import { Injectable } from '@nestjs/common';
import { APP_EVENTS } from '../../core/events/app-event.constants';
import { AppEventPublisher } from '../../core/events/app-event.publisher';

@Injectable()
export class UserService {
  constructor(private readonly events: AppEventPublisher) {}

  async createUser() {
    const user = {
      id: 'user_123',
      email: 'user@example.com',
      name: 'New User',
    };

    await this.events.publish(
      APP_EVENTS.EMAIL.SEND_REQUESTED,
      {
        to: user.email,
        subject: 'Welcome',
        template: 'welcome',
        data: { name: user.name },
      },
      {
        source: 'user',
        actorId: user.id,
      },
    );

    return user;
  }
}
```

Use `publish` for async handlers:

```ts
await this.events.publish(APP_EVENTS.AUDIT.LOG_REQUESTED, payload);
```

Use `publishSync` only when the publisher should not wait for async listeners:

```ts
this.events.publishSync(APP_EVENTS.CACHE.INVALIDATE_REQUESTED, payload);
```

Most application code should use `publish`.

## Existing Events

All event names are defined in `APP_EVENTS`.

### Email

```ts
APP_EVENTS.EMAIL.SEND_REQUESTED
APP_EVENTS.EMAIL.SENT
APP_EVENTS.EMAIL.FAILED
```

Handled now:

- `EMAIL.SEND_REQUESTED` queues an email job.
- `EmailProcessor` sends the email through `MailService`.

Payload:

```ts
{
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  data?: Record<string, unknown>;
}
```

### Notification

```ts
APP_EVENTS.NOTIFICATION.CREATE_REQUESTED
APP_EVENTS.NOTIFICATION.CREATED
APP_EVENTS.NOTIFICATION.READ
APP_EVENTS.NOTIFICATION.FAILED
```

Handled now:

- `NOTIFICATION.CREATE_REQUESTED` creates a database notification.
- If channel contains `EMAIL`, it queues an email job.
- If channel contains `SOCKET`, it queues a websocket emit job.

Payload:

```ts
{
  userId: string;
  title: string;
  message: string;
  type?: string;
  channels?: ('IN_APP' | 'EMAIL' | 'PUSH' | 'SOCKET' | 'SMS')[];
  metadata?: Record<string, unknown>;
}
```

Important: email notification currently expects `metadata.email` when `EMAIL` channel is used.

### Message

```ts
APP_EVENTS.MESSAGE.CONVERSATION_CREATED
APP_EVENTS.MESSAGE.SENT
APP_EVENTS.MESSAGE.DELIVERED
APP_EVENTS.MESSAGE.READ
APP_EVENTS.MESSAGE.DELETED
APP_EVENTS.MESSAGE.TYPING_STARTED
APP_EVENTS.MESSAGE.TYPING_STOPPED
```

Handled now:

- `MESSAGE.SENT` creates notifications for receivers and queues websocket emit to `conversation:{conversationId}`.
- `MESSAGE.READ` queues websocket emit to the conversation room.

### Audit

```ts
APP_EVENTS.AUDIT.LOG_REQUESTED
APP_EVENTS.AUDIT.LOG_CREATED
```

Handled now:

- `AUDIT.LOG_REQUESTED` creates an `AuditLog`.

Use this for security-sensitive or compliance-style history:

```ts
await this.events.publish(APP_EVENTS.AUDIT.LOG_REQUESTED, {
  action: 'USER_UPDATED',
  entity: 'User',
  entityId: user.id,
  userId: actor.id,
  oldValue,
  newValue,
});
```

### Activity

```ts
APP_EVENTS.ACTIVITY.LOG_REQUESTED
APP_EVENTS.ACTIVITY.LOG_CREATED
```

Handled now:

- `ACTIVITY.LOG_REQUESTED` creates an `ActivityLog`.

Use this for user timelines, admin feeds, or user-visible history.

### Queue

```ts
APP_EVENTS.QUEUE.JOB_REQUESTED
APP_EVENTS.QUEUE.JOB_CREATED
APP_EVENTS.QUEUE.JOB_COMPLETED
APP_EVENTS.QUEUE.JOB_FAILED
```

Handled now:

- `QUEUE.JOB_REQUESTED` routes a generic job to one of the registered queues.

Payload:

```ts
{
  queueName: string;
  jobName: string;
  data: Record<string, unknown>;
  delay?: number;
  attempts?: number;
}
```

Prefer specific events for business actions. Use `QUEUE.JOB_REQUESTED` when you already know the exact queue and job name.

### Websocket

```ts
APP_EVENTS.WEBSOCKET.EMIT_REQUESTED
APP_EVENTS.WEBSOCKET.EMITTED
APP_EVENTS.WEBSOCKET.FAILED
```

Handled now:

- `WEBSOCKET.EMIT_REQUESTED` queues a websocket job.
- `WebsocketProcessor` emits to a Socket.IO room.

Payload:

```ts
{
  room: string;
  event: string;
  data: Record<string, unknown>;
}
```

### Webhook

```ts
APP_EVENTS.WEBHOOK.DISPATCH_REQUESTED
APP_EVENTS.WEBHOOK.SENT
APP_EVENTS.WEBHOOK.FAILED
```

Handled now:

- `WEBHOOK.DISPATCH_REQUESTED` creates a `WebhookDelivery` record.
- It queues `dispatch-webhook`.
- `WebhookProcessor` posts JSON to the target URL.
- If `secret` is provided, `x-webhook-signature` is generated with HMAC SHA-256.

Payload:

```ts
{
  url: string;
  event: string;
  payload: Record<string, unknown>;
  headers?: Record<string, string>;
  secret?: string;
}
```

### File Processing

```ts
APP_EVENTS.FILE.UPLOADED
APP_EVENTS.FILE.PROCESS_REQUESTED
APP_EVENTS.FILE.PROCESSING_STARTED
APP_EVENTS.FILE.PROCESSED
APP_EVENTS.FILE.FAILED
APP_EVENTS.FILE.DELETED
```

Handled now:

- `FILE.PROCESS_REQUESTED` creates a `FileProcessingJob`.
- It queues a file-processing job with the action as job name.
- Processor calls `FileProcessingService.process(...)`.

Supported actions:

```ts
'IMAGE_RESIZE' | 'CSV_IMPORT' | 'PDF_PARSE' | 'VIDEO_THUMBNAIL' | 'VIRUS_SCAN'
```

The service currently marks jobs as processed. Add real processing logic inside `FileProcessingService.process`.

### Security

```ts
APP_EVENTS.SECURITY.LOGIN_SUCCESS
APP_EVENTS.SECURITY.LOGIN_FAILED
APP_EVENTS.SECURITY.PASSWORD_CHANGED
APP_EVENTS.SECURITY.PASSWORD_RESET_REQUESTED
APP_EVENTS.SECURITY.ROLE_CHANGED
APP_EVENTS.SECURITY.PERMISSION_CHANGED
APP_EVENTS.SECURITY.SUSPICIOUS_ACTIVITY
```

Handled now:

- Login success and failure create audit logs.
- Suspicious activity creates a system alert and audit log.
- Password, role, and permission changes create audit logs.

Use these from auth and admin modules.

### System Alert

```ts
APP_EVENTS.SYSTEM_ALERT.ALERT_REQUESTED
APP_EVENTS.SYSTEM_ALERT.ERROR_OCCURRED
APP_EVENTS.SYSTEM_ALERT.QUEUE_FAILED
APP_EVENTS.SYSTEM_ALERT.CRON_FAILED
APP_EVENTS.SYSTEM_ALERT.DATABASE_FAILED
```

Handled now:

- `ALERT_REQUESTED`, `ERROR_OCCURRED`, and `QUEUE_FAILED` create `SystemAlert` rows.

Payload:

```ts
{
  title: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata?: Record<string, unknown>;
}
```

### Cache

```ts
APP_EVENTS.CACHE.INVALIDATE_REQUESTED
APP_EVENTS.CACHE.INVALIDATED
```

Handled now:

- Deletes a single key.
- Deletes all keys matching a pattern.
- Deletes tag-style keys using `tag:{tag}:*`.

Payload:

```ts
{
  key?: string;
  pattern?: string;
  tags?: string[];
}
```

### Search

```ts
APP_EVENTS.SEARCH.INDEX_REQUESTED
APP_EVENTS.SEARCH.UPDATE_REQUESTED
APP_EVENTS.SEARCH.DELETE_REQUESTED
APP_EVENTS.SEARCH.INDEXED
APP_EVENTS.SEARCH.FAILED
```

Handled now:

- Creates a `SearchIndexJob`.
- Queues the search operation.
- Processor calls `SearchService.process(...)`.

The service currently marks jobs as done. Connect your real search provider inside `SearchService.process`, for example Meilisearch, Typesense, Elasticsearch, OpenSearch, or Algolia.

### Reminder

```ts
APP_EVENTS.REMINDER.SCHEDULE_REQUESTED
APP_EVENTS.REMINDER.SCHEDULED
APP_EVENTS.REMINDER.DUE
APP_EVENTS.REMINDER.SENT
APP_EVENTS.REMINDER.FAILED
```

Handled now:

- `REMINDER.SCHEDULE_REQUESTED` creates a `Reminder`.
- It queues `send-reminder` with delay calculated from `remindAt`.
- Processor calls `ReminderService.send(...)`.

## Queue System

Queues are defined in `QUEUE_NAMES`:

```ts
export const QUEUE_NAMES = {
  EMAIL: 'email',
  WEBSOCKET: 'websocket',
  WEBHOOK: 'webhook',
  FILE_PROCESSING: 'file-processing',
  SEARCH: 'search',
  REMINDER: 'reminder',
} as const;
```

Registered queues live in `src/core/queue/queue.module.ts`.

Queue helper methods live in `QueueDispatchService`:

- `addEmailJob`
- `addWebsocketJob`
- `addWebhookJob`
- `addFileProcessingJob`
- `addSearchJob`
- `addReminderJob`

Default retry behavior:

- Email: 3 attempts, exponential backoff
- Websocket: 2 attempts
- Webhook: 5 attempts, exponential backoff
- File processing: 3 attempts, exponential backoff
- Search: 3 attempts, exponential backoff
- Reminder: 3 attempts

## Database Models

Current Prisma models:

- `AuditLog`: compliance and security style history
- `ActivityLog`: timeline or user-visible activity
- `Notification`: in-app notifications and channel metadata
- `WebhookDelivery`: webhook status, attempts, response body, errors
- `FileProcessingJob`: file-processing lifecycle
- `Reminder`: scheduled reminders
- `SystemAlert`: internal operational alerts
- `SearchIndexJob`: search indexing lifecycle
- `Conversation`, `ConversationParticipant`, `Message`, `MessageReadReceipt`: chat foundation

After changing `prisma/schema.prisma`, run:

```bash
npx prisma migrate dev
npm run generate
```

## Adding A New Business Module

Example: create an `orders` module that publishes events without directly sending email or websocket messages.

1. Generate or create module files under `src/modules/orders`.
2. Inject `AppEventPublisher` into `OrdersService`.
3. After the main database transaction succeeds, publish events.

```ts
await this.events.publish(
  APP_EVENTS.AUDIT.LOG_REQUESTED,
  {
    action: 'ORDER_CREATED',
    entity: 'Order',
    entityId: order.id,
    userId: order.userId,
    metadata: { total: order.total },
  },
  {
    source: 'user',
    actorId: order.userId,
  },
);

await this.events.publish(APP_EVENTS.NOTIFICATION.CREATE_REQUESTED, {
  userId: order.userId,
  title: 'Order created',
  message: `Your order ${order.id} has been created.`,
  type: 'ORDER',
  channels: ['IN_APP', 'SOCKET'],
  metadata: { orderId: order.id },
});
```

4. Import the module in `AppModule`.

Keep business modules focused on business logic. Let core handlers handle side effects.

## Adding A New Event

Use this checklist:

1. Add event name to `src/core/events/app-event.constants.ts`.
2. Add payload type to `src/core/events/app-event.types.ts`.
3. Create or update a handler in `src/core/events/handlers`.
4. Register the handler provider in `AppEventModule`.
5. If async work is needed, add queue method and processor.
6. Add or update Prisma model if persistence is required.
7. Add tests for the service or handler.

Example event constant:

```ts
PAYMENT: {
  SUCCEEDED: 'payment.succeeded',
  FAILED: 'payment.failed',
},
```

Example payload:

```ts
export interface PaymentSucceededPayload {
  paymentId: string;
  userId: string;
  amount: number;
  currency: string;
}
```

Example handler:

```ts
@Injectable()
export class PaymentEventHandler {
  constructor(private readonly events: AppEventPublisher) {}

  @OnEvent(APP_EVENTS.PAYMENT.SUCCEEDED)
  async handlePaymentSucceeded(event: AppEvent<PaymentSucceededPayload>) {
    await this.events.publish(APP_EVENTS.AUDIT.LOG_REQUESTED, {
      action: 'PAYMENT_SUCCEEDED',
      entity: 'Payment',
      entityId: event.payload.paymentId,
      userId: event.payload.userId,
      metadata: {
        amount: event.payload.amount,
        currency: event.payload.currency,
      },
    });
  }
}
```

## Adding A New Queue

Use this only when the work must run in the background, can retry, or should not block the request.

1. Add queue name to `QUEUE_NAMES`.
2. Register the queue in `QueueModule`.
3. Inject it in `QueueDispatchService`.
4. Add a helper method like `addPaymentJob`.
5. Create a processor with `@Processor(QUEUE_NAMES.PAYMENT)`.
6. Import and provide the processor from the related module.

## Realtime Usage

The websocket core uses Socket.IO.

Common room naming:

```text
user:{userId}
conversation:{conversationId}
admin
```

To emit:

```ts
await this.events.publish(APP_EVENTS.WEBSOCKET.EMIT_REQUESTED, {
  room: `user:${user.id}`,
  event: 'profile.updated',
  data: { userId: user.id },
});
```

Clients should join rooms through the gateway logic you add in `RealtimeGateway`.

## Webhook Usage

To dispatch a webhook:

```ts
await this.events.publish(APP_EVENTS.WEBHOOK.DISPATCH_REQUESTED, {
  url: 'https://partner.example.com/webhooks',
  event: 'order.created',
  payload: {
    orderId: order.id,
    total: order.total,
  },
  secret: process.env.PARTNER_WEBHOOK_SECRET,
});
```

The receiver can verify:

```text
x-webhook-signature = HMAC_SHA256(secret, raw_body)
```

Webhook delivery state is stored in `WebhookDelivery`.

## Cache Usage

Direct Redis usage:

```ts
await this.redisService.set(`user:${userId}`, user, 300);
const cached = await this.redisService.get<User>(`user:${userId}`);
```

Event-based invalidation:

```ts
await this.events.publish(APP_EVENTS.CACHE.INVALIDATE_REQUESTED, {
  key: `user:${userId}`,
});

await this.events.publish(APP_EVENTS.CACHE.INVALIDATE_REQUESTED, {
  pattern: 'users:list:*',
});
```

Note: `deleteByPattern` uses Redis `KEYS`, which is fine for small/local usage but should be replaced with a `SCAN` based implementation for high-volume production Redis.

## API Behavior

The app sets:

- Global prefix: `/api`
- URI versioning: `/v1`
- Swagger: `/api/v1/docs`
- Validation: whitelist enabled, non-whitelisted fields rejected, transform enabled
- Response interceptor: standard response formatting
- Exception filter: standard error formatting
- CORS: enabled with credentials
- Security middleware: helmet

Controllers should normally live under `src/modules/{feature}`.

## Testing Guidance

For normal business modules:

- Unit test services.
- Mock `AppEventPublisher` and assert expected events are published.
- Test handlers separately when they perform important side effects.

For event handlers:

- Mock dependent services like `NotificationService`, `QueueDispatchService`, `AuditService`.
- Assert the correct queue job or database write is requested.

For processors:

- Mock external services.
- Assert retries are allowed to happen by throwing errors instead of swallowing them.

Run:

```bash
npm run test
npm run test:e2e
```

## Production Checklist

Before using this template in production:

- Replace JWT secrets.
- Configure real SMTP credentials.
- Use managed PostgreSQL and Redis or secure your own instances.
- Add auth modules and guards.
- Add request ID middleware and pass `requestId` into event publish options.
- Replace placeholder file-processing and search logic with real implementations.
- Replace Redis pattern deletion with `SCAN` for large keyspaces.
- Add queue monitoring, for example Bull Board or your monitoring stack.
- Add structured logging and log shipping.
- Add rate limiting for public APIs.
- Add health checks for database, Redis, queue workers, and external providers.
- Add CI steps for lint, test, build, and migration checks.
- Review CORS origins and helmet CSP for your frontend domain.

## Recommended Team Rules

- Publish events after the main database write succeeds.
- Do not put unrelated side effects inside feature services.
- Keep event payloads small and explicit.
- Prefer IDs over huge nested objects in events.
- Make handlers idempotent when possible.
- Use queues for slow or unreliable work.
- Keep event names stable because other handlers may depend on them.
- Add a new payload type whenever you add a new event.
- Never publish raw secrets, tokens, passwords, or full payment data in event payloads.

## Quick Example: User Signup Flow

After creating a user:

```ts
await this.events.publish(APP_EVENTS.EMAIL.SEND_REQUESTED, {
  to: user.email,
  subject: 'Welcome',
  template: 'welcome',
  data: { name: user.fullName },
});

await this.events.publish(APP_EVENTS.NOTIFICATION.CREATE_REQUESTED, {
  userId: user.id,
  title: 'Welcome',
  message: 'Your account is ready.',
  channels: ['IN_APP', 'SOCKET'],
});

await this.events.publish(APP_EVENTS.AUDIT.LOG_REQUESTED, {
  action: 'USER_SIGNED_UP',
  entity: 'User',
  entityId: user.id,
  userId: user.id,
});
```

The signup service stays simple. Email, notification, websocket, and audit work happens through core handlers.

## Developer Handbook: How To Actually Use This Template

Ei section ta notun developer der jonno. Kothay ki ache, keno ache, and feature build korte gele kon file touch korte hobe, step by step bola holo.

### Mental Model

This template follows one simple rule:

```text
Main feature service = core business decision
Event handler = side effect decision
Queue processor = slow/retryable work
Core service = reusable infrastructure operation
```

Example:

```text
OrdersService.createOrder()
  -> order DB row create kore
  -> APP_EVENTS.AUDIT.LOG_REQUESTED publish kore
  -> APP_EVENTS.NOTIFICATION.CREATE_REQUESTED publish kore
  -> APP_EVENTS.WEBHOOK.DISPATCH_REQUESTED publish kore

AuditEventHandler
  -> AuditLog create kore

NotificationEventHandler
  -> Notification create kore
  -> email/socket queue korte pare

WebhookEventHandler
  -> WebhookDelivery create kore
  -> webhook queue kore
```

So, kono feature service er vitore direct email send, websocket emit, webhook call, audit insert, cache invalidation, search index update mix korba na. Feature service event publish korbe. Side effect dedicated handler handle korbe.

### When To Use Event, Queue, Or Direct Service Call

Use direct service call when:

- The action is required to complete the current request.
- The action must fail the request if it fails.
- The action is fast and local.

Example:

```ts
const user = await this.prisma.user.create({ data });
```

Use event when:

- Multiple side effects may happen from one business action.
- The publisher should not know who reacts.
- You want the business module to stay clean.

Example:

```ts
await this.events.publish(APP_EVENTS.AUDIT.LOG_REQUESTED, {
  action: 'USER_CREATED',
  entity: 'User',
  entityId: user.id,
  userId: user.id,
});
```

Use queue when:

- Work is slow.
- Work calls external services.
- Work needs retry.
- Work can continue after the HTTP response.

Example:

```ts
await this.queueDispatchService.addEmailJob('send-email', {
  to: user.email,
  subject: 'Welcome',
});
```

In normal feature code, prefer event publishing over direct queue calls. Queue calls should usually live inside event handlers.

### File Responsibility Map

Use this map when you are lost.

| File or Folder | Responsibility |
| --- | --- |
| `src/app.module.ts` | Root module. Imports global config, database, event system, and feature modules. |
| `src/main.ts` | App bootstrap. Sets global prefix, versioning, Swagger, CORS, helmet, validation, interceptors, filters. |
| `src/config/env.validation.ts` | Zod env validation. Add required env keys here. |
| `src/core/events/app-event.constants.ts` | Central event names and queue names. Add every new event here. |
| `src/core/events/app-event.types.ts` | Payload types for events. Add every new payload here. |
| `src/core/events/app-event.publisher.ts` | Event publishing abstraction. Inject this into services. |
| `src/core/events/app-event.module.ts` | Registers EventEmitter, event handlers, and core modules. |
| `src/core/events/handlers` | Event listeners. Convert events into side effects. |
| `src/core/queue/queue.module.ts` | BullMQ Redis connection and queue registration. |
| `src/core/queue/queue-dispatch.service.ts` | Helper service for adding jobs to queues. |
| `src/core/*/processors` | BullMQ workers. Process background jobs. |
| `src/core/database/prisma.service.ts` | Prisma client wrapper. |
| `src/core/redis/redis.service.ts` | Redis helper methods. |
| `src/core/mail/mail.service.ts` | Nodemailer email sender and simple template renderer. |
| `src/core/websocket/realtime.gateway.ts` | Socket.IO connection and room joining events. |
| `src/core/websocket/realtime.service.ts` | Emits websocket messages to rooms. |
| `src/core/webhook/webhook.service.ts` | Creates and dispatches outgoing webhook deliveries. |
| `src/core/notification/notification.service.ts` | Creates notification rows and fans out email/socket channels. |
| `src/core/audit/audit.service.ts` | Creates audit logs. |
| `src/core/activity/activity.service.ts` | Creates activity logs. |
| `src/core/file-processing/file-processing.service.ts` | Tracks and runs file processing actions. |
| `src/core/search/search.service.ts` | Tracks and runs search indexing actions. |
| `src/core/reminder/reminder.service.ts` | Creates scheduled reminders and sends notifications when due. |
| `prisma/schema.prisma` | Database models and generated Prisma client config. |
| `docker-compose.yml` | Local PostgreSQL and Redis. |

### Core Module Dependency Flow

This is the actual dependency direction:

```text
Feature modules
  -> AppEventPublisher
    -> Event handlers
      -> Core services
      -> QueueDispatchService
        -> BullMQ queues
          -> Processors
            -> Core services / external providers
```

Keep dependencies one-way. Feature modules can publish events. Core event handlers should not depend on feature modules unless there is a very strong reason.

### Request Lifecycle In This Project

HTTP request lifecycle:

```text
Request
  -> Nest adapter
  -> global prefix /api
  -> version /v1
  -> controller
  -> validation pipe
  -> service
  -> events or database
  -> response interceptor
  -> response
```

If an exception is thrown:

```text
Exception
  -> HttpExceptionFilter
  -> formatted error response
```

If a service publishes an async event:

```text
Service
  -> AppEventPublisher.publish
  -> EventEmitter emitAsync
  -> all matching @OnEvent handlers
  -> return after handlers complete
```

Important: `publish` waits for async handlers because it uses `emitAsync`. So if a handler is slow, the publishing service can become slow. For slow work, handler should queue a job and return quickly.

### Event Publishing Rules

Follow these rules in team projects:

1. Publish events after the main database write succeeds.
2. Do not publish events before a transaction commits unless you know what you are doing.
3. Keep event payloads small.
4. Include IDs, not full database objects.
5. Include `source`, `actorId`, and `requestId` when possible.
6. Do not put passwords, JWTs, API keys, card data, or private secrets into event payloads.
7. Make handler logic safe to retry when it calls queues or external systems.
8. Use clear event names: `domain.action_state`, for example `order.created`, `payment.failed`.

Good payload:

```ts
await this.events.publish(
  APP_EVENTS.AUDIT.LOG_REQUESTED,
  {
    action: 'PRODUCT_UPDATED',
    entity: 'Product',
    entityId: product.id,
    userId: actor.id,
    metadata: {
      changedFields: ['name', 'price'],
    },
  },
  {
    source: 'admin',
    actorId: actor.id,
    requestId,
  },
);
```

Bad payload:

```ts
await this.events.publish('product.updated', {
  fullUserObject,
  password,
  accessToken,
  hugeNestedProductTree,
});
```

### Event Naming Convention

Use this naming pattern:

```text
domain.action
domain.action_requested
domain.action_completed
domain.action_failed
```

Examples:

```text
email.send_requested
notification.create_requested
webhook.dispatch_requested
search.index_requested
reminder.schedule_requested
payment.succeeded
payment.failed
```

Use `_requested` when the event asks another part of the system to do work.

Use past tense when the event says something already happened:

```text
message.sent
payment.succeeded
file.uploaded
```

### Handler Design Rules

Handlers should be thin:

```text
Handler receives event
  -> validates basic assumptions if needed
  -> calls a core service or queues a job
  -> logs result
```

Good handler:

```ts
@OnEvent(APP_EVENTS.WEBHOOK.DISPATCH_REQUESTED)
async handleWebhookDispatchRequested(
  event: AppEvent<WebhookDispatchRequestedPayload>,
): Promise<void> {
  const delivery = await this.webhookService.createDelivery(event.payload);

  await this.queueDispatchService.addWebhookJob('dispatch-webhook', {
    ...event.payload,
    deliveryId: delivery.id,
  });
}
```

Avoid putting large business logic directly inside handlers. Move reusable logic into a service.

### Queue Processor Rules

Processors should:

- Log job start and completion.
- Call a service to do the actual work.
- Throw errors when work fails so BullMQ can retry.
- Update database status when needed.

Pattern:

```ts
@Processor(QUEUE_NAMES.SEARCH)
export class SearchProcessor extends WorkerHost {
  constructor(private readonly searchService: SearchService) {
    super();
  }

  async process(job: Job<SearchJobData>): Promise<void> {
    try {
      await this.searchService.process(job.data.searchJobId, job.data);
    } catch (error) {
      await this.searchService.markFailed(
        job.data.searchJobId,
        error instanceof Error ? error.message : 'Unknown error',
      );

      throw error;
    }
  }
}
```

Do not swallow errors in processors if you want retries.

### How To Add A Complete Feature: Example Orders Module

This is a full pattern that team members can copy.

#### 1. Create module files

```text
src/modules/orders/
  orders.module.ts
  orders.controller.ts
  orders.service.ts
  dto/
    create-order.dto.ts
    update-order-status.dto.ts
```

#### 2. Add Prisma models

Example:

```prisma
model Order {
  id        String   @id @default(uuid())
  userId    String
  status    String   @default("PENDING")
  total     Decimal
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([status])
  @@index([createdAt])
}
```

Then run:

```bash
npx prisma migrate dev --name add_orders
npm run generate
```

#### 3. Create DTO

```ts
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  userId: string;

  @IsArray()
  items: Array<{
    productId: string;
    quantity: number;
  }>;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
```

#### 4. Create service and publish events

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AppEventPublisher } from '../../core/events/app-event.publisher';
import { APP_EVENTS } from '../../core/events/app-event.constants';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: AppEventPublisher,
  ) {}

  async create(dto: CreateOrderDto, actorId?: string, requestId?: string) {
    const order = await this.prisma.order.create({
      data: {
        userId: dto.userId,
        total: 0,
        metadata: dto.metadata as any,
      },
    });

    await this.events.publish(
      APP_EVENTS.AUDIT.LOG_REQUESTED,
      {
        action: 'ORDER_CREATED',
        entity: 'Order',
        entityId: order.id,
        userId: actorId ?? dto.userId,
        metadata: { orderId: order.id },
      },
      { source: 'user', actorId, requestId },
    );

    await this.events.publish(
      APP_EVENTS.NOTIFICATION.CREATE_REQUESTED,
      {
        userId: dto.userId,
        title: 'Order created',
        message: 'Your order has been created.',
        type: 'ORDER',
        channels: ['IN_APP', 'SOCKET'],
        metadata: { orderId: order.id },
      },
      { source: 'user', actorId, requestId },
    );

    await this.events.publish(
      APP_EVENTS.WEBHOOK.DISPATCH_REQUESTED,
      {
        url: 'https://partner.example.com/webhooks',
        event: 'order.created',
        payload: {
          orderId: order.id,
          userId: order.userId,
        },
      },
      { source: 'system', actorId, requestId },
    );

    return order;
  }
}
```

#### 5. Add controller

```ts
import { Body, Controller, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller({
  path: 'orders',
  version: '1',
})
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }
}
```

Route will be:

```text
POST /api/v1/orders
```

#### 6. Add module

```ts
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
```

#### 7. Register module in AppModule

```ts
@Module({
  imports: [
    ConfigModule.forRoot(...),
    DatabaseModule,
    AppEventModule,
    HealthModule,
    OrdersModule,
  ],
})
export class AppModule {}
```

### How To Add A New Domain Event Properly

Example: payment success event.

#### 1. Add constant

In `src/core/events/app-event.constants.ts`:

```ts
PAYMENT: {
  SUCCEEDED: 'payment.succeeded',
  FAILED: 'payment.failed',
  REFUND_REQUESTED: 'payment.refund_requested',
  REFUNDED: 'payment.refunded',
},
```

#### 2. Add payload types

In `src/core/events/app-event.types.ts`:

```ts
export interface PaymentSucceededPayload {
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  provider: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentFailedPayload {
  paymentId?: string;
  orderId?: string;
  userId?: string;
  reason: string;
  provider: string;
  metadata?: Record<string, unknown>;
}
```

#### 3. Create handler

Create:

```text
src/core/events/handlers/payment-event.handler.ts
```

```ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { APP_EVENTS } from '../app-event.constants';
import type { AppEvent, PaymentSucceededPayload } from '../app-event.types';
import { AuditService } from '../../audit/audit.service';
import { NotificationService } from '../../notification/notification.service';

@Injectable()
export class PaymentEventHandler {
  private readonly logger = new Logger(PaymentEventHandler.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  @OnEvent(APP_EVENTS.PAYMENT.SUCCEEDED)
  async handlePaymentSucceeded(
    event: AppEvent<PaymentSucceededPayload>,
  ): Promise<void> {
    await this.auditService.create({
      action: 'PAYMENT_SUCCEEDED',
      entity: 'Payment',
      entityId: event.payload.paymentId,
      userId: event.payload.userId,
      metadata: {
        orderId: event.payload.orderId,
        amount: event.payload.amount,
        currency: event.payload.currency,
        provider: event.payload.provider,
      },
    });

    await this.notificationService.create({
      userId: event.payload.userId,
      title: 'Payment successful',
      message: 'Your payment was completed successfully.',
      type: 'PAYMENT',
      channels: ['IN_APP', 'SOCKET'],
      metadata: {
        paymentId: event.payload.paymentId,
        orderId: event.payload.orderId,
      },
    });

    this.logger.log(`Payment success handled: ${event.payload.paymentId}`);
  }
}
```

#### 4. Register handler

In `AppEventModule`:

```ts
import { PaymentEventHandler } from './handlers/payment-event.handler';

@Module({
  providers: [
    AppEventPublisher,
    PaymentEventHandler,
  ],
})
export class AppEventModule {}
```

#### 5. Publish from payment service

```ts
await this.events.publish(
  APP_EVENTS.PAYMENT.SUCCEEDED,
  {
    paymentId: payment.id,
    orderId: payment.orderId,
    userId: payment.userId,
    amount: payment.amount,
    currency: payment.currency,
    provider: 'stripe',
  },
  {
    source: 'system',
    actorId: payment.userId,
    requestId,
  },
);
```

### How To Add A New Queue With Processor

Example: report generation queue.

#### 1. Add queue name

```ts
export const QUEUE_NAMES = {
  EMAIL: 'email',
  WEBSOCKET: 'websocket',
  WEBHOOK: 'webhook',
  FILE_PROCESSING: 'file-processing',
  SEARCH: 'search',
  REMINDER: 'reminder',
  REPORT: 'report',
} as const;
```

#### 2. Register queue

In `QueueModule`:

```ts
BullModule.registerQueue(
  { name: QUEUE_NAMES.EMAIL },
  { name: QUEUE_NAMES.WEBSOCKET },
  { name: QUEUE_NAMES.WEBHOOK },
  { name: QUEUE_NAMES.FILE_PROCESSING },
  { name: QUEUE_NAMES.SEARCH },
  { name: QUEUE_NAMES.REMINDER },
  { name: QUEUE_NAMES.REPORT },
),
```

#### 3. Inject queue

In `QueueDispatchService`:

```ts
@InjectQueue(QUEUE_NAMES.REPORT)
private readonly reportQueue: Queue,
```

#### 4. Add helper method

```ts
async addReportJob(
  jobName: string,
  data: Record<string, unknown>,
  options?: JobsOptions,
) {
  return this.reportQueue.add(jobName, data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false,
    ...options,
  });
}
```

#### 5. Create processor

```ts
import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../../events/app-event.constants';

type ReportJobData = {
  reportId: string;
};

@Processor(QUEUE_NAMES.REPORT)
export class ReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportProcessor.name);

  async process(job: Job<ReportJobData>): Promise<void> {
    this.logger.log(`Generating report: ${job.data.reportId}`);
  }
}
```

#### 6. Provide processor from module

```ts
@Module({
  providers: [ReportProcessor, ReportService],
})
export class ReportModule {}
```

### How To Use Current Built-In Flows

#### Send email

```ts
await this.events.publish(APP_EVENTS.EMAIL.SEND_REQUESTED, {
  to: 'user@example.com',
  subject: 'Welcome',
  template: 'welcome',
  data: { name: 'Amit' },
});
```

Actual flow:

```text
EMAIL.SEND_REQUESTED
  -> EmailEventHandler
  -> QueueDispatchService.addEmailJob('send-email')
  -> EmailProcessor
  -> MailService.send
  -> nodemailer
```

#### Create notification

```ts
await this.events.publish(APP_EVENTS.NOTIFICATION.CREATE_REQUESTED, {
  userId: 'user_123',
  title: 'Profile updated',
  message: 'Your profile was updated successfully.',
  type: 'PROFILE',
  channels: ['IN_APP', 'SOCKET'],
  metadata: { profileId: 'profile_123' },
});
```

Actual flow:

```text
NOTIFICATION.CREATE_REQUESTED
  -> NotificationEventHandler
  -> NotificationService.create
  -> Notification row create
  -> if SOCKET channel, websocket job queue
  -> if EMAIL channel, email job queue
```

#### Add audit log

```ts
await this.events.publish(APP_EVENTS.AUDIT.LOG_REQUESTED, {
  action: 'USER_DELETED',
  entity: 'User',
  entityId: userId,
  userId: adminId,
  oldValue: previousUser,
  metadata: { reason: 'Admin action' },
});
```

Actual flow:

```text
AUDIT.LOG_REQUESTED
  -> AuditEventHandler
  -> AuditService.create
  -> AuditLog row create
```

#### Add activity log

```ts
await this.events.publish(APP_EVENTS.ACTIVITY.LOG_REQUESTED, {
  userId,
  title: 'Profile updated',
  description: 'User changed profile picture',
  entity: 'User',
  entityId: userId,
});
```

Activity logs are better for user-facing timelines. Audit logs are better for compliance and admin/security tracing.

#### Emit websocket event

```ts
await this.events.publish(APP_EVENTS.WEBSOCKET.EMIT_REQUESTED, {
  room: `user:${userId}`,
  event: 'profile.updated',
  data: { userId },
});
```

Client joins room:

```ts
socket.emit('join-user-room', { userId });
```

For conversation:

```ts
socket.emit('join-conversation-room', { conversationId });
```

Then server can emit:

```ts
await this.events.publish(APP_EVENTS.WEBSOCKET.EMIT_REQUESTED, {
  room: `conversation:${conversationId}`,
  event: 'message.sent',
  data: { messageId, conversationId },
});
```

#### Dispatch webhook

```ts
await this.events.publish(APP_EVENTS.WEBHOOK.DISPATCH_REQUESTED, {
  url: 'https://example.com/webhook',
  event: 'invoice.paid',
  payload: {
    invoiceId,
    userId,
    amount,
  },
  headers: {
    'x-partner-id': 'partner_123',
  },
  secret: 'shared_secret',
});
```

Actual body sent:

```json
{
  "event": "invoice.paid",
  "payload": {
    "invoiceId": "invoice_123",
    "userId": "user_123",
    "amount": 500
  },
  "sentAt": "2026-05-23T00:00:00.000Z"
}
```

If `secret` is passed, request includes:

```text
x-webhook-signature: sha256_hmac_body
```

#### Process file

```ts
await this.events.publish(APP_EVENTS.FILE.PROCESS_REQUESTED, {
  fileId: 'file_123',
  filePath: '/uploads/users.csv',
  mimeType: 'text/csv',
  action: 'CSV_IMPORT',
  metadata: {
    uploadedBy: userId,
  },
});
```

Actual flow:

```text
FILE.PROCESS_REQUESTED
  -> FileEventHandler
  -> FileProcessingService.createJob
  -> FileProcessingJob row with PENDING
  -> file-processing queue
  -> FileProcessingProcessor
  -> FileProcessingService.process
  -> mark PROCESSING
  -> runAction
  -> mark PROCESSED or FAILED
```

Current `runAction` is placeholder. Replace each switch case with real logic.

#### Search index

```ts
await this.events.publish(APP_EVENTS.SEARCH.INDEX_REQUESTED, {
  indexName: 'products',
  entity: 'Product',
  entityId: product.id,
  data: {
    name: product.name,
    price: product.price,
    categoryId: product.categoryId,
  },
});
```

Update:

```ts
await this.events.publish(APP_EVENTS.SEARCH.UPDATE_REQUESTED, {
  indexName: 'products',
  entity: 'Product',
  entityId: product.id,
  data: {
    name: product.name,
    price: product.price,
  },
});
```

Delete:

```ts
await this.events.publish(APP_EVENTS.SEARCH.DELETE_REQUESTED, {
  indexName: 'products',
  entity: 'Product',
  entityId: product.id,
});
```

Connect real provider in `SearchService.process`.

#### Schedule reminder

```ts
await this.events.publish(APP_EVENTS.REMINDER.SCHEDULE_REQUESTED, {
  userId,
  title: 'Appointment reminder',
  message: 'Your appointment starts in 30 minutes.',
  remindAt: '2026-05-23T10:00:00.000Z',
  channels: ['IN_APP', 'SOCKET'],
  metadata: {
    appointmentId,
  },
});
```

Actual flow:

```text
REMINDER.SCHEDULE_REQUESTED
  -> ReminderEventHandler
  -> ReminderService.create
  -> calculate delay
  -> reminder queue with delay
  -> ReminderProcessor
  -> ReminderService.send
  -> NotificationService.create
  -> reminder marked SENT
```

#### Invalidate cache

Single key:

```ts
await this.events.publish(APP_EVENTS.CACHE.INVALIDATE_REQUESTED, {
  key: `product:${productId}`,
});
```

Pattern:

```ts
await this.events.publish(APP_EVENTS.CACHE.INVALIDATE_REQUESTED, {
  pattern: 'products:list:*',
});
```

Tags:

```ts
await this.events.publish(APP_EVENTS.CACHE.INVALIDATE_REQUESTED, {
  tags: ['products', 'homepage'],
});
```

### Database Table Purpose And Status Values

#### `AuditLog`

Purpose:

- Store security and compliance history.
- Track who changed what and when.

Important fields:

- `action`: action name like `USER_UPDATED`
- `entity`: domain name like `User`
- `entityId`: ID of changed entity
- `userId`: actor or affected user
- `oldValue`, `newValue`: before/after snapshots
- `ipAddress`, `userAgent`: request metadata

#### `ActivityLog`

Purpose:

- Store user timeline or admin activity feed.

Use when the event is useful for product UX, not only security.

#### `Notification`

Purpose:

- Store in-app notifications.
- Track read/unread state.
- Store chosen delivery channels.

Statuses:

- `isRead = false`: unread
- `isRead = true`: read

#### `WebhookDelivery`

Purpose:

- Track outgoing webhook dispatches.

Statuses:

- `PENDING`
- `SENT`
- `FAILED`

Important fields:

- `attempts`
- `responseStatusCode`
- `responseBody`
- `error`
- `deliveredAt`

#### `FileProcessingJob`

Purpose:

- Track background file work.

Statuses:

- `PENDING`
- `PROCESSING`
- `PROCESSED`
- `FAILED`

#### `Reminder`

Purpose:

- Store scheduled reminder jobs.

Statuses:

- `SCHEDULED`
- `SENT`

You can add `CANCELLED` later if reminder cancellation is needed.

#### `SystemAlert`

Purpose:

- Store operational alerts for admins or devops.

Statuses:

- `OPEN`
- `RESOLVED`

Severity:

- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

#### `SearchIndexJob`

Purpose:

- Track search indexing operations.

Statuses:

- `PENDING`
- `COMPLETED`
- `FAILED`

Operations:

- `INDEX`
- `UPDATE`
- `DELETE`

### Error Handling Strategy

Controller/service errors:

- Throw Nest exceptions like `BadRequestException`, `NotFoundException`, `UnauthorizedException`.
- Global `HttpExceptionFilter` formats error responses.

Event handler errors:

- If `publish` is used, handler errors can bubble back to publisher.
- Keep handlers quick and reliable.
- For risky external calls, queue a job from handler and let processor retry.

Processor errors:

- Catch only when you need to update DB status.
- Re-throw after marking failure so BullMQ retries.

Example:

```ts
try {
  await this.externalProvider.call(job.data);
} catch (error) {
  await this.service.markFailed(id, errorMessage);
  throw error;
}
```

### Idempotency Guidance

Some events or jobs may run more than once because of retries. Design important handlers and processors to be idempotent.

Examples:

- Before creating a webhook delivery for a unique business event, check if one already exists.
- Before sending a reminder, check status is still `SCHEDULED`.
- Before marking notification read, make update safe if already read.
- For payment webhooks, store provider event ID and ignore duplicates.

Current reminder flow already has a basic idempotency guard:

```ts
if (!reminder || reminder.status !== 'SCHEDULED') {
  return null;
}
```

### Transaction Guidance

If a feature uses a transaction, publish event after transaction completes:

```ts
const order = await this.prisma.$transaction(async (tx) => {
  const created = await tx.order.create({ data });
  await tx.orderItem.createMany({ data: items });
  return created;
});

await this.events.publish(APP_EVENTS.AUDIT.LOG_REQUESTED, {
  action: 'ORDER_CREATED',
  entity: 'Order',
  entityId: order.id,
});
```

Do not do this unless you accept the risk:

```ts
await this.prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data });

  await this.events.publish(APP_EVENTS.AUDIT.LOG_REQUESTED, {
    action: 'ORDER_CREATED',
    entity: 'Order',
    entityId: order.id,
  });
});
```

Why? If transaction rolls back after event is published, side effects may happen for data that does not exist.

### Request ID And Actor ID Pattern

For production, add middleware that creates or reads a request ID:

```text
x-request-id
```

Then pass it into event options:

```ts
await this.events.publish(
  APP_EVENTS.AUDIT.LOG_REQUESTED,
  payload,
  {
    source: 'admin',
    actorId: currentUser.id,
    requestId: request.id,
  },
);
```

Benefits:

- Logs can be correlated.
- Events can be traced.
- Debugging production issues becomes easier.

### Security Notes

Current template has infrastructure foundation, not a full auth product.

Before production:

- Add auth module.
- Add JWT strategy and guards.
- Add role/permission guards.
- Protect websocket room join events.
- Restrict CORS origin.
- Use strong JWT secrets.
- Add rate limiting.
- Add request size limit.
- Validate webhook URLs if users can provide them.
- Do not allow private network webhook targets unless intended.

Webhook SSRF warning:

If external users can create webhook URLs, they might try URLs like:

```text
http://localhost:5432
http://169.254.169.254
http://internal-service
```

For production webhook systems, validate allowed protocols, block private IP ranges, and consider an allowlist.

### Websocket Security Notes

Current gateway lets clients join rooms by sending a user ID or conversation ID:

```ts
socket.emit('join-user-room', { userId });
socket.emit('join-conversation-room', { conversationId });
```

This is fine for template/demo usage. In production, verify the socket identity before joining:

```text
client auth token
  -> validate JWT
  -> get userId
  -> only join user:{ownUserId}
  -> only join conversation if participant
```

Do not trust `body.userId` from client in production.

### Email Template Guidance

Current `MailService.renderTemplate` supports simple built-in templates:

- `welcome`
- `notification`

For real projects, move templates into a dedicated template system:

```text
src/core/mail/templates/
  welcome.template.ts
  notification.template.ts
  password-reset.template.ts
```

Or use a provider:

- React Email
- Handlebars
- MJML
- Provider templates from SendGrid, Resend, Mailgun, Postmark

Keep email sending behind `MailService` so the rest of the app does not care which provider is used.

### Search Provider Integration Pattern

Current `SearchService.process` only marks jobs completed. Replace it like this:

```ts
async process(jobId: string, payload: SearchIndexRequestedPayload) {
  try {
    if (payload.operation === 'DELETE') {
      await this.searchClient
        .index(payload.indexName)
        .deleteDocument(payload.entityId);
    } else {
      await this.searchClient
        .index(payload.indexName)
        .addDocuments([
          {
            id: payload.entityId,
            entity: payload.entity,
            ...payload.data,
          },
        ]);
    }

    return this.prisma.searchIndexJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED' },
    });
  } catch (error) {
    await this.markFailed(
      jobId,
      error instanceof Error ? error.message : 'Unknown error',
    );

    throw error;
  }
}
```

Provider choices:

- Meilisearch: easy setup, good for product search.
- Typesense: fast, developer-friendly.
- Elasticsearch/OpenSearch: powerful and heavier.
- Algolia: managed and polished.

### File Processing Integration Pattern

Current file actions are placeholders. Replace them by action.

Image resize:

```text
Install sharp
Read image
Resize variants
Upload or save outputs
Store result metadata
```

CSV import:

```text
Read file stream
Parse rows
Validate rows
Insert in batches
Store import summary
```

PDF parse:

```text
Read file
Extract text
Store extracted content
Queue search indexing
```

Video thumbnail:

```text
Use ffmpeg
Generate thumbnail
Store output path
```

Virus scan:

```text
Call ClamAV or external scanner
Mark file clean or infected
Block further processing if infected
```

### Deployment Notes

Build:

```bash
npm run build
```

Run:

```bash
npm run start:prod
```

Minimum production services:

```text
API server
PostgreSQL
Redis
Queue workers
SMTP or email provider
Log storage
Monitoring
```

In this template, API and workers run in the same Nest process because processors are registered inside modules. For larger production systems, you may split API and worker processes later:

```text
api process
  -> controllers
  -> publishes events
  -> queues jobs

worker process
  -> no public HTTP requirement
  -> processors enabled
  -> consumes queues
```

### CI Checklist

Recommended CI pipeline:

```bash
npm ci
npm run lint
npm run test
npm run build
```

Migration check:

```bash
npx prisma migrate status
```

For pull requests, require:

- TypeScript build passes.
- Tests pass.
- Prisma migration is included when schema changes.
- README or docs updated when architecture changes.

### Pull Request Checklist For Team

Before merging a feature:

- Did you keep business logic in the feature service?
- Did you publish events for side effects?
- Did you add event constants and payload types?
- Did you register new handlers?
- Did you queue slow external work?
- Did you add migrations for DB changes?
- Did you avoid secrets in payloads/logs?
- Did you add tests for important behavior?
- Did you document new event names?

### Common Mistakes

#### Mistake: sending email directly from feature service

Avoid:

```ts
await this.mailService.send(...);
```

Prefer:

```ts
await this.events.publish(APP_EVENTS.EMAIL.SEND_REQUESTED, payload);
```

#### Mistake: adding event string inline

Avoid:

```ts
await this.events.publish('email.send_requested', payload);
```

Prefer:

```ts
await this.events.publish(APP_EVENTS.EMAIL.SEND_REQUESTED, payload);
```

#### Mistake: huge event payload

Avoid sending full entity graphs. Send IDs and necessary small metadata.

#### Mistake: slow handler

If handler calls external API directly, request may become slow. Queue it.

#### Mistake: not registering handler

Creating handler file is not enough. Add it to `providers` in `AppEventModule`.

#### Mistake: queue exists but processor not provided

Registering queue is not enough. Processor must be provided from a module loaded by the app.

### Developer Onboarding Path

For a new team member, read in this order:

1. `README.md` overview.
2. `src/app.module.ts`.
3. `src/main.ts`.
4. `src/core/events/app-event.constants.ts`.
5. `src/core/events/app-event.types.ts`.
6. `src/core/events/app-event.publisher.ts`.
7. One handler, for example `webhook-event.handler.ts`.
8. One processor, for example `webhook.processor.ts`.
9. One service, for example `webhook.service.ts`.
10. `prisma/schema.prisma`.

After that, create a small test feature module and publish an audit event.

## Troubleshooting

### App fails on startup with env validation error

Check `.env`. Required values:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

### Database connection fails

Make sure Docker database is running:

```bash
docker compose ps
```

Default database URL uses port `5434`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/backend_template
```

### Queue jobs are not processing

Check Redis is running:

```bash
docker compose ps
```

Check env:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

Also confirm the processor class is provided from its module.

### Email fails

Configure SMTP variables:

```env
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
MAIL_FROM=
```

### Prisma client errors

Regenerate:

```bash
npm run generate
```

Then rebuild or restart the dev server.

## Current Template Status

This template includes a strong event-driven foundation and several ready-to-wire infrastructure modules. Some provider-specific logic is intentionally placeholder-level:

- `FileProcessingService.process`
- `SearchService.process`
- auth and user modules
- advanced websocket room authorization
- mail templates beyond simple built-ins

That is intentional. Add project-specific logic there while keeping the event architecture intact.
