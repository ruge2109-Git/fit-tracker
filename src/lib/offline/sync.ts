import { offlineDB, SyncItem } from './db'
import { workoutRepository } from '@/domain/repositories/workout.repository'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { exerciseRepository } from '@/domain/repositories/exercise.repository'
import { setRepository } from '@/domain/repositories/set.repository'
import { tagRepository } from '@/domain/repositories/tag.repository'
import { bodyMeasurementRepository } from '@/domain/repositories/body-measurement.repository'
import { goalRepository } from '@/domain/repositories/goal.repository'
import { progressPhotoRepository } from '@/domain/repositories/progress-photo.repository'
import { auditLogRepository } from '@/domain/repositories/audit-log.repository'
import { feedbackRepository } from '@/domain/repositories/feedback.repository'
import { pushSubscriptionRepository } from '@/domain/repositories/push-subscription.repository'
import { savedFilterRepository } from '@/domain/repositories/saved-filter.repository'
import { workoutTagRepository } from '@/domain/repositories/workout-tag.repository'
import { logger } from '@/lib/logger'
import { toast } from 'sonner'

const MAX_RETRIES = 5

class SyncService {
  private isSyncing = false
  private repositoryRegistry: Record<string, any> = {
    workout: workoutRepository,
    routine: routineRepository,
    exercise: exerciseRepository,
    set: setRepository,
    tag: tagRepository,
    body_measurement: bodyMeasurementRepository,
    goal: goalRepository,
    progress_photo: progressPhotoRepository,
    audit_log: auditLogRepository,
    feedback: feedbackRepository,
    push_subscription: pushSubscriptionRepository,
    saved_filter: savedFilterRepository,
    workout_tag: workoutTagRepository,
    goal_progress: goalRepository,
  }

  async sync(): Promise<void> {
    if (this.isSyncing) return
    if (typeof navigator !== 'undefined' && !navigator.onLine) return

    this.isSyncing = true

    try {
      const queue = await offlineDB.getSyncQueue()

      if (queue.length === 0) {
        this.isSyncing = false
        return
      }

      logger.info(`Starting sync of ${queue.length} items`, 'SyncService')

      let syncedCount = 0
      let failedCount = 0
      let conflictCount = 0

      for (const item of queue) {
        if ((item.retryCount || 0) >= MAX_RETRIES) {
          logger.warn(`Item ${item.id} exceeded max retries, skipping`, 'SyncService')
          await offlineDB.removeFromSyncQueue(item.id)
          failedCount++
          continue
        }

        try {
          const hadConflict = await this.processSyncItem(item)
          if (hadConflict) conflictCount++
          await offlineDB.removeFromSyncQueue(item.id)
          syncedCount++
        } catch (error) {
          logger.error(`Failed to sync item ${item.id} of type ${item.type}`, error as Error, 'SyncService')
          await offlineDB.incrementRetry(item.id)
          failedCount++
        }
      }

      if (syncedCount > 0) {
        const message = `Sincronización completada (${syncedCount} items${conflictCount > 0 ? `, ${conflictCount} conflictos` : ''})`
        toast.success(message)
      }
      if (failedCount > 0) {
        toast.warning(`${failedCount} items no pudieron sincronizarse. Reintentando después.`)
      }
    } catch (error) {
      logger.error('Sync error', error as Error, 'SyncService')
      toast.error('Error al sincronizar datos.')
    } finally {
      this.isSyncing = false
    }
  }

  private async processSyncItem(item: SyncItem): Promise<boolean> {
    let hadConflict = false

    if (item.type === ('goal_progress' as any)) {
      switch (item.action) {
        case 'create':
          await goalRepository.addProgress(item.data.goal_id, item.data)
          break
      }
      return false
    }

    const repository = this.repositoryRegistry[item.type]

    if (!repository) {
      throw new Error(`No repository registered for type: ${item.type}`)
    }

    if (item.action === 'update' && item.localUpdatedAt && repository.findById) {
      try {
        const serverResult = await repository.findById(item.data.id)
        if (serverResult.data?.updated_at && serverResult.data.updated_at > item.localUpdatedAt) {
          logger.warn(
            `Conflict detected for ${item.type} ${item.data.id}: server version is newer`,
            'SyncService'
          )
          hadConflict = true
        }
      } catch {
        // Unable to check for conflict, proceed with update
      }
    }

    switch (item.action) {
      case 'create':
        await repository.create(item.data)
        break
      case 'update':
        await repository.update(item.data.id, item.data)
        break
      case 'delete':
        await repository.delete(item.data.id)
        break
    }

    return hadConflict
  }
}

export const syncService = new SyncService()
