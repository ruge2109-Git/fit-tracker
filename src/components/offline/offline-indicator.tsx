/**
 * Offline Indicator Component
 * Shows when app is offline and sync status
 */

'use client'

import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useOffline } from '@/hooks/use-offline'
import { Button } from '@/components/ui/button'
import { syncService } from '@/lib/offline/sync'

export function OfflineIndicator() {
  const { isOffline, isSyncing } = useOffline()

  if (!isOffline && !isSyncing) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-background border rounded-lg shadow-lg p-3 flex items-center gap-3">
        {isOffline ? (
          <>
            <WifiOff className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Offline Mode</p>
              <p className="text-xs text-muted-foreground">Changes will sync when online</p>
            </div>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="h-5 w-5 text-primary animate-spin" />
            <div>
              <p className="text-sm font-medium">Syncing...</p>
              <p className="text-xs text-muted-foreground">Updating your data</p>
            </div>
          </>
        ) : null}
        {!isOffline && !isSyncing && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => syncService.sync()}
          >
            <Wifi className="h-4 w-4 mr-2" />
            Sync Now
          </Button>
        )}
      </div>
    </div>
  )
}

