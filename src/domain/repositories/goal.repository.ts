/**
 * Goal Repository
 * Implements Repository Pattern for goal data access
 * Following Single Responsibility and Dependency Inversion principles
 */

import { supabase } from '@/lib/supabase/client'
import { Goal, GoalWithProgress, GoalProgress, ApiResponse } from '@/types'
import { BaseRepository } from './base.repository'

export interface IGoalRepository {
  findById(id: string): Promise<ApiResponse<GoalWithProgress>>
  findAll(): Promise<ApiResponse<Goal[]>>
  findByUserId(userId: string): Promise<ApiResponse<Goal[]>>
  findByType(userId: string, type: string): Promise<ApiResponse<Goal[]>>
  findActive(userId: string): Promise<ApiResponse<Goal[]>>
  findCompleted(userId: string): Promise<ApiResponse<Goal[]>>
  create(data: Partial<Goal>): Promise<ApiResponse<Goal>>
  update(id: string, data: Partial<Goal>): Promise<ApiResponse<Goal>>
  delete(id: string): Promise<ApiResponse<boolean>>
  addProgress(goalId: string, progress: Partial<GoalProgress>): Promise<ApiResponse<GoalProgress>>
  getProgress(goalId: string): Promise<ApiResponse<GoalProgress[]>>
}

export class GoalRepository extends BaseRepository<Goal> implements IGoalRepository {
  constructor() {
    super('goals')
  }

  async findById(id: string): Promise<ApiResponse<GoalWithProgress>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          progress:goal_progress (
            *
          )
        `)
        .eq('id', id)
        .single()

      if (error) return this.handleError(error)
      return this.success(data as GoalWithProgress)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findAll(): Promise<ApiResponse<Goal[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) return this.handleError(error)
      return this.success(data || [])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findByUserId(userId: string): Promise<ApiResponse<Goal[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) return this.handleError(error)
      return this.success(data || [])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findByType(userId: string, type: string): Promise<ApiResponse<Goal[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .order('created_at', { ascending: false })

      if (error) return this.handleError(error)
      return this.success(data || [])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findActive(userId: string): Promise<ApiResponse<Goal[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', false)
        .order('target_date', { ascending: true, nullsFirst: false })

      if (error) return this.handleError(error)
      return this.success(data || [])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findCompleted(userId: string): Promise<ApiResponse<Goal[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false })

      if (error) return this.handleError(error)
      return this.success(data || [])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async create(data: Partial<Goal>): Promise<ApiResponse<Goal>> {
    try {
      const { data: goal, error } = await supabase
        .from(this.tableName)
        .insert({
          ...data,
          current_value: 0,
          is_completed: false,
        })
        .select()
        .single()

      if (error) return this.handleError(error)
      return this.success(goal as Goal)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async update(id: string, data: Partial<Goal>): Promise<ApiResponse<Goal>> {
    try {
      const { data: goal, error } = await supabase
        .from(this.tableName)
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) return this.handleError(error)
      return this.success(goal as Goal)
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

  async addProgress(goalId: string, progress: Partial<GoalProgress>): Promise<ApiResponse<GoalProgress>> {
    try {
      const { data, error } = await supabase
        .from('goal_progress')
        .insert({
          goal_id: goalId,
          value: progress.value,
          notes: progress.notes || null,
        })
        .select()
        .single()

      if (error) return this.handleError(error)
      return this.success(data as GoalProgress)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async getProgress(goalId: string): Promise<ApiResponse<GoalProgress[]>> {
    try {
      const { data, error } = await supabase
        .from('goal_progress')
        .select('*')
        .eq('goal_id', goalId)
        .order('created_at', { ascending: true })

      if (error) return this.handleError(error)
      return this.success(data || [])
    } catch (error) {
      return this.handleError(error)
    }
  }
}

export const goalRepository = new GoalRepository()

