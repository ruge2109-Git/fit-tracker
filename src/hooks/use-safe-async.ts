/**
 * Safe Async Hook
 * Provides a safe way to handle async operations with loading states
 * Prevents state updates after component unmount and handles errors gracefully
 */

import { useCallback, useRef, useEffect, useState } from 'react'

interface UseSafeAsyncOptions {
  onError?: (error: Error) => void
}

/**
 * Hook that provides safe async operations with automatic cleanup
 */
export function useSafeAsync<T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  options?: UseSafeAsyncOptions
): T {
  const isMountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const safeAsyncFn = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T> extends Promise<infer U> ? U : never> => {
      if (!isMountedRef.current) {
        throw new Error('Component unmounted')
      }

      // Create new abort controller for this operation
      abortControllerRef.current = new AbortController()

      try {
        const result = await asyncFn(...args)
        
        // Check if component is still mounted before returning
        if (!isMountedRef.current) {
          throw new Error('Component unmounted during operation')
        }

        return result
      } catch (error) {
        // Don't throw if component unmounted or operation aborted
        if (error instanceof Error && error.message === 'Component unmounted') {
          throw error
        }

        if (error instanceof Error && error.name === 'AbortError') {
          throw error
        }

        // Handle other errors
        if (options?.onError && error instanceof Error) {
          options.onError(error)
        }

        throw error
      } finally {
        abortControllerRef.current = null
      }
    },
    [asyncFn, options]
  ) as T

  return safeAsyncFn
}

/**
 * Hook for managing loading state safely
 */
export function useSafeLoading() {
  const isMountedRef = useRef(true)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    if (isMountedRef.current) {
      setIsLoading(loading)
    }
  }, [])

  const withLoading = useCallback(
    async <T,>(asyncFn: () => Promise<T>): Promise<T> => {
      setLoading(true)
      try {
        const result = await asyncFn()
        return result
      } finally {
        setLoading(false)
      }
    },
    [setLoading]
  )

  return { isLoading, setLoading, withLoading }
}

