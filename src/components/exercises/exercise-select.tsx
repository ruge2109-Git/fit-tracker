/**
 * ExerciseSelect Component
 * Dropdown for selecting exercises
 */

'use client'

import { useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useExerciseStore } from '@/store/exercise.store'

interface ExerciseSelectProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function ExerciseSelect({ value, onChange, disabled }: ExerciseSelectProps) {
  const { exercises, loadExercises, isLoading } = useExerciseStore()

  useEffect(() => {
    loadExercises()
  }, [loadExercises])

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger>
        <SelectValue placeholder="Select an exercise" />
      </SelectTrigger>
      <SelectContent>
        {exercises.map((exercise) => (
          <SelectItem key={exercise.id} value={exercise.id}>
            {exercise.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

