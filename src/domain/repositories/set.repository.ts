/**
 * Set Repository
 * Manages workout sets data operations
 */

import { supabase } from '@/lib/supabase/client'
import { Set, SetWithExercise, ApiResponse } from '@/types'
import { BaseRepository } from './base.repository'

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
    super('sets')
  }

  async findById(id: string): Promise<ApiResponse<SetWithExercise>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*, exercise:exercises(*)')
        .eq('id', id)
        .single()

      if (error) return this.handleError(error)
      return this.success(data as SetWithExercise)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findAll(): Promise<ApiResponse<Set[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) return this.handleError(error)
      return this.success(data as Set[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findByWorkoutId(workoutId: string): Promise<ApiResponse<SetWithExercise[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*, exercise:exercises(*)')
        .eq('workout_id', workoutId)
        .order('set_order', { ascending: true })

      if (error) return this.handleError(error)
      return this.success(data as SetWithExercise[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findByExerciseId(exerciseId: string): Promise<ApiResponse<Set[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('exercise_id', exerciseId)
        .order('created_at', { ascending: false })

      if (error) return this.handleError(error)
      return this.success(data as Set[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async create(data: Partial<Set>): Promise<ApiResponse<Set>> {
    try {
      const { data: set, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single()

      if (error) return this.handleError(error)
      return this.success(set as Set)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async createMany(data: Partial<Set>[]): Promise<ApiResponse<Set[]>> {
    try {
      const { data: sets, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()

      if (error) return this.handleError(error)
      return this.success(sets as Set[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async update(id: string, data: Partial<Set>): Promise<ApiResponse<Set>> {
    try {
      const { data: set, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) return this.handleError(error)
      return this.success(set as Set)
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

export const setRepository = new SetRepository()

