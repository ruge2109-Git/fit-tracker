/**
 * Analytics Service
 * Calculates workout metrics, volume, trends, and recommendations
 */

import { WorkoutWithSets, MuscleGroup, Exercise } from '@/types'
import { workoutRepository } from '../repositories/workout.repository'

export interface VolumeMetrics {
  totalTonnage: number // kg (weight * reps * sets)
  totalSets: number
  totalReps: number
  byMuscleGroup: Record<MuscleGroup, number>
  byExercise: Record<string, number>
  averageWeightPerSet: number
}

export interface OneRepMax {
  exercise: string
  estimatedOneRM: number
  lastAchieved: string
  progression: number // % increase from first workout
}

export interface WorkoutTrend {
  week: number
  date: string
  tonnage: number
  workouts: number
  avgDuration: number
}

export interface MuscleBalance {
  muscleGroup: MuscleGroup
  tonnage: number
  percentage: number
  workouts: number
}

class AnalyticsService {
  /**
   * Calculate volume metrics for a period
   */
  calculateVolumeMetrics(workouts: WorkoutWithSets[]): VolumeMetrics {
    let totalTonnage = 0
    let totalSets = 0
    let totalReps = 0
    const byMuscleGroup: Record<MuscleGroup, number> = {} as Record<MuscleGroup, number>
    const byExercise: Record<string, number> = {}

    workouts.forEach((workout) => {
      workout.sets.forEach((set) => {
        const tonnage = set.weight * set.reps
        totalTonnage += tonnage

        const muscle = set.exercise.muscle_group
        byMuscleGroup[muscle] = (byMuscleGroup[muscle] || 0) + tonnage

        const exerciseName = set.exercise.name
        byExercise[exerciseName] = (byExercise[exerciseName] || 0) + tonnage

        totalSets += 1
        totalReps += set.reps
      })
    })

    return {
      totalTonnage: Math.round(totalTonnage * 10) / 10,
      totalSets,
      totalReps,
      byMuscleGroup,
      byExercise,
      averageWeightPerSet: totalSets > 0 ? Math.round((totalTonnage / totalSets) * 10) / 10 : 0,
    }
  }

  /**
   * Calculate muscle group balance
   */
  calculateMuscleBalance(workouts: WorkoutWithSets[]): MuscleBalance[] {
    const metrics = this.calculateVolumeMetrics(workouts)
    const muscleGroupWorkouts: Record<MuscleGroup, number> = {} as Record<MuscleGroup, number>

    workouts.forEach((workout) => {
      const musclesInWorkout = new Set<MuscleGroup>()
      workout.sets.forEach((set) => {
        musclesInWorkout.add(set.exercise.muscle_group)
      })
      musclesInWorkout.forEach((muscle) => {
        muscleGroupWorkouts[muscle] = (muscleGroupWorkouts[muscle] || 0) + 1
      })
    })

    return Object.entries(metrics.byMuscleGroup).map(([muscle, tonnage]) => ({
      muscleGroup: muscle as MuscleGroup,
      tonnage: Math.round(tonnage * 10) / 10,
      percentage: metrics.totalTonnage > 0 ? (tonnage / metrics.totalTonnage) * 100 : 0,
      workouts: muscleGroupWorkouts[muscle as MuscleGroup] || 0,
    }))
  }

  /**
   * Estimate one-rep max using Epley formula
   * 1RM = weight * (1 + reps/30)
   */
  estimateOneRepMax(weight: number, reps: number): number {
    if (reps >= 37) return weight // Epley breaks down at high reps
    const oneRM = weight * (1 + reps / 30)
    return Math.round(oneRM * 10) / 10
  }

  /**
   * Get one-rep-max progression for each exercise
   */
  getOneRepMaxProgression(workouts: WorkoutWithSets[]): OneRepMax[] {
    const exerciseData: Record<string, { weights: number[]; reps: number[] }> = {}

    workouts.forEach((workout) => {
      workout.sets.forEach((set) => {
        const name = set.exercise.name
        if (!exerciseData[name]) {
          exerciseData[name] = { weights: [], reps: [] }
        }
        exerciseData[name].weights.push(set.weight)
        exerciseData[name].reps.push(set.reps)
      })
    })

    return Object.entries(exerciseData).map(([exerciseName, data]) => {
      const maxIdx = data.weights.reduce((maxI, w, i) => (w > data.weights[maxI] ? i : maxI), 0)
      const maxWeight = data.weights[maxIdx]
      const repsAtMax = data.reps[maxIdx]
      const estimatedRM = this.estimateOneRepMax(maxWeight, repsAtMax)
      const firstRM = this.estimateOneRepMax(data.weights[0], data.reps[0])

      return {
        exercise: exerciseName,
        estimatedOneRM: estimatedRM,
        lastAchieved: new Date().toISOString(),
        progression: Math.round(((estimatedRM - firstRM) / firstRM) * 1000) / 10,
      }
    })
  }

  /**
   * Calculate weekly tonnage trend
   */
  calculateWeeklyTrend(workouts: WorkoutWithSets[]): WorkoutTrend[] {
    const weeklyData: Record<number, { tonnage: number; count: number; durations: number[] }> =
      {}

    workouts.forEach((workout) => {
      const date = new Date(workout.date)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekNumber = Math.floor(
        (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
      )

      if (!weeklyData[weekNumber]) {
        weeklyData[weekNumber] = { tonnage: 0, count: 0, durations: [] }
      }

      let workoutTonnage = 0
      workout.sets.forEach((set) => {
        workoutTonnage += set.weight * set.reps
      })

      weeklyData[weekNumber].tonnage += workoutTonnage
      weeklyData[weekNumber].count += 1
      weeklyData[weekNumber].durations.push(workout.duration)
    })

    return Object.entries(weeklyData)
      .map(([weekNumber, data]) => ({
        week: parseInt(weekNumber),
        date: new Date(2024, 0, 1 + parseInt(weekNumber) * 7).toISOString().split('T')[0],
        tonnage: Math.round(data.tonnage * 10) / 10,
        workouts: data.count,
        avgDuration: Math.round(data.durations.reduce((a, b) => a + b, 0) / data.durations.length),
      }))
      .sort((a, b) => a.week - b.week)
  }

  /**
   * Get comparison between two periods (e.g., this month vs last month)
   */
  compareMonths(
    workouts: WorkoutWithSets[],
    month1: number,
    month2: number,
    year: number
  ): {
    month1: VolumeMetrics
    month2: VolumeMetrics
    percentChange: number
  } {
    const isInMonth = (workout: WorkoutWithSets, month: number) => {
      const date = new Date(workout.date)
      return date.getMonth() === month && date.getFullYear() === year
    }

    const month1Workouts = workouts.filter((w) => isInMonth(w, month1))
    const month2Workouts = workouts.filter((w) => isInMonth(w, month2))

    const metrics1 = this.calculateVolumeMetrics(month1Workouts)
    const metrics2 = this.calculateVolumeMetrics(month2Workouts)

    const percentChange =
      metrics1.totalTonnage > 0
        ? ((metrics2.totalTonnage - metrics1.totalTonnage) / metrics1.totalTonnage) * 100
        : 0

    return {
      month1: metrics1,
      month2: metrics2,
      percentChange: Math.round(percentChange * 10) / 10,
    }
  }

  /**
   * Get frequency heatmap data (workouts per day of week)
   */
  getFrequencyHeatmap(workouts: WorkoutWithSets[]): Record<string, number> {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const heatmap: Record<string, number> = {}

    dayNames.forEach((day) => {
      heatmap[day] = 0
    })

    workouts.forEach((workout) => {
      const date = new Date(workout.date)
      const dayName = dayNames[date.getDay()]
      heatmap[dayName] = (heatmap[dayName] || 0) + 1
    })

    return heatmap
  }
}

export const analyticsService = new AnalyticsService()
