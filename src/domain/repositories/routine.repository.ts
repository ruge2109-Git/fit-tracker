/**
 * Routine Repository
 * Manages workout routines and routine exercises
 */

import { supabase } from '@/lib/supabase/client'
import { Routine, RoutineWithExercises, RoutineExercise, ApiResponse } from '@/types'
import { BaseRepository } from './base.repository'

export interface IRoutineRepository {
  findById(id: string): Promise<ApiResponse<RoutineWithExercises>>
  findAll(): Promise<ApiResponse<Routine[]>>
  findByUserId(userId: string): Promise<ApiResponse<Routine[]>>
  findActiveByUserId(userId: string): Promise<ApiResponse<Routine[]>>
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
    super('routines')
  }

  async findById(id: string): Promise<ApiResponse<RoutineWithExercises>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          exercises:routine_exercises (
            *,
            exercise:exercises (*)
          )
        `)
        .eq('id', id)
        .single()

      if (error) return this.handleError(error)
      return this.success(data as RoutineWithExercises)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findAll(): Promise<ApiResponse<Routine[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) return this.handleError(error)
      return this.success(data as Routine[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findByUserId(userId: string): Promise<ApiResponse<Routine[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) return this.handleError(error)
      return this.success(data as Routine[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findActiveByUserId(userId: string): Promise<ApiResponse<Routine[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) return this.handleError(error)
      return this.success(data as Routine[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async create(data: Partial<Routine>): Promise<ApiResponse<Routine>> {
    try {
      const { data: routine, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single()

      if (error) return this.handleError(error)
      return this.success(routine as Routine)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async update(id: string, data: Partial<Routine>): Promise<ApiResponse<Routine>> {
    try {
      const { data: routine, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) return this.handleError(error)
      return this.success(routine as Routine)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) return this.handleError(error)
      return this.success(true)
    } catch (error) {
      return this.handleError(error)
    }
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

