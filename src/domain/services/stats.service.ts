/**
 * Statistics Service
 * Calculates workout statistics and analytics
 * Following Single Responsibility Principle
 */

import { supabase } from '@/lib/supabase/client'
import { WorkoutStats, ExerciseProgress, MuscleGroup, ApiResponse } from '@/types'

export interface VolumeByWeek {
  week: string
  volume: number
  workouts: number
}

export interface ExerciseFrequency {
  exercise_id: string
  exercise_name: string
  count: number
  muscle_group: string
}

export interface PersonalRecord {
  exercise_id: string
  exercise_name: string
  max_weight: number
  date: string
  reps: number
}

export interface WeeklyProgress {
  week: string
  total_volume: number
  total_sets: number
  total_workouts: number
  avg_weight: number
}

export interface IStatsService {
  getUserStats(userId: string): Promise<ApiResponse<WorkoutStats>>
  getExerciseProgress(userId: string, exerciseId: string): Promise<ApiResponse<ExerciseProgress>>
  getMuscleGroupDistribution(userId: string): Promise<ApiResponse<Record<MuscleGroup, number>>>
  getVolumeByWeek(userId: string, weeks?: number): Promise<ApiResponse<VolumeByWeek[]>>
  getTotalVolume(userId: string): Promise<ApiResponse<number>>
  getMostFrequentExercises(userId: string, limit?: number): Promise<ApiResponse<ExerciseFrequency[]>>
  getPersonalRecords(userId: string): Promise<ApiResponse<PersonalRecord[]>>
  getWeeklyProgress(userId: string, weeks?: number): Promise<ApiResponse<WeeklyProgress[]>>
}

class StatsService implements IStatsService {
  async getUserStats(userId: string): Promise<ApiResponse<WorkoutStats>> {
    try {
      // Get total workouts
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('id, duration')
        .eq('user_id', userId)

      if (workoutsError) throw workoutsError

      // Get total sets
      const { count: totalSets, error: setsError } = await supabase
        .from('sets')
        .select('*', { count: 'exact', head: true })
        .in('workout_id', workouts?.map(w => w.id) || [])

      if (setsError) throw setsError

      // Get most trained muscle group
      const { data: muscleData, error: muscleError } = await supabase
        .from('sets')
        .select('exercise_id, exercises(muscle_group)')
        .in('workout_id', workouts?.map(w => w.id) || [])

      if (muscleError) throw muscleError

      // Calculate stats
      const totalWorkouts = workouts?.length || 0
      const totalDuration = workouts?.reduce((sum, w) => sum + w.duration, 0) || 0
      const averageDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0

      // Find most trained muscle group
      const muscleGroupCounts: Record<string, number> = {}
      muscleData?.forEach((item: any) => {
        const muscle = item.exercises?.muscle_group
        if (muscle) {
          muscleGroupCounts[muscle] = (muscleGroupCounts[muscle] || 0) + 1
        }
      })

      const mostTrainedMuscle = Object.keys(muscleGroupCounts).length > 0
        ? (Object.keys(muscleGroupCounts).reduce((a, b) =>
            muscleGroupCounts[a] > muscleGroupCounts[b] ? a : b
          ) as MuscleGroup)
        : null

      return {
        data: {
          total_workouts: totalWorkouts,
          total_duration: totalDuration,
          total_sets: totalSets || 0,
          average_duration: Math.round(averageDuration),
          most_trained_muscle: mostTrainedMuscle,
        },
      }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async getExerciseProgress(
    userId: string,
    exerciseId: string
  ): Promise<ApiResponse<ExerciseProgress>> {
    try {
      const { data: sets, error } = await supabase
        .from('sets')
        .select(`
          *,
          workout:workouts!inner(date, user_id),
          exercise:exercises(name)
        `)
        .eq('exercise_id', exerciseId)
        .eq('workout.user_id', userId)
        .order('workout(date)', { ascending: true })

      if (error) throw error

      const dates: string[] = []
      const weights: number[] = []
      const reps: number[] = []
      const volume: number[] = []

      sets?.forEach((set: any) => {
        dates.push(set.workout.date)
        weights.push(set.weight)
        reps.push(set.reps)
        volume.push(set.weight * set.reps)
      })

      return {
        data: {
          exercise_id: exerciseId,
          exercise_name: sets?.[0]?.exercise?.name || '',
          dates,
          weights,
          reps,
          volume,
        },
      }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async getMuscleGroupDistribution(
    userId: string
  ): Promise<ApiResponse<Record<MuscleGroup, number>>> {
    try {
      const { data: workouts } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', userId)

      const { data: sets, error } = await supabase
        .from('sets')
        .select('exercise:exercises(muscle_group)')
        .in('workout_id', workouts?.map(w => w.id) || [])

      if (error) throw error

      const distribution: Record<string, number> = {}
      sets?.forEach((set: any) => {
        const muscle = set.exercise?.muscle_group
        if (muscle) {
          distribution[muscle] = (distribution[muscle] || 0) + 1
        }
      })

      return { data: distribution as Record<MuscleGroup, number> }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async getVolumeByWeek(userId: string, weeks: number = 12): Promise<ApiResponse<VolumeByWeek[]>> {
    try {
      const weeksAgo = new Date()
      weeksAgo.setDate(weeksAgo.getDate() - weeks * 7)

      const { data: workouts } = await supabase
        .from('workouts')
        .select('id, date')
        .eq('user_id', userId)
        .gte('date', weeksAgo.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (!workouts || workouts.length === 0) {
        return { data: [] }
      }

      const { data: sets, error } = await supabase
        .from('sets')
        .select('workout_id, weight, reps, workouts!inner(date)')
        .in('workout_id', workouts.map(w => w.id))

      if (error) throw error

      // Group by week
      const weeklyData: Record<string, { volume: number; workouts: Set<string> }> = {}
      
      sets?.forEach((set: any) => {
        const date = new Date(set.workouts.date)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
        const weekKey = weekStart.toISOString().split('T')[0]
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { volume: 0, workouts: new Set() }
        }
        
        weeklyData[weekKey].volume += set.weight * set.reps
        weeklyData[weekKey].workouts.add(set.workout_id)
      })

      const result: VolumeByWeek[] = Object.entries(weeklyData).map(([week, data]) => ({
        week,
        volume: Math.round(data.volume),
        workouts: data.workouts.size,
      }))

      return { data: result }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async getTotalVolume(userId: string): Promise<ApiResponse<number>> {
    try {
      const { data: workouts } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', userId)

      const { data: sets, error } = await supabase
        .from('sets')
        .select('weight, reps')
        .in('workout_id', workouts?.map(w => w.id) || [])

      if (error) throw error

      const totalVolume = sets?.reduce((sum, set) => sum + (set.weight * set.reps), 0) || 0

      return { data: Math.round(totalVolume) }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async getMostFrequentExercises(userId: string, limit: number = 5): Promise<ApiResponse<ExerciseFrequency[]>> {
    try {
      const { data: workouts } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', userId)

      const { data: sets, error } = await supabase
        .from('sets')
        .select('exercise_id, exercise:exercises(name, muscle_group)')
        .in('workout_id', workouts?.map(w => w.id) || [])

      if (error) throw error

      const exerciseCounts: Record<string, { name: string; count: number; muscle_group: string }> = {}
      
      sets?.forEach((set: any) => {
        const id = set.exercise_id
        if (!exerciseCounts[id]) {
          exerciseCounts[id] = {
            name: set.exercise?.name || 'Unknown',
            count: 0,
            muscle_group: set.exercise?.muscle_group || 'unknown',
          }
        }
        exerciseCounts[id].count++
      })

      const result: ExerciseFrequency[] = Object.entries(exerciseCounts)
        .map(([exercise_id, data]) => ({
          exercise_id,
          exercise_name: data.name,
          count: data.count,
          muscle_group: data.muscle_group,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)

      return { data: result }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async getPersonalRecords(userId: string): Promise<ApiResponse<PersonalRecord[]>> {
    try {
      const { data: workouts } = await supabase
        .from('workouts')
        .select('id, date')
        .eq('user_id', userId)

      const { data: sets, error } = await supabase
        .from('sets')
        .select('exercise_id, weight, reps, workout_id, exercise:exercises(name)')
        .in('workout_id', workouts?.map(w => w.id) || [])

      if (error) throw error

      // Find max weight for each exercise
      const records: Record<string, PersonalRecord> = {}
      
      sets?.forEach((set: any) => {
        const id = set.exercise_id
        if (!records[id] || set.weight > records[id].max_weight) {
          const workout = workouts?.find(w => w.id === set.workout_id)
          records[id] = {
            exercise_id: id,
            exercise_name: set.exercise?.name || 'Unknown',
            max_weight: set.weight,
            date: workout?.date || '',
            reps: set.reps,
          }
        }
      })

      const result = Object.values(records)
        .sort((a, b) => b.max_weight - a.max_weight)

      return { data: result }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  async getWeeklyProgress(userId: string, weeks: number = 8): Promise<ApiResponse<WeeklyProgress[]>> {
    try {
      const weeksAgo = new Date()
      weeksAgo.setDate(weeksAgo.getDate() - weeks * 7)

      const { data: workouts } = await supabase
        .from('workouts')
        .select('id, date')
        .eq('user_id', userId)
        .gte('date', weeksAgo.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (!workouts || workouts.length === 0) {
        return { data: [] }
      }

      const { data: sets, error } = await supabase
        .from('sets')
        .select('workout_id, weight, reps')
        .in('workout_id', workouts.map(w => w.id))

      if (error) throw error

      // Group by week
      const weeklyData: Record<string, { 
        volume: number
        sets: number
        workouts: Set<string>
        totalWeight: number
      }> = {}
      
      sets?.forEach((set: any) => {
        const workout = workouts.find(w => w.id === set.workout_id)
        if (!workout) return
        
        const date = new Date(workout.date)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        const weekKey = weekStart.toISOString().split('T')[0]
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { 
            volume: 0, 
            sets: 0,
            workouts: new Set(),
            totalWeight: 0,
          }
        }
        
        weeklyData[weekKey].volume += set.weight * set.reps
        weeklyData[weekKey].sets++
        weeklyData[weekKey].workouts.add(set.workout_id)
        weeklyData[weekKey].totalWeight += set.weight
      })

      const result: WeeklyProgress[] = Object.entries(weeklyData).map(([week, data]) => ({
        week,
        total_volume: Math.round(data.volume),
        total_sets: data.sets,
        total_workouts: data.workouts.size,
        avg_weight: Math.round(data.totalWeight / data.sets),
      }))

      return { data: result }
    } catch (error: any) {
      return { error: error.message }
    }
  }
}

export const statsService = new StatsService()

