import { supabase } from '@/lib/supabase/client'
import { BaseRepository } from './base.repository'
import { ApiResponse } from '@/types'
import { offlineDB } from '@/lib/offline/db'
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
    super('audit_log', 'audit_log')
  }

  private getClient(supabaseClient?: SupabaseClient) {
    return supabaseClient || supabase
  }

  async findById(id: string): Promise<ApiResponse<AuditLogWithUser>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
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
          .single(),
      async () => await offlineDB.getEntity<AuditLogWithUser>(this.tableName, id),
      async (data) => await offlineDB.saveEntity(this.tableName, data)
    )
  }

  async findAll(limit = 100, offset = 0): Promise<ApiResponse<AuditLogWithUser[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
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
          .range(offset, offset + limit - 1),
      async () => {
        const all = await offlineDB.getAllEntities<AuditLogWithUser>(this.tableName)
        return all.slice(offset, offset + limit)
      },
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findByUserId(userId: string, limit = 100, offset = 0): Promise<ApiResponse<AuditLogWithUser[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
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
          .range(offset, offset + limit - 1),
      async () => {
        const all = await offlineDB.getEntitiesByIndex<AuditLogWithUser>(this.tableName, 'user_id', userId)
        return all.slice(offset, offset + limit)
      },
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findByAction(action: string, limit = 100, offset = 0): Promise<ApiResponse<AuditLogWithUser[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
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
          .range(offset, offset + limit - 1),
      async () => {
        const all = await offlineDB.getAllEntities<AuditLogWithUser>(this.tableName)
        return all.filter(e => e.action === action).slice(offset, offset + limit)
      },
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findByEntityType(entityType: string, limit = 100, offset = 0): Promise<ApiResponse<AuditLogWithUser[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
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
          .range(offset, offset + limit - 1),
      async () => {
        const all = await offlineDB.getAllEntities<AuditLogWithUser>(this.tableName)
        return all.filter(e => e.entity_type === entityType).slice(offset, offset + limit)
      },
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findByDateRange(
    startDate: string,
    endDate: string,
    limit = 100,
    offset = 0
  ): Promise<ApiResponse<AuditLogWithUser[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
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
          .range(offset, offset + limit - 1),
      async () => {
        const all = await offlineDB.getAllEntities<AuditLogWithUser>(this.tableName)
        return all.filter(e => e.created_at >= startDate && e.created_at <= endDate).slice(offset, offset + limit)
      },
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async create(data: Omit<AuditLog, 'id' | 'created_at'>, supabaseClient?: SupabaseClient): Promise<ApiResponse<AuditLog>> {
    const id = `${Date.now()}-${Math.random()}`
    const auditData = { ...data, id }
    const client = this.getClient(supabaseClient)

    return this.mutateWithOfflineSupport(
      async () =>
        await client
          .from(this.tableName)
          .insert(data)
          .select()
          .single(),
      async (savedData) => await offlineDB.saveEntity(this.tableName, savedData),
      'create',
      auditData
    )
  }

  async search(query: string, limit = 100, offset = 0): Promise<ApiResponse<AuditLogWithUser[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
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
          .range(offset, offset + limit - 1),
      async () => {
        const all = await offlineDB.getAllEntities<AuditLogWithUser>(this.tableName)
        const q = query.toLowerCase()
        return all.filter(e => e.action.toLowerCase().includes(q) || e.entity_type.toLowerCase().includes(q)).slice(offset, offset + limit)
      },
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  override async update(id: string, data: Partial<AuditLog>): Promise<ApiResponse<AuditLog>> {
    return { error: 'Audit logs cannot be updated' }
  }

  override async delete(id: string): Promise<ApiResponse<boolean>> {
    return { error: 'Audit logs cannot be deleted' }
  }
}

export const auditLogRepository = new AuditLogRepository()
