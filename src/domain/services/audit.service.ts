/**
 * Audit Service
 * Service for logging user actions and retrieving audit logs
 */

import { auditLogRepository, AuditLog } from '@/domain/repositories/audit-log.repository'
import { logger } from '@/lib/logger'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface AuditLogData {
  userId: string
  action: string
  entityType: string
  entityId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export class AuditService {
  /**
   * Log a user action
   */
  async logAction(data: AuditLogData, supabaseClient?: SupabaseClient): Promise<void> {
    try {
      const result = await auditLogRepository.create({
        user_id: data.userId,
        action: data.action,
        entity_type: data.entityType,
        entity_id: data.entityId || null,
        details: data.details || null,
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null,
      }, supabaseClient)

      if (result.error) {
        logger.error('Failed to log audit action', new Error(result.error), 'AuditService')
      }
    } catch (error) {
      logger.error('Error logging audit action', error as Error, 'AuditService')
    }
  }

  /**
   * Get client IP address from request headers
   */
  getClientIP(headers: Headers): string | undefined {
    // Try various headers that might contain the real IP
    const forwarded = headers.get('x-forwarded-for')
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }

    const realIP = headers.get('x-real-ip')
    if (realIP) {
      return realIP
    }

    return undefined
  }

  /**
   * Get user agent from request headers
   */
  getClientUserAgent(headers: Headers): string | undefined {
    return headers.get('user-agent') || undefined
  }
}

export const auditService = new AuditService()

