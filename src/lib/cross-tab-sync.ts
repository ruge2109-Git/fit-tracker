/**
 * Cross-Tab Synchronization
 * Uses BroadcastChannel API to sync state across browser tabs
 */

import { useEffect, useCallback, useRef } from 'react'

interface SyncMessage {
  type: string
  payload: any
  timestamp: number
}

type MessageHandler = (payload: any) => void

class CrossTabSync {
  private channel: BroadcastChannel | null = null
  private handlers = new Map<string, Set<MessageHandler>>()

  constructor(channelName: string = 'fittrackr-sync') {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(channelName)
        this.channel.onmessage = this.handleMessage.bind(this)
      } catch (error) {
        console.warn('BroadcastChannel not supported or failed to initialize')
      }
    }
  }

  private handleMessage = (event: MessageEvent<SyncMessage>) => {
    const { type, payload } = event.data
    const handlers = this.handlers.get(type)
    if (handlers) {
      handlers.forEach((handler) => handler(payload))
    }
  }

  broadcast(type: string, payload: any) {
    if (!this.channel) return

    this.channel.postMessage({
      type,
      payload,
      timestamp: Date.now(),
    } as SyncMessage)
  }

  subscribe(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(type)
      if (handlers) {
        handlers.delete(handler)
      }
    }
  }

  destroy() {
    if (this.channel) {
      this.channel.close()
      this.channel = null
    }
    this.handlers.clear()
  }
}

// Singleton instance
export const crossTabSync = new CrossTabSync()

/**
 * Hook to listen for cross-tab sync messages
 */
export function useCrossTabSync(
  messageType: string,
  handler: (payload: any) => void
) {
  useEffect(() => {
    return crossTabSync.subscribe(messageType, handler)
  }, [messageType, handler])
}

/**
 * Hook to broadcast cross-tab sync messages
 */
export function useBroadcastMessage(messageType: string) {
  return useCallback(
    (payload: any) => {
      crossTabSync.broadcast(messageType, payload)
    },
    [messageType]
  )
}

// Common sync event types
export const SYNC_EVENTS = {
  WORKOUT_CREATED: 'workout:created',
  WORKOUT_UPDATED: 'workout:updated',
  WORKOUT_DELETED: 'workout:deleted',
  EXPORT_STARTED: 'export:started',
  EXPORT_COMPLETED: 'export:completed',
  IMPORT_COMPLETED: 'import:completed',
  CACHE_INVALIDATED: 'cache:invalidated',
} as const
