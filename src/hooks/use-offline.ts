/**
 * useOffline Hook
 * Detects online/offline status and manages sync
 */

import { useEffect, useState } from 'react'
import { syncService } from '@/lib/offline/sync'

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setIsSyncing(true)
      syncService.sync().finally(() => setIsSyncing(false))
    }

    const handleOffline = () => {
      setIsOnline(false)
      setIsSyncing(false)
    }

    setIsOnline(navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, isOffline: !isOnline, isSyncing }
}

