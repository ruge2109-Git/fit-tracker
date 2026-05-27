import { BaseRepository } from './base.repository'
import { BodyMeasurement, BodyMeasurementFormData, ApiResponse } from '@/types'
import { supabase } from '@/lib/supabase/client'
import { offlineDB } from '@/lib/offline/db'
import { generateId } from '@/lib/utils'
import { getTodayColombia } from '@/lib/datetime/colombia'

export interface IBodyMeasurementRepository {
  findById(id: string): Promise<ApiResponse<BodyMeasurement>>
  findAll(): Promise<ApiResponse<BodyMeasurement[]>>
  findByUserId(userId: string): Promise<ApiResponse<BodyMeasurement[]>>
  findByType(userId: string, type: string): Promise<ApiResponse<BodyMeasurement[]>>
  findByDateRange(userId: string, startDate: string, endDate: string): Promise<ApiResponse<BodyMeasurement[]>>
  create(data: Partial<BodyMeasurement>): Promise<ApiResponse<BodyMeasurement>>
  update(id: string, data: Partial<BodyMeasurementFormData>): Promise<ApiResponse<BodyMeasurement>>
  delete(id: string): Promise<ApiResponse<boolean>>
}

export class BodyMeasurementRepository extends BaseRepository<BodyMeasurement> implements IBodyMeasurementRepository {
  constructor() {
    super('body_measurements', 'body_measurement')
  }

  override async findById(id: string): Promise<ApiResponse<BodyMeasurement>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('id', id)
          .single(),
      async () => await offlineDB.getEntity<BodyMeasurement>(this.tableName, id),
      async (data) => await offlineDB.saveEntity(this.tableName, data)
    )
  }

  override async findAll(): Promise<ApiResponse<BodyMeasurement[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .order('measurement_date', { ascending: false })
          .order('created_at', { ascending: false }),
      async () => await offlineDB.getAllEntities<BodyMeasurement>(this.tableName),
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findByUserId(userId: string): Promise<ApiResponse<BodyMeasurement[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('user_id', userId)
          .order('measurement_date', { ascending: false })
          .order('created_at', { ascending: false }),
      async () => await offlineDB.getEntitiesByIndex<BodyMeasurement>(this.tableName, 'user_id', userId),
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findByType(userId: string, type: string): Promise<ApiResponse<BodyMeasurement[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('user_id', userId)
          .eq('measurement_type', type)
          .order('measurement_date', { ascending: true })
          .order('created_at', { ascending: true }),
      async () => {
        const all = await offlineDB.getEntitiesByIndex<BodyMeasurement>(this.tableName, 'user_id', userId)
        return all.filter(e => e.measurement_type === type)
      },
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  async findByDateRange(userId: string, startDate: string, endDate: string): Promise<ApiResponse<BodyMeasurement[]>> {
    return this.fetchWithOfflineFallback(
      async () =>
        await supabase
          .from(this.tableName)
          .select('*')
          .eq('user_id', userId)
          .gte('measurement_date', startDate)
          .lte('measurement_date', endDate)
          .order('measurement_date', { ascending: true })
          .order('created_at', { ascending: true }),
      async () => {
        const all = await offlineDB.getEntitiesByIndex<BodyMeasurement>(this.tableName, 'user_id', userId)
        return all.filter(e => e.measurement_date >= startDate && e.measurement_date <= endDate)
      },
      async (data) => {
        for (const item of data) {
          await offlineDB.saveEntity(this.tableName, item)
        }
      }
    )
  }

  override async create(data: Partial<BodyMeasurement>): Promise<ApiResponse<BodyMeasurement>> {
    const id = data.id || generateId()
    const measurementData = {
      ...data,
      id,
      measurement_date: data.measurement_date || getTodayColombia(),
    }

    return this.mutateWithOfflineSupport(
      async () =>
        await supabase
          .from(this.tableName)
          .insert(measurementData)
          .select()
          .single(),
      async (savedData) => await offlineDB.saveEntity(this.tableName, savedData),
      'create',
      measurementData
    )
  }

  override async update(id: string, data: Partial<BodyMeasurementFormData>): Promise<ApiResponse<BodyMeasurement>> {
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

export const bodyMeasurementRepository = new BodyMeasurementRepository()
