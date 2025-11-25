/**
 * Search Dialog Hook
 * Manages the global search dialog state
 */

'use client'

import { useState, createContext, useContext, ReactNode } from 'react'

interface SearchDialogContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  openSearch: () => void
  closeSearch: () => void
}

const SearchDialogContext = createContext<SearchDialogContextType | undefined>(undefined)

export function SearchDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openSearch = () => setIsOpen(true)
  const closeSearch = () => setIsOpen(false)

  return (
    <SearchDialogContext.Provider value={{ isOpen, setIsOpen, openSearch, closeSearch }}>
      {children}
    </SearchDialogContext.Provider>
  )
}

export function useSearchDialog() {
  const context = useContext(SearchDialogContext)
  if (context === undefined) {
    throw new Error('useSearchDialog must be used within a SearchDialogProvider')
  }
  return context
}

