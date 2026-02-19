/**
 * Import Routine Hook
 * Reusable logic for importing routines
 */

'use client'

import { useState } from 'react'
import { Routine } from '@/types'

interface ParsedExercise {
  day: string
  exerciseName: string
  sets: number
  reps: string
  rest: string
  exerciseId: string | null
}

interface ParsedRoutine {
  name: string
  exercises: ParsedExercise[]
}

export function useImportRoutine() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  const analyzeRoutine = async (csvText: string, apiKey: string): Promise<ParsedRoutine | null> => {
    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/ai/analyze-routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText, apiKey }),
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const data = await response.json()
      return data.routine
    } catch (error) {
      console.error('Error analyzing routine:', error)
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }

  return { analyzeRoutine, isAnalyzing }
}
