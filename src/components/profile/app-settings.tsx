/**
 * App Settings Component
 * Allows users to change language and theme
 */

'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LanguageSelector } from '@/components/language/language-selector'
import { ThemeToggle } from '@/components/providers/theme-toggle'
import { useTranslations } from 'next-intl'
import { Palette, Globe, Map } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useProductTourStore } from '@/store/product-tour.store'
import { clearProductTourMobileDone } from '@/lib/tour/product-tour-storage'
import { toast } from 'sonner'

export function AppSettings() {
  const t = useTranslations('common')
  const tProfile = useTranslations('profile')
  const tTour = useTranslations('tour')
  const { user } = useAuthStore()

  const handleReplayTour = () => {
    if (!user?.id) return
    clearProductTourMobileDone(user.id)
    useProductTourStore.getState().requestTourStart()
    toast.success(tTour('replayToast'))
  }

  return (
    <Card className="rounded-3xl border-none bg-accent/5 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2 uppercase tracking-tighter italic">
          <Palette className="h-5 w-5 text-primary" />
          {tProfile('appPreferences') || 'Preferencias de la App'}
        </CardTitle>
        <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">
          Personaliza tu experiencia en FitTrackr
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Theme Setting */}
        <div className="flex items-center justify-between p-4 bg-background/40 rounded-2xl border border-border/5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Palette className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-tight italic">{t('theme') || 'Tema'}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                {t('toggleTheme') || 'Claro / Oscuro'}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Language Setting */}
        <div className="flex items-center justify-between p-4 bg-background/40 rounded-2xl border border-border/5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-tight italic">{t('language') || 'Idioma'}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                Selecciona tu lenguaje
              </p>
            </div>
          </div>
          <LanguageSelector />
        </div>

        <div className="flex flex-col gap-2 p-4 bg-background/40 rounded-2xl border border-border/5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Map className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-tight italic">{tTour('profileReplay')}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                {tTour('profileReplayHint')}
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" className="shrink-0 rounded-xl font-bold" onClick={handleReplayTour}>
            {tTour('profileReplayButton')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
