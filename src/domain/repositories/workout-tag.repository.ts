/**
 * Workout Tag Repository
 * Handles many-to-many relationship between workouts and tags
 */

import { BaseRepository } from './base.repository'
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
    super('workout_tags')
  }

  async findById(id: string): Promise<ApiResponse<WorkoutTag>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) return this.handleError(error)
      return this.success(data as WorkoutTag)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findAll(): Promise<ApiResponse<WorkoutTag[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) return this.handleError(error)
      return this.success(data as WorkoutTag[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async create(data: Partial<WorkoutTag>): Promise<ApiResponse<WorkoutTag>> {
    // This method is not used, use create(workoutId, tagId) instead
    throw new Error('Use create(workoutId, tagId) instead')
  }

  async update(id: string, data: Partial<WorkoutTag>): Promise<ApiResponse<WorkoutTag>> {
    // WorkoutTag is a join table, updates are not supported
    throw new Error('Updates not supported for workout tags. Delete and recreate instead.')
  }

  async findByWorkoutId(workoutId: string): Promise<ApiResponse<WorkoutTag[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('workout_id', workoutId)

      if (error) return this.handleError(error)
      return this.success(data as WorkoutTag[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findByTagId(tagId: string): Promise<ApiResponse<WorkoutTag[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('tag_id', tagId)

      if (error) return this.handleError(error)
      return this.success(data as WorkoutTag[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async create(workoutId: string, tagId: string): Promise<ApiResponse<WorkoutTag>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          workout_id: workoutId,
          tag_id: tagId,
        })
        .select()
        .single()

      if (error) return this.handleError(error)
      return this.success(data as WorkoutTag)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async delete(workoutId: string, tagId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('workout_id', workoutId)
        .eq('tag_id', tagId)

      if (error) return this.handleError(error)
      return this.success(true)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async deleteByWorkoutId(workoutId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('workout_id', workoutId)

      if (error) return this.handleError(error)
      return this.success(true)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async setWorkoutTags(workoutId: string, tagIds: string[]): Promise<ApiResponse<boolean>> {
    try {
      // Delete existing tags
      await this.deleteByWorkoutId(workoutId)

      // Insert new tags
      if (tagIds.length > 0) {
        const { error } = await supabase
          .from(this.tableName)
          .insert(
            tagIds.map(tagId => ({
              workout_id: workoutId,
              tag_id: tagId,
            }))
          )

        if (error) return this.handleError(error)
      }

      return this.success(true)
    } catch (error) {
      return this.handleError(error)
    }
  }
}

export const workoutTagRepository = new WorkoutTagRepository()

