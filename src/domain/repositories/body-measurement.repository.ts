/**
 * Body Measurement Repository
 * Handles database operations for body measurements
 */

import { BaseRepository } from './base.repository'
import { BodyMeasurement, BodyMeasurementFormData, ApiResponse } from '@/types'
import { supabase } from '@/lib/supabase/client'

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
    super('body_measurements')
  }

  override async findById(id: string): Promise<ApiResponse<BodyMeasurement>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) return this.handleError(error)
      return this.success(data as BodyMeasurement)
    } catch (error) {
      return this.handleError(error)
    }
  }

  override async findAll(): Promise<ApiResponse<BodyMeasurement[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('measurement_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) return this.handleError(error)
      return this.success(data || [])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findByUserId(userId: string): Promise<ApiResponse<BodyMeasurement[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('measurement_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) return this.handleError(error)
      return this.success(data || [])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findByType(userId: string, type: string): Promise<ApiResponse<BodyMeasurement[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('measurement_type', type)
        .order('measurement_date', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) return this.handleError(error)
      return this.success(data || [])
    } catch (error) {
      return this.handleError(error)
    }
  }

  async findByDateRange(userId: string, startDate: string, endDate: string): Promise<ApiResponse<BodyMeasurement[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .gte('measurement_date', startDate)
        .lte('measurement_date', endDate)
        .order('measurement_date', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) return this.handleError(error)
      return this.success(data || [])
    } catch (error) {
      return this.handleError(error)
    }
  }

  override async create(data: Partial<BodyMeasurement>): Promise<ApiResponse<BodyMeasurement>> {
    try {
      const { data: measurement, error } = await supabase
        .from(this.tableName)
        .insert({
          ...data,
          measurement_date: data.measurement_date || new Date().toISOString().split('T')[0],
        })
        .select()
        .single()

      if (error) return this.handleError(error)
      return this.success(measurement as BodyMeasurement)
    } catch (error) {
      return this.handleError(error)
    }
  }

  override async update(id: string, data: Partial<BodyMeasurementFormData>): Promise<ApiResponse<BodyMeasurement>> {
    try {
      const { data: measurement, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) return this.handleError(error)
      return this.success(measurement as BodyMeasurement)
    } catch (error) {
      return this.handleError(error)
    }
  }

  override async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) return this.handleError(error)
      return this.success(true)
    } catch (error) {
      return this.handleError(error)
    }
  }
}

export const bodyMeasurementRepository = new BodyMeasurementRepository()

