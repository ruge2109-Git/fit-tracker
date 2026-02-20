/**
 * Workout Repository
 * Implements Repository Pattern for workout data access
 * Following Single Responsibility and Dependency Inversion principles
 */

import { supabase } from '@/lib/supabase/client'
import { Workout, WorkoutWithSets, ApiResponse } from '@/types'
import { BaseRepository } from './base.repository'

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
    super('workouts')
  }

  async findById(id: string): Promise<ApiResponse<WorkoutWithSets>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          sets (
            *,
            exercise:exercises (*)
          )
        `)
        .eq('id', id)
        .maybeSingle()

      if (error) return this.handleError(error)
      return this.success(data as WorkoutWithSets)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findAll(): Promise<ApiResponse<Workout[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('date', { ascending: false })

      if (error) return this.handleError(error)
      return this.success(data as Workout[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findByUserId(userId: string): Promise<ApiResponse<Workout[]>> {
    try {
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

      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from(this.tableName)
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false })

        if (fallbackError) return this.handleError(fallbackError)
        
        const workouts = (fallbackData || []) as Workout[]
        return this.success(workouts)
      }
      
      const workouts = (data || []).map((workout: any) => ({
        ...workout,
        routine_name: workout.routine?.name || null,
        routine: undefined
      })) as Workout[]
      
      return this.success(workouts)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<Workout[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (error) return this.handleError(error)
      return this.success(data as Workout[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async create(data: Partial<Workout>): Promise<ApiResponse<Workout>> {
    try {
      const { data: workout, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .maybeSingle()

      if (error) return this.handleError(error)
      return this.success(workout as Workout)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async update(id: string, data: Partial<Workout>): Promise<ApiResponse<Workout>> {
    try {
      const { data: workout, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .maybeSingle()

      if (error) return this.handleError(error)
      return this.success(workout as Workout)
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
}

// Export singleton instance (can be replaced with DI container in larger apps)
export const workoutRepository = new WorkoutRepository()

