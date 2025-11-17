/**
 * ExerciseSelect Component
 * Dropdown for selecting exercises
 */

'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useExerciseStore } from '@/store/exercise.store'
import { useTranslations } from 'next-intl'
import { getMuscleGroupOptions } from '@/lib/constants'

interface ExerciseSelectProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  onCreateExercise?: () => void
}

export function ExerciseSelect({ value, onChange, disabled, onCreateExercise }: ExerciseSelectProps) {
  const t = useTranslations('exercises')
  const tCommon = useTranslations('common')
  const tMuscleGroups = useTranslations('muscleGroups')
  const { exercises, loadExercises, isLoading } = useExerciseStore()
  const [open, setOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  
  const muscleGroupOptions = getMuscleGroupOptions(tMuscleGroups)

  useEffect(() => {
    loadExercises()
  }, [loadExercises])

  const selectedExercise = useMemo(
    () => exercises.find((exercise) => exercise.id === value),
    [exercises, value],
  )

  const getMuscleLabel = (muscle: string) => {
    return muscleGroupOptions.find((option) => option.value === muscle)?.label ?? muscle
  }

  const handleSelect = (exerciseId: string) => {
    onChange(exerciseId)
    setOpen(false)
  }

  const handleCreateClick = () => {
    setOpen(false)
    if (onCreateExercise) {
      onCreateExercise()
    }
  }

  const triggerDisabled = disabled || isLoading

  return (
    <Popover open={open && !triggerDisabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={triggerDisabled}
        >
          {selectedExercise ? (
            <span className="flex flex-col items-start text-left">
              <span className="font-medium leading-tight">{selectedExercise.name}</span>
              <span className="text-xs text-muted-foreground">
                {getMuscleLabel(selectedExercise.muscle_group)}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">{t('selectExercise')}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[240px] max-w-full p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={t('searchExercises') || 'Search exercises...'} />
          <CommandList
            ref={listRef}
            className="max-h-[336px]"
          >
            <CommandEmpty>{t('noExercises') || 'No exercises found'}</CommandEmpty>
            <CommandGroup heading={t('allExercises') || 'All Exercises'}>
              {isLoading && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  {tCommon('loading')}
                </div>
              )}
              {!isLoading &&
                exercises.map((exercise) => (
                  <CommandItem
                    key={exercise.id}
                    value={`${exercise.name} ${exercise.muscle_group}`}
                    onSelect={() => handleSelect(exercise.id)}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium leading-tight">{exercise.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {getMuscleLabel(exercise.muscle_group)}
                      </span>
                    </div>
                    <Check
                      className={`ml-auto h-4 w-4 ${
                        value === exercise.id ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </CommandItem>
                ))}
            </CommandGroup>
            {onCreateExercise && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleCreateClick}
                    className="text-primary font-medium"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('createNewExercise') || 'Create New Exercise'}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

