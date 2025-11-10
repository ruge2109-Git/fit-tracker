/**
 * useNotifications Hook
 * Initializes and manages routine notifications
 */

import { useEffect } from 'react'
import { notificationService } from '@/lib/notifications/notification.service'
import { Routine } from '@/types'

export function useNotifications(routines: Routine[]) {
  useEffect(() => {
    if (routines.length > 0) {
      notificationService.scheduleRoutineNotifications(routines)
    }

    return () => {
      notificationService.clearAllNotifications()
    }
  }, [routines])
}

