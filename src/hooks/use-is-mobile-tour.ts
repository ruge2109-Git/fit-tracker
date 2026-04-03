/**
 * True when viewport matches Tailwind `md` breakpoint (mobile-only tour).
 * max-width: 767px
 */

'use client'

import { useEffect, useState } from 'react'

const QUERY = '(max-width: 767px)'

export function useIsMobileTourViewport(): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const update = () => setMatches(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return matches
}
