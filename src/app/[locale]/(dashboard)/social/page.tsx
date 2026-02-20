/**
 * Social Page
 * Hub for community features, starting with the Volume Leaderboard
 */

'use client'

import React, { useEffect, useState } from 'react'
import { Users, Globe, Info, ShieldCheck } from 'lucide-react'
import { LeaderboardCard } from '@/components/social/leaderboard-card'
import { statsService, LeaderboardEntry } from '@/domain/services/stats.service'
import { useAuthStore } from '@/store/auth.store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'
import { useNavigationRouter } from '@/hooks/use-navigation-router'
import { useTranslations } from 'next-intl'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'

export default function SocialPage() {
  const t = useTranslations('social')
  const { user } = useAuthStore()
  const router = useNavigationRouter()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    setIsLoading(true)
    try {
      const res = await statsService.getWeeklyLeaderboard()
      if (res.data) {
        setLeaderboard(res.data)
      }
    } catch (error) {
      logger.error('Error loading leaderboard', error as Error, 'SocialPage')
    } finally {
      setIsLoading(false)
    }
  }

  const isUserOnLeaderboard = leaderboard.some(entry => entry.user_id === user?.id)

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header section */}
      <header className="mb-10 text-center md:text-left space-y-4 px-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tighter uppercase italic flex items-center justify-center md:justify-start gap-3">
              <Globe className="h-10 w-10 text-primary" />
              {t('title') || 'Comunidad'}
            </h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-60">
              {t('subtitle') || 'Compite y progresa con otros atletas'}
            </p>
          </div>
          
          {!user?.is_public && (
            <Button 
              variant="outline" 
              className="rounded-full border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-black uppercase tracking-tighter text-[10px] h-10 px-6"
              onClick={() => router.push(ROUTES.PROFILE + '?tab=settings')}
            >
              <Users className="h-3.5 w-3.5 mr-2" />
              {t('joinLeaderboard') || 'Unirse al Ranking'}
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-8 md:grid-cols-12">
        {/* Main Content - Leaderboard */}
        <div className="md:col-span-8 space-y-6">
          <LeaderboardCard data={leaderboard} isLoading={isLoading} />
          
          {/* Info Section */}
          <Card className="rounded-3xl border-none bg-accent/5 overflow-hidden border border-white/5">
            <CardContent className="p-6 flex gap-4 items-start">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Info className="h-5 w-5 text-blue-500" />
              </div>
              <div className="space-y-2">
                <h3 className="font-black uppercase tracking-tighter italic text-sm">
                  {t('howItWorks') || '¿Cómo funciona el Ranking?'}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('rankingGuide') || 'El ranking suma todo el peso que levantes (Volumen = Series x Repeticiones x Peso) desde el lunes de cada semana. Se reinicia cada domingo a medianoche.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Privacy & Rules */}
        <div className="md:col-span-4 space-y-6">
          <Card className="rounded-3xl border-none bg-accent/5 overflow-hidden border border-white/5">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                  <h3 className="font-black uppercase tracking-tighter italic text-sm">
                    {t('privacyTitle') || 'Privacidad Pro'}
                  </h3>
                </div>
                <p className="text-[11px] font-bold text-muted-foreground/80 uppercase leading-relaxed tracking-wide">
                  {t('privacyText') || 'Tu perfil social es 100% opcional. Solo se muestra tu apodo y tus logros de volumen. Tus rutinas y notas personales siguen siendo privadas.'}
                </p>
                
                <div className="pt-2">
                   <div className="flex items-center justify-between p-3 bg-background/50 rounded-2xl border border-border/5">
                      <span className="text-[10px] font-black uppercase text-muted-foreground">{t('socialStatus') || 'Estado'}</span>
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2 py-0.5 rounded-full",
                        user?.is_public ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                      )}>
                        {user?.is_public ? (t('active') || 'Activo') : (t('inactive') || 'Inactivo')}
                      </span>
                   </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/5 space-y-4">
                <h4 className="font-black uppercase tracking-tighter italic text-xs">
                  {t('comingSoon') || 'Próximamente'}
                </h4>
                <ul className="space-y-3">
                  {['Rachas Globales', 'Compartir Rutinas', 'Desafíos de Grupo'].map(item => (
                    <li key={item} className="flex items-center gap-3 opacity-40">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <footer className="px-4 text-center md:text-left">
            <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-20">
              SOCIAL ENGINE v1.0 • OPTIMIZADO PARA COMPETICIÓN
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}
