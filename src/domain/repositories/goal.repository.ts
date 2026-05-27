import { supabase } from '@/lib/supabase/client'
import { Goal, GoalWithProgress, GoalProgress, ApiResponse } from '@/types'
import { BaseRepository } from './base.repository'
import { offlineDB } from '@/lib/offline/db'

export interface IGoalRepository {
  findById(id: string): Promise<ApiResponse<GoalWithProgress>>
  findAll(): Promise<ApiResponse<Goal[]>>
  findByUserId(userId: string): Promise<ApiResponse<Goal[]>>
  findByType(userId: string, type: string): Promise<ApiResponse<Goal[]>>
  findActive(userId: string): Promise<ApiResponse<Goal[]>>
  findCompleted(userId: string): Promise<ApiResponse<Goal[]>>
  create(data: Partial<Goal>): Promise<ApiResponse<Goal>>
  update(id: string, data: Partial<Goal>): Promise<ApiResponse<Goal>>
  delete(id: string): Promise<ApiResponse<boolean>>
  addProgress(goalId: string, progress: Partial<GoalProgress>): Promise<ApiResponse<GoalProgress>>
  getProgress(goalId: string): Promise<ApiResponse<GoalProgress[]>>
}

export class GoalRepository extends BaseRepository<Goal> implements IGoalRepository {
  constructor() {
    super('goals', 'goal')
  }

  async findById(id: string): Promise<ApiResponse<GoalWithProgress>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select(`
            *,
            progress:goal_progress (
              *
            )
          `)
          .eq('id', id)
          .single(),
      async () => await offlineDB.getEntity<GoalWithProgress>(this.tableName, id),
      async (data) => await offlineDB.saveEntity(this.tableName, data)
    )
  }

  async findAll(): Promise<ApiResponse<Goal[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .order('created_at', { ascending: false }),
      async () => await offlineDB.getAllEntities<Goal>(this.tableName),
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findByUserId(userId: string): Promise<ApiResponse<Goal[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
      async () => await offlineDB.getEntitiesByIndex<Goal>(this.tableName, 'user_id', userId),
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findByType(userId: string, type: string): Promise<ApiResponse<Goal[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('user_id', userId)
          .eq('type', type)
          .order('created_at', { ascending: false }),
      async () => {
        const all = await offlineDB.getEntitiesByIndex<Goal>(this.tableName, 'user_id', userId)
        return all.filter(g => g.type === type)
      },
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findActive(userId: string): Promise<ApiResponse<Goal[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('user_id', userId)
          .eq('is_completed', false)
          .order('target_date', { ascending: true, nullsFirst: false }),
      async () => {
        const all = await offlineDB.getEntitiesByIndex<Goal>(this.tableName, 'user_id', userId)
        return all.filter(g => !g.is_completed)
      },
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findCompleted(userId: string): Promise<ApiResponse<Goal[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('user_id', userId)
          .eq('is_completed', true)
          .order('completed_at', { ascending: false }),
      async () => {
        const all = await offlineDB.getEntitiesByIndex<Goal>(this.tableName, 'user_id', userId)
        return all.filter(g => g.is_completed)
      },
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async create(data: Partial<Goal>): Promise<ApiResponse<Goal>> {
    const id = data.id || `${Date.now()}-${Math.random()}`
    const goalData = {
      ...data,
      id,
      current_value: 0,
      is_completed: false,
    }

    return this.mutateWithOfflineSupport(
      async () =>
        await supabase
          .from(this.tableName)
          .insert(goalData)
          .select()
          .single(),
      async (savedData) => await offlineDB.saveEntity(this.tableName, savedData),
      'create',
      goalData
    )
  }

  async update(id: string, data: Partial<Goal>): Promise<ApiResponse<Goal>> {
    const updateData = { ...data, id }
    return this.mutateWithOfflineSupport(
      async () =>
        await supabase
          .from(this.tableName)
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single(),
      async (savedData) => await offlineDB.saveEntity(this.tableName, { ...savedData, id }),
      'update',
      updateData
    )
  }

  async delete(id: string): Promise<ApiResponse<boolean>> {
    return this.mutateWithOfflineSupport(
      async () => {
        const { error } = await supabase
          .from(this.tableName)
          .delete()
          .eq('id', id)
        return { data: error ? null : true, error }
      },
      async () => await offlineDB.deleteEntity(this.tableName, id),
      'delete',
      { id }
    )
  }

  async addProgress(goalId: string, progress: Partial<GoalProgress>): Promise<ApiResponse<GoalProgress>> {
    const isOnline = typeof window !== 'undefined' ? navigator.onLine : true
    const id = `${Date.now()}-${Math.random()}`
    const progressData = {
      id,
      goal_id: goalId,
      value: progress.value,
      notes: progress.notes || null,
      created_at: new Date().toISOString(),
    }

    const localUpdatedAt = new Date().toISOString()
    const queueForSync = async () => {
      await offlineDB.addToSyncQueue({
        type: 'goal_progress' as any,
        action: 'create',
        data: progressData,
        localUpdatedAt,
      })
    }

    if (!isOnline) {
      await offlineDB.saveEntity('goal_progress', progressData)
      await queueForSync()
      return this.success(progressData as GoalProgress)
    }

    try {
      const { data, error } = await supabase
        .from('goal_progress')
        .insert(progressData)
        .select()
        .single()

      if (error) {
        if (error.message?.includes('FetchError') || (error as any).status === 0) {
          await offlineDB.saveEntity('goal_progress', progressData)
          await queueForSync()
          return this.success(progressData as GoalProgress)
        }
        return this.handleError(error)
      }

      if (data) {
        await offlineDB.saveEntity('goal_progress', data)
        return this.success(data as GoalProgress)
      }

      return { error: 'Failed to add progress' }
    } catch (error) {
      await offlineDB.saveEntity('goal_progress', progressData)
      await queueForSync()
      return this.success(progressData as GoalProgress)
    }
  }

  async getProgress(goalId: string): Promise<ApiResponse<GoalProgress[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from('goal_progress')
          .select('*')
          .eq('goal_id', goalId)
          .order('created_at', { ascending: true }),
      async () => {
        const all = await offlineDB.getEntitiesByIndex<GoalProgress>('goal_progress', 'goal_id', goalId)
        return all.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
      },
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity('goal_progress', item)
        }
      }
    )
  }
}

export const goalRepository = new GoalRepository()
