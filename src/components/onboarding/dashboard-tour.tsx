/**
 * Mobile-first interactive product tour: dashboard highlights + bottom navigation.
 * Uses react-joyride v3 with theme-aligned styles and navigation to /dashboard when needed.
 */

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Joyride, EVENTS, type Controls, type EventData, type Step } from 'react-joyride'
import { useTranslations } from 'next-intl'
import { usePathname } from '@/i18n/routing'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { ROUTES } from '@/lib/constants'
import { useAuthStore } from '@/store/auth.store'
import { useIsMobileTourViewport } from '@/hooks/use-is-mobile-tour'
import { useProductTourStore } from '@/store/product-tour.store'
import {
  isProductTourMobileDone,
  setProductTourMobileDone,
} from '@/lib/tour/product-tour-storage'
import { logger } from '@/lib/logger'

export function DashboardTour() {
  const t = useTranslations('tour')
  const pathname = usePathname()
  const router = useNavigationRouter()
  const { user } = useAuthStore()
  const isMobile = useIsMobileTourViewport()
  const pendingTourStart = useProductTourStore((s) => s.pendingTourStart)
  const consumePendingTourStart = useProductTourStore((s) => s.consumePendingTourStart)

  const [run, setRun] = useState(false)
  const autoOfferedRef = useRef(false)
  const finishedRef = useRef(false)

  useEffect(() => {
    if (run) finishedRef.current = false
  }, [run])

  const ensureDashboard = useCallback(async () => {
    if (!pathname.includes('/dashboard')) {
      await router.push(ROUTES.DASHBOARD)
      await new Promise((r) => setTimeout(r, 480))
    }
  }, [pathname, router])

  const steps: Step[] = useMemo(
    () => [
      {
        target: '[data-tour="dashboard-welcome"]',
        title: t('stepWelcomeTitle'),
        content: t('stepWelcomeBody'),
        placement: 'bottom',
        before: ensureDashboard,
      },
      {
        target: '[data-tour="dashboard-stats"]',
        title: t('stepStatsTitle'),
        content: t('stepStatsBody'),
        placement: 'bottom',
      },
      {
        target: '[data-tour="dashboard-quick-actions"]',
        title: t('stepQuickActionsTitle'),
        content: t('stepQuickActionsBody'),
        placement: 'top',
      },
      {
        target: '[data-tour="dashboard-quick-start"]',
        title: t('stepQuickStartTitle'),
        content: t('stepQuickStartBody'),
        placement: 'top',
      },
      {
        target: '[data-tour="dashboard-streak"]',
        title: t('stepStreakTitle'),
        content: t('stepStreakBody'),
        placement: 'bottom',
      },
      {
        target: '[data-tour="dashboard-calendar"]',
        title: t('stepCalendarTitle'),
        content: t('stepCalendarBody'),
        placement: 'top',
      },
      {
        target: '[data-tour="dashboard-weekstrip"]',
        title: t('stepWeekstripTitle'),
        content: t('stepWeekstripBody'),
        placement: 'top',
      },
      {
        target: '[data-tour="nav-dashboard"]',
        title: t('navDashboardTitle'),
        content: t('navDashboardBody'),
        placement: 'top',
      },
      {
        target: '[data-tour="nav-workouts"]',
        title: t('navWorkoutsTitle'),
        content: t('navWorkoutsBody'),
        placement: 'top',
      },
      {
        target: '[data-tour="nav-routines"]',
        title: t('navRoutinesTitle'),
        content: t('navRoutinesBody'),
        placement: 'top',
      },
      {
        target: '[data-tour="nav-social"]',
        title: t('navSocialTitle'),
        content: t('navSocialBody'),
        placement: 'top',
      },
    ],
    [t, ensureDashboard]
  )

  const finishTour = useCallback((userId: string) => {
    if (finishedRef.current) return
    finishedRef.current = true
    setProductTourMobileDone(userId)
    setRun(false)
  }, [])

  const handleEvent = useCallback(
    (data: EventData, controls: Controls) => {
      if (data.type === EVENTS.TARGET_NOT_FOUND) {
        logger.warn('Product tour target not found, skipping tour', 'DashboardTour')
        controls.skip()
        return
      }

      if (data.type === EVENTS.TOUR_END && user?.id) {
        finishTour(user.id)
      }
    },
    [user?.id, finishTour]
  )

  useEffect(() => {
    if (!isMobile) {
      setRun(false)
    }
  }, [isMobile])

  useEffect(() => {
    autoOfferedRef.current = false
  }, [user?.id])

  useEffect(() => {
    if (!user?.id || !user.onboarding_completed_at) {
      setRun(false)
      return
    }

    if (isProductTourMobileDone(user.id)) {
      return
    }

    if (pendingTourStart && isMobile) {
      if (consumePendingTourStart()) {
        setRun(true)
      }
      return
    }

    if (!isMobile) {
      setRun(false)
      return
    }

    if (autoOfferedRef.current) return
    autoOfferedRef.current = true

    const timer = window.setTimeout(() => {
      setRun(true)
    }, 800)

    return () => window.clearTimeout(timer)
  }, [
    user?.id,
    user?.onboarding_completed_at,
    isMobile,
    consumePendingTourStart,
    pendingTourStart,
  ])

  if (!user?.id || !isMobile || isProductTourMobileDone(user.id)) {
    return null
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      locale={{
        back: t('joyrideBack'),
        close: t('joyrideClose'),
        last: t('joyrideLast'),
        next: t('joyrideNext'),
        skip: t('joyrideSkip'),
        // ICU treats {current}/{total} as variables; pass literals so Joyride can replace them.
        nextWithProgress: t('joyrideNextProgress', {
          current: '{current}',
          total: '{total}',
        }),
      }}
      options={{
        zIndex: 120,
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        spotlightPadding: 10,
        scrollOffset: 72,
        skipBeacon: true,
        buttons: ['back', 'skip', 'close', 'primary'],
        width: 'min(100vw - 2rem, 380px)',
        showProgress: true,
        targetWaitTimeout: 2800,
        spotlightRadius: 18,
        primaryColor: 'hsl(var(--primary))',
        textColor: 'hsl(var(--foreground))',
        backgroundColor: 'hsl(var(--card))',
        blockTargetInteraction: false,
        overlayClickAction: false,
      }}
      styles={{
        tooltip: {
          borderRadius: '1.25rem',
          border: '1px solid hsl(var(--border) / 0.7)',
          boxShadow:
            '0 25px 50px -12px hsl(0 0% 0% / 0.35), 0 0 0 1px hsl(var(--primary) / 0.12)',
          overflow: 'hidden',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: '1.05rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          padding: '1rem 1rem 0.35rem',
        },
        tooltipContent: {
          fontSize: '0.875rem',
          lineHeight: 1.5,
          padding: '0 1rem 0.75rem',
          opacity: 0.92,
        },
        tooltipFooter: {
          padding: '0.65rem 1rem 1rem',
          gap: '0.5rem',
        },
        buttonPrimary: {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          borderRadius: '0.75rem',
          fontWeight: 700,
          outline: 'none',
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
          borderRadius: '0.75rem',
          fontWeight: 600,
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
          fontWeight: 600,
        },
        buttonClose: {
          color: 'hsl(var(--muted-foreground))',
        },
        overlay: {
          mixBlendMode: 'normal',
        },
      }}
      onEvent={handleEvent}
    />
  )
}
