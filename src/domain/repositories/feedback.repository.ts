/**
 * Feedback Repository
 * Implements Repository Pattern for feedback data access
 * Following Single Responsibility and Dependency Inversion principles
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Feedback, ApiResponse } from '@/types'
import { BaseRepository } from './base.repository'

export interface IFeedbackRepository {
  findById(id: string, supabase?: SupabaseClient): Promise<ApiResponse<Feedback>>
  findByUserId(userId: string, supabase?: SupabaseClient): Promise<ApiResponse<Feedback[]>>
  create(data: Partial<Feedback>, supabase?: SupabaseClient): Promise<ApiResponse<Feedback>>
  update(id: string, data: Partial<Feedback>, supabase?: SupabaseClient): Promise<ApiResponse<Feedback>>
}

export class FeedbackRepository extends BaseRepository<Feedback> implements IFeedbackRepository {
  constructor() {
    super('feedback')
  }

  private async getClient(supabase?: SupabaseClient) {
    if (supabase) return supabase
    // Fallback to client-side supabase if not provided
    const { supabase: clientSupabase } = await import('@/lib/supabase/client')
    return clientSupabase
  }

  async findById(id: string, supabase?: SupabaseClient): Promise<ApiResponse<Feedback>> {
    try {
      const client = await this.getClient(supabase)
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) return this.handleError(error)
      return this.success(data as Feedback)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findAll(): Promise<ApiResponse<Feedback[]>> {
    // Not implemented - users should only see their own feedback
    return { error: 'Use findByUserId instead' }
  }

  async findByUserId(userId: string, supabase?: SupabaseClient): Promise<ApiResponse<Feedback[]>> {
    try {
      const client = await this.getClient(supabase)
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) return this.handleError(error)
      return this.success(data as Feedback[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async create(data: Partial<Feedback>, supabase?: SupabaseClient): Promise<ApiResponse<Feedback>> {
    try {
      const client = await this.getClient(supabase)
      const { data: feedback, error } = await client
        .from(this.tableName)
        .insert(data)
        .select()
        .single()

      if (error) return this.handleError(error)
      return this.success(feedback as Feedback)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async update(id: string, data: Partial<Feedback>, supabase?: SupabaseClient): Promise<ApiResponse<Feedback>> {
    try {
      const client = await this.getClient(supabase)
      const { data: feedback, error } = await client
        .from(this.tableName)
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) return this.handleError(error)
      return this.success(feedback as Feedback)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async delete(id: string): Promise<ApiResponse<boolean>> {
    // Users cannot delete feedback, only update pending ones
    return { error: 'Feedback deletion not allowed' }
  }
}

// Export singleton instance
export const feedbackRepository = new FeedbackRepository()

