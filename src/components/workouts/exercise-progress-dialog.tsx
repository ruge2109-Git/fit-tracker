'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { TrendingUp, Calendar, Info } from 'lucide-react'
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
      <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground>
        <DrawerTrigger asChild>
          {children}
        </DrawerTrigger>
        <DrawerContent className="max-h-[90vh]">
          <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-muted/20" />
          <DrawerHeader className="px-6 pb-2">
            <DrawerTitle className="flex items-center gap-2 text-xl font-black uppercase italic tracking-tighter">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="truncate">{exerciseName}</span>
            </DrawerTitle>
            <DrawerDescription className="text-sm font-medium opacity-60">
              {t('exerciseProgressDescription') || 'View your historical performance and progress'}
            </DrawerDescription>
          </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-8">
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
            <div className="space-y-6 py-4">
            <Card className="rounded-[1.5rem] bg-accent/5 border-none shadow-sm">
              <CardHeader className="p-4 sm:p-6 pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider opacity-70">{t('weightProgression') || 'Weight Progression'}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      className="text-[10px] font-bold uppercase"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      className="text-[10px] font-bold"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                      width={30}
                    />
                    <RechartsTooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                      itemStyle={{ padding: 0 }}
                    />
                    {maxWeight > 0 && (
                      <ReferenceLine 
                        y={maxWeight} 
                        stroke="hsl(var(--primary))" 
                        strokeDasharray="4 4"
                        strokeOpacity={0.5}
                      />
                    )}
                    <Line 
                      type="monotone" 
                      dataKey="maxWeight" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--background))', stroke: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.5rem] bg-accent/5 border-none shadow-sm">
              <CardHeader className="p-4 sm:p-6 pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider opacity-70 flex items-center gap-2">
                  {t('workoutHistory') || 'Workout History'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div 
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                  className="max-h-[400px] overflow-y-auto pr-2"
                >
                  <Accordion type="single" collapsible className="space-y-3">
                    {displayedHistory.map((workout) => {
                      const date = new Date(workout.date)
                      const formattedDate = date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                      
                      return (
                        <AccordionItem key={workout.date} value={workout.date} className="border-none bg-background/50 rounded-xl px-0 overflow-hidden">
                          <AccordionTrigger className="px-4 py-3 hover:no-underline group">
                            <div className="flex items-center justify-between w-full pr-2">
                                <span className="text-sm font-bold uppercase tracking-tight text-muted-foreground group-data-[state=open]:text-primary transition-colors">
                                {formattedDate}
                                </span>
                                <span className="font-black text-sm">
                                    {workout.maxWeight.toFixed(1)} <span className="text-[10px] text-muted-foreground font-bold uppercase">{t('kg') || 'kg'}</span>
                                </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4 pt-0">
                            <div className="mt-2 space-y-2">
                                <div className="grid grid-cols-4 text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60 mb-2 px-2">
                                    <div className="text-center">#</div>
                                    <div className="text-center">{t('reps') || 'Reps'}</div>
                                    <div className="text-center">{t('kg') || 'Kg'}</div>
                                    <div className="text-right">{t('volume') || 'Vol'}</div>
                                </div>
                                {workout.sets.map((set, index) => (
                                    <div key={index} className="grid grid-cols-4 text-xs font-bold items-center bg-background/40 rounded-lg py-2 px-2">
                                        <div className="text-center text-muted-foreground">{index + 1}</div>
                                        <div className="text-center">{set.reps}</div>
                                        <div className="text-center">{set.weight.toFixed(1)}</div>
                                        <div className="text-right text-muted-foreground">{set.volume.toFixed(0)}</div>
                                    </div>
                                ))}
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
                    <div className="text-center py-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                      {t('allWorkoutsLoaded') || 'All workouts loaded'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            </div>
          )}
        </div>
        </DrawerContent>
      </Drawer>
    </TooltipProvider>
  )
}

