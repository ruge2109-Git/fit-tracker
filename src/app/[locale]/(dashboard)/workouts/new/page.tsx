'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { toast } from 'sonner'
import { Sparkles, List, Search, X, Plus, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth.store'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { RoutineWithExercises } from '@/types'
import { ROUTES } from '@/lib/constants'
import { useTranslations } from 'next-intl'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default function NewWorkoutPage() {
  const router = useNavigationRouter()
  const { user } = useAuthStore()
  const t = useTranslations('workouts')
  const tRoutines = useTranslations('routines')
  const tCommon = useTranslations('common')
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>('')
  const [availableRoutines, setAvailableRoutines] = useState<RoutineWithExercises[]>([])
  const [isLoadingRoutines, setIsLoadingRoutines] = useState(false)
  const [routineSearch, setRoutineSearch] = useState('')

  const loadAvailableRoutines = useCallback(async () => {
    if (!user) return
    setIsLoadingRoutines(true)
    const result = await routineRepository.findByUserId(user.id)
    if (result.data) {
      setAvailableRoutines(result.data)
    } else if (result.error) {
      toast.error(tRoutines('failedToLoad') || 'Failed to load routines')
    }
    setIsLoadingRoutines(false)
  }, [user, tRoutines])

  useEffect(() => {
    if (user && availableRoutines.length === 0 && !isLoadingRoutines) {
      loadAvailableRoutines()
    }
  }, [user, availableRoutines.length, isLoadingRoutines, loadAvailableRoutines])

  const filteredRoutines = useMemo(() => {
    if (!routineSearch) return availableRoutines
    return availableRoutines.filter((routine) =>
      `${routine.name} ${routine.description || ''}`.toLowerCase().includes(routineSearch.toLowerCase()),
    )
  }, [availableRoutines, routineSearch])

  const handleStartFreeWorkout = () => {
    router.push(ROUTES.NEW_WORKOUT_FREE)
  }

  const handleSelectRoutine = (routineId: string) => {
    router.push(ROUTES.WORKOUT_FROM_ROUTINE(routineId))
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-1 duration-400 px-4 sm:px-0">
      
      {/* Header */}
      <div className="flex flex-col gap-1 px-1">
        <h1 className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary/60 italic">
          {t('newWorkout')}
        </h1>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-foreground/90">
           {t('chooseTemplate') || 'Select Workout Type'}
        </h2>
      </div>

       {/* Search and Filter */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input 
            placeholder={t('searchRoutinePlaceholder') || "Search routine..."}
            value={routineSearch}
            onChange={(e) => setRoutineSearch(e.target.value)}
            className="pl-9 h-11 rounded-2xl border-accent/10 bg-accent/5 focus:bg-background transition-all"
          />
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-11 rounded-2xl bg-accent/5 p-1 mb-6">
            <TabsTrigger 
              value="active" 
              className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-wider"
            >
              {tRoutines('active') || 'Active'}
            </TabsTrigger>
            <TabsTrigger 
              value="inactive" 
              className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-muted-foreground data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-wider"
            >
              {tRoutines('inactive') || 'Inactive'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-0">
             <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Free Workout Card - Always visible in Active tab */}
                <div 
                  onClick={() => router.push(ROUTES.WORKOUT_DETAIL('new'))}
                  className="group relative flex flex-col justify-between h-full min-h-[160px] p-6 rounded-[2rem] border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all cursor-pointer overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:scale-110 transition-transform duration-500">
                     <Sparkles className="h-24 w-24 text-primary/10 -rotate-12 translate-x-4 -translate-y-4" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-black uppercase italic tracking-tighter text-foreground group-hover:text-primary transition-colors">
                      {t('freeWorkout') || 'Free Workout'}
                    </h3>
                    <p className="text-xs font-medium text-muted-foreground mt-1 line-clamp-2 opacity-80">
                      {t('freeWorkoutDescription') || 'Start from scratch'}
                    </p>
                  </div>
                </div>

                {isLoadingRoutines ? (
                   Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-40 rounded-[2rem] bg-accent/5 animate-pulse" />
                   ))
                ) : filteredRoutines.filter(r => r.is_active).length > 0 ? (
                  filteredRoutines.filter(r => r.is_active).map((routine) => (
                    <div 
                      key={routine.id}
                      onClick={() => handleSelectRoutine(routine.id)}
                      className="group relative flex flex-col h-fit p-5 rounded-[2rem] border border-border/50 bg-card hover:bg-accent/5 hover:border-primary/50 transition-all cursor-pointer overflow-hidden hover:shadow-md hover:scale-[1.02]"
                    >
                       <div className="absolute top-0 right-0 p-5 opacity-0 group-hover:opacity-10 dark:group-hover:opacity-5 transition-opacity duration-500">
                          <Dumbbell className="h-20 w-20 text-foreground -rotate-12 translate-x-4 -translate-y-4" />
                       </div>

                       <div className="relative z-10">
                          <div className="flex justify-between items-start mb-4">
                              <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-background/50 backdrop-blur-sm text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                {routine.exercises?.length || 0} {t('exercises') || 'Exercises'}
                              </span>
                          </div>
                          
                          <h3 className="text-lg font-black uppercase italic tracking-tighter text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {routine.name}
                          </h3>
                          
                          {routine.description && (
                            <p className="text-xs font-medium text-muted-foreground mt-2 line-clamp-2 opacity-70 group-hover:opacity-100 transition-opacity">
                              {routine.description}
                            </p>
                          )}
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center opacity-60">
                    <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                       <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {routineSearch ? (t('noRoutinesMatchSearch') || 'No matching routines') : (t('noRoutines') || 'No active routines')}
                    </p>
                  </div>
                )}
             </div>
          </TabsContent>
          
          <TabsContent value="inactive" className="mt-0">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {isLoadingRoutines ? (
                   Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-40 rounded-[2rem] bg-accent/5 animate-pulse" />
                   ))
                ) : filteredRoutines.filter(r => !r.is_active).length > 0 ? (
                  filteredRoutines.filter(r => !r.is_active).map((routine) => (
                    <div 
                      key={routine.id}
                      onClick={() => handleSelectRoutine(routine.id)}
                      className="group relative flex flex-col h-fit p-5 rounded-[2rem] border border-border/50 bg-card hover:bg-accent/5 hover:border-primary/50 transition-all cursor-pointer overflow-hidden hover:shadow-md hover:scale-[1.02] opacity-70 hover:opacity-100"
                    >
                       <div className="relative z-10">
                          <div className="flex justify-between items-start mb-4">
                              <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-background/50 backdrop-blur-sm text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                {routine.exercises?.length || 0} {t('exercises') || 'Exercises'}
                              </span>
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-muted text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                                {tRoutines('inactive')}
                              </span>
                          </div>
                          
                          <h3 className="text-lg font-black uppercase italic tracking-tighter text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {routine.name}
                          </h3>
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center opacity-60">
                    <p className="text-sm font-medium text-muted-foreground">
                       {t('noRoutines') || 'No inactive routines'}
                    </p>
                  </div>
                )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
