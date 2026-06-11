/**
 * Logger Service
 * Centralized logging following Single Responsibility Principle
 * Replaces console.log/error/warn with a structured logging system
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  context?: string
  error?: Error
  stack?: string
  timestamp: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private minLevel: LogLevel = this.isDevelopment ? 'debug' : 'info'
  private readonly levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.minLevel]
  }

  private getStackTrace(): string | undefined {
    if (typeof Error.captureStackTrace !== 'function') return undefined
    const obj = {} as any
    Error.captureStackTrace(obj, this.getStackTrace)
    return obj.stack?.split('\n').slice(3, 5).join('\n')
  }

  private formatEntry(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString()
    const level = entry.level.toUpperCase().padEnd(5)
    const context = entry.context ? `[${entry.context}]` : ''

    if (this.isDevelopment) {
      return `${timestamp} ${level} ${context} ${entry.message}`
    }

    // Production: JSON format for log aggregation
    return JSON.stringify({
      timestamp,
      level: entry.level,
      message: entry.message,
      context: entry.context,
      ...(entry.error && { error: entry.error.message }),
      ...(entry.stack && { stack: entry.stack }),
    })
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return

    const formatted = this.formatEntry(entry)

    switch (entry.level) {
      case 'error':
        console.error(formatted)
        if (entry.error) console.error(entry.error)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'debug':
        console.debug(formatted)
        break
      default:
        console.log(formatted)
    }
  }

  info(message: string, context?: string): void {
    this.log({
      level: 'info',
      message,
      context,
      timestamp: new Date().toISOString(),
    })
  }

  warn(message: string, context?: string): void {
    this.log({
      level: 'warn',
      message,
      context,
      timestamp: new Date().toISOString(),
    })
  }

  error(message: string | Error, error?: Error, context?: string): void {
    const errorObj = message instanceof Error ? message : error
    const messageStr = message instanceof Error ? message.message : message

    this.log({
      level: 'error',
      message: messageStr,
      context,
      error: errorObj,
      stack: errorObj?.stack,
      timestamp: new Date().toISOString(),
    })
  }

  debug(message: string, context?: string): void {
    this.log({
      level: 'debug',
      message,
      context,
      stack: this.getStackTrace(),
      timestamp: new Date().toISOString(),
    })
  }
}

export const logger = new Logger()

