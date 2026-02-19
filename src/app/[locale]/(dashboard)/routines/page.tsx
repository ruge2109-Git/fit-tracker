/**
 * Routines Page
 * Manage workout routines
 */

'use client'

import { useEffect, useState } from 'react'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { Plus, BookOpen, Trash2, CheckSquare, Square, X, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/store/auth.store'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { useNotifications } from '@/hooks/use-notifications'
import { Routine } from '@/types'
import { ROUTES } from '@/lib/constants'
import { useTranslations } from 'next-intl'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'
import { RoutineCard } from './RoutineCard'
import { ImportRoutineDialog } from '@/components/routines/import-routine-dialog'
import { useExerciseStore } from '@/store/exercise.store'

export default function RoutinesPage() {
  const router = useNavigationRouter()
  const { user } = useAuthStore()
  const t = useTranslations('routines')
  const tCommon = useTranslations('common')
  const [routines, setRoutines] = useState<Routine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const { exercises, loadExercises } = useExerciseStore()

  // Multi-select state
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeletingSelected, setIsDeletingSelected] = useState(false)

  useEffect(() => {
    loadExercises()
  }, [loadExercises])

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

  const toggleSelectMode = () => {
    setIsSelectMode(prev => !prev)
    setSelectedIds(new Set())
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAll = (visibleRoutines: Routine[]) => {
    if (selectedIds.size === visibleRoutines.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(visibleRoutines.map(r => r.id)))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    const count = selectedIds.size
    if (!confirm(`¿Eliminar ${count} rutina${count !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`)) return

    setIsDeletingSelected(true)
    let deleted = 0
    for (const id of selectedIds) {
      const result = await routineRepository.delete(id)
      if (!result.error) deleted++
    }
    setIsDeletingSelected(false)
    setSelectedIds(new Set())
    setIsSelectMode(false)
    toast.success(`${deleted} rutina${deleted !== 1 ? 's' : ''} eliminada${deleted !== 1 ? 's' : ''} correctamente`)
    loadRoutines()
  }

  const renderRoutineGrid = (filteredRoutines: Routine[]) => {
    if (filteredRoutines.length === 0) return null

    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredRoutines.map((routine, index) => (
          <div
            key={routine.id}
            className="relative"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            {/* Selection Overlay */}
            {isSelectMode && (
              <button
                className={cn(
                  "absolute inset-0 z-10 rounded-2xl border-2 transition-all duration-150 flex items-start justify-end p-3",
                  selectedIds.has(routine.id)
                    ? "border-destructive bg-destructive/10"
                    : "border-transparent hover:border-accent/40"
                )}
                onClick={() => toggleSelect(routine.id)}
              >
                {selectedIds.has(routine.id) ? (
                  <CheckSquare className="h-5 w-5 text-destructive" />
                ) : (
                  <Square className="h-5 w-5 text-muted-foreground/40" />
                )}
              </button>
            )}
            <RoutineCard
              routine={routine}
              index={index}
              router={isSelectMode ? { push: () => {} } : router}
              t={t}
            />
          </div>
        ))}
      </div>
    )
  }

  const activeRoutines = routines.filter(r => r.is_active)
  const inactiveRoutines = routines.filter(r => !r.is_active)

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-1 duration-400 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary/60 italic mb-1">
            {t('title') || 'My Routines'}
          </h1>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-foreground/90">
            {t('manageYourRoutines') || 'Library'}
          </h2>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {!isSelectMode ? (
            <>
              <Button
                onClick={() => router.push(ROUTES.NEW_ROUTINE)}
                size="sm"
                className="flex-1 sm:flex-none h-10 rounded-xl font-bold uppercase tracking-wider text-[10px] bg-primary text-white shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all px-5"
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                {t('newRoutine')}
              </Button>
              <Button
                onClick={() => setIsImportDialogOpen(true)}
                size="sm"
                className="flex-1 sm:flex-none h-10 rounded-xl font-bold uppercase tracking-wider text-[10px] bg-accent/10 hover:bg-accent/20 text-foreground transition-all px-5"
              >
                <BookOpen className="h-3.5 w-3.5 mr-2" />
                {t('importRoutine') || 'Import'}
              </Button>
              {routines.length > 0 && (
                <Button
                  onClick={toggleSelectMode}
                  size="sm"
                  variant="ghost"
                  className="h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  title="Seleccionar para eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          ) : (
            // Selection mode toolbar
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
              <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                {selectedIds.size} seleccionada{selectedIds.size !== 1 ? 's' : ''}
              </span>
              <Button
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0 || isDeletingSelected}
                size="sm"
                className="h-9 rounded-xl font-bold uppercase tracking-wider text-[10px] bg-destructive text-white hover:bg-destructive/90 disabled:opacity-40 transition-all px-4"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                {isDeletingSelected ? 'Eliminando...' : 'Eliminar'}
              </Button>
              <Button
                onClick={toggleSelectMode}
                size="sm"
                variant="ghost"
                className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-accent/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <ImportRoutineDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        exercises={exercises}
        onSuccess={loadRoutines}
      />

      {/* Routines Grid */}
      {isLoading && routines.length === 0 ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-accent/5 animate-pulse border border-accent/5" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="active" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2 bg-accent/5 rounded-xl p-1 h-12">
              <TabsTrigger
                value="active"
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-bold uppercase tracking-wider text-xs h-10 transition-all"
              >
                {t('active') || 'Active'} ({activeRoutines.length})
              </TabsTrigger>
              <TabsTrigger
                value="inactive"
                className="rounded-lg data-[state=active]:bg-muted data-[state=active]:text-foreground font-bold uppercase tracking-wider text-xs h-10 transition-all"
              >
                {t('inactive') || 'Inactive'} ({inactiveRoutines.length})
              </TabsTrigger>
            </TabsList>

            {/* Select All button - only shown in select mode */}
            {isSelectMode && (
              <Tabs>
                {/* We render a per-tab select-all using inline logic below */}
              </Tabs>
            )}
          </div>

          <TabsContent value="active" className="mt-0">
            {isSelectMode && activeRoutines.length > 0 && (
              <button
                onClick={() => selectAll(activeRoutines)}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-3"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {selectedIds.size === activeRoutines.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
              </button>
            )}
            {activeRoutines.length === 0 ? (
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
              renderRoutineGrid(activeRoutines)
            )}
          </TabsContent>

          <TabsContent value="inactive" className="mt-0">
            {isSelectMode && inactiveRoutines.length > 0 && (
              <button
                onClick={() => selectAll(inactiveRoutines)}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-3"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {selectedIds.size === inactiveRoutines.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
              </button>
            )}
            {inactiveRoutines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 opacity-60">
                <BookOpen className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs font-medium text-muted-foreground">No inactive routines found</p>
              </div>
            ) : (
              renderRoutineGrid(inactiveRoutines)
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
