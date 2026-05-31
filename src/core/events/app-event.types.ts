export type EventSource =
  | 'auth'
  | 'user'
  | 'admin'
  | 'system'
  | 'chat'
  | 'file'
  | 'payment'
  | 'webhook'
  | 'cron'
  | 'unknown';

export interface AppEvent<TPayload = unknown> {
  id: string;
  name: string;
  payload: TPayload;
  source: EventSource;
  actorId?: string;
  requestId?: string;
  occurredAt: string;
}

export interface PublishEventOptions {
  source?: EventSource;
  actorId?: string;
  requestId?: string;
}

export type NotificationChannel =
  | 'IN_APP'
  | 'EMAIL'
  | 'PUSH'
  | 'SOCKET'
  | 'SMS';

export interface EmailSendRequestedPayload {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  data?: Record<string, unknown>;
}

export interface NotificationCreateRequestedPayload {
  userId: string;
  title: string;
  message: string;
  type?: string;
  channels?: NotificationChannel[];
  metadata?: Record<string, unknown>;
}

export interface MessageSentPayload {
  conversationId: string;
  senderId: string;
  receiverIds: string[];
  messageId: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface MessageReadPayload {
  messageId: string;
  userId: string;
  conversationId: string;
}

export interface AuditLogRequestedPayload {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityLogRequestedPayload {
  userId?: string;
  title: string;
  description?: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export interface QueueJobRequestedPayload {
  queueName: string;
  jobName: string;
  data: Record<string, unknown>;
  delay?: number;
  attempts?: number;
}

export interface WebsocketEmitRequestedPayload {
  room: string;
  event: string;
  data: Record<string, unknown>;
}

export interface WebhookDispatchRequestedPayload {
  url: string;
  event: string;
  payload: Record<string, unknown>;
  headers?: Record<string, string>;
  secret?: string;
}

export interface FileProcessRequestedPayload {
  fileId: string;
  filePath: string;
  mimeType: string;
  action:
    | 'IMAGE_RESIZE'
    | 'CSV_IMPORT'
    | 'PDF_PARSE'
    | 'VIDEO_THUMBNAIL'
    | 'VIRUS_SCAN';
  metadata?: Record<string, unknown>;
}

export interface SecurityEventPayload {
  userId?: string;
  email?: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface SystemAlertPayload {
  title: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata?: Record<string, unknown>;
}

export interface CacheInvalidateRequestedPayload {
  key?: string;
  pattern?: string;
  tags?: string[];
}

export interface SearchIndexRequestedPayload {
  indexName: string;
  entity: string;
  entityId: string;
  operation?: 'INDEX' | 'UPDATE' | 'DELETE';
  data?: Record<string, unknown>;
}

export interface ReminderScheduleRequestedPayload {
  userId: string;
  title: string;
  message: string;
  remindAt: string;
  channels?: NotificationChannel[];
  metadata?: Record<string, unknown>;
}
