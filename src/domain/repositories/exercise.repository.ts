/**
 * Exercise Repository
 * Handles all exercise-related data operations
 */

import { supabase } from '@/lib/supabase/client'
import { Exercise, ExerciseType, MuscleGroup, ApiResponse } from '@/types'
import { BaseRepository } from './base.repository'

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
    super('exercises')
  }

  async findById(id: string): Promise<ApiResponse<Exercise>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) return this.handleError(error)
      return this.success(data as Exercise)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findAll(): Promise<ApiResponse<Exercise[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('name', { ascending: true })

      if (error) return this.handleError(error)
      return this.success(data as Exercise[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findByType(type: ExerciseType): Promise<ApiResponse<Exercise[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('type', type)
        .order('name', { ascending: true })

      if (error) return this.handleError(error)
      return this.success(data as Exercise[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findByMuscleGroup(muscleGroup: MuscleGroup): Promise<ApiResponse<Exercise[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('muscle_group', muscleGroup)
        .order('name', { ascending: true })

      if (error) return this.handleError(error)
      return this.success(data as Exercise[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async search(query: string): Promise<ApiResponse<Exercise[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true })

      if (error) return this.handleError(error)
      return this.success(data as Exercise[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async create(data: Partial<Exercise>): Promise<ApiResponse<Exercise>> {
    try {
      const { data: exercise, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single()

      if (error) return this.handleError(error)
      return this.success(exercise as Exercise)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async update(id: string, data: Partial<Exercise>): Promise<ApiResponse<Exercise>> {
    try {
      const { data: exercise, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) return this.handleError(error)
      return this.success(exercise as Exercise)
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

export const exerciseRepository = new ExerciseRepository()

