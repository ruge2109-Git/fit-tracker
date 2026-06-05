'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const COMPACT_MODE_KEY = 'fittrackr-compact-mode'

interface CompactModeContextValue {
  isCompact: boolean
  toggleCompact: () => void
}

const CompactModeContext = createContext<CompactModeContextValue>({
  isCompact: false,
  toggleCompact: () => {},
})

export function CompactModeProvider({ children }: { children: ReactNode }) {
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(COMPACT_MODE_KEY)
    if (saved !== null) {
      setIsCompact(saved === 'true')
    }
  }, [])

  const toggleCompact = () => {
    setIsCompact(prev => {
      const next = !prev
      localStorage.setItem(COMPACT_MODE_KEY, String(next))
      return next
    })
  }

  return (
    <CompactModeContext.Provider value={{ isCompact, toggleCompact }}>
      {children}
    </CompactModeContext.Provider>
  )
}

export function useCompactMode() {
  return useContext(CompactModeContext)
}
