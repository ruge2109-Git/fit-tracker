import { SupabaseClient } from '@supabase/supabase-js'
import { Feedback, ApiResponse } from '@/types'
import { BaseRepository } from './base.repository'
import { offlineDB } from '@/lib/offline/db'

export interface IFeedbackRepository {
  findById(id: string, supabase?: SupabaseClient): Promise<ApiResponse<Feedback>>
  findByUserId(userId: string, supabase?: SupabaseClient): Promise<ApiResponse<Feedback[]>>
  create(data: Partial<Feedback>, supabase?: SupabaseClient): Promise<ApiResponse<Feedback>>
  update(id: string, data: Partial<Feedback>, supabase?: SupabaseClient): Promise<ApiResponse<Feedback>>
}

export class FeedbackRepository extends BaseRepository<Feedback> implements IFeedbackRepository {
  constructor() {
    super('feedback', 'feedback')
  }

  private async getClient(supabase?: SupabaseClient) {
    if (supabase) return supabase
    const { supabase: clientSupabase } = await import('@/lib/supabase/client')
    return clientSupabase
  }

  async findById(id: string, supabase?: SupabaseClient): Promise<ApiResponse<Feedback>> {
    const client = await this.getClient(supabase)

    return this.fetchWithOfflineFallback(
      async () =>
        await client
          .from(this.tableName)
          .select('*')
          .eq('id', id)
          .single(),
      async () => await offlineDB.getEntity<Feedback>(this.tableName, id),
      async (data) => await offlineDB.saveEntity(this.tableName, data)
    )
  }

  async findAll(): Promise<ApiResponse<Feedback[]>> {
    return { error: 'Use findByUserId instead' }
  }

  async findByUserId(userId: string, supabase?: SupabaseClient): Promise<ApiResponse<Feedback[]>> {
    const client = await this.getClient(supabase)

    return this.fetchWithOfflineFallback(
      async () =>
        await client
          .from(this.tableName)
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
      async () => await offlineDB.getEntitiesByIndex<Feedback>(this.tableName, 'user_id', userId),
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async create(data: Partial<Feedback>, supabase?: SupabaseClient): Promise<ApiResponse<Feedback>> {
    const id = data.id || `${Date.now()}-${Math.random()}`
    const feedbackData = { ...data, id }
    const client = await this.getClient(supabase)

    return this.mutateWithOfflineSupport(
      async () =>
        await client
          .from(this.tableName)
          .insert(data)
          .select()
          .single(),
      async (savedData) => await offlineDB.saveEntity(this.tableName, savedData),
      'create',
      feedbackData
    )
  }

  async update(id: string, data: Partial<Feedback>, supabase?: SupabaseClient): Promise<ApiResponse<Feedback>> {
    const updateData = { ...data, id }
    const client = await this.getClient(supabase)

    return this.mutateWithOfflineSupport(
      async () =>
        await client
          .from(this.tableName)
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single(),
      async (savedData) => await offlineDB.saveEntity(this.tableName, { ...savedData, id }),
      'update',
      updateData
    )
  }

  async delete(id: string): Promise<ApiResponse<boolean>> {
    return { error: 'Feedback deletion not allowed' }
  }
}

export const feedbackRepository = new FeedbackRepository()
