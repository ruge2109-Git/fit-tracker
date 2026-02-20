/**
 * Audit Log Repository
 * Manages audit log entries for tracking user actions
 */

import { supabase } from '@/lib/supabase/client'
import { BaseRepository } from './base.repository'
import { ApiResponse } from '@/types'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface AuditLog {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id?: string | null
  details?: Record<string, any> | null
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
}

export interface AuditLogWithUser extends AuditLog {
  user?: {
    id: string
    email: string
    name: string | null
  }
}

export interface IAuditLogRepository {
  findById(id: string): Promise<ApiResponse<AuditLogWithUser>>
  findAll(limit?: number, offset?: number): Promise<ApiResponse<AuditLogWithUser[]>>
  findByUserId(userId: string, limit?: number, offset?: number): Promise<ApiResponse<AuditLog[]>>
  findByAction(action: string, limit?: number, offset?: number): Promise<ApiResponse<AuditLogWithUser[]>>
  findByEntityType(entityType: string, limit?: number, offset?: number): Promise<ApiResponse<AuditLogWithUser[]>>
  findByDateRange(startDate: string, endDate: string, limit?: number, offset?: number): Promise<ApiResponse<AuditLogWithUser[]>>
  create(data: Omit<AuditLog, 'id' | 'created_at'>, supabaseClient?: SupabaseClient): Promise<ApiResponse<AuditLog>>
  search(query: string, limit?: number, offset?: number): Promise<ApiResponse<AuditLogWithUser[]>>
}

export class AuditLogRepository extends BaseRepository<AuditLog> implements IAuditLogRepository {
  constructor() {
    super('audit_log')
  }

  private getClient(supabaseClient?: SupabaseClient) {
    return supabaseClient || supabase
  }

  async findById(id: string): Promise<ApiResponse<AuditLogWithUser>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          user:users (
            id,
            email,
            name
          )
        `)
        .eq('id', id)
        .single()

      if (error) return this.handleError(error)
      return this.success(data as AuditLogWithUser)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findAll(limit = 100, offset = 0): Promise<ApiResponse<AuditLogWithUser[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          user:users (
            id,
            email,
            name
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) return this.handleError(error)
      return this.success(data as AuditLogWithUser[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findByUserId(userId: string, limit = 100, offset = 0): Promise<ApiResponse<AuditLogWithUser[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          user:users (
            id,
            email,
            name
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) return this.handleError(error)
      return this.success(data as AuditLogWithUser[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findByAction(action: string, limit = 100, offset = 0): Promise<ApiResponse<AuditLogWithUser[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          user:users (
            id,
            email,
            name
          )
        `)
        .eq('action', action)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) return this.handleError(error)
      return this.success(data as AuditLogWithUser[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findByEntityType(entityType: string, limit = 100, offset = 0): Promise<ApiResponse<AuditLogWithUser[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          user:users (
            id,
            email,
            name
          )
        `)
        .eq('entity_type', entityType)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) return this.handleError(error)
      return this.success(data as AuditLogWithUser[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findByDateRange(
    startDate: string,
    endDate: string,
    limit = 100,
    offset = 0
  ): Promise<ApiResponse<AuditLogWithUser[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          user:users (
            id,
            email,
            name
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) return this.handleError(error)
      return this.success(data as AuditLogWithUser[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async create(data: Omit<AuditLog, 'id' | 'created_at'>, supabaseClient?: SupabaseClient): Promise<ApiResponse<AuditLog>> {
    try {
      const client = this.getClient(supabaseClient)
      const { data: result, error } = await client
        .from(this.tableName)
        .insert(data)
        .select()
        .single()

      if (error) return this.handleError(error)
      return this.success(result)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async search(query: string, limit = 100, offset = 0): Promise<ApiResponse<AuditLogWithUser[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          user:users (
            id,
            email,
            name
          )
        `)
        .or(`action.ilike.%${query}%,entity_type.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) return this.handleError(error)
      return this.success(data as AuditLogWithUser[])
    } catch (error) {
      return this.handleError(error)
    }
  }

  // Override base methods - audit logs should not be updated or deleted
  override async update(id: string, data: Partial<AuditLog>): Promise<ApiResponse<AuditLog>> {
    return { error: 'Audit logs cannot be updated' }
  }

  override async delete(id: string): Promise<ApiResponse<boolean>> {
    return { error: 'Audit logs cannot be deleted' }
  }
}

export const auditLogRepository = new AuditLogRepository()

