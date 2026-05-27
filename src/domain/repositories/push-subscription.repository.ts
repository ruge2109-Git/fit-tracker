import { BaseRepository } from './base.repository'
import { PushSubscription, PushSubscriptionData, ApiResponse } from '@/types'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { offlineDB } from '@/lib/offline/db'
import { generateId } from '@/lib/utils'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

export class PushSubscriptionRepository extends BaseRepository<PushSubscription> {
  constructor() {
    super('push_subscriptions', 'push_subscription')
  }

  async findById(id: string): Promise<ApiResponse<PushSubscription>> {
    return this.fetchWithOfflineFallback(
      async () => {
        const supabase = createBrowserClient()
        return await supabase
          .from(this.tableName)
          .select('*')
          .eq('id', id)
          .single()
      },
      async () => await offlineDB.getEntity<PushSubscription>(this.tableName, id),
      async (data) => await offlineDB.saveEntity(this.tableName, data)
    )
  }

  async findAll(): Promise<ApiResponse<PushSubscription[]>> {
    return this.fetchWithOfflineFallback(
      async () => {
        const supabase = createBrowserClient()
        const { data, error } = await supabase
          .from(this.tableName)
          .select('*')
        return { data: data || [], error }
      },
      async () => await offlineDB.getAllEntities<PushSubscription>(this.tableName),
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async update(id: string, data: Partial<PushSubscription>): Promise<ApiResponse<PushSubscription>> {
    const updateData = { ...data, id }
    return this.mutateWithOfflineSupport(
      async () => {
        const supabase = createBrowserClient()
        return await supabase
          .from(this.tableName)
          .update(data)
          .eq('id', id)
          .select()
          .single()
      },
      async (savedData) => await offlineDB.saveEntity(this.tableName, { ...savedData, id }),
      'update',
      updateData
    )
  }

  async delete(id: string) {
    return this.mutateWithOfflineSupport(
      async () => {
        const supabase = createBrowserClient()
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

  async findByUserId(userId: string, supabaseClient?: SupabaseClient): Promise<ApiResponse<PushSubscription[]>> {
    return this.fetchWithOfflineFallback(
      async () => {
        const supabase = supabaseClient || createBrowserClient()
        return await supabase
          .from(this.tableName)
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
      },
      async () => await offlineDB.getEntitiesByIndex<PushSubscription>(this.tableName, 'user_id', userId),
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async create(data: Partial<PushSubscription>): Promise<ApiResponse<PushSubscription>> {
    if (!data.user_id) return { error: 'user_id is required' }

    if (data.endpoint && data.p256dh && data.auth) {
      const id = data.id || generateId()
      const subData = { ...data, id }

      return this.mutateWithOfflineSupport(
        async () => {
          const supabase = createBrowserClient()
          return await supabase
            .from(this.tableName)
            .insert({
              user_id: data.user_id,
              endpoint: data.endpoint,
              p256dh: data.p256dh,
              auth: data.auth,
            })
            .select()
            .single()
        },
        async (savedData) => await offlineDB.saveEntity(this.tableName, savedData),
        'create',
        subData
      )
    }

    return { error: 'Invalid subscription data' }
  }

  async createSubscription(userId: string, subscriptionData: PushSubscriptionData, supabaseClient?: SupabaseClient): Promise<ApiResponse<PushSubscription>> {
    try {
      const supabase = supabaseClient || createBrowserClient()

      const { data: existing } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('endpoint', subscriptionData.endpoint)
        .single()

      if (existing) {
        const { data, error } = await supabase
          .from(this.tableName)
          .update({
            p256dh: subscriptionData.keys.p256dh,
            auth: subscriptionData.keys.auth,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) {
          logger.error('Failed to update push subscription', error, 'PushSubscriptionRepository')
          return { error: error.message }
        }

        return { data: data as PushSubscription }
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          user_id: userId,
          endpoint: subscriptionData.endpoint,
          p256dh: subscriptionData.keys.p256dh,
          auth: subscriptionData.keys.auth,
        })
        .select()
        .single()

      if (error) {
        logger.error('Failed to create push subscription', error, 'PushSubscriptionRepository')
        return { error: error.message }
      }

      return { data: data as PushSubscription }
    } catch (error) {
      logger.error('Exception in create', error as Error, 'PushSubscriptionRepository')
      return { error: 'Failed to create push subscription' }
    }
  }

  async deleteByEndpoint(userId: string, endpoint: string, supabaseClient?: SupabaseClient): Promise<ApiResponse<boolean>> {
    try {
      const supabase = supabaseClient || createBrowserClient()
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint)

      if (error) {
        logger.error('Failed to delete push subscription', error, 'PushSubscriptionRepository')
        return { error: error.message }
      }

      return { data: true }
    } catch (error) {
      logger.error('Exception in deleteByEndpoint', error as Error, 'PushSubscriptionRepository')
      return { error: 'Failed to delete push subscription' }
    }
  }

  async deleteAllByUserId(userId: string): Promise<ApiResponse<boolean>> {
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('user_id', userId)

      if (error) {
        logger.error('Failed to delete all push subscriptions', error, 'PushSubscriptionRepository')
        return { error: error.message }
      }

      return { data: true }
    } catch (error) {
      logger.error('Exception in deleteAllByUserId', error as Error, 'PushSubscriptionRepository')
      return { error: 'Failed to delete push subscriptions' }
    }
  }
}

export const pushSubscriptionRepository = new PushSubscriptionRepository()
