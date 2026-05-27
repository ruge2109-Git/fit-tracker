import { BaseRepository } from './base.repository'
import { offlineDB } from '@/lib/offline/db'
import { ApiResponse } from '@/types'
import { supabase } from '@/lib/supabase/client'

export interface WorkoutTag {
  id: string
  workout_id: string
  tag_id: string
  created_at: string
}

export interface IWorkoutTagRepository {
  findByWorkoutId(workoutId: string): Promise<ApiResponse<WorkoutTag[]>>
  findByTagId(tagId: string): Promise<ApiResponse<WorkoutTag[]>>
  create(workoutId: string, tagId: string): Promise<ApiResponse<WorkoutTag>>
  delete(workoutId: string, tagId: string): Promise<ApiResponse<boolean>>
  deleteByWorkoutId(workoutId: string): Promise<ApiResponse<boolean>>
  setWorkoutTags(workoutId: string, tagIds: string[]): Promise<ApiResponse<boolean>>
}

export class WorkoutTagRepository extends BaseRepository<WorkoutTag> implements IWorkoutTagRepository {
  constructor() {
    super('workout_tags', 'workout_tag')
  }

  async findById(id: string): Promise<ApiResponse<WorkoutTag>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('id', id)
          .single(),
      async () => await offlineDB.getEntity<WorkoutTag>(this.tableName, id),
      async (data) => await offlineDB.saveEntity(this.tableName, data)
    )
  }

  async findAll(): Promise<ApiResponse<WorkoutTag[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .order('created_at', { ascending: false }),
      async () => await offlineDB.getAllEntities<WorkoutTag>(this.tableName),
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async update(id: string, data: Partial<WorkoutTag>): Promise<ApiResponse<WorkoutTag>> {
    throw new Error('Updates not supported for workout tags. Delete and recreate instead.')
  }

  async findByWorkoutId(workoutId: string): Promise<ApiResponse<WorkoutTag[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('workout_id', workoutId),
      async () => await offlineDB.getEntitiesByIndex<WorkoutTag>(this.tableName, 'workout_id', workoutId),
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findByTagId(tagId: string): Promise<ApiResponse<WorkoutTag[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('tag_id', tagId),
      async () => await offlineDB.getEntitiesByIndex<WorkoutTag>(this.tableName, 'tag_id', tagId),
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async create(data: Partial<WorkoutTag>): Promise<ApiResponse<WorkoutTag>>
  async create(workoutId: string, tagId: string): Promise<ApiResponse<WorkoutTag>>
  async create(workoutIdOrData: string | Partial<WorkoutTag>, tagId?: string): Promise<ApiResponse<WorkoutTag>> {
    if (typeof workoutIdOrData !== 'string') {
      throw new Error('Use create(workoutId, tagId) instead')
    }

    const workoutId = workoutIdOrData
    const tagIdValue = tagId!
    const id = `${workoutId}_${tagIdValue}`
    const workoutTagData = { id, workout_id: workoutId, tag_id: tagIdValue }

    return this.mutateWithOfflineSupport(
      async () =>
        await supabase
          .from(this.tableName)
          .insert(workoutTagData)
          .select()
          .single(),
      async (savedData) => await offlineDB.saveEntity(this.tableName, savedData),
      'create',
      workoutTagData
    )
  }

  async delete(id: string): Promise<ApiResponse<boolean>>
  async delete(workoutId: string, tagId: string): Promise<ApiResponse<boolean>>
  async delete(workoutIdOrId: string, tagId?: string): Promise<ApiResponse<boolean>> {
    if (tagId === undefined) {
      throw new Error('Use delete(workoutId, tagId) instead')
    }

    const workoutId = workoutIdOrId
    const id = `${workoutId}_${tagId}`

    return this.mutateWithOfflineSupport(
      async () => {
        const { error } = await supabase
          .from(this.tableName)
          .delete()
          .eq('workout_id', workoutId)
          .eq('tag_id', tagId)
        return { data: error ? null : true, error }
      },
      async () => await offlineDB.deleteEntity(this.tableName, id),
      'delete',
      { id, workout_id: workoutId, tag_id: tagId }
    )
  }

  async deleteByWorkoutId(workoutId: string): Promise<ApiResponse<boolean>> {
    const isOnline = typeof window !== 'undefined' ? navigator.onLine : true

    if (!isOnline) {
      const existing = await offlineDB.getEntitiesByIndex<WorkoutTag>(this.tableName, 'workout_id', workoutId)
      for (const item of existing) {
        await offlineDB.deleteEntity(this.tableName, item.id)
        await offlineDB.addToSyncQueue({
          type: this.entityType,
          action: 'delete',
          data: { id: item.id, workout_id: workoutId, tag_id: item.tag_id },
        })
      }
      return this.success(true)
    }

    try {
      const existing = await offlineDB.getEntitiesByIndex<WorkoutTag>(this.tableName, 'workout_id', workoutId)
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('workout_id', workoutId)

      if (error) {
        if (error.message?.includes('FetchError') || (error as any).status === 0) {
          return this.deleteByWorkoutId(workoutId)
        }
        return this.handleError(error)
      }

      for (const item of existing) {
        await offlineDB.deleteEntity(this.tableName, item.id)
      }
      return this.success(true)
    } catch (error) {
      return this.deleteByWorkoutId(workoutId)
    }
  }

  async setWorkoutTags(workoutId: string, tagIds: string[]): Promise<ApiResponse<boolean>> {
    const isOnline = typeof window !== 'undefined' ? navigator.onLine : true

    if (!isOnline) {
      await this.deleteByWorkoutId(workoutId)
      for (const tagId of tagIds) {
        const id = `${workoutId}_${tagId}`
        const data = { id, workout_id: workoutId, tag_id: tagId }
        await offlineDB.saveEntity(this.tableName, data)
        await offlineDB.addToSyncQueue({
          type: this.entityType,
          action: 'create',
          data,
        })
      }
      return this.success(true)
    }

    try {
      const existing = await offlineDB.getEntitiesByIndex<WorkoutTag>(this.tableName, 'workout_id', workoutId)

      if (tagIds.length > 0) {
        const { error } = await supabase
          .from(this.tableName)
          .upsert(
            tagIds.map(tagId => ({
              workout_id: workoutId,
              tag_id: tagId,
            })),
            { onConflict: 'workout_id,tag_id' }
          )

        if (error) {
          if (error.message?.includes('FetchError') || (error as any).status === 0) {
            return this.setWorkoutTags(workoutId, tagIds)
          }
          return this.handleError(error)
        }
      } else {
        const { error } = await supabase
          .from(this.tableName)
          .delete()
          .eq('workout_id', workoutId)

        if (error) {
          if (error.message?.includes('FetchError') || (error as any).status === 0) {
            return this.setWorkoutTags(workoutId, tagIds)
          }
          return this.handleError(error)
        }
      }

      for (const item of existing) {
        await offlineDB.deleteEntity(this.tableName, item.id)
      }
      for (const tagId of tagIds) {
        const id = `${workoutId}_${tagId}`
        await offlineDB.saveEntity(this.tableName, { id, workout_id: workoutId, tag_id: tagId } as WorkoutTag)
      }
      return this.success(true)
    } catch (error) {
      return this.setWorkoutTags(workoutId, tagIds)
    }
  }
}

export const workoutTagRepository = new WorkoutTagRepository()
