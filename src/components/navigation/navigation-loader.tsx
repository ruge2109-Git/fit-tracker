/**
 * Navigation Loader Component
 * Shows a full-screen loader when navigating between pages
 */

'use client'

import { useNavigationLoading } from '@/hooks/use-navigation-loading'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function NavigationLoader() {
  const { isNavigating } = useNavigationLoading()
  const t = useTranslations('common')

  return (
    <AnimatePresence>
      {isNavigating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t('loading') || 'Cargando...'}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

