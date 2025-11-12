'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { TrendingUp, Calendar, Info } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'
import { statsService } from '@/domain/services/stats.service'
import { useAuthStore } from '@/store/auth.store'
import { ExerciseProgress } from '@/types'
import { useTranslations, useLocale } from 'next-intl'

interface ExerciseProgressDialogProps {
  exerciseId: string
  exerciseName: string
  children: React.ReactNode
}

interface WorkoutHistoryItem {
  date: string
  maxWeight: number
  sets: Array<{
    reps: number
    weight: number
    volume: number
  }>
  totalVolume: number
}

const ITEMS_PER_PAGE = 3

export function ExerciseProgressDialog({
  exerciseId,
  exerciseName,
  children,
}: ExerciseProgressDialogProps) {
  const { user } = useAuthStore()
  const t = useTranslations('workouts')
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [progress, setProgress] = useState<ExerciseProgress | null>(null)
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryItem[]>([])
  const [displayedHistory, setDisplayedHistory] = useState<WorkoutHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && user && exerciseId) {
      loadProgress()
    }
  }, [open, user, exerciseId])

  const loadProgress = async () => {
    if (!user) return

    setIsLoading(true)
    const result = await statsService.getExerciseProgress(user.id, exerciseId)

    if (result.data) {
      setProgress(result.data)
      
      const historyMap = new Map<string, WorkoutHistoryItem>()
      
      result.data.dates.forEach((date, index) => {
        const weight = result.data!.weights[index]
        const reps = result.data!.reps[index]
        const volume = weight * reps
        
        if (!historyMap.has(date)) {
          historyMap.set(date, {
            date,
            maxWeight: weight,
            sets: [],
            totalVolume: 0,
          })
        }
        
        const workout = historyMap.get(date)!
        workout.sets.push({ reps, weight, volume })
        workout.maxWeight = Math.max(workout.maxWeight, weight)
        workout.totalVolume += volume
      })
      
      const history = Array.from(historyMap.values()).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      
      setWorkoutHistory(history)
      
      if (history.length > ITEMS_PER_PAGE) {
        setDisplayedHistory(history.slice(0, ITEMS_PER_PAGE))
      } else {
        setDisplayedHistory(history)
      }
    }
    setIsLoading(false)
  }

  const loadMore = useCallback(() => {
    if (isLoadingMore || displayedHistory.length >= workoutHistory.length) return
    
    setIsLoadingMore(true)
    setTimeout(() => {
      const nextIndex = displayedHistory.length
      const nextItems = workoutHistory.slice(nextIndex, nextIndex + ITEMS_PER_PAGE)
      setDisplayedHistory([...displayedHistory, ...nextItems])
      setIsLoadingMore(false)
    }, 300)
  }, [displayedHistory, workoutHistory, isLoadingMore])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight
    
    if (scrollBottom < 100 && workoutHistory.length > displayedHistory.length) {
      loadMore()
    }
  }, [loadMore, workoutHistory.length, displayedHistory.length])

  const maxWeight = progress ? Math.max(...progress.weights) : 0

  const chartData = workoutHistory.map(workout => ({
    date: new Date(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    maxWeight: workout.maxWeight,
    dateKey: workout.date,
  })).reverse()

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {exerciseName} - {t('progress') || 'Progress'}
          </DialogTitle>
          <DialogDescription>
            {t('exerciseProgressDescription') || 'View your historical performance and progress'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : workoutHistory.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {t('noExerciseData') || 'No data available for this exercise yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-6 flex-1 flex flex-col overflow-hidden">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('weightProgression') || 'Weight Progression'}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      label={{ value: t('weightKg') || 'Weight (kg)', angle: -90, position: 'insideLeft' }}
                    />
                    <RechartsTooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Legend />
                    {maxWeight > 0 && (
                      <ReferenceLine 
                        y={maxWeight} 
                        stroke="hsl(var(--destructive))" 
                        strokeDasharray="5 5"
                        label={{ value: `${t('maxWeight') || 'Max'}: ${maxWeight}kg`, position: 'insideTopRight' }}
                      />
                    )}
                    <Line 
                      type="monotone" 
                      dataKey="maxWeight" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name={t('maxWeightPerWorkout') || 'Max Weight (kg)'}
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t('workoutHistory') || 'Workout History'}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('volumeExplanation') || 'Volume = Weight × Reps. It represents the total work done in each set.'}
                </p>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <div 
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                  className="h-full overflow-y-auto pr-2"
                >
                  <Accordion type="single" collapsible className="space-y-2">
                    {displayedHistory.map((workout) => {
                      const date = new Date(workout.date)
                      const formattedDate = date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                      
                      return (
                        <AccordionItem key={workout.date} value={workout.date} className="border rounded-lg">
                          <AccordionTrigger className="px-4">
                            <span className="text-left">
                              {formattedDate} ({workout.maxWeight.toFixed(1)} {t('kg') || 'kg'})
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>{t('set') || 'Set'}</TableHead>
                                    <TableHead>{t('reps') || 'Reps'}</TableHead>
                                    <TableHead>{t('weightKg') || 'Weight (kg)'}</TableHead>
                                    <TableHead>
                                      <div className="flex items-center gap-1">
                                        {t('volume') || 'Volume (kg)'}
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p className="max-w-xs">
                                                {t('volumeTooltip') || 'Volume = Weight × Reps. Total work done in this set.'}
                                              </p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </div>
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {workout.sets.map((set, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="font-medium">{index + 1}</TableCell>
                                      <TableCell>{set.reps}</TableCell>
                                      <TableCell>{set.weight.toFixed(1)}</TableCell>
                                      <TableCell>{set.volume.toFixed(1)}</TableCell>
                                    </TableRow>
                                  ))}
                                  <TableRow className="font-semibold bg-muted/50">
                                    <TableCell colSpan={2}>{t('total') || 'Total'}</TableCell>
                                    <TableCell>{workout.maxWeight.toFixed(1)}</TableCell>
                                    <TableCell>{workout.totalVolume.toFixed(1)}</TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                  
                  {isLoadingMore && (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  )}
                  
                  {displayedHistory.length >= workoutHistory.length && workoutHistory.length > ITEMS_PER_PAGE && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      {t('allWorkoutsLoaded') || 'All workouts loaded'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}

