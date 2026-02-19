/**
 * Import Routine Dialog
 * Allows users to paste a CSV routine and import it using OpenAI
 */

'use client'

import { useState } from 'react'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useImportRoutine } from '@/hooks/use-import-routine'
import { useTranslations } from 'next-intl'
import { Loader2, Key, Check, AlertTriangle, FileText, ArrowRight, Download } from 'lucide-react'
import { RoutineFormData, DayOfWeek, Exercise } from '@/types'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'
import { ExerciseSelect } from '@/components/exercises/exercise-select'
import { useRouter } from '@/i18n/routing'
import { ROUTES } from '@/lib/constants'

interface ImportRoutineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercises: Exercise[] // Pass local copy of exercises map for better UX if needed
  onSuccess?: () => void // Optional callback after successful import
}

export function ImportRoutineDialog({ open, onOpenChange, exercises, onSuccess }: ImportRoutineDialogProps) {
  const t = useTranslations('routines')
  const tCommon = useTranslations('common')
  const { user } = useAuthStore()
  const router = useRouter()
  
  const [step, setStep] = useState<1 | 2>(1)
  const [csvText, setCsvText] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [isImporting, setIsImporting] = useState(false)
  
  // Use hook directly with embedded fetch logic to keep component clean
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    if (!csvText.trim()) {
      toast.error(t('pleaseEnterCSV') || 'Please enter routine text')
      return
    }
    // if (!apiKey.trim()) {
    //   toast.error(t('pleaseEnterAPIKey') || 'Please enter OpenAI API Key')
    //   return
    // }

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/ai/analyze-routine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvText,
          apiKey: '', // API key handled on server side now
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze routine')
      }

      if (data.routine) {
        setAnalysisResult(data.routine)
        setStep(2)
      } else {
        toast.error('Could not parse routine structure')
      }
    } catch (error) {
      console.error('Error analyzing routine:', error)
      toast.error(error instanceof Error ? error.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSaveRoutine = async () => {
    if (!user || !analysisResult) return

    setIsImporting(true)
    try {
      // Group exercises by day
      const exercisesByDay: Record<string, any[]> = {}
      
      analysisResult.exercises.forEach((ex: any) => {
        if (!ex.exercise_id) return // Skip unmatched exercises
        
        const day = ex.day || 'Day 1'
        if (!exercisesByDay[day]) {
          exercisesByDay[day] = []
        }
        exercisesByDay[day].push(ex)
      })

      const days = Object.keys(exercisesByDay)
      
      if (days.length === 0) {
        toast.error('No valid exercises matched. Please select manually.')
        setIsImporting(false)
        return
      }

      let createdCount = 0

      // Map day name to DayOfWeek enum (handles "Monday", "monday", "Lunes", etc.)
      const dayNameToDayOfWeek: Record<string, DayOfWeek> = {
        monday: DayOfWeek.MONDAY, lunes: DayOfWeek.MONDAY,
        tuesday: DayOfWeek.TUESDAY, martes: DayOfWeek.TUESDAY,
        wednesday: DayOfWeek.WEDNESDAY, miércoles: DayOfWeek.WEDNESDAY, miercoles: DayOfWeek.WEDNESDAY,
        thursday: DayOfWeek.THURSDAY, jueves: DayOfWeek.THURSDAY,
        friday: DayOfWeek.FRIDAY, viernes: DayOfWeek.FRIDAY,
        saturday: DayOfWeek.SATURDAY, sábado: DayOfWeek.SATURDAY, sabado: DayOfWeek.SATURDAY,
        sunday: DayOfWeek.SUNDAY, domingo: DayOfWeek.SUNDAY,
      }

      // Create a routine for each day found
      for (const day of days) {
        const dayExercises = exercisesByDay[day]
        if (dayExercises.length === 0) continue

        // Construct RoutineFormData for this day
        const routineName = days.length > 1 
          ? `${analysisResult.name} - ${day}`
          : analysisResult.name

        // Map the day name to DayOfWeek
        const dayKey = day.toLowerCase().trim()
        const mappedDay = dayNameToDayOfWeek[dayKey]
        const scheduledDays: DayOfWeek[] = mappedDay ? [mappedDay] : []

        // Create Routine
        const newRoutineResult = await routineRepository.create({
          user_id: user.id,
          name: routineName,
          description: `Imported via AI on ${new Date().toLocaleDateString()} (${day})`,
          is_active: true,
          scheduled_days: scheduledDays,
          is_public: false,
        })

        if (newRoutineResult.error || !newRoutineResult.data) {
          console.error(`Failed to create routine for ${day}:`, newRoutineResult.error)
          continue
        }
        
        const routineId = newRoutineResult.data.id

        // Add Exercises
        let order = 1
        for (const ex of dayExercises) {
          // Parse rep ranges like "8-10" into target_reps (min) and target_reps_max (max)
          const repStr = String(ex.target_reps || 10)
          const repParts = repStr.split('-').map((s: string) => parseInt(s.trim(), 10))
          const targetRepsMin = repParts[0] || 10
          const targetRepsMax = repParts.length > 1 ? repParts[1] : undefined

          await routineRepository.addExercise({
              routine_id: routineId,
              exercise_id: ex.exercise_id,
              target_sets: parseInt(String(ex.target_sets || 3), 10),
              target_reps: targetRepsMin,
              target_reps_max: targetRepsMax,
              target_rest_time: parseInt(String(ex.target_rest_time || 60), 10),
              order: order++
          })
        }
        createdCount++
      }

      if (createdCount > 0) {
        toast.success(t('routineImported') || 'Routine(s) imported successfully!')
        onOpenChange(false)
        setStep(1)
        setCsvText('')
        setAnalysisResult(null)
        onSuccess?.() // Refresh routines list in parent
        router.push(ROUTES.ROUTINES)
      } else {
        throw new Error('No routines created')
      }

    } catch (error) {
      console.error('Error saving imported routine:', error)
      toast.error('Failed to save routine')
    } finally {
      setIsImporting(false)
    }
  }

  const updateMappedExercise = (index: number, exerciseId: string) => {
    const newExercises = [...analysisResult.exercises]
    newExercises[index].exercise_id = exerciseId
    // Update name for UI
    const exercise = exercises.find(e => e.id === exerciseId)
    if (exercise) {
        newExercises[index].matched_name = exercise.name
    }
    setAnalysisResult({ ...analysisResult, exercises: newExercises })
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <DrawerHeader>
          <DrawerTitle>{t('importRoutineFromAI') || 'Import Routine with AI'}</DrawerTitle>
          <DrawerDescription>
            {step === 1 
              ? (t('pasteRoutineCSV') || 'Paste your routine CSV text below. Provide your OpenAI API Key for analysis.')
              : (t('reviewImport') || 'Review the matched exercises before saving.')}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {step === 1 ? (
            <div className="space-y-4">
              {/* API Key field removed - using env var */}

              <div className="space-y-2">
                <Label htmlFor="csvText" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Routine CSV / Text
                </Label>
                <Textarea
                  id="csvText"
                  placeholder="Day,Exercise,Sets,Reps,Rest..."
                  className="min-h-[200px] font-mono text-xs"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                />
                <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                   <span>{t('csvFormatInfo') || 'Format: Day, Exercise, Sets, Reps, Rest'}</span>
                   <a 
                     href="/example-routine.csv" 
                     download 
                     className="flex items-center gap-1 hover:text-primary transition-colors hover:underline"
                    >
                      <Download className="h-3 w-3" />
                      {t('downloadExample') || 'Download Example'}
                   </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
               {analysisResult && (
                 <div className="space-y-4">
                    <div className="bg-accent/10 p-3 rounded-lg">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Routine Name</Label>
                        <Input 
                            value={analysisResult.name} 
                            onChange={(e) => setAnalysisResult({...analysisResult, name: e.target.value})}
                            className="mt-1 font-bold"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Exercises ({analysisResult.exercises.length})</Label>
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-3">
                                {analysisResult.exercises.map((ex: any, idx: number) => (
                                    <div key={idx} className="flex flex-col gap-2 p-3 rounded-lg border bg-background/50">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm">{ex.original_name}</span>
                                            <span className="text-xs text-muted-foreground bg-accent/10 px-2 py-0.5 rounded">
                                                {ex.day}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {ex.exercise_id ? (
                                                <div className="flex items-center gap-2 text-emerald-500 text-xs font-medium bg-emerald-500/10 px-2 py-1 rounded w-full">
                                                    <Check className="h-3 w-3" />
                                                    <span>Mapped to: {ex.matched_name || 'Unknown (ID found)'}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-amber-500 text-xs font-medium bg-amber-500/10 px-2 py-1 rounded w-full">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    <span>Not matched automatically</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <ExerciseSelect
                                                value={ex.exercise_id || ''}
                                                onChange={(id) => updateMappedExercise(idx, id)}
                                            />
                                        </div>
                                        
                                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                                            <span>Sets: {ex.target_sets}</span>
                                            <span>Reps: {ex.target_reps}</span>
                                            <span>Rest: {ex.target_rest_time}s</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                 </div>
               )}
            </div>
          )}
        </div>

        <DrawerFooter className="pt-4 border-t px-4 pb-8">
            {step === 1 ? (
                <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
                    {isAnalyzing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            Analyze with AI
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            ) : (
                <div className="flex gap-2 w-full">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                        Back
                    </Button>
                    <Button onClick={handleSaveRoutine} disabled={isImporting} className="flex-[2]">
                         {isImporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating Routine...
                            </>
                        ) : (
                            'Confirm Import'
                        )}
                    </Button>
                </div>
            )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
