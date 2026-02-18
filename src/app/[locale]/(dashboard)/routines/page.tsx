/**
 * Routines Page
 * Manage workout routines
 */

'use client'

import { useEffect, useState } from 'react'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { Plus, BookOpen, Calendar, Clock, ChevronRight, Dumbbell, LayoutGrid, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/store/auth.store'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { useNotifications } from '@/hooks/use-notifications'
import { Routine } from '@/types'
import { ROUTES, ROUTINE_FREQUENCY_OPTIONS } from '@/lib/constants'
import { useTranslations } from 'next-intl'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'
import { RoutineCard } from './RoutineCard'

export default function RoutinesPage() {
  const router = useNavigationRouter()
  const { user } = useAuthStore()
  const t = useTranslations('routines')
  const tCommon = useTranslations('common')
  const [routines, setRoutines] = useState<Routine[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadRoutines()
    }
  }, [user])

  // Initialize notifications for active routines
  useNotifications(routines.filter(r => r.is_active))

  const loadRoutines = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const result = await routineRepository.findByUserId(user.id)
      if (result.data) {
        setRoutines(result.data)
      }
    } catch (error) {
      logger.error('Error loading routines', error as Error, 'RoutinesPage')
      toast.error(t('failedToLoad') || 'Failed to load routines')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-1 duration-400 px-4 sm:px-0">
      {/* Header - More Compact */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary/60 italic mb-1">
            {t('title') || 'My Routines'}
          </h1>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-foreground/90">
            {t('manageYourRoutines') || 'Library'}
          </h2>
        </div>
        <Button 
          onClick={() => router.push(ROUTES.NEW_ROUTINE)}
          size="sm"
          className="h-10 rounded-xl font-bold uppercase tracking-wider text-[10px] bg-primary text-white shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all px-6 w-full sm:w-auto"
        >
          <Plus className="h-3.5 w-3.5 mr-2" />
          {t('newRoutine')}
        </Button>
      </div>

      {/* Routines Grid - More Columns, Less Gap */}
      {/* Routines Grid - More Columns, Less Gap */}
      {isLoading && routines.length === 0 ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-accent/5 animate-pulse border border-accent/5" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="active" className="w-full">
            <div className="flex items-center mb-6">
                 <TabsList className="grid w-full max-w-[400px] grid-cols-2 bg-accent/5 rounded-xl p-1 h-12">
                    <TabsTrigger 
                        value="active"
                        className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-bold uppercase tracking-wider text-xs h-10 transition-all"
                    >
                        {t('active') || 'Active'} ({routines.filter(r => r.is_active).length})
                    </TabsTrigger>
                    <TabsTrigger 
                        value="inactive"
                        className="rounded-lg data-[state=active]:bg-muted data-[state=active]:text-foreground font-bold uppercase tracking-wider text-xs h-10 transition-all"
                    >
                        {t('inactive') || 'Inactive'} ({routines.filter(r => !r.is_active).length})
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="active" className="mt-0">
                {routines.filter(r => r.is_active).length === 0 ? (
                    <Card className="rounded-3xl border-none shadow-none bg-accent/5 overflow-hidden py-16">
                      <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <div className="max-w-xs">
                          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">
                            {t('noRoutines')}
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed italic font-medium">
                            "{t('createRoutinesDescription')}"
                          </p>
                        </div>
                        <Button 
                            onClick={() => router.push(ROUTES.NEW_ROUTINE)}
                            variant="outline"
                            className="h-10 rounded-xl font-bold uppercase tracking-widest text-[9px] border-accent/20 hover:bg-accent/10"
                        >
                          <Plus className="h-3 w-3 mr-2" />
                          {t('createFirst')}
                        </Button>
                      </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {routines.filter(r => r.is_active).map((routine, index) => (
                             <RoutineCard 
                                key={routine.id} 
                                routine={routine} 
                                index={index} 
                                router={router} 
                                t={t} 
                             />
                        ))}
                    </div>
                )}
            </TabsContent>
            
            <TabsContent value="inactive" className="mt-0">
                {routines.filter(r => !r.is_active).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 opacity-60">
                         <BookOpen className="h-8 w-8 text-muted-foreground/40 mb-2" />
                         <p className="text-xs font-medium text-muted-foreground">No inactive routines found</p>
                    </div>
                ) : (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {routines.filter(r => !r.is_active).map((routine, index) => (
                             <RoutineCard 
                                key={routine.id} 
                                routine={routine} 
                                index={index} 
                                router={router} 
                                t={t} 
                             />
                        ))}
                    </div>
                )}
            </TabsContent>
        </Tabs>
      )}

    </div>
  )
}

