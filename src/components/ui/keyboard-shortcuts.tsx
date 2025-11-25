/**
 * Keyboard Shortcuts Component
 * Provides global keyboard shortcuts (Ctrl+K for search, etc.)
 * Includes global search for workouts, exercises, and routines
 */

'use client'

import { useEffect, useState, useMemo } from 'react'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { useTranslations } from 'next-intl'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ROUTES } from '@/lib/constants'
import { Search, Home, CalendarDays, BookOpen, ListTodo, Wrench, User, Clock, Dumbbell } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useWorkoutStore } from '@/store/workout.store'
import { useExerciseStore } from '@/store/exercise.store'
import { routineRepository } from '@/domain/repositories/routine.repository'
import { Routine, Workout, Exercise } from '@/types'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useSearchDialog } from '@/hooks/use-search-dialog'

interface Shortcut {
  keys: string[]
  label: string
  action: () => void
  icon: React.ComponentType<{ className?: string }>
}

interface SearchResult {
  type: 'workout' | 'exercise' | 'routine'
  id: string
  title: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
}

export function KeyboardShortcuts() {
  const router = useNavigationRouter()
  const t = useTranslations('common')
  const tWorkouts = useTranslations('workouts')
  const tExercises = useTranslations('exercises')
  const tRoutines = useTranslations('routines')
  const { user } = useAuthStore()
  const { workouts, loadWorkouts } = useWorkoutStore()
  const { exercises, loadExercises } = useExerciseStore()
  const { isOpen, setIsOpen } = useSearchDialog()
  const [searchQuery, setSearchQuery] = useState('')
  const [routines, setRoutines] = useState<Routine[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)

  const shortcuts: Shortcut[] = [
    {
      keys: ['Ctrl', 'K'],
      label: t('search') || 'Search',
      action: () => setIsOpen(true),
      icon: Search,
    },
    {
      keys: ['Ctrl', 'H'],
      label: t('dashboard') || 'Dashboard',
      action: () => router.push(ROUTES.DASHBOARD),
      icon: Home,
    },
    {
      keys: ['Ctrl', 'W'],
      label: t('workouts') || 'Workouts',
      action: () => router.push(ROUTES.WORKOUTS),
      icon: CalendarDays,
    },
    {
      keys: ['Ctrl', 'E'],
      label: t('exercises') || 'Exercises',
      action: () => router.push(ROUTES.EXERCISES),
      icon: BookOpen,
    },
    {
      keys: ['Ctrl', 'R'],
      label: t('routines') || 'Routines',
      action: () => router.push(ROUTES.ROUTINES),
      icon: ListTodo,
    },
    {
      keys: ['Ctrl', 'T'],
      label: t('tools') || 'Tools',
      action: () => router.push(ROUTES.TOOLS),
      icon: Wrench,
    },
    {
      keys: ['Ctrl', 'P'],
      label: t('profile') || 'Profile',
      action: () => router.push(ROUTES.PROFILE),
      icon: User,
    },
  ]

  // Load data when dialog opens
  useEffect(() => {
    if (isOpen && user) {
      setIsLoadingData(true)
      Promise.all([
        loadWorkouts(user.id),
        loadExercises(),
        routineRepository.findByUserId(user.id).then(result => {
          if (result.data) {
            setRoutines(result.data)
          }
        }),
      ]).finally(() => {
        setIsLoadingData(false)
      })
    }
  }, [isOpen, user, loadWorkouts, loadExercises])

  // Filter search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return []
    }

    const query = searchQuery.toLowerCase().trim()
    const results: SearchResult[] = []

    // Search workouts
    workouts
      .filter(workout => {
        const name = (workout.routine_name || t('workout') || '').toLowerCase()
        const notes = (workout.notes || '').toLowerCase()
        return name.includes(query) || notes.includes(query)
      })
      .slice(0, 5)
      .forEach(workout => {
        results.push({
          type: 'workout',
          id: workout.id,
          title: workout.routine_name || t('workout') || 'Workout',
          subtitle: formatDate(workout.date, 'PP'),
          icon: CalendarDays,
          action: () => {
            router.push(ROUTES.WORKOUT_DETAIL(workout.id))
            setIsOpen(false)
            setSearchQuery('')
          },
        })
      })

    // Search exercises
    exercises
      .filter(exercise => {
        const name = (exercise.name || '').toLowerCase()
        const description = (exercise.description || '').toLowerCase()
        return name.includes(query) || description.includes(query)
      })
      .slice(0, 5)
      .forEach(exercise => {
        results.push({
          type: 'exercise',
          id: exercise.id,
          title: exercise.name,
          subtitle: exercise.muscle_group || exercise.type || '',
          icon: Dumbbell,
          action: () => {
            router.push(ROUTES.EXERCISES)
            setIsOpen(false)
            setSearchQuery('')
          },
        })
      })

    // Search routines
    routines
      .filter(routine => {
        const name = (routine.name || '').toLowerCase()
        const description = (routine.description || '').toLowerCase()
        return name.includes(query) || description.includes(query)
      })
      .slice(0, 5)
      .forEach(routine => {
        results.push({
          type: 'routine',
          id: routine.id,
          title: routine.name,
          subtitle: routine.description || '',
          icon: ListTodo,
          action: () => {
            router.push(ROUTES.ROUTINE_DETAIL(routine.id))
            setIsOpen(false)
            setSearchQuery('')
          },
        })
      })

    return results
  }, [searchQuery, workouts, exercises, routines, router, t])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }

      // Other shortcuts only work when not in input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Ctrl+H for home
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault()
        router.push(ROUTES.DASHBOARD)
      }

      // Ctrl+W for workouts
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault()
        router.push(ROUTES.WORKOUTS)
      }

      // Ctrl+E for exercises
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault()
        router.push(ROUTES.EXERCISES)
      }

      // Ctrl+R for routines
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault()
        router.push(ROUTES.ROUTINES)
      }

      // Ctrl+T for tools
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault()
        router.push(ROUTES.TOOLS)
      }

      // Ctrl+P for profile
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        router.push(ROUTES.PROFILE)
      }

      // Escape to close search
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router, isOpen])

  const handleShortcutClick = (shortcut: Shortcut) => {
    shortcut.action()
    if (shortcut.keys.includes('K')) {
      // Keep search open
    } else {
      setIsOpen(false)
    }
  }

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {
      workouts: [],
      exercises: [],
      routines: [],
    }

    searchResults.forEach(result => {
      if (result.type === 'workout') {
        groups.workouts.push(result)
      } else if (result.type === 'exercise') {
        groups.exercises.push(result)
      } else if (result.type === 'routine') {
        groups.routines.push(result)
      }
    })

    return groups
  }, [searchResults])

  const hasResults = searchResults.length > 0
  const showShortcuts = !searchQuery.trim()

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) {
          setSearchQuery('')
        }
      }}>
        <DialogContent className="sm:max-w-[600px] p-0">
          <DialogTitle className="sr-only">{t('shortcuts') || 'Keyboard Shortcuts'}</DialogTitle>
          <Command className="rounded-lg border-0">
            <CommandInput
              placeholder={t('search') || 'Search workouts, exercises, routines...'}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {isLoadingData && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {t('loading') || 'Loading...'}
                </div>
              )}
              {!isLoadingData && showShortcuts && (
                <>
                  <CommandGroup heading={t('shortcuts') || 'Shortcuts'}>
                    {shortcuts.map((shortcut, index) => {
                      const Icon = shortcut.icon
                      return (
                        <CommandItem
                          key={index}
                          onSelect={() => handleShortcutClick(shortcut)}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{shortcut.label}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, keyIndex) => (
                              <span key={keyIndex} className="flex items-center">
                                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                  {key}
                                </kbd>
                                {keyIndex < shortcut.keys.length - 1 && (
                                  <span className="text-muted-foreground mx-0.5">+</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </>
              )}
              {!isLoadingData && !showShortcuts && (
                <>
                  {hasResults ? (
                    <>
                      {groupedResults.workouts.length > 0 && (
                        <CommandGroup heading={tWorkouts('title') || 'Workouts'}>
                          {groupedResults.workouts.map((result) => {
                            const Icon = result.icon
                            return (
                              <CommandItem
                                key={`workout-${result.id}`}
                                onSelect={result.action}
                                className="flex items-center gap-2"
                              >
                                <Icon className="h-4 w-4" />
                                <div className="flex flex-col">
                                  <span>{result.title}</span>
                                  {result.subtitle && (
                                    <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                                  )}
                                </div>
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      )}
                      {groupedResults.exercises.length > 0 && (
                        <CommandGroup heading={tExercises('title') || 'Exercises'}>
                          {groupedResults.exercises.map((result) => {
                            const Icon = result.icon
                            return (
                              <CommandItem
                                key={`exercise-${result.id}`}
                                onSelect={result.action}
                                className="flex items-center gap-2"
                              >
                                <Icon className="h-4 w-4" />
                                <div className="flex flex-col">
                                  <span>{result.title}</span>
                                  {result.subtitle && (
                                    <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                                  )}
                                </div>
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      )}
                      {groupedResults.routines.length > 0 && (
                        <CommandGroup heading={tRoutines('title') || 'Routines'}>
                          {groupedResults.routines.map((result) => {
                            const Icon = result.icon
                            return (
                              <CommandItem
                                key={`routine-${result.id}`}
                                onSelect={result.action}
                                className="flex items-center gap-2"
                              >
                                <Icon className="h-4 w-4" />
                                <div className="flex flex-col">
                                  <span>{result.title}</span>
                                  {result.subtitle && (
                                    <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                                  )}
                                </div>
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      )}
                    </>
                  ) : (
                    <CommandEmpty>{t('noResults') || 'No results found'}</CommandEmpty>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  )
}
