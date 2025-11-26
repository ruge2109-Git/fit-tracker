/**
 * Body Measurement Service
 * Business logic layer for body measurement operations
 */

import { bodyMeasurementRepository } from '../repositories/body-measurement.repository'
import { BodyMeasurement, BodyMeasurementFormData, ApiResponse } from '@/types'

export interface IBodyMeasurementService {
  getMeasurement(id: string): Promise<ApiResponse<BodyMeasurement>>
  getUserMeasurements(userId: string): Promise<ApiResponse<BodyMeasurement[]>>
  getMeasurementsByType(userId: string, type: string): Promise<ApiResponse<BodyMeasurement[]>>
  getMeasurementsByDateRange(userId: string, startDate: string, endDate: string): Promise<ApiResponse<BodyMeasurement[]>>
  createMeasurement(userId: string, data: BodyMeasurementFormData): Promise<ApiResponse<BodyMeasurement>>
  updateMeasurement(id: string, data: Partial<BodyMeasurementFormData>): Promise<ApiResponse<BodyMeasurement>>
  deleteMeasurement(id: string): Promise<ApiResponse<boolean>>
}

class BodyMeasurementService implements IBodyMeasurementService {
  async getMeasurement(id: string): Promise<ApiResponse<BodyMeasurement>> {
    return await bodyMeasurementRepository.findById(id)
  }

  async getUserMeasurements(userId: string): Promise<ApiResponse<BodyMeasurement[]>> {
    return await bodyMeasurementRepository.findByUserId(userId)
  }

  async getMeasurementsByType(userId: string, type: string): Promise<ApiResponse<BodyMeasurement[]>> {
    return await bodyMeasurementRepository.findByType(userId, type)
  }

  async getMeasurementsByDateRange(userId: string, startDate: string, endDate: string): Promise<ApiResponse<BodyMeasurement[]>> {
    return await bodyMeasurementRepository.findByDateRange(userId, startDate, endDate)
  }

  async createMeasurement(userId: string, data: BodyMeasurementFormData): Promise<ApiResponse<BodyMeasurement>> {
    // Normalize optional fields
    const normalizedData: Partial<BodyMeasurement> = {
      user_id: userId,
      measurement_type: data.measurement_type,
      value: data.value,
      unit: data.unit,
      notes: data.notes && data.notes.trim() !== '' ? data.notes : undefined,
      measurement_date: data.measurement_date || new Date().toISOString().split('T')[0],
    }

    return await bodyMeasurementRepository.create(normalizedData)
  }

  async updateMeasurement(id: string, data: Partial<BodyMeasurementFormData>): Promise<ApiResponse<BodyMeasurement>> {
    // Normalize optional fields
    const normalizedData: Partial<BodyMeasurementFormData> = { ...data }
    
    if ('notes' in normalizedData && normalizedData.notes === '') {
      normalizedData.notes = undefined
    }

    return await bodyMeasurementRepository.update(id, normalizedData)
  }

  async deleteMeasurement(id: string): Promise<ApiResponse<boolean>> {
    return await bodyMeasurementRepository.delete(id)
  }
}

export const bodyMeasurementService = new BodyMeasurementService()

