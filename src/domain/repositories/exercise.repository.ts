/**
 * Exercise Repository
 * Handles all exercise-related data operations
 */

import { supabase } from '@/lib/supabase/client'
import { Exercise, ExerciseType, MuscleGroup, ApiResponse } from '@/types'
import { BaseRepository } from './base.repository'
import { offlineDB } from '@/lib/offline/db'
import { generateId } from '@/lib/utils'

export interface IExerciseRepository {
  findById(id: string): Promise<ApiResponse<Exercise>>
  findAll(): Promise<ApiResponse<Exercise[]>>
  findByType(type: ExerciseType): Promise<ApiResponse<Exercise[]>>
  findByMuscleGroup(muscleGroup: MuscleGroup): Promise<ApiResponse<Exercise[]>>
  search(query: string): Promise<ApiResponse<Exercise[]>>
  create(data: Partial<Exercise>): Promise<ApiResponse<Exercise>>
  update(id: string, data: Partial<Exercise>): Promise<ApiResponse<Exercise>>
  delete(id: string): Promise<ApiResponse<boolean>>
}

export class ExerciseRepository extends BaseRepository<Exercise> implements IExerciseRepository {
  constructor() {
    super('exercises', 'exercise')
  }

  async findById(id: string): Promise<ApiResponse<Exercise>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('id', id)
          .single(),
      async () => await offlineDB.getEntity<Exercise>(this.tableName, id),
      async (data) => await offlineDB.saveEntity(this.tableName, data)
    )
  }

  async findAll(): Promise<ApiResponse<Exercise[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .order('name', { ascending: true }),
      async () => await offlineDB.getAllEntities<Exercise>(this.tableName),
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findByType(type: ExerciseType): Promise<ApiResponse<Exercise[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('type', type)
          .order('name', { ascending: true }),
      async () => {
        const all = await offlineDB.getAllEntities<Exercise>(this.tableName)
        return all.filter(e => e.type === type)
      },
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findByMuscleGroup(muscleGroup: MuscleGroup): Promise<ApiResponse<Exercise[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('muscle_group', muscleGroup)
          .order('name', { ascending: true }),
      async () => {
        const all = await offlineDB.getAllEntities<Exercise>(this.tableName)
        return all.filter(e => e.muscle_group === muscleGroup)
      },
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async search(query: string): Promise<ApiResponse<Exercise[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .ilike('name', `%${query}%`)
          .order('name', { ascending: true }),
      async () => {
        const all = await offlineDB.getAllEntities<Exercise>(this.tableName)
        return all.filter(e => e.name.toLowerCase().includes(query.toLowerCase()))
      },
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async create(data: Partial<Exercise>): Promise<ApiResponse<Exercise>> {
    const id = data.id || generateId()
    const exerciseData = { ...data, id }

    return this.mutateWithOfflineSupport(
      async () =>
        await supabase
          .from(this.tableName)
          .insert(exerciseData)
          .select()
          .single(),
      async (savedData) => await offlineDB.saveEntity(this.tableName, savedData),
      'create',
      exerciseData
    )
  }

  async update(id: string, data: Partial<Exercise>): Promise<ApiResponse<Exercise>> {
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

export const exerciseRepository = new ExerciseRepository()

