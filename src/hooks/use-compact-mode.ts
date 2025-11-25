/**
 * Compact Mode Hook
 * Manages compact mode state for dashboard
 */

'use client'

import { useState, useEffect } from 'react'

const COMPACT_MODE_KEY = 'fittrackr-compact-mode'

export function useCompactMode() {
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem(COMPACT_MODE_KEY)
    if (saved !== null) {
      setIsCompact(saved === 'true')
    }
  }, [])

  const toggleCompact = () => {
    const newValue = !isCompact
    setIsCompact(newValue)
    localStorage.setItem(COMPACT_MODE_KEY, String(newValue))
  }

  return {
    isCompact,
    toggleCompact,
  }
}

