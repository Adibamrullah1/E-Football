// ============================================================
// Structured Logger — Zero-dependency console wrapper
// ============================================================
// Outputs structured JSON logs for better observability.
// Includes audit() method for admin action trail.
// ============================================================

type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
}

interface AuditEntry {
  timestamp: string
  level: 'audit'
  action: string
  entity: string
  entityId?: string
  userId?: string
  details?: Record<string, unknown>
}

function formatEntry(entry: LogEntry | AuditEntry): string {
  return JSON.stringify(entry)
}

function getTimestamp(): string {
  return new Date().toISOString()
}

export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = { timestamp: getTimestamp(), level: 'info', message, context }
    console.log(formatEntry(entry))
  },

  warn(message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = { timestamp: getTimestamp(), level: 'warn', message, context }
    console.warn(formatEntry(entry))
  },

  error(message: string, error?: unknown, context?: Record<string, unknown>) {
    const errorDetails: Record<string, unknown> = { ...context }

    if (error instanceof Error) {
      errorDetails.errorName = error.name
      errorDetails.errorMessage = error.message
      errorDetails.stack = error.stack?.split('\n').slice(0, 3).join(' | ')
    } else if (error !== undefined) {
      errorDetails.errorRaw = String(error)
    }

    const entry: LogEntry = {
      timestamp: getTimestamp(),
      level: 'error',
      message,
      context: errorDetails,
    }
    console.error(formatEntry(entry))
  },

  /**
   * Audit log for admin actions (create, update, delete).
   * Provides an action trail without needing a separate DB table.
   */
  audit(params: {
    action: 'CREATE' | 'UPDATE' | 'DELETE'
    entity: string
    entityId?: string
    userId?: string
    details?: Record<string, unknown>
  }) {
    const entry: AuditEntry = {
      timestamp: getTimestamp(),
      level: 'audit',
      ...params,
    }
    console.log(formatEntry(entry))
  },

  /**
   * Log an API request with method, path, and optional status.
   */
  request(method: string, path: string, status: number, durationMs?: number) {
    const entry: LogEntry = {
      timestamp: getTimestamp(),
      level: 'info',
      message: `${method} ${path} → ${status}`,
      context: { method, path, status, ...(durationMs !== undefined ? { durationMs } : {}) },
    }
    console.log(formatEntry(entry))
  },
}
