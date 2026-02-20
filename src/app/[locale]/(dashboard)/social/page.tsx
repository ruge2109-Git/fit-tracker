/**
 * Social Page Hub - Rediseño Total "The Arena"
 * Una experiencia social unificada, intuitiva y premium.
 */

'use client'

import React, { useEffect, useState, useCallback, Suspense } from 'react'
import { Users, Globe, Trophy, MessageSquare, Activity, Search, UserPlus, SlidersHorizontal } from 'lucide-react'
import { LeaderboardCard } from '@/components/social/leaderboard-card'
import { FriendsCard } from '@/components/social/friends-card'
import { MessengerView } from '@/components/social/messenger-view'
import { ActivityFeedCard } from '@/components/social/activity-feed-card'
import { statsService, LeaderboardEntry } from '@/domain/services/stats.service'
import { useAuthStore } from '@/store/auth.store'
import { useSocialStore } from '@/store/social.store'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'

type SocialSection = 'arena' | 'feed' | 'messenger' | 'athletes'

function SocialPageContent() {
  const t = useTranslations('social')
  const { user } = useAuthStore()
  const { unreadMessagesCount } = useSocialStore()
  const searchParams = useSearchParams()
  
  const [activeSection, setActiveSection] = useState<SocialSection>((searchParams.get('tab') as SocialSection) || 'arena')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // DM state for deep linking
  const [dmTarget, setDmTarget] = useState<{ id: string; nickname: string } | null>(null)

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true)
    const res = await statsService.getWeeklyLeaderboard()
    if (res.data) setLeaderboard(res.data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadLeaderboard()
  }, [loadLeaderboard])

  const openDM = (id: string, nickname: string) => {
    setDmTarget({ id, nickname })
    setActiveSection('messenger')
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-9rem)] md:h-auto max-w-7xl mx-auto overflow-visible">
      
      {/* Ultra Compact Sticky Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg pt-1 pb-3 px-2 border-b border-white/5">
        <div className="flex items-center justify-between mb-3 px-1">
          <h1 className="text-lg font-black tracking-tighter uppercase italic leading-none">
            {activeSection === 'arena' && (t('ranking') || 'The Arena')}
            {activeSection === 'feed' && (t('activityFeed') || 'Activity')}
            {activeSection === 'messenger' && 'Chat Central'}
            {activeSection === 'athletes' && (t('friends') || 'Atletas')}
          </h1>
          
          <div className="flex items-center gap-2">
            {/* Functional actions could go here */}
          </div>
        </div>

        {/* Segmented Control - Standard PWA Style */}
        <nav className="flex items-center justify-between gap-1 bg-accent/5 p-1 rounded-xl border border-white/10 mx-auto max-w-lg shadow-sm">
          <SegmentButton 
            active={activeSection === 'arena'} 
            onClick={() => setActiveSection('arena')}
            label="Arena"
          />
          <SegmentButton 
            active={activeSection === 'feed'} 
            onClick={() => setActiveSection('feed')}
            label="Feed"
          />
          <SegmentButton 
            active={activeSection === 'messenger'} 
            onClick={() => setActiveSection('messenger')}
            label="Chat"
            unreadCount={unreadMessagesCount}
          />
          <SegmentButton 
            active={activeSection === 'athletes'} 
            onClick={() => setActiveSection('athletes')}
            label="Atletas"
          />
        </nav>
      </header>

      {/* Main Content Area - Optimized for device height */}
      <main className="flex-1 overflow-y-auto md:overflow-visible px-2 pt-6 pb-24 md:pb-8 scrollbar-none">
        
        {/* Arena Section - Visual Leaderboard */}
        <div className={cn(
          "transition-all duration-300",
          activeSection === 'arena' ? "opacity-100 block" : "hidden opacity-0"
        )}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <LeaderboardCard data={leaderboard} isLoading={isLoading} />
            </div>
            <div className="lg:col-span-4 space-y-4">
                <div className="relative group overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-[2.5rem] p-8 shadow-2xl shadow-primary/5 transition-all hover:bg-primary/10">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Trophy className="h-32 w-32 rotate-12 text-primary" />
                   </div>
                   <h3 className="font-black uppercase italic text-sm mb-4 flex items-center gap-2 text-primary">
                     <Activity className="h-5 w-5 animate-pulse" />
                     Poder de la Arena
                   </h3>
                   <div className="space-y-4 relative z-10">
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Volumen Semanal Comunitario</p>
                         <p className="text-4xl font-black italic tracking-tighter">
                            {isLoading ? '---' : (leaderboard.reduce((acc, curr) => acc + curr.total_volume, 0) / 1000).toFixed(1)}
                            <span className="text-sm ml-1 opacity-40">TONS</span>
                          </p>

                      </div>
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                         <p className="text-[9px] font-black uppercase text-muted-foreground leading-tight italic">
                            "La fuerza de la arena no es individual, es la suma de cada guerrero."
                         </p>
                      </div>
                   </div>
                </div>
                
                <div className="bg-accent/5 border border-white/5 rounded-[2.5rem] p-8 flex flex-col gap-4">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-background border border-white/10 flex items-center justify-center">
                         <Users className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <h3 className="font-black uppercase italic text-sm tracking-tight text-foreground/80">Código del Atleta</h3>
                   </div>
                   <p className="text-[11px] font-bold text-muted-foreground/60 uppercase leading-relaxed">
                      Conecta con otros guerreros, comparte tus marcas personales y asciende en el ranking para convertirte en leyenda.
                   </p>
                   <Button variant="outline" className="w-full rounded-2xl border-white/5 bg-white/5 font-black uppercase italic text-[10px] tracking-widest hover:bg-primary/10 transition-all">
                      Buscar Guerreros
                   </Button>
                </div>
            </div>
          </div>
        </div>

        {/* Feed Section */}
        <div className={cn(
          "max-w-xl mx-auto transition-all duration-300",
          activeSection === 'feed' ? "opacity-100 block" : "hidden opacity-0"
        )}>
          <ActivityFeedCard />
        </div>

        {/* Messenger Section - Optimized Height */}
        <div className={cn(
          "h-[calc(100dvh-14rem)] md:h-[700px] transition-all duration-300",
          activeSection === 'messenger' ? "opacity-100 block" : "hidden opacity-0"
        )}>
           <MessengerView 
             initialFriendId={dmTarget?.id} 
             initialFriendNickname={dmTarget?.nickname} 
           />
        </div>

        {/* Athletes Section */}
        <div className={cn(
          "max-w-2xl mx-auto transition-all duration-300",
          activeSection === 'athletes' ? "opacity-100 block" : "hidden opacity-0"
        )}>
          <FriendsCard onOpenDM={openDM} />
        </div>

      </main>
    </div>
  )
}

function SegmentButton({ active, onClick, label, unreadCount }: { active: boolean, onClick: () => void, label: string, unreadCount?: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1 flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-tighter transition-all relative",
        "active:scale-95",
        active 
          ? "bg-background text-primary shadow-sm border border-white/5" 
          : "text-muted-foreground/60 hover:text-muted-foreground"
      )}
    >
      <span className="block">{label}</span>
      {unreadCount !== undefined && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[8px] font-black text-white shadow-sm ring-1 ring-background">
          {unreadCount > 9 ? '+9' : unreadCount}
        </span>
      )}
    </button>
  )
}

export default function SocialPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center font-black uppercase italic tracking-widest animate-pulse">Entrando en la Arena...</div>}>
      <SocialPageContent />
    </Suspense>
  )
}
