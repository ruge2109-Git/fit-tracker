/**
 * First-time guided onboarding (modal steps). Completion persisted in public.users.onboarding_completed_at.
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth.store'
import { userService } from '@/domain/services/user.service'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { ROUTES } from '@/lib/constants'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import {
  Activity,
  Bell,
  BookOpen,
  CalendarDays,
  Dumbbell,
  Home,
  ListTodo,
  Sparkles,
  User,
} from 'lucide-react'
import { requestNotificationPermissionAndPushSubscription } from '@/lib/notifications/notification-push-setup'
import { cn } from '@/lib/utils'
import { useProductTourStore } from '@/store/product-tour.store'

const STEP_COUNT = 4

export function OnboardingWizard() {
  const t = useTranslations('onboarding')
  const tNotif = useTranslations('notifications')
  const router = useNavigationRouter()
  const { user, loadUser } = useAuthStore()
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)

  const needsOnboarding = Boolean(user && !user.onboarding_completed_at)

  useEffect(() => {
    if (needsOnboarding) setStep(0)
  }, [needsOnboarding])

  const completeOnboarding = useCallback(async (): Promise<boolean> => {
    if (!user || isSubmitting) return false
    setIsSubmitting(true)
    try {
      const result = await userService.updateProfile(user.id, {
        onboarding_completed_at: new Date().toISOString(),
      })
      if (result.error) {
        toast.error(t('saveError'))
        return false
      }
      await loadUser()
      useProductTourStore.getState().requestTourStart()
      return true
    } finally {
      setIsSubmitting(false)
    }
  }, [user, isSubmitting, loadUser, t])

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      void completeOnboarding()
    }
  }

  const goNext = () => {
    if (step < STEP_COUNT - 1) setStep((s) => s + 1)
    else void completeOnboarding()
  }

  const finishAndGo = async (href: string) => {
    const ok = await completeOnboarding()
    if (ok) router.push(href)
  }

  const handleEnableNotifications = async () => {
    setNotifLoading(true)
    try {
      const { granted, pushSubscribed } = await requestNotificationPermissionAndPushSubscription()
      if (granted) {
        toast.success(tNotif('enabledSuccess'))
        if (pushSubscribed) toast.success(tNotif('pushEnabled'))
      } else {
        toast.error(tNotif('permissionDenied'))
      }
    } finally {
      setNotifLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={needsOnboarding} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          // Mobile-first: pantalla completa, tipografía y toques táctiles priorizados
          'fixed inset-0 left-0 top-0 z-[101] flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0',
          'translate-x-0 translate-y-0 rounded-none border-0 bg-background p-0 shadow-none',
          'overflow-hidden',
          // Escritorio: tarjeta centrada clásica
          'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[min(90vh,calc(100dvh-2rem))] sm:w-[calc(100%-2rem)] sm:max-w-lg',
          'sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:border-border sm:bg-card sm:p-0 sm:shadow-2xl'
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Cabecera: espacio para el botón cerrar (absolute del Dialog) + safe area superior */}
          <DialogHeader className="shrink-0 space-y-3 px-5 pb-3 pt-14 text-center sm:space-y-2 sm:px-6 sm:pb-4 sm:pt-6">
            <div className="flex items-center justify-center">
              {step === 0 && <Sparkles className="h-12 w-12 text-violet-500 sm:h-10 sm:w-10" />}
              {step === 1 && <Dumbbell className="h-12 w-12 text-primary sm:h-10 sm:w-10" />}
              {step === 2 && <Bell className="h-12 w-12 text-amber-500 sm:h-10 sm:w-10" />}
              {step === 3 && <Activity className="h-12 w-12 text-green-500 sm:h-10 sm:w-10" />}
            </div>
            <DialogTitle className="text-balance px-1 text-2xl font-black leading-tight tracking-tight sm:text-xl">
              {step === 0 && t('step0Title')}
              {step === 1 && t('step1Title')}
              {step === 2 && t('step2Title')}
              {step === 3 && t('step3Title')}
            </DialogTitle>
            <DialogDescription className="text-balance px-0.5 text-base leading-relaxed sm:text-sm">
              {step === 0 && t('step0Description')}
              {step === 1 && t('step1Description')}
              {step === 2 && t('step2Description')}
              {step === 3 && t('step3Description')}
            </DialogDescription>
          </DialogHeader>

          {/* Cuerpo con scroll solo en el centro (listas largas en paso 1) */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 sm:px-6">
            {step === 1 && (
              <ul className="grid gap-3 text-[15px] leading-snug text-muted-foreground sm:text-sm">
                <li className="flex items-start gap-3.5 rounded-2xl border bg-muted/40 p-4 active:bg-muted/60 sm:rounded-xl sm:p-3">
                  <Home className="mt-0.5 h-6 w-6 shrink-0 text-primary sm:h-5 sm:w-5" />
                  <span>{t('step1Dashboard')}</span>
                </li>
                <li className="flex items-start gap-3.5 rounded-2xl border bg-muted/40 p-4 active:bg-muted/60 sm:rounded-xl sm:p-3">
                  <CalendarDays className="mt-0.5 h-6 w-6 shrink-0 text-primary sm:h-5 sm:w-5" />
                  <span>{t('step1Workouts')}</span>
                </li>
                <li className="flex items-start gap-3.5 rounded-2xl border bg-muted/40 p-4 active:bg-muted/60 sm:rounded-xl sm:p-3">
                  <ListTodo className="mt-0.5 h-6 w-6 shrink-0 text-primary sm:h-5 sm:w-5" />
                  <span>{t('step1Routines')}</span>
                </li>
                <li className="flex items-start gap-3.5 rounded-2xl border bg-muted/40 p-4 active:bg-muted/60 sm:rounded-xl sm:p-3">
                  <BookOpen className="mt-0.5 h-6 w-6 shrink-0 text-primary sm:h-5 sm:w-5" />
                  <span>{t('step1Exercises')}</span>
                </li>
                <li className="flex items-start gap-3.5 rounded-2xl border bg-muted/40 p-4 active:bg-muted/60 sm:rounded-xl sm:p-3">
                  <User className="mt-0.5 h-6 w-6 shrink-0 text-primary sm:h-5 sm:w-5" />
                  <span>{t('step1Profile')}</span>
                </li>
              </ul>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="default"
                  className="h-12 w-full rounded-2xl text-base font-semibold sm:h-10 sm:rounded-md sm:text-sm"
                  disabled={notifLoading}
                  onClick={() => void handleEnableNotifications()}
                >
                  <Bell className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                  {t('step2EnableButton')}
                </Button>
                <p className="text-center text-sm text-muted-foreground sm:text-xs">{t('step2SkipHint')}</p>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  variant="default"
                  className="h-12 w-full rounded-2xl text-base font-semibold sm:h-10 sm:rounded-md sm:text-sm"
                  disabled={isSubmitting}
                  onClick={() => void finishAndGo(ROUTES.NEW_ROUTINE)}
                >
                  {t('step3CtaRoutine')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full rounded-2xl text-base font-semibold sm:h-10 sm:rounded-md sm:text-sm"
                  disabled={isSubmitting}
                  onClick={() => void finishAndGo(ROUTES.NEW_WORKOUT_FREE)}
                >
                  {t('step3CtaWorkout')}
                </Button>
              </div>
            )}

            {/* Indicador de pasos: más visible en móvil */}
            <div
              className={cn(
                'flex justify-center gap-2 sm:gap-1.5',
                step === 0 ? 'py-8 sm:py-3' : 'py-4 sm:py-3'
              )}
            >
              {Array.from({ length: STEP_COUNT }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-2 w-8 rounded-full transition-colors sm:h-1.5 sm:w-6',
                    i === step ? 'bg-primary' : 'bg-muted'
                  )}
                  aria-hidden
                />
              ))}
            </div>
          </div>

          {/* Pie fijo: acciones principales al borde inferior (área segura home indicator) */}
          <DialogFooter
            className={cn(
              'shrink-0 flex-col gap-3 border-t border-border bg-background/95 px-5 py-4 backdrop-blur-sm',
              'pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4',
              'sm:flex-row sm:justify-between sm:gap-2 sm:space-x-0'
            )}
          >
            <Button
              type="button"
              variant="ghost"
              className="order-2 h-11 w-full text-base sm:order-1 sm:h-9 sm:w-auto sm:text-sm"
              disabled={isSubmitting}
              onClick={() => void completeOnboarding()}
            >
              {t('skip')}
            </Button>
            <div className="order-1 flex w-full gap-3 sm:order-2 sm:w-auto sm:justify-end sm:gap-2">
              {step > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 min-w-[5.5rem] flex-1 rounded-2xl text-base font-semibold sm:h-9 sm:min-w-0 sm:flex-initial sm:rounded-md sm:text-sm"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={isSubmitting}
                >
                  {t('back')}
                </Button>
              )}
              <Button
                type="button"
                className="h-12 min-w-[5.5rem] flex-1 rounded-2xl text-base font-semibold sm:h-9 sm:min-w-0 sm:flex-initial sm:rounded-md sm:text-sm"
                onClick={() => (step === STEP_COUNT - 1 ? void completeOnboarding() : goNext())}
                disabled={isSubmitting}
              >
                {step === STEP_COUNT - 1 ? t('finish') : t('next')}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
