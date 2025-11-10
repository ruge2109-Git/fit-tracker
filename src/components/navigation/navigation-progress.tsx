/**
 * Navigation Progress Component
 * Shows a progress bar at the top when navigating
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from '@/i18n/routing'
import { motion, AnimatePresence } from 'framer-motion'

export function NavigationProgress() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const prevPathnameRef = useRef(pathname)

  useEffect(() => {
    // Only show loading if pathname actually changed
    if (prevPathnameRef.current !== pathname) {
      setIsLoading(true)
      setProgress(0)
      prevPathnameRef.current = pathname

      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            clearInterval(interval)
            return 85
          }
          return prev + 10
        })
      }, 50)

      // Complete after a short delay to allow page to render
      const timer = setTimeout(() => {
        setProgress(100)
        setTimeout(() => {
          setIsLoading(false)
          setProgress(0)
        }, 200)
        clearInterval(interval)
      }, 300)

      return () => {
        clearInterval(interval)
        clearTimeout(timer)
      }
    }
  }, [pathname])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent pointer-events-none"
        >
          <motion.div
            className="h-full bg-primary shadow-lg"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

