/**
 * Offline Sync Service
 * Handles synchronization when coming back online
 */

import { offlineDB, SyncItem } from './db'
import { workoutRepository } from '@/domain/repositories/workout.repository'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { exerciseRepository } from '@/domain/repositories/exercise.repository'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'

class SyncService {
  private isSyncing = false

  async sync(): Promise<void> {
    if (this.isSyncing) return
    if (!navigator.onLine) return

    this.isSyncing = true

    try {
      const queue = await offlineDB.getSyncQueue()
      
      if (queue.length === 0) {
        this.isSyncing = false
        return
      }

      toast.info(`Syncing ${queue.length} item(s)...`)

      for (const item of queue) {
        try {
          await this.processSyncItem(item)
          await offlineDB.removeFromSyncQueue(item.id)
        } catch (error) {
          logger.error(`Failed to sync item ${item.id}`, error as Error, 'SyncService')
          // Keep item in queue for retry
        }
      }

      toast.success('Sync completed!')
    } catch (error) {
      logger.error('Sync error', error as Error, 'SyncService')
      toast.error('Sync failed. Will retry later.')
    } finally {
      this.isSyncing = false
    }
  }

  private async processSyncItem(item: SyncItem): Promise<void> {
    switch (item.type) {
      case 'workout':
        await this.syncWorkout(item)
        break
      case 'routine':
        await this.syncRoutine(item)
        break
      case 'exercise':
        await this.syncExercise(item)
        break
    }
  }

  private async syncWorkout(item: SyncItem): Promise<void> {
    switch (item.action) {
      case 'create':
        await workoutRepository.create(item.data)
        break
      case 'update':
        await workoutRepository.update(item.data.id, item.data)
        break
      case 'delete':
        await workoutRepository.delete(item.data.id)
        break
    }
  }

  private async syncRoutine(item: SyncItem): Promise<void> {
    switch (item.action) {
      case 'create':
        await routineRepository.create(item.data)
        break
      case 'update':
        await routineRepository.update(item.data.id, item.data)
        break
      case 'delete':
        await routineRepository.delete(item.data.id)
        break
    }
  }

  private async syncExercise(item: SyncItem): Promise<void> {
    switch (item.action) {
      case 'create':
        await exerciseRepository.create(item.data)
        break
      case 'update':
        await exerciseRepository.update(item.data.id, item.data)
        break
      case 'delete':
        await exerciseRepository.delete(item.data.id)
        break
    }
  }
}

export const syncService = new SyncService()

// Auto-sync when coming online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncService.sync()
  })
}

