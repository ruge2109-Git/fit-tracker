/**
 * Rate Limiting Hook
 * Prevents action from running more than once within a time window
 */

import { useRef, useCallback } from 'react'

interface UseRateLimitedActionOptions {
  delayMs?: number
  onRateLimited?: () => void
}

export function useRateLimitedAction(
  action: () => Promise<void> | void,
  { delayMs = 5000, onRateLimited }: UseRateLimitedActionOptions = {}
) {
  const lastExecutionRef = useRef<number>(0)
  const isExecutingRef = useRef(false)

  const execute = useCallback(async () => {
    const now = Date.now()
    const timeSinceLastExecution = now - lastExecutionRef.current

    if (timeSinceLastExecution < delayMs) {
      onRateLimited?.()
      return
    }

    if (isExecutingRef.current) return

    isExecutingRef.current = true
    lastExecutionRef.current = now

    try {
      await action()
    } finally {
      isExecutingRef.current = false
    }
  }, [action, delayMs, onRateLimited])

  const getTimeUntilNextAction = useCallback(() => {
    const timeSinceLastExecution = Date.now() - lastExecutionRef.current
    const remainingMs = delayMs - timeSinceLastExecution
    return Math.max(0, remainingMs)
  }, [delayMs])

  const canExecute = useCallback(() => {
    return Date.now() - lastExecutionRef.current >= delayMs && !isExecutingRef.current
  }, [delayMs])

  return {
    execute,
    canExecute,
    getTimeUntilNextAction,
    isExecuting: isExecutingRef.current,
  }
}
