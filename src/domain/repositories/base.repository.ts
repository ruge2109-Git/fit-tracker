/**
 * Base Repository Interface
 * Following Interface Segregation and Dependency Inversion principles
 * All repositories extend this base interface for consistency
 */

import { ApiResponse } from '@/types'
import { logger } from '@/lib/logger'
import { offlineDB, SyncItem } from '@/lib/offline/db'

export interface IBaseRepository<T> {
  findById(id: string): Promise<ApiResponse<T>>
  findAll(): Promise<ApiResponse<T[]>>
  create(data: Partial<T>): Promise<ApiResponse<T>>
  update(id: string, data: Partial<T>): Promise<ApiResponse<T>>
  delete(id: string): Promise<ApiResponse<boolean>>
}

/**
 * Abstract base repository implementation
 * Provides common functionality for all repositories including offline support
 */
export abstract class BaseRepository<T> implements IBaseRepository<T> {
  protected tableName: string
  protected entityType: SyncItem['type']

  constructor(tableName: string, entityType: SyncItem['type']) {
    this.tableName = tableName
    this.entityType = entityType
  }

  abstract findById(id: string): Promise<ApiResponse<T>>
  abstract findAll(): Promise<ApiResponse<T[]>>
  abstract create(data: Partial<T>): Promise<ApiResponse<T>>
  abstract update(id: string, data: Partial<T>): Promise<ApiResponse<T>>
  abstract delete(id: string): Promise<ApiResponse<boolean>>

  /**
   * Helper to handle remote operations with offline fallback and cache
   */
  protected async fetchWithOfflineFallback<D>(
    remoteCall: () => Promise<{ data: D | null; error: any }>,
    localCall: () => Promise<D | null>,
    saveLocal: (data: D) => Promise<void>
  ): Promise<ApiResponse<D>> {
    const isOnline = typeof window !== 'undefined' ? navigator.onLine : true

    if (!isOnline) {
      const localData = await localCall()
      if (localData) return this.success(localData)
      return { error: 'Offline and no cached data available' }
    }

    try {
      const { data, error } = await remoteCall()
      if (error) {
        const localData = await localCall()
        if (localData) return this.success(localData)
        return this.handleError(error)
      }

      if (data) {
        await saveLocal(data)
        return this.success(data)
      }

      const localData = await localCall()
      return localData ? this.success(localData) : { error: 'No data found' }
    } catch (error) {
      const localData = await localCall()
      if (localData) return this.success(localData)
      return this.handleError(error)
    }
  }

  /**
   * Helper to handle mutations with offline support and sync queue
   */
  protected async mutateWithOfflineSupport<D>(
    remoteCall: () => Promise<{ data: D | null; error: any }>,
    localSave: (data: any) => Promise<void>,
    action: SyncItem['action'],
    dataForSync: any
  ): Promise<ApiResponse<D>> {
    const isOnline = typeof window !== 'undefined' ? navigator.onLine : true
    const localUpdatedAt = new Date().toISOString()

    const queueForSync = async () => {
      await offlineDB.addToSyncQueue({
        type: this.entityType,
        action,
        data: dataForSync,
        localUpdatedAt,
      })
    }

    if (!isOnline) {
      await localSave(dataForSync)
      await queueForSync()
      return this.success(dataForSync as D)
    }

    try {
      const { data, error } = await remoteCall()
      if (error) {
        if (error.message?.includes('FetchError') || error.status === 0) {
          await localSave(dataForSync)
          await queueForSync()
          return this.success(dataForSync as D)
        }
        return this.handleError(error)
      }

      if (data) {
        await localSave(data)
        return this.success(data)
      }

      return { error: 'Mutation failed' }
    } catch (error: any) {
      await localSave(dataForSync)
      await queueForSync()
      return this.success(dataForSync as D)
    }
  }

  /**
   * Helper to handle Supabase errors consistently
   */
  protected handleError(error: any): ApiResponse<never> {
    logger.error(`Repository error in ${this.tableName}`, error as Error, 'BaseRepository')
    return {
      error: error.message || 'An unexpected error occurred',
    }
  }

  /**
   * Helper to return successful responses
   */
  protected success<D>(data: D): ApiResponse<D> {
    return { data }
  }
}

