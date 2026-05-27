import { supabase } from '@/lib/supabase/client'
import { Set, SetWithExercise, ApiResponse } from '@/types'
import { BaseRepository } from './base.repository'
import { offlineDB } from '@/lib/offline/db'

export interface ISetRepository {
  findById(id: string): Promise<ApiResponse<SetWithExercise>>
  findAll(): Promise<ApiResponse<Set[]>>
  findByWorkoutId(workoutId: string): Promise<ApiResponse<SetWithExercise[]>>
  findByExerciseId(exerciseId: string): Promise<ApiResponse<Set[]>>
  create(data: Partial<Set>): Promise<ApiResponse<Set>>
  createMany(data: Partial<Set>[]): Promise<ApiResponse<Set[]>>
  update(id: string, data: Partial<Set>): Promise<ApiResponse<Set>>
  delete(id: string): Promise<ApiResponse<boolean>>
}

export class SetRepository extends BaseRepository<Set> implements ISetRepository {
  constructor() {
    super('sets', 'set')
  }

  async findById(id: string): Promise<ApiResponse<SetWithExercise>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*, exercise:exercises(*)')
          .eq('id', id)
          .single(),
      async () => await offlineDB.getEntity<SetWithExercise>(this.tableName, id),
      async (data) => await offlineDB.saveEntity(this.tableName, data)
    )
  }

  async findAll(): Promise<ApiResponse<Set[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .order('created_at', { ascending: false }),
      async () => await offlineDB.getAllEntities<Set>(this.tableName),
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findByWorkoutId(workoutId: string): Promise<ApiResponse<SetWithExercise[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*, exercise:exercises(*)')
          .eq('workout_id', workoutId)
          .order('set_order', { ascending: true }),
      async () => {
        const all = await offlineDB.getEntitiesByIndex<SetWithExercise>(this.tableName, 'workout_id', workoutId)
        return all.sort((a, b) => (a.set_order || 0) - (b.set_order || 0))
      },
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findByExerciseId(exerciseId: string): Promise<ApiResponse<Set[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('exercise_id', exerciseId)
          .order('created_at', { ascending: false }),
      async () => {
        const all = await offlineDB.getEntitiesByIndex<Set>(this.tableName, 'exercise_id', exerciseId)
        return all.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      },
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async create(data: Partial<Set>): Promise<ApiResponse<Set>> {
    const id = data.id || `${Date.now()}-${Math.random()}`
    const setData = { ...data, id }
    return this.mutateWithOfflineSupport(
      async () =>
        await supabase
          .from(this.tableName)
          .insert(setData)
          .select()
          .single(),
      async (savedData) => await offlineDB.saveEntity(this.tableName, savedData),
      'create',
      setData
    )
  }

  async createMany(data: Partial<Set>[]): Promise<ApiResponse<Set[]>> {
    const isOnline = typeof window !== 'undefined' ? navigator.onLine : true

    if (!isOnline) {
      const saved: Set[] = []
      for (const item of data) {
        const id = item.id || `${Date.now()}-${Math.random()}`
        const setData = { ...item, id }
        await offlineDB.saveEntity(this.tableName, setData)
        await offlineDB.addToSyncQueue({
          type: this.entityType,
          action: 'create',
          data: setData,
        })
        saved.push(setData as Set)
      }
      return this.success(saved)
    }

    try {
      const { data: sets, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()

      if (error) {
        if (error.message?.includes('FetchError') || (error as any).status === 0) {
          return this.createMany(data)
        }
        return this.handleError(error)
      }

      if (sets) {
        for (const item of sets) {
          await offlineDB.saveEntity(this.tableName, item)
        }
        return this.success(sets as Set[])
      }

      return { error: 'Failed to create sets' }
    } catch (error) {
      return this.createMany(data)
    }
  }

  async update(id: string, data: Partial<Set>): Promise<ApiResponse<Set>> {
    const updateData = { ...data, id }
    return this.mutateWithOfflineSupport(
      async () =>
        await supabase
          .from(this.tableName)
          .update(data)
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
}

export const setRepository = new SetRepository()
