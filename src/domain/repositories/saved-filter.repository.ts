import { BaseRepository } from './base.repository'
import { ApiResponse } from '@/types'
import { supabase } from '@/lib/supabase/client'
import { offlineDB } from '@/lib/offline/db'
import { generateId } from '@/lib/utils'

export interface SavedFilter {
  id: string
  user_id: string
  name: string
  type: 'workout' | 'exercise' | 'routine'
  filters: Record<string, any>
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface SavedFilterFormData {
  name: string
  type: 'workout' | 'exercise' | 'routine'
  filters: Record<string, any>
  is_favorite?: boolean
}

export interface ISavedFilterRepository {
  findByUserId(userId: string): Promise<ApiResponse<SavedFilter[]>>
  findByUserIdAndType(userId: string, type: 'workout' | 'exercise' | 'routine'): Promise<ApiResponse<SavedFilter[]>>
  create(userId: string, data: SavedFilterFormData): Promise<ApiResponse<SavedFilter>>
  update(id: string, data: Partial<SavedFilterFormData>): Promise<ApiResponse<SavedFilter>>
  delete(id: string): Promise<ApiResponse<boolean>>
}

export class SavedFilterRepository extends BaseRepository<SavedFilter> implements ISavedFilterRepository {
  constructor() {
    super('saved_filters', 'saved_filter')
  }

  async findById(id: string): Promise<ApiResponse<SavedFilter>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('id', id)
          .single(),
      async () => await offlineDB.getEntity<SavedFilter>(this.tableName, id),
      async (data) => await offlineDB.saveEntity(this.tableName, data)
    )
  }

  async findAll(): Promise<ApiResponse<SavedFilter[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .order('is_favorite', { ascending: false })
          .order('created_at', { ascending: false }),
      async () => await offlineDB.getAllEntities<SavedFilter>(this.tableName),
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findByUserId(userId: string): Promise<ApiResponse<SavedFilter[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('user_id', userId)
          .order('is_favorite', { ascending: false })
          .order('created_at', { ascending: false }),
      async () => await offlineDB.getEntitiesByIndex<SavedFilter>(this.tableName, 'user_id', userId),
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findByUserIdAndType(userId: string, type: 'workout' | 'exercise' | 'routine'): Promise<ApiResponse<SavedFilter[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('user_id', userId)
          .eq('type', type)
          .order('is_favorite', { ascending: false })
          .order('created_at', { ascending: false }),
      async () => {
        const all = await offlineDB.getEntitiesByIndex<SavedFilter>(this.tableName, 'user_id', userId)
        return all.filter(e => e.type === type)
      },
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async create(data: Partial<SavedFilter>): Promise<ApiResponse<SavedFilter>>
  async create(userId: string, data: SavedFilterFormData): Promise<ApiResponse<SavedFilter>>
  async create(userIdOrData: string | Partial<SavedFilter>, data?: SavedFilterFormData): Promise<ApiResponse<SavedFilter>> {
    if (typeof userIdOrData !== 'string') {
      throw new Error('Use create(userId, data) instead')
    }

    const userId = userIdOrData
    const formData = data!
    const id = generateId()
    const filterData: SavedFilter = {
      id,
      user_id: userId,
      name: formData.name,
      type: formData.type,
      filters: formData.filters,
      is_favorite: formData.is_favorite || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return this.mutateWithOfflineSupport(
      async () =>
        await supabase
          .from(this.tableName)
          .insert({
            user_id: userId,
            name: formData.name,
            type: formData.type,
            filters: formData.filters,
            is_favorite: formData.is_favorite || false,
          })
          .select()
          .single(),
      async (savedData) => await offlineDB.saveEntity(this.tableName, savedData),
      'create',
      filterData
    )
  }

  async update(id: string, data: Partial<SavedFilter>): Promise<ApiResponse<SavedFilter>>
  async update(id: string, data: Partial<SavedFilterFormData>): Promise<ApiResponse<SavedFilter>>
  async update(id: string, data: Partial<SavedFilter> | Partial<SavedFilterFormData>): Promise<ApiResponse<SavedFilter>> {
    if ('user_id' in data || 'created_at' in data) {
      throw new Error('Use update(id, data) with SavedFilterFormData instead')
    }

    const updateData: any = { ...data, id, updated_at: new Date().toISOString() }

    return this.mutateWithOfflineSupport(
      async () =>
        await supabase
          .from(this.tableName)
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single(),
      async (savedData) => await offlineDB.saveEntity(this.tableName, { ...savedData, id }),
      'update',
      updateData
    )
  }

  async delete(id: string): Promise<ApiResponse<boolean>> {
    return this.mutateWithOfflineSupport(
      async () => {
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
}

export const savedFilterRepository = new SavedFilterRepository()
