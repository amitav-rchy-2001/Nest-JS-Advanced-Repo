export const APP_EVENTS = {
    EMAIL: {
        SEND_REQUESTED: 'email.send_requested',
        SENT: 'email.sent',
        FAILED: 'email.failed',
    },
    NOTIFICATION: {
        CREATE_REQUESTED: 'notification.create_requested',
        CREATED: 'notification.created',
        SEND_REQUESTED: 'notification.send_requested',
        SENT: 'notification.sent',
        READ: 'notification.read',
        FAILED: 'notification.failed',
    },
    MESSAGE: {
        CONVERSATION_CREATED: 'message.conversation_created',
        SENT: 'message.sent',
        DELIVERED: 'message.delivered',
        READ: 'message.read',
        DELETED: 'message.deleted',
        TYPING_STARTED: 'message.typing_started',
        TYPING_STOPPED: 'message.typing_stopped',
        RECEIVED: 'message.received',
    },
    AUDIT: {
        LOG_REQUESTED: 'audit.log_requested',
        LOG_CREATED: 'audit.log_created',
    },
    ACTIVITY: {
        LOG_REQUESTED: 'activity.log_requested',
        LOG_CREATED: 'activity.log_created',
    },
    QUEUE: {
        JOB_REQUESTED: 'queue.job_requested',
        JOB_CREATED: 'queue.job_created',
        JOB_COMPLETED: 'queue.job_completed',
        JOB_FAILED: 'queue.job_failed',
    },
    WEBSOCKET: {
        EMIT_REQUESTED: 'websocket.emit_requested',
        EMITTED: 'websocket.emitted',
        FAILED: 'websocket.failed',
    },
    FILE: {
        UPLOADED: 'file.uploaded',
        PROCESS_REQUESTED: 'file.process_requested',
        PROCESSING_STARTED: 'file.processing_started',
        PROCESSED: 'file.processed',
        FAILED: 'file.failed',
        DELETED: 'file.deleted',
    },
    SECURITY: {
        LOGIN_SUCCESS: 'security.login_success',
        LOGIN_FAILED: 'security.login_failed',
        PASSWORD_CHANGED: 'security.password_changed',
        PASSWORD_RESET_REQUESTED: 'security.password_reset_requested',
        ROLE_CHANGED: 'security.role_changed',
        PERMISSION_CHANGED: 'security.permission_changed',
        SUSPICIOUS_ACTIVITY: 'security.suspicious_activity',
    },

    SYSTEM_ALERT: {
        ALERT_REQUESTED: 'system_alert.alert_requested',
        ERROR_OCCURRED: 'system_alert.error_occurred',
        QUEUE_FAILED: 'system_alert.queue_failed',
        CRON_FAILED: 'system_alert.cron_failed',
        DATABASE_FAILED: 'system_alert.database_failed',
    },

    CACHE: {
        INVALIDATE_REQUESTED: 'cache.invalidate_requested',
        INVALIDATED: 'cache.invalidated',
    },

    SEARCH: {
        INDEX_REQUESTED: 'search.index_requested',
        UPDATE_REQUESTED: 'search.update_requested',
        DELETE_REQUESTED: 'search.delete_requested',
        INDEXED: 'search.indexed',
        FAILED: 'search.failed',
    },

    REMINDER: {
        SCHEDULE_REQUESTED: 'reminder.schedule_requested',
        SCHEDULED: 'reminder.scheduled',
        DUE: 'reminder.due',
        SENT: 'reminder.sent',
        FAILED: 'reminder.failed',
    }
} as const;