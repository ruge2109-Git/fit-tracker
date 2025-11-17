/**
 * Custom hook that wraps useRouter to automatically show loading state
 * Use this instead of useRouter for programmatic navigation
 */

'use client'

import { useRouter as useNextIntlRouter } from '@/i18n/routing'
import { setNavigationLoading } from './use-navigation-loading'

export function useNavigationRouter() {
  const router = useNextIntlRouter()

  return {
    ...router,
    push: (...args: Parameters<typeof router.push>) => {
      setNavigationLoading(true)
      return router.push(...args)
    },
    replace: (...args: Parameters<typeof router.replace>) => {
      setNavigationLoading(true)
      return router.replace(...args)
    },
  }
}

