'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useTranslations } from 'next-intl'
import { Moon } from 'lucide-react'
import { DayOfWeek } from '@/types'
import { userService } from '@/domain/services/user.service'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const ORDER: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
]

interface RestDaysSettingsProps {
  /** `workouts`: títulos desde namespace workouts; `profile` (default): desde profile */
  variant?: 'profile' | 'workouts'
}

export function RestDaysSettings({ variant = 'profile' }: RestDaysSettingsProps) {
  const tProfile = useTranslations('profile')
  const tWorkouts = useTranslations('workouts')
  const tRoutines = useTranslations('routines')
  const { user, loadUser } = useAuthStore()
  const [selected, setSelected] = useState<Set<DayOfWeek>>(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user?.rest_days?.length) {
      setSelected(new Set(user.rest_days))
    } else {
      setSelected(new Set())
    }
  }, [user?.rest_days])

  const dayLabel = (d: DayOfWeek) =>
    tRoutines(d as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')

  const toggle = async (day: DayOfWeek, checked: boolean) => {
    if (!user?.id) return
    const next = new Set(selected)
    if (checked) next.add(day)
    else next.delete(day)
    setSelected(next)

    setSaving(true)
    const rest_days = Array.from(next)
    const res = await userService.updateProfile(user.id, { rest_days })
    setSaving(false)
    if (res.error) {
      toast.error(res.error)
      loadUser()
      return
    }
    toast.success(tProfile('restDaysSaved'))
    loadUser()
  }

  const title =
    variant === 'workouts' ? tWorkouts('restDaysInWorkoutsTitle') : tProfile('restDaysTitle')
  const description =
    variant === 'workouts'
      ? tWorkouts('restDaysInWorkoutsDescription')
      : tProfile('restDaysDescription')
  const hint = tProfile('restDaysHint')
  const idPrefix = variant === 'workouts' ? 'workouts-rest' : 'profile-rest'

  return (
    <Card className="rounded-3xl border-none bg-accent/5 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2 uppercase tracking-tighter italic">
          <Moon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        <p className="text-[11px] font-medium text-muted-foreground leading-relaxed px-1">{hint}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ORDER.map((day) => {
            const id = `${idPrefix}-${day}`
            const isChecked = selected.has(day)
            return (
              <label
                key={day}
                htmlFor={id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-2xl border border-border/5 cursor-pointer transition-colors',
                  isChecked ? 'bg-primary/10 border-primary/20' : 'bg-background/40 hover:bg-background/60'
                )}
              >
                <Checkbox
                  id={id}
                  checked={isChecked}
                  disabled={saving}
                  onCheckedChange={(c) => toggle(day, c === true)}
                />
                <span className="text-sm font-bold">{dayLabel(day)}</span>
              </label>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
