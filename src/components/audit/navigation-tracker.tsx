/**
 * Navigation Tracker
 * Logs every page navigation, session lifecycle, and PWA launch to the audit log.
 * Placed in the dashboard layout so it captures all authenticated navigation.
 */

'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from '@/i18n/routing'
import { useAuthStore } from '@/store/auth.store'
import { logAuditEvent } from '@/lib/audit/audit-helper'

export function NavigationTracker() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const previousPathRef = useRef<string | null>(null)
  const sessionStartRef = useRef<number>(Date.now())
  const hasLoggedSessionRef = useRef(false)

  // ─── PWA Launch Detection ────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || hasLoggedSessionRef.current) return
    hasLoggedSessionRef.current = true

    const isPWA = typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
       (window.navigator as any).standalone === true)

    const referrer = typeof document !== 'undefined' ? document.referrer : ''
    const connectionType = typeof navigator !== 'undefined' && 'connection' in navigator
      ? (navigator as any).connection?.effectiveType || 'unknown'
      : 'unknown'

    // Log PWA-specific launch event
    if (isPWA) {
      logAuditEvent({
        action: 'pwa_launch',
        entityType: 'navigation',
        details: {
          timestamp: new Date().toISOString(),
          screen_width: window.innerWidth,
          screen_height: window.innerHeight,
          language: navigator.language,
          connection_type: connectionType,
          online: navigator.onLine,
          platform: navigator.platform,
        },
      })
    }

    // Always log session_start (for both browser and PWA)
    logAuditEvent({
      action: 'session_start',
      entityType: 'navigation',
      details: {
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        language: navigator.language,
        is_pwa: isPWA,
        screen_width: window.innerWidth,
        screen_height: window.innerHeight,
        online: navigator.onLine,
        referrer: referrer || null,
        connection_type: connectionType,
        platform: navigator.platform,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    })

    // Log session_end on unload using sendBeacon for reliable delivery
    const handleUnload = () => {
      const data = JSON.stringify({
        action: 'session_end',
        entityType: 'navigation',
        details: {
          timestamp: new Date().toISOString(),
          session_duration_seconds: Math.round((Date.now() - sessionStartRef.current) / 1000),
          last_path: previousPathRef.current,
          pages_visited: pageCountRef.current,
        },
      })
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/audit', data)
      }
    }

    // Log when user goes offline/online
    const handleOnline = () => {
      logAuditEvent({
        action: 'connectivity_change',
        entityType: 'navigation',
        details: { status: 'online', timestamp: new Date().toISOString() },
      })
    }

    const handleOffline = () => {
      logAuditEvent({
        action: 'connectivity_change',
        entityType: 'navigation',
        details: { status: 'offline', timestamp: new Date().toISOString() },
      })
    }

    // Log visibility changes (tab focus/blur, PWA background/foreground)
    const handleVisibility = () => {
      logAuditEvent({
        action: document.visibilityState === 'visible' ? 'app_foreground' : 'app_background',
        entityType: 'navigation',
        details: {
          timestamp: new Date().toISOString(),
          current_path: previousPathRef.current,
        },
      })
    }

    window.addEventListener('beforeunload', handleUnload)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('beforeunload', handleUnload)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [user?.id])

  // ─── Page View Tracking ──────────────────────────────────────────────────
  const pageCountRef = useRef<number>(0)

  useEffect(() => {
    if (!user?.id || !pathname) return

    // Skip duplicate path logs (re-renders)
    if (previousPathRef.current === pathname) return

    const timeOnPreviousPage = previousPathRef.current
      ? Math.round((Date.now() - sessionStartRef.current) / 1000)
      : 0

    pageCountRef.current += 1

    logAuditEvent({
      action: 'page_view',
      entityType: 'navigation',
      details: {
        path: pathname,
        previous_path: previousPathRef.current || null,
        time_on_previous_page_seconds: timeOnPreviousPage,
        page_number: pageCountRef.current,
        timestamp: new Date().toISOString(),
      },
    })

    previousPathRef.current = pathname
    sessionStartRef.current = Date.now()
  }, [pathname, user?.id])

  return null // This component only produces side effects
}
