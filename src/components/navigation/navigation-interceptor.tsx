/**
 * Navigation Interceptor Component
 * Intercepts navigation events to show loading state immediately
 */

'use client'

import { useEffect } from 'react'
import { usePathname } from '@/i18n/routing'
import { setNavigationLoading } from '@/hooks/use-navigation-loading'

export function NavigationInterceptor() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return

    let navigationTimeout: NodeJS.Timeout | null = null

    // Intercept link clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a[href]') as HTMLAnchorElement | null
      
      if (!link) return

      const href = link.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return
      }

      // Check if it's an internal link
      const isInternalLink = href.startsWith('/') || 
        (href.startsWith(window.location.origin) && !href.includes('#'))
      
      if (isInternalLink) {
        const currentPath = window.location.pathname
        let targetPath = href
        
        // Extract pathname from full URL if needed
        if (href.startsWith('http')) {
          try {
            targetPath = new URL(href).pathname
          } catch {
            return
          }
        }

        // Only show loader if navigating to a different page
        if (targetPath !== currentPath) {
          // Clear any existing timeout
          if (navigationTimeout) {
            clearTimeout(navigationTimeout)
          }

          // Show loader immediately
          setNavigationLoading(true)
        }
      }
    }

    // Intercept browser navigation (back/forward)
    const handlePopState = () => {
      setNavigationLoading(true)
    }

    // Listen for navigation start events from Next.js
    const handleNavigationStart = () => {
      setNavigationLoading(true)
    }

    // Use capture phase to catch events early
    document.addEventListener('click', handleClick, true)
    window.addEventListener('popstate', handlePopState)
    
    // Listen for Next.js navigation events
    // Next.js fires these events during navigation
    if (typeof window !== 'undefined') {
      // Listen for beforeunload as a fallback
      window.addEventListener('beforeunload', handleNavigationStart)
    }

    return () => {
      document.removeEventListener('click', handleClick, true)
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('beforeunload', handleNavigationStart)
      if (navigationTimeout) {
        clearTimeout(navigationTimeout)
      }
    }
  }, [])

  // Reset loading state when pathname changes (navigation complete)
  useEffect(() => {
    // Small delay to ensure page has rendered, then clear loading
    const timer = setTimeout(() => {
      setNavigationLoading(false)
    }, 150)

    return () => {
      clearTimeout(timer)
    }
  }, [pathname])

  return null
}

