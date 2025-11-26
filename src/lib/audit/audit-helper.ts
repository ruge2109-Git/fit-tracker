/**
 * Audit Helper
 * Utility functions for logging audit events
 * Can be used from stores, services, or components
 */

'use client'

import { logger } from '@/lib/logger'

/**
 * Log an audit event
 * This function can be called from anywhere (stores, components, etc.)
 */
export async function logAuditEvent(data: {
  action: string
  entityType: string
  entityId?: string
  details?: Record<string, any>
}): Promise<void> {
  try {
    await fetch('/api/audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  } catch (error) {
    // Silently fail - don't block user actions if audit logging fails
    logger.error('Failed to log audit event', error as Error, 'AuditHelper')
  }
}

