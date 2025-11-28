/**
 * Hook to detect navigation start and show loading state
 * Detects when navigation begins before pathname changes
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from '@/i18n/routing'

// Global state to track navigation across components
let navigationState = {
  isNavigating: false,
  startTime: 0,
}

// Event listeners for navigation detection
const navigationListeners = new Set<(isNavigating: boolean) => void>()

export function setNavigationLoading(isNavigating: boolean) {
  navigationState.isNavigating = isNavigating
  if (isNavigating) {
    navigationState.startTime = Date.now()
  }
  navigationListeners.forEach(listener => listener(isNavigating))
}

export function useNavigationLoading() {
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)
  const prevPathnameRef = useRef(pathname)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Subscribe to navigation state changes
    const handleNavigationChange = (isNav: boolean) => {
      setIsNavigating(isNav)
    }

    navigationListeners.add(handleNavigationChange)
    setIsNavigating(navigationState.isNavigating)

    // If we're mounted and pathname matches current location, clear any stuck loading
    if (typeof window !== 'undefined' && navigationState.isNavigating) {
      const currentPath = window.location.pathname
      // Normalize paths for comparison (remove trailing slashes)
      const normalizedPathname = pathname.replace(/\/$/, '') || '/'
      const normalizedCurrentPath = currentPath.replace(/\/$/, '') || '/'
      
      if (normalizedPathname === normalizedCurrentPath) {
        // Pathname matches, navigation should be complete
        setNavigationLoading(false)
      }
    }

    return () => {
      navigationListeners.delete(handleNavigationChange)
    }
  }, [pathname])

  useEffect(() => {
    // When pathname changes, navigation is complete
    if (prevPathnameRef.current !== pathname) {
      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current)
        fallbackTimeoutRef.current = null
      }
      
      // Reset immediately to prevent stuck loading state
      setNavigationLoading(false)
      prevPathnameRef.current = pathname

      // Fallback: ensure loading is cleared after max 2 seconds (for slow devices)
      fallbackTimeoutRef.current = setTimeout(() => {
        setNavigationLoading(false)
      }, 2000)

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        if (fallbackTimeoutRef.current) {
          clearTimeout(fallbackTimeoutRef.current)
        }
      }
    }
  }, [pathname])

  // Safety: ensure loading is cleared on mount and when DOM is ready
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Clear loading when DOM is ready
    const clearIfStuck = () => {
      if (navigationState.isNavigating) {
        // Check if page is actually loaded
        if (document.readyState === 'complete') {
          setNavigationLoading(false)
        }
      }
    }

    // Try to clear immediately if page is already loaded
    if (document.readyState === 'complete') {
      clearIfStuck()
    } else {
      // Wait for page to load
      window.addEventListener('load', clearIfStuck)
      document.addEventListener('DOMContentLoaded', clearIfStuck)
    }

    // Fallback: clear after 1 second if still stuck
    const fallbackTimer = setTimeout(() => {
      if (navigationState.isNavigating) {
        setNavigationLoading(false)
      }
    }, 1000)

    return () => {
      window.removeEventListener('load', clearIfStuck)
      document.removeEventListener('DOMContentLoaded', clearIfStuck)
      clearTimeout(fallbackTimer)
    }
  }, [])

  return { isNavigating }
}

