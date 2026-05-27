import { BaseRepository } from './base.repository'
import { ProgressPhoto, ApiResponse } from '@/types'
import { supabase } from '@/lib/supabase/client'
import { offlineDB } from '@/lib/offline/db'

export interface IProgressPhotoRepository {
  findById(id: string): Promise<ApiResponse<ProgressPhoto>>
  findAll(): Promise<ApiResponse<ProgressPhoto[]>>
  findByUserId(userId: string): Promise<ApiResponse<ProgressPhoto[]>>
  findByType(userId: string, type: string): Promise<ApiResponse<ProgressPhoto[]>>
  findByDateRange(userId: string, startDate: string, endDate: string): Promise<ApiResponse<ProgressPhoto[]>>
  create(data: Partial<ProgressPhoto>): Promise<ApiResponse<ProgressPhoto>>
  update(id: string, data: Partial<ProgressPhoto>): Promise<ApiResponse<ProgressPhoto>>
  delete(id: string): Promise<ApiResponse<boolean>>
}

export class ProgressPhotoRepository extends BaseRepository<ProgressPhoto> implements IProgressPhotoRepository {
  constructor() {
    super('progress_photos', 'progress_photo')
  }

  override async findById(id: string): Promise<ApiResponse<ProgressPhoto>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('id', id)
          .single(),
      async () => await offlineDB.getEntity<ProgressPhoto>(this.tableName, id),
      async (data) => await offlineDB.saveEntity(this.tableName, data)
    )
  }

  override async findAll(): Promise<ApiResponse<ProgressPhoto[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .order('photo_date', { ascending: false })
          .order('created_at', { ascending: false }),
      async () => await offlineDB.getAllEntities<ProgressPhoto>(this.tableName),
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findByUserId(userId: string): Promise<ApiResponse<ProgressPhoto[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('user_id', userId)
          .order('photo_date', { ascending: false })
          .order('created_at', { ascending: false }),
      async () => await offlineDB.getEntitiesByIndex<ProgressPhoto>(this.tableName, 'user_id', userId),
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findByType(userId: string, type: string): Promise<ApiResponse<ProgressPhoto[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('user_id', userId)
          .eq('photo_type', type)
          .order('photo_date', { ascending: true })
          .order('created_at', { ascending: true }),
      async () => {
        const all = await offlineDB.getEntitiesByIndex<ProgressPhoto>(this.tableName, 'user_id', userId)
        return all.filter(e => e.photo_type === type)
      },
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findByDateRange(userId: string, startDate: string, endDate: string): Promise<ApiResponse<ProgressPhoto[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('user_id', userId)
          .gte('photo_date', startDate)
          .lte('photo_date', endDate)
          .order('photo_date', { ascending: true })
          .order('created_at', { ascending: true }),
      async () => {
        const all = await offlineDB.getEntitiesByIndex<ProgressPhoto>(this.tableName, 'user_id', userId)
        return all.filter(e => e.photo_date >= startDate && e.photo_date <= endDate)
      },
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  override async create(data: Partial<ProgressPhoto>): Promise<ApiResponse<ProgressPhoto>> {
    const id = data.id || `${Date.now()}-${Math.random()}`
    const photoData = { ...data, id }

    return this.mutateWithOfflineSupport(
      async () =>
        await supabase
          .from(this.tableName)
          .insert(photoData)
          .select()
          .single(),
      async (savedData) => await offlineDB.saveEntity(this.tableName, savedData),
      'create',
      photoData
    )
  }

  override async update(id: string, data: Partial<ProgressPhoto>): Promise<ApiResponse<ProgressPhoto>> {
    const updateData = { ...data, id }
    return this.mutateWithOfflineSupport(
      async () =>
        await supabase
          .from(this.tableName)
          .update(data)
          .eq('id', id)
          .select()
          .single(),
      async (savedData) => await offlineDB.saveEntity(this.tableName, { ...savedData, id }),
      'update',
      updateData
    )
  }

  override async delete(id: string): Promise<ApiResponse<boolean>> {
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

export const progressPhotoRepository = new ProgressPhotoRepository()
