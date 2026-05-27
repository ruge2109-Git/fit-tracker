/**
 * Workout Repository
 * Implements Repository Pattern for workout data access
 * Following Single Responsibility and Dependency Inversion principles
 */

import { supabase } from '@/lib/supabase/client'
import { Workout, WorkoutWithSets, ApiResponse } from '@/types'
import { BaseRepository } from './base.repository'
import { offlineDB } from '@/lib/offline/db'
import { generateId } from '@/lib/utils'

export interface IWorkoutRepository {
  findById(id: string): Promise<ApiResponse<WorkoutWithSets>>
  findAll(): Promise<ApiResponse<Workout[]>>
  findByUserId(userId: string): Promise<ApiResponse<Workout[]>>
  findByDateRange(userId: string, startDate: string, endDate: string): Promise<ApiResponse<Workout[]>>
  create(data: Partial<Workout>): Promise<ApiResponse<Workout>>
  update(id: string, data: Partial<Workout>): Promise<ApiResponse<Workout>>
  delete(id: string): Promise<ApiResponse<boolean>>
}

export class WorkoutRepository extends BaseRepository<Workout> implements IWorkoutRepository {
  constructor() {
    super('workouts', 'workout')
  }

  async findById(id: string): Promise<ApiResponse<WorkoutWithSets>> {
    return this.fetchWithOfflineFallback(
      async () => 
        await supabase
          .from(this.tableName)
          .select(`
            *,
            sets (
              *,
              exercise:exercises (*)
            )
          `)
          .eq('id', id)
          .maybeSingle(),
      async () => await offlineDB.getEntity<WorkoutWithSets>(this.tableName, id),
      async (data) => await offlineDB.saveEntity(this.tableName, data)
    )
  }

  async findAll(): Promise<ApiResponse<Workout[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .order('date', { ascending: false }),
      async () => await offlineDB.getAllEntities<Workout>(this.tableName),
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findByUserId(userId: string): Promise<ApiResponse<Workout[]>> {
    return this.fetchWithOfflineFallback(
      async () => {
        const { data, error } = await supabase
          .from(this.tableName)
          .select(`
            *,
            routine:routines (
              name
            )
          `)
          .eq('user_id', userId)
          .order('date', { ascending: false })

        if (error) return { data: null, error }

        const workouts = (data || []).map((workout: any) => ({
          ...workout,
          routine_name: workout.routine?.name || null,
          routine: undefined
        })) as Workout[]

        return { data: workouts, error: null }
      },
      async () => await offlineDB.getEntitiesByIndex<Workout>(this.tableName, 'user_id', userId),
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<Workout[]>> {
    return this.fetchWithOfflineFallback(
      async () => 
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('user_id', userId)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false }),
      async () => {
        const all = await offlineDB.getEntitiesByIndex<Workout>(this.tableName, 'user_id', userId)
        return all.filter(w => w.date >= startDate && w.date <= endDate)
      },
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async create(data: Partial<Workout>): Promise<ApiResponse<Workout>> {
    // For creation, we need a temp ID if offline
    const id = data.id || generateId()
    const workoutData = { ...data, id }

    return this.mutateWithOfflineSupport(
      async () => 
        await supabase
          .from(this.tableName)
          .insert(workoutData)
          .select()
          .maybeSingle(),
      async (savedData) => await offlineDB.saveEntity(this.tableName, savedData),
      'create',
      workoutData
    )
  }

  async update(id: string, data: Partial<Workout>): Promise<ApiResponse<Workout>> {
    const updateData = { ...data, id }
    return this.mutateWithOfflineSupport(
      async () => 
        await supabase
          .from(this.tableName)
          .update(data)
          .eq('id', id)
          .select()
          .maybeSingle(),
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

// Export singleton instance (can be replaced with DI container in larger apps)
export const workoutRepository = new WorkoutRepository()

