/**
 * Logger Service
 * Centralized logging following Single Responsibility Principle
 * Replaces console.log/error/warn with a structured logging system
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  context?: string
  error?: Error
  timestamp: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatMessage(level: LogLevel, message: string, context?: string, error?: Error): LogEntry {
    return {
      level,
      message,
      context,
      error,
      timestamp: new Date().toISOString(),
    }
  }

  private log(entry: LogEntry): void {
    if (!this.isDevelopment && entry.level === 'debug') {
      return
    }

    const prefix = `[${entry.level.toUpperCase()}]`
    const contextStr = entry.context ? `[${entry.context}]` : ''
    const message = `${prefix} ${contextStr} ${entry.message}`

    switch (entry.level) {
      case 'error':
        console.error(message, entry.error || '')
        break
      case 'warn':
        console.warn(message)
        break
      case 'debug':
        console.debug(message)
        break
      default:
        console.log(message)
    }
  }

  info(message: string, context?: string): void {
    this.log(this.formatMessage('info', message, context))
  }

  warn(message: string, context?: string): void {
    this.log(this.formatMessage('warn', message, context))
  }

  error(message: string | Error, error?: Error, context?: string): void {
    const errorObj = message instanceof Error ? message : error
    const messageStr = message instanceof Error ? message.message : message
    this.log(this.formatMessage('error', messageStr, context, errorObj))
  }

  debug(message: string, context?: string): void {
    this.log(this.formatMessage('debug', message, context))
  }
}

export const logger = new Logger()

