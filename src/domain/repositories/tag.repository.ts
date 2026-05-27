import { BaseRepository } from './base.repository'
import { offlineDB } from '@/lib/offline/db'
import { generateId } from '@/lib/utils'
import { ApiResponse } from '@/types'
import { supabase } from '@/lib/supabase/client'

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

export interface TagFormData {
  name: string
  color: string
}

export interface ITagRepository {
  findByUserId(userId: string): Promise<ApiResponse<Tag[]>>
  create(userId: string, data: TagFormData): Promise<ApiResponse<Tag>>
  update(id: string, data: Partial<TagFormData>): Promise<ApiResponse<Tag>>
  delete(id: string): Promise<ApiResponse<boolean>>
}

export class TagRepository extends BaseRepository<Tag> implements ITagRepository {
  constructor() {
    super('tags', 'tag')
  }

  async findById(id: string): Promise<ApiResponse<Tag>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('id', id)
          .single(),
      async () => await offlineDB.getEntity<Tag>(this.tableName, id),
      async (data) => await offlineDB.saveEntity(this.tableName, data)
    )
  }

  async findAll(): Promise<ApiResponse<Tag[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .order('created_at', { ascending: false }),
      async () => await offlineDB.getAllEntities<Tag>(this.tableName),
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findByUserId(userId: string): Promise<ApiResponse<Tag[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
      async () => await offlineDB.getEntitiesByIndex<Tag>(this.tableName, 'user_id', userId),
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async create(data: Partial<Tag>): Promise<ApiResponse<Tag>>
  async create(userId: string, data: TagFormData): Promise<ApiResponse<Tag>>
  async create(userIdOrData: string | Partial<Tag>, data?: TagFormData): Promise<ApiResponse<Tag>> {
    if (typeof userIdOrData !== 'string') {
      throw new Error('Use create(userId, data) instead')
    }

    const userId = userIdOrData
    const formData = data!
    const id = generateId()
    const tagData = { id, user_id: userId, name: formData.name, color: formData.color }

    return this.mutateWithOfflineSupport(
      async () =>
        await supabase
          .from(this.tableName)
          .insert(tagData)
          .select()
          .single(),
      async (savedData) => await offlineDB.saveEntity(this.tableName, savedData),
      'create',
      tagData
    )
  }

  async update(id: string, data: Partial<Tag>): Promise<ApiResponse<Tag>>
  async update(id: string, data: Partial<TagFormData>): Promise<ApiResponse<Tag>>
  async update(id: string, data: Partial<Tag> | Partial<TagFormData>): Promise<ApiResponse<Tag>> {
    if ('user_id' in data || 'created_at' in data) {
      throw new Error('Use update(id, data) with TagFormData instead')
    }

    const updateData = { ...data, id }
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

export const tagRepository = new TagRepository()
