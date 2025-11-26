/**
 * Body Measurement Store using Zustand
 * Manages body measurement state and operations
 */

import { create } from 'zustand'
import { BodyMeasurement, BodyMeasurementFormData } from '@/types'
import { bodyMeasurementService } from '@/domain/services/body-measurement.service'
import { logAuditEvent } from '@/lib/audit/audit-helper'

interface BodyMeasurementState {
  measurements: BodyMeasurement[]
  isLoading: boolean
  error: string | null
  loadMeasurements: (userId: string) => Promise<void>
  loadMeasurementsByType: (userId: string, type: string) => Promise<BodyMeasurement[]>
  createMeasurement: (userId: string, data: BodyMeasurementFormData) => Promise<string | null>
  updateMeasurement: (id: string, data: Partial<BodyMeasurementFormData>) => Promise<boolean>
  deleteMeasurement: (id: string) => Promise<boolean>
  clearError: () => void
}

export const useBodyMeasurementStore = create<BodyMeasurementState>((set, get) => ({
  measurements: [],
  isLoading: false,
  error: null,

  loadMeasurements: async (userId) => {
    set({ isLoading: true, error: null })
    const result = await bodyMeasurementService.getUserMeasurements(userId)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return
    }

    set({ measurements: result.data || [], isLoading: false })
  },

  loadMeasurementsByType: async (userId, type) => {
    const result = await bodyMeasurementService.getMeasurementsByType(userId, type)
    return result.data || []
  },

  createMeasurement: async (userId, data) => {
    set({ isLoading: true, error: null })
    const result = await bodyMeasurementService.createMeasurement(userId, data)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return null
    }

    // Refresh measurements list
    await get().loadMeasurements(userId)
    set({ isLoading: false })
    
    // Log create measurement event
    if (result.data) {
      logAuditEvent({
        action: 'create_body_measurement',
        entityType: 'body_measurement',
        entityId: result.data.id,
        details: { type: data.measurement_type, value: data.value, unit: data.unit },
      })
    }
    
    return result.data!.id
  },

  updateMeasurement: async (id, data) => {
    set({ isLoading: true, error: null })
    const result = await bodyMeasurementService.updateMeasurement(id, data)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return false
    }

    // Update local state
    set((state) => ({
      measurements: state.measurements.map(m => m.id === id ? { ...m, ...data } : m),
      isLoading: false,
    }))
    
    // Log update measurement event
    logAuditEvent({
      action: 'update_body_measurement',
      entityType: 'body_measurement',
      entityId: id,
      details: { changes: Object.keys(data) },
    })
    
    return true
  },

  deleteMeasurement: async (id) => {
    set({ isLoading: true, error: null })
    const result = await bodyMeasurementService.deleteMeasurement(id)

    if (result.error) {
      set({ error: result.error, isLoading: false })
      return false
    }

    // Update local state
    set((state) => ({
      measurements: state.measurements.filter(m => m.id !== id),
      isLoading: false,
    }))
    
    // Log delete measurement event
    logAuditEvent({
      action: 'delete_body_measurement',
      entityType: 'body_measurement',
      entityId: id,
    })
    
    return true
  },

  clearError: () => set({ error: null }),
}))

