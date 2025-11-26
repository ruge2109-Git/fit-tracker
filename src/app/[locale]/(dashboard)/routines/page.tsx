/**
 * Routines Page
 * Manage workout routines
 */

'use client'

import { useEffect, useState } from 'react'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { Plus, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth.store'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { useNotifications } from '@/hooks/use-notifications'
import { logAuditEvent } from '@/lib/audit/audit-helper'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { Routine, DayOfWeek, RoutineFrequency } from '@/types'
import { ROUTES } from '@/lib/constants'
import { useTranslations } from 'next-intl'
import { logger } from '@/lib/logger'

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
    
    // Don't block - show page immediately
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title') || 'My Routines'}</h1>
          <p className="text-muted-foreground">{t('subtitle') || 'Create and manage workout templates'}</p>
        </div>
        <Button onClick={() => router.push(ROUTES.NEW_ROUTINE)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('newRoutine') || 'New Routine'}
        </Button>
      </div>

      {/* Routines Grid */}
      {routines.length === 0 && isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-300">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : routines.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">{t('noRoutines') || 'No routines yet'}</p>
          <p className="text-sm text-muted-foreground mb-6">
            {t('createRoutinesDescription') || 'Create routines to quickly start workouts with predefined exercises'}
          </p>
          <Button onClick={() => router.push(ROUTES.NEW_ROUTINE)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('createFirst') || 'Create Your First Routine'}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {routines.map((routine) => (
            <Card key={routine.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{routine.name}</CardTitle>
                  {routine.is_active && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {tCommon('active') || 'Active'}
                    </span>
                  )}
                </div>
                {routine.description && (
                  <CardDescription>{routine.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push(`/routines/${routine.id}`)}
                >
                  {t('viewDetails') || 'View Details'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

