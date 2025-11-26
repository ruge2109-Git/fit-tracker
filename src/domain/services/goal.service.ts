/**
 * Goal Service
 * Business logic layer for goal operations
 * Following Single Responsibility and Open/Closed principles
 */

import { goalRepository } from '../repositories/goal.repository'
import { Goal, GoalWithProgress, GoalFormData, GoalProgressFormData, ApiResponse } from '@/types'

export interface IGoalService {
  getGoal(id: string): Promise<ApiResponse<GoalWithProgress>>
  getUserGoals(userId: string): Promise<ApiResponse<Goal[]>>
  getActiveGoals(userId: string): Promise<ApiResponse<Goal[]>>
  getCompletedGoals(userId: string): Promise<ApiResponse<Goal[]>>
  createGoal(userId: string, data: GoalFormData): Promise<ApiResponse<Goal>>
  updateGoal(id: string, data: Partial<GoalFormData>): Promise<ApiResponse<Goal>>
  deleteGoal(id: string): Promise<ApiResponse<boolean>>
  addProgress(goalId: string, progress: GoalProgressFormData): Promise<ApiResponse<Goal>>
  getProgress(goalId: string): Promise<ApiResponse<any[]>>
  calculateProgress(goal: Goal): number // Returns percentage (0-100)
}

class GoalService implements IGoalService {
  async getGoal(id: string): Promise<ApiResponse<GoalWithProgress>> {
    return await goalRepository.findById(id)
  }

  async getUserGoals(userId: string): Promise<ApiResponse<Goal[]>> {
    return await goalRepository.findByUserId(userId)
  }

  async getActiveGoals(userId: string): Promise<ApiResponse<Goal[]>> {
    return await goalRepository.findActive(userId)
  }

  async getCompletedGoals(userId: string): Promise<ApiResponse<Goal[]>> {
    return await goalRepository.findCompleted(userId)
  }

  async createGoal(userId: string, data: GoalFormData): Promise<ApiResponse<Goal>> {
    // Normalize optional fields: convert empty strings to undefined
    const normalizedData: Partial<Goal> = {
      user_id: userId,
      title: data.title,
      description: data.description && data.description.trim() !== '' ? data.description : undefined,
      type: data.type,
      target_value: data.target_value,
      unit: data.unit,
      start_date: data.start_date,
      target_date: data.target_date && data.target_date.trim() !== '' ? data.target_date : undefined,
      current_value: 0,
      is_completed: false,
    }
    
    return await goalRepository.create(normalizedData)
  }

  async updateGoal(id: string, data: Partial<GoalFormData>): Promise<ApiResponse<Goal>> {
    // Normalize optional fields: convert empty strings to null
    const normalizedData: Partial<GoalFormData> = { ...data }
    
    if ('description' in normalizedData && normalizedData.description === '') {
      normalizedData.description = undefined
    }
    
    if ('target_date' in normalizedData) {
      normalizedData.target_date = normalizedData.target_date && normalizedData.target_date.trim() !== '' 
        ? normalizedData.target_date 
        : undefined
    }
    
    return await goalRepository.update(id, normalizedData)
  }

  async deleteGoal(id: string): Promise<ApiResponse<boolean>> {
    return await goalRepository.delete(id)
  }

  async addProgress(goalId: string, progress: GoalProgressFormData): Promise<ApiResponse<Goal>> {
    // Add progress entry
    const progressResult = await goalRepository.addProgress(goalId, {
      value: progress.value,
      notes: progress.notes,
    })

    if (progressResult.error) {
      return { error: progressResult.error }
    }

    // Get updated goal (current_value is auto-updated by trigger)
    return await goalRepository.findById(goalId)
  }

  async getProgress(goalId: string): Promise<ApiResponse<any[]>> {
    return await goalRepository.getProgress(goalId)
  }

  calculateProgress(goal: Goal): number {
    if (goal.target_value === 0) return 0
    const percentage = (goal.current_value / goal.target_value) * 100
    return Math.min(100, Math.max(0, Math.round(percentage * 100) / 100))
  }
}

export const goalService = new GoalService()

