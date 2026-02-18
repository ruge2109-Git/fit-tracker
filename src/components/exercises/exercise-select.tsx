/**
 * ExerciseSelect Component
 * Dropdown for selecting exercises
 */

'use client'

import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { Check, ChevronsUpDown, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { useExerciseStore } from '@/store/exercise.store'
import { useTranslations } from 'next-intl'
import { getMuscleGroupOptions } from '@/lib/constants'
import { CreateExerciseDialog } from './create-exercise-dialog'
import { useIsMobile } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

interface ExerciseSelectProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  onCreateExercise?: () => void
  showCreateInline?: boolean
}

export function ExerciseSelect({ 
  value, 
  onChange, 
  disabled, 
  onCreateExercise,
  showCreateInline = true
}: ExerciseSelectProps) {
  const t = useTranslations('exercises')
  const tCommon = useTranslations('common')
  const tMuscleGroups = useTranslations('muscleGroups')
  const { exercises, loadExercises, isLoading } = useExerciseStore()
  const [open, setOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const isMobile = useIsMobile()
  const listRef = useRef<HTMLDivElement>(null)
  
  const muscleGroupOptions = getMuscleGroupOptions(tMuscleGroups)

  useEffect(() => {
    loadExercises()
  }, [loadExercises])

  const selectedExercise = useMemo(
    () => exercises.find((exercise) => exercise.id === value),
    [exercises, value],
  )

  const getMuscleLabel = useCallback((muscle: string) => {
    return muscleGroupOptions.find((option) => option.value === muscle)?.label ?? muscle
  }, [muscleGroupOptions])

  const handleSelect = useCallback((exerciseId: string) => {
    onChange(exerciseId)
    setOpen(false)
  }, [onChange])

  const handleCreateClick = useCallback(() => {
    setOpen(false)
    if (showCreateInline) {
      setIsCreateDialogOpen(true)
    } else if (onCreateExercise) {
      onCreateExercise()
    }
  }, [onCreateExercise, showCreateInline])

  const triggerDisabled = disabled || isLoading

  const TriggerButton = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className={cn(
        "w-full justify-between rounded-xl h-10 border-accent/10 bg-background/40 hover:bg-background/60 transition-all",
        !selectedExercise && "text-muted-foreground/50 font-normal"
      )}
      disabled={triggerDisabled}
    >
      {selectedExercise ? (
        <span className="flex items-center gap-2 text-left truncate">
          <span className="font-bold text-sm truncate">{selectedExercise.name}</span>
          <span className="text-[10px] text-primary/60 font-medium whitespace-nowrap">
            {getMuscleLabel(selectedExercise.muscle_group)}
          </span>
        </span>
      ) : (
        <span className="text-sm">{t('selectExercise')}</span>
      )}
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-30" />
    </Button>
  )

  const Content = (
    <Command className="rounded-t-[2.5rem] border-none bg-background h-full" data-vaul-no-drag>
      <CommandInput 
        placeholder={t('searchExercises') || 'Search exercises...'} 
        className="h-12 text-base"
      />
      <div className="px-2 pt-2">
        {(showCreateInline || onCreateExercise) && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleCreateClick}
            className="w-full justify-start rounded-xl h-10 px-3 text-primary font-bold text-xs bg-primary/5 hover:bg-primary/10 transition-colors border border-primary/10 mb-2"
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            {t('createNewExercise') || 'Create New Exercise'}
          </Button>
        )}
      </div>

      <CommandList
        className="max-h-[60vh] md:max-h-[400px] p-2 pt-0"
      >
        <CommandEmpty className="py-8 text-xs text-center text-muted-foreground/60 italic">
          {t('noExercises') || 'No exercises found'}
        </CommandEmpty>

        <CommandGroup heading={t('allExercises') || 'All Exercises'} className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30 px-3 py-2">
          {isLoading ? (
            <CommandItem disabled className="px-3 py-8 text-xs justify-center text-muted-foreground animate-pulse">
              {tCommon('loading')}
            </CommandItem>
          ) : (
            exercises.map((exercise) => (
              <CommandItem
                key={exercise.id}
                value={`${exercise.name} ${exercise.muscle_group}`}
                onSelect={() => handleSelect(exercise.id)}
                className="rounded-xl h-11 px-3 flex items-center justify-between group cursor-pointer aria-selected:bg-accent/10 transition-colors mb-0.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "h-2 w-2 rounded-full transition-all shrink-0",
                    value === exercise.id ? "bg-primary" : "bg-accent/20 group-hover:bg-accent/40"
                  )} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold truncate group-aria-selected:text-primary transition-colors">{exercise.name}</span>
                    <span className="text-[9px] text-muted-foreground/60 font-medium uppercase tracking-tight">
                      {getMuscleLabel(exercise.muscle_group)}
                    </span>
                  </div>
                </div>
                {value === exercise.id && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </CommandItem>
            ))
          )}
        </CommandGroup>
      </CommandList>
    </Command>
  )

  return (
    <>
      {isMobile ? (
        <Drawer open={open && !triggerDisabled} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            {TriggerButton}
          </DrawerTrigger>
          <DrawerContent className="rounded-t-[2.5rem] p-0 border-none bg-background shadow-2xl">
            <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-accent/20" />
            <DrawerHeader className="pt-6 px-6">
              <DrawerTitle className="text-xl font-black uppercase italic tracking-tighter text-center">
                {t('selectExercise')}
              </DrawerTitle>
              <p className="sr-only">Search and select an exercise from the list</p>
            </DrawerHeader>
            <div className="pb-8">
              {Content}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover open={open && !triggerDisabled} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            {TriggerButton}
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] min-w-[300px] p-0 rounded-2xl border-accent/10 shadow-2xl"
            align="start"
          >
            {Content}
          </PopoverContent>
        </Popover>
      )}

      {showCreateInline && (
        <CreateExerciseDialog 
          open={isCreateDialogOpen} 
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={(exerciseId) => {
            onChange(exerciseId)
          }}
        />
      )}
    </>
  )
}

