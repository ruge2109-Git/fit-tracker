/**
 * History Hook (Undo/Redo)
 * Manages history stack for undo/redo functionality
 */

'use client'

import { useState, useCallback, useRef } from 'react'

export interface HistoryState<T> {
  past: T[]
  present: T | null
  future: T[]
}

export interface UseHistoryReturn<T> {
  state: T | null
  canUndo: boolean
  canRedo: boolean
  setState: (newState: T, addToHistory?: boolean) => void
  undo: () => void
  redo: () => void
  clear: () => void
  reset: (newState: T) => void
}

const MAX_HISTORY_SIZE = 50

export function useHistory<T>(initialState: T | null = null): UseHistoryReturn<T> {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  })

  const skipNextUpdate = useRef(false)

  const setState = useCallback((newState: T, addToHistory: boolean = true) => {
    if (skipNextUpdate.current) {
      skipNextUpdate.current = false
      return
    }

    setHistory((prev) => {
      // Don't add to history if state hasn't actually changed
      if (prev.present !== null && JSON.stringify(prev.present) === JSON.stringify(newState)) {
        return prev
      }

      if (!addToHistory) {
        return {
          ...prev,
          present: newState,
        }
      }

      const newPast = prev.present !== null 
        ? [...prev.past, prev.present].slice(-MAX_HISTORY_SIZE)
        : prev.past

      return {
        past: newPast,
        present: newState,
        future: [], // Clear future when new action is performed
      }
    })
  }, [])

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev

      const previous = prev.past[prev.past.length - 1]
      const newPast = prev.past.slice(0, -1)
      const newFuture = prev.present !== null 
        ? [prev.present, ...prev.future]
        : prev.future

      skipNextUpdate.current = true

      return {
        past: newPast,
        present: previous,
        future: newFuture,
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev

      const next = prev.future[0]
      const newFuture = prev.future.slice(1)
      const newPast = prev.present !== null
        ? [...prev.past, prev.present].slice(-MAX_HISTORY_SIZE)
        : prev.past

      skipNextUpdate.current = true

      return {
        past: newPast,
        present: next,
        future: newFuture,
      }
    })
  }, [])

  const clear = useCallback(() => {
    setHistory({
      past: [],
      present: null,
      future: [],
    })
  }, [])

  const reset = useCallback((newState: T) => {
    setHistory({
      past: [],
      present: newState,
      future: [],
    })
  }, [])

  return {
    state: history.present,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    setState,
    undo,
    redo,
    clear,
    reset,
  }
}

