/**
 * Push Subscription Repository
 * Handles database operations for push notification subscriptions
 */

import { BaseRepository } from './base.repository'
import { PushSubscription, PushSubscriptionData, ApiResponse } from '@/types'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

export class PushSubscriptionRepository extends BaseRepository<PushSubscription> {
  constructor() {
    super('push_subscriptions')
  }

  async findById(id: string): Promise<ApiResponse<PushSubscription>> {
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        logger.error('Failed to find push subscription by ID', error, 'PushSubscriptionRepository')
        return { error: error.message }
      }

      return { data: data as PushSubscription }
    } catch (error) {
      logger.error('Exception in findById', error as Error, 'PushSubscriptionRepository')
      return { error: 'Failed to find push subscription' }
    }
  }

  async findAll() {
    // Not typically used - would return all subscriptions
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')

      if (error) {
        logger.error('Failed to find all push subscriptions', error, 'PushSubscriptionRepository')
        return { error: error.message }
      }

      return { data: data || [] }
    } catch (error) {
      logger.error('Exception in findAll', error as Error, 'PushSubscriptionRepository')
      return { error: 'Failed to find push subscriptions' }
    }
  }

  async update(id: string, data: Partial<PushSubscription>) {
    try {
      const supabase = createBrowserClient()
      const { data: updated, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        logger.error('Failed to update push subscription', error, 'PushSubscriptionRepository')
        return { error: error.message }
      }

      return { data: updated as PushSubscription }
    } catch (error) {
      logger.error('Exception in update', error as Error, 'PushSubscriptionRepository')
      return { error: 'Failed to update push subscription' }
    }
  }

  async delete(id: string) {
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) {
        logger.error('Failed to delete push subscription', error, 'PushSubscriptionRepository')
        return { error: error.message }
      }

      return { data: true }
    } catch (error) {
      logger.error('Exception in delete', error as Error, 'PushSubscriptionRepository')
      return { error: 'Failed to delete push subscription' }
    }
  }

  async findByUserId(userId: string, supabaseClient?: SupabaseClient): Promise<ApiResponse<PushSubscription[]>> {
    try {
      const supabase = supabaseClient || createBrowserClient()
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Failed to find push subscriptions by user ID', error, 'PushSubscriptionRepository')
        return { error: error.message }
      }

      return { data: data || [] }
    } catch (error) {
      logger.error('Exception in findByUserId', error as Error, 'PushSubscriptionRepository')
      return { error: 'Failed to find push subscriptions' }
    }
  }

  async create(data: Partial<PushSubscription>): Promise<ApiResponse<PushSubscription>> {
    // This method accepts Partial<PushSubscription> for BaseRepository compatibility
    // But we need userId and subscriptionData, so we extract them
    if (!data.user_id) {
      return { error: 'user_id is required' }
    }
    
    // If data has endpoint and keys, use them directly
    if (data.endpoint && data.p256dh && data.auth) {
      try {
        const supabase = createBrowserClient()
        const { data: created, error } = await supabase
          .from(this.tableName)
          .insert({
            user_id: data.user_id,
            endpoint: data.endpoint,
            p256dh: data.p256dh,
            auth: data.auth,
          })
          .select()
          .single()

        if (error) {
          logger.error('Failed to create push subscription', error, 'PushSubscriptionRepository')
          return { error: error.message }
        }

        return { data: created as PushSubscription }
      } catch (error) {
        logger.error('Exception in create', error as Error, 'PushSubscriptionRepository')
        return { error: 'Failed to create push subscription' }
      }
    }

    return { error: 'Invalid subscription data' }
  }

  async createSubscription(userId: string, subscriptionData: PushSubscriptionData, supabaseClient?: SupabaseClient): Promise<ApiResponse<PushSubscription>> {
    try {
      const supabase = supabaseClient || createBrowserClient()
      
      // Check if subscription already exists
      const { data: existing } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('endpoint', subscriptionData.endpoint)
        .single()

      if (existing) {
        // Update existing subscription
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

      // Create new subscription
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

