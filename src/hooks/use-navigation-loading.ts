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

  useEffect(() => {
    // Subscribe to navigation state changes
    const handleNavigationChange = (isNav: boolean) => {
      setIsNavigating(isNav)
    }

    navigationListeners.add(handleNavigationChange)
    setIsNavigating(navigationState.isNavigating)

    return () => {
      navigationListeners.delete(handleNavigationChange)
    }
  }, [])

  useEffect(() => {
    // When pathname changes, navigation is complete
    if (prevPathnameRef.current !== pathname) {
      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      
      // Small delay to ensure page has rendered
      timeoutRef.current = setTimeout(() => {
        setNavigationLoading(false)
        prevPathnameRef.current = pathname
      }, 100)

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }
  }, [pathname])

  return { isNavigating }
}

