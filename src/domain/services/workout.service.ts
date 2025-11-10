/**
 * Workout Service
 * Business logic layer for workout operations
 * Following Single Responsibility and Open/Closed principles
 */

import { workoutRepository } from '../repositories/workout.repository'
import { setRepository } from '../repositories/set.repository'
import { Workout, WorkoutWithSets, WorkoutFormData, SetFormData, ApiResponse } from '@/types'

export interface IWorkoutService {
  getWorkout(id: string): Promise<ApiResponse<WorkoutWithSets>>
  getUserWorkouts(userId: string): Promise<ApiResponse<Workout[]>>
  createWorkout(userId: string, data: WorkoutFormData): Promise<ApiResponse<Workout>>
  createWorkoutWithSets(
    userId: string,
    workoutData: WorkoutFormData,
    sets: SetFormData[]
  ): Promise<ApiResponse<WorkoutWithSets>>
  updateWorkout(id: string, data: Partial<WorkoutFormData>): Promise<ApiResponse<Workout>>
  deleteWorkout(id: string): Promise<ApiResponse<boolean>>
}

class WorkoutService implements IWorkoutService {
  async getWorkout(id: string): Promise<ApiResponse<WorkoutWithSets>> {
    return await workoutRepository.findById(id)
  }

  async getUserWorkouts(userId: string): Promise<ApiResponse<Workout[]>> {
    return await workoutRepository.findByUserId(userId)
  }

  async createWorkout(userId: string, data: WorkoutFormData): Promise<ApiResponse<Workout>> {
    return await workoutRepository.create({
      ...data,
      user_id: userId,
    })
  }

  async createWorkoutWithSets(
    userId: string,
    workoutData: WorkoutFormData,
    sets: SetFormData[]
  ): Promise<ApiResponse<WorkoutWithSets>> {
    // Create workout first
    const workoutResponse = await this.createWorkout(userId, workoutData)

    if (workoutResponse.error || !workoutResponse.data) {
      return { error: workoutResponse.error || 'Failed to create workout' }
    }

    const workout = workoutResponse.data

    // Create sets if provided
    if (sets.length > 0) {
      const setsWithWorkoutId = sets.map((set, index) => ({
        ...set,
        workout_id: workout.id,
        set_order: index + 1,
      }))

      const setsResponse = await setRepository.createMany(setsWithWorkoutId)

      if (setsResponse.error) {
        // Rollback: delete workout if sets creation failed
        await workoutRepository.delete(workout.id)
        return { error: 'Failed to create sets' }
      }
    }

    // Fetch complete workout with sets
    return await workoutRepository.findById(workout.id)
  }

  async updateWorkout(id: string, data: Partial<WorkoutFormData>): Promise<ApiResponse<Workout>> {
    return await workoutRepository.update(id, data)
  }

  async deleteWorkout(id: string): Promise<ApiResponse<boolean>> {
    return await workoutRepository.delete(id)
  }

  /**
   * Get workouts within a date range
   */
  async getWorkoutsByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<Workout[]>> {
    return await workoutRepository.findByDateRange(userId, startDate, endDate)
  }
}

export const workoutService = new WorkoutService()

