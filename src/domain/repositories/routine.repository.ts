/**
 * Routine Repository
 * Manages workout routines and routine exercises
 */

import { supabase } from '@/lib/supabase/client'
import { Routine, RoutineWithExercises, RoutineExercise, ApiResponse } from '@/types'
import { BaseRepository } from './base.repository'
import { offlineDB } from '@/lib/offline/db'

export interface IRoutineRepository {
  findById(id: string): Promise<ApiResponse<RoutineWithExercises>>
  findAll(): Promise<ApiResponse<Routine[]>>
  findByUserId(userId: string): Promise<ApiResponse<RoutineWithExercises[]>>
  findActiveByUserId(userId: string): Promise<ApiResponse<RoutineWithExercises[]>>
  create(data: Partial<Routine>): Promise<ApiResponse<Routine>>
  update(id: string, data: Partial<Routine>): Promise<ApiResponse<Routine>>
  delete(id: string): Promise<ApiResponse<boolean>>
  addExercise(data: Partial<RoutineExercise>): Promise<ApiResponse<RoutineExercise>>
  removeExercise(routineExerciseId: string): Promise<ApiResponse<boolean>>
  updateExerciseOrder(routineExerciseId: string, order: number): Promise<ApiResponse<boolean>>
  updateExercisesOrder(updates: { id: string; order: number }[]): Promise<ApiResponse<boolean>>
  updateExercise(id: string, data: Partial<RoutineExercise>): Promise<ApiResponse<RoutineExercise>>
}

export class RoutineRepository extends BaseRepository<Routine> implements IRoutineRepository {
  constructor() {
    super('routines', 'routine')
  }

  async findById(id: string): Promise<ApiResponse<RoutineWithExercises>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select(`
            *,
            exercises:routine_exercises (
              *,
              exercise:exercises (*)
            )
          `)
          .eq('id', id)
          .maybeSingle(),
      async () => await offlineDB.getEntity<RoutineWithExercises>(this.tableName, id),
      async (data) => await offlineDB.saveEntity(this.tableName, data)
    )
  }

  async findAll(): Promise<ApiResponse<Routine[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .order('created_at', { ascending: false }),
      async () => await offlineDB.getAllEntities<Routine>(this.tableName),
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findByUserId(userId: string): Promise<ApiResponse<RoutineWithExercises[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select(`
            *,
            exercises:routine_exercises (
              *,
              exercise:exercises (*)
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
      async () => await offlineDB.getEntitiesByIndex<RoutineWithExercises>(this.tableName, 'user_id', userId),
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findActiveByUserId(userId: string): Promise<ApiResponse<RoutineWithExercises[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select(`
            *,
            exercises:routine_exercises (
              *,
              exercise:exercises (*)
            )
          `)
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
      async () => {
        const all = await offlineDB.getEntitiesByIndex<RoutineWithExercises>(this.tableName, 'user_id', userId)
        return all.filter(r => r.is_active)
      },
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async create(data: Partial<Routine>): Promise<ApiResponse<Routine>> {
    const id = data.id || `${Date.now()}-${Math.random()}`
    const routineData = { ...data, id }

    return this.mutateWithOfflineSupport(
      async () =>
        await supabase
          .from(this.tableName)
          .insert(routineData)
          .select()
          .single(),
      async (savedData) => await offlineDB.saveEntity(this.tableName, savedData),
      'create',
      routineData
    )
  }

  async update(id: string, data: Partial<Routine>): Promise<ApiResponse<Routine>> {
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

  async addExercise(data: Partial<RoutineExercise>): Promise<ApiResponse<RoutineExercise>> {
    try {
      const { data: exercise, error } = await supabase
        .from('routine_exercises')
        .insert(data)
        .select('*, exercise:exercises(*)')
        .single()

      if (error) return this.handleError(error)
      return this.success(exercise as RoutineExercise)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async removeExercise(routineExerciseId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('routine_exercises')
        .delete()
        .eq('id', routineExerciseId)

      if (error) return this.handleError(error)
      return this.success(true)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async updateExerciseOrder(routineExerciseId: string, order: number): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('routine_exercises')
        .update({ order })
        .eq('id', routineExerciseId)

      if (error) return this.handleError(error)
      return this.success(true)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async updateExercisesOrder(updates: { id: string; order: number }[]): Promise<ApiResponse<boolean>> {
    try {
      // Update all exercises in parallel
      const promises = updates.map(({ id, order }) =>
        supabase
          .from('routine_exercises')
          .update({ order })
          .eq('id', id)
      )

      const results = await Promise.all(promises)
      const hasError = results.some(result => result.error)

      if (hasError) {
        return this.handleError(new Error('Failed to update exercise order'))
      }

      return this.success(true)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async updateExercise(id: string, data: Partial<RoutineExercise>): Promise<ApiResponse<RoutineExercise>> {
    try {
      const { data: exercise, error } = await supabase
        .from('routine_exercises')
        .update(data)
        .eq('id', id)
        .select('*, exercise:exercises(*)')
        .single()

      if (error) return this.handleError(error)
      return this.success(exercise as RoutineExercise)
    } catch (error) {
      return this.handleError(error)
    }
  }
}

export const routineRepository = new RoutineRepository()

