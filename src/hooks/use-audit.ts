/**
 * useAudit Hook
 * Hook for logging user actions to audit log
 */

'use client'

import { useCallback } from 'react'
import { useAuthStore } from '@/store/auth.store'

export interface AuditLogAction {
  action: string
  entityType: string
  entityId?: string
  details?: Record<string, any>
}

export function useAudit() {
  const { user } = useAuthStore()

  const logAction = useCallback(
    async (data: AuditLogAction) => {
      if (!user) return

      try {
        // Call API route to log action (server-side can get IP and user agent)
        await fetch('/api/audit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
      } catch (error) {
        // Silently fail - don't block user actions if audit logging fails
        console.error('Failed to log audit action:', error)
      }
    },
    [user]
  )

  return { logAction }
}

